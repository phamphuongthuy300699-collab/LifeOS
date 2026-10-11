import { Hono } from 'hono';
import { z } from 'zod';
import { sql } from 'drizzle-orm';
import {
  and, asc, desc, eq, inArray,
  exercises, workoutPlans, workoutPlanExercises,
  workoutSessions, workoutSessionExercises, workoutSets,
} from '@lifeos/db';
import { db } from '../config/db';
import { resolveWorkoutContext } from './_workout-context';

export const workoutAtlasRoutes = new Hono();

const atlasExerciseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,110}$/),
  name: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().min(1).max(200),
  group: z.enum(['грудь','спина','ноги','плечи','бицепс','трицепс','кор']),
});
const planExerciseSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{2,110}$/),
  sets: z.number().int().min(1).max(10),
  reps: z.string().min(1).max(30),
  rest: z.number().int().min(30).max(300),
});
const installSchema = z.object({
  exercises: z.array(atlasExerciseSchema).min(38).max(38),
  plans: z.array(z.object({
    slug: z.string().regex(/^atlas-(day-[123])$/),
    name: z.string().min(1).max(200),
    goal: z.string().max(1000),
    exercises: z.array(planExerciseSchema).min(3).max(16),
  })).length(3),
}).superRefine((value, ctx) => {
  const slugs = new Set(value.exercises.map(item => item.slug));
  if (slugs.size !== 38 || value.plans.some(plan => plan.exercises.some(item => !slugs.has(item.slug)))) {
    ctx.addIssue({code: z.ZodIssueCode.custom, message: 'Duplicate or unknown exercise slugs'});
  }
});

const historySchema = z.object({
  entries: z.array(z.object({
    date: z.string().regex(/^20\d{2}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/),
    label: z.string().trim().min(1).max(180),
    raw: z.string().trim().min(1).max(1500),
    slug: z.string().regex(/^[a-z0-9-]{2,110}$/).optional(),
  })).min(1).max(160),
});

function fallbackSlug(label: string): string {
  const basic = label.toLowerCase().normalize('NFKD').replace(/[^a-zа-яё0-9]+/g, '-').replace(/^-|-$/g, '');
  return 'history-' + basic.slice(0, 90);
}

workoutAtlasRoutes.post('/install', async c => {
  const context = await resolveWorkoutContext(c.req.raw);
  if (!context) return c.json({code: 'UNAUTHORIZED'}, 401);
  const json = await c.req.json().catch(() => null);
  const validation = installSchema.safeParse(json);
  if (!validation.success) return c.json({code:'VALIDATION_ERROR', issues: validation.error.issues}, 400);
  const {userId,workspaceId} = context;
  const {exercises: catalog, plans: templates} = validation.data;

  const result = await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId + ':atlas-install'}))`);
    await tx.insert(exercises).values(catalog.map(item => ({
      userId, workspaceId, slug:item.slug, name:item.name,
      descriptionShort: item.nameEn,
      muscleGroupsJson: [item.group],
      primaryMuscleGroupsJson: [item.group],
      isCustom: false,
    }))).onConflictDoNothing();

    const exerciseRows = await tx.select({id:exercises.id,slug:exercises.slug}).from(exercises)
      .where(and(eq(exercises.userId,userId),eq(exercises.workspaceId,workspaceId),
        inArray(exercises.slug, catalog.map(item=>item.slug))));
    const exerciseIdBySlug = new Map(exerciseRows.map(row=>[row.slug,row.id]));
    if(exerciseIdBySlug.size !== 38) throw new Error('Incomplete exercise install');

    let plansCreated = 0;
    for(const plan of templates) {
      const inserted = await tx.insert(workoutPlans).values({
        userId,workspaceId,slug:plan.slug,name:plan.name,goal:plan.goal,
        description:'Трёхдневный цикл из атласа. Подбирайте вес самостоятельно.',
        isActive:true,scheduleHintJson:{source:'workout-atlas', daysPerWeek:'2-3'},
      }).onConflictDoNothing().returning({id:workoutPlans.id});
      if(!inserted[0]) continue;
      plansCreated++;
      await tx.insert(workoutPlanExercises).values(plan.exercises.map((exercise,index)=>({
        workoutPlanId:inserted[0]!.id,
        exerciseId:exerciseIdBySlug.get(exercise.slug)!,
        orderIndex:index,
        targetSets:exercise.sets,
        targetReps:exercise.reps,
        targetRestSeconds:exercise.rest,
      })));
    }
    return {exercisesEnsured:exerciseIdBySlug.size,plansCreated};
  });
  return c.json(result);
});

workoutAtlasRoutes.post('/history/import', async c => {
  const context = await resolveWorkoutContext(c.req.raw);
  if(!context) return c.json({code:'UNAUTHORIZED'},401);
  const payload = await c.req.json().catch(()=>null);
  const parsed = historySchema.safeParse(payload);
  if(!parsed.success) return c.json({code:'VALIDATION_ERROR',issues:parsed.error.issues},400);
  const {userId,workspaceId}=context;
  const groups = new Map<string,typeof parsed.data.entries>();
  for(const entry of parsed.data.entries){
    const date = new Date(entry.date + 'T12:00:00.000Z');
    if(Number.isNaN(date.getTime()) || date.toISOString().slice(0,10)!==entry.date) {
      return c.json({code:'INVALID_DATE'},400);
    }
    groups.set(entry.date,[...(groups.get(entry.date)??[]),entry]);
  }

  const result = await db.transaction(async tx => {
    await tx.execute(sql`SELECT pg_advisory_xact_lock(hashtext(${userId + ':atlas-history'}))`);
    let datesCreated=0,entriesCreated=0,datesSkipped=0;
    for(const [date,entries] of groups) {
      const marker='atlas-history:v1:'+date;
      const existing=await tx.select({id:workoutSessions.id}).from(workoutSessions)
        .where(and(eq(workoutSessions.userId,userId),eq(workoutSessions.workspaceId,workspaceId),
          eq(workoutSessions.notes,marker))).limit(1);
      if(existing.length){datesSkipped++;continue;}
      const [session]=await tx.insert(workoutSessions).values({
        userId,workspaceId,startedAt:new Date(date+'T12:00:00.000Z'),
        endedAt:new Date(date+'T12:00:00.000Z'),
        sessionStatus:'completed',notes:marker,
      }).returning({id:workoutSessions.id});
      if(!session) throw new Error('Cannot import workout history');

      for(const [i,entry] of entries.entries()) {
        const slug=entry.slug ?? fallbackSlug(entry.label);
        let [exercise]=await tx.select({id:exercises.id}).from(exercises)
          .where(and(eq(exercises.workspaceId,workspaceId),eq(exercises.userId,userId),eq(exercises.slug,slug))).limit(1);
        if(!exercise){
          const created=await tx.insert(exercises).values({
            userId,workspaceId,slug,name:entry.label,isCustom:true,
          }).onConflictDoNothing().returning({id:exercises.id});
          exercise=created[0] ?? (await tx.select({id:exercises.id}).from(exercises)
            .where(and(eq(exercises.workspaceId,workspaceId),eq(exercises.userId,userId),eq(exercises.slug,slug))).limit(1))[0];
        }
        if(!exercise) throw new Error('Cannot resolve imported exercise');
        // No fake weights or completed sets: source contains ranges, approximations,
        // assisted reps and even historical references rather than exact performed sets.
        await tx.insert(workoutSessionExercises).values({
          workoutSessionId:session.id,exerciseId:exercise.id,orderIndex:i,
          previousResultJson:{atlasLabel:entry.label,atlasRaw:entry.raw,source:'training-history-markdown'},
        });
        entriesCreated++;
      }
      datesCreated++;
    }
    return {datesCreated,entriesCreated,datesSkipped};
  });
  return c.json(result);
});

/** Scope all historical and live workout reads to the JWT user and workspace. */
workoutAtlasRoutes.get('/history', async c => {
  const context=await resolveWorkoutContext(c.req.raw);
  if(!context) return c.json({code:'UNAUTHORIZED'},401);
  const {userId,workspaceId}=context;
  const sessions=await db.select().from(workoutSessions)
    .where(and(eq(workoutSessions.userId,userId),eq(workoutSessions.workspaceId,workspaceId)))
    .orderBy(desc(workoutSessions.startedAt)).limit(100);
  if(!sessions.length) return c.json({items:[]});
  const sesRows=await db.select().from(workoutSessionExercises)
    .where(inArray(workoutSessionExercises.workoutSessionId,sessions.map(s=>s.id)))
    .orderBy(asc(workoutSessionExercises.orderIndex));
  const exerciseIds=[...new Set(sesRows.map(r=>r.exerciseId))];
  const exerciseRows=exerciseIds.length ? await db.select({id:exercises.id,name:exercises.name,slug:exercises.slug})
    .from(exercises).where(and(eq(exercises.userId,userId),eq(exercises.workspaceId,workspaceId),inArray(exercises.id,exerciseIds))) : [];
  const byId=new Map(exerciseRows.map(r=>[r.id,r]));
  const setRows=sesRows.length?await db.select().from(workoutSets)
    .where(inArray(workoutSets.workoutSessionExerciseId,sesRows.map(r=>r.id))):[];
  const setsByExercise=new Map<string,typeof setRows>();
  for(const item of setRows)setsByExercise.set(item.workoutSessionExerciseId,[...(setsByExercise.get(item.workoutSessionExerciseId)??[]),item]);
  const entriesBySession=new Map<string,typeof sesRows>();
  for(const row of sesRows) entriesBySession.set(row.workoutSessionId,[...(entriesBySession.get(row.workoutSessionId)??[]),row]);
  return c.json({items:sessions.map(session=>({
    id:session.id,date:session.startedAt.toISOString().slice(0,10),
    status:session.sessionStatus,imported:session.notes?.startsWith('atlas-history:v1:')??false,
    exercises:(entriesBySession.get(session.id)??[]).map(item=>{
      const meta=item.previousResultJson as Record<string,unknown>|null;
      return {
        id:item.id,slug:byId.get(item.exerciseId)?.slug??null,
        name:byId.get(item.exerciseId)?.name??'Упражнение',
        label:typeof meta?.atlasLabel==='string'?meta.atlasLabel:null,
        raw:typeof meta?.atlasRaw==='string'?meta.atlasRaw:null,
        sets:(setsByExercise.get(item.id)??[]).filter(s=>s.isCompleted).map(s=>({
          weight:s.weightValue===null?null:Number(s.weightValue),
          reps:s.repsCount,rir:s.rir,rpe:s.rpe,isWarmup:s.isWarmup,
        })),
      };
    }),
  }))});
});
