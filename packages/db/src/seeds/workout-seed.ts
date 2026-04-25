import fs from 'node:fs/promises';
import path from 'node:path';
import { and, asc, eq } from 'drizzle-orm';
import {
  createDb,
  exercises,
  memberships,
  workoutPlanExercises,
  workoutPlans,
  workspaces,
} from '../index';
import { workoutSeedSchema } from '@lifeos/domain-workouts';

function getArg(name: string): string | undefined {
  const prefix = `--${name}=`;
  const value = process.argv.find((arg: string) => arg.startsWith(prefix));
  return value ? value.slice(prefix.length) : undefined;
}

async function resolveContext(db: ReturnType<typeof createDb>) {
  const workspaceIdArg = getArg('workspace-id');
  const userIdArg = getArg('user-id');
  const workspaceSlugArg = getArg('workspace-slug');

  if (workspaceIdArg && userIdArg) {
    return { workspaceId: workspaceIdArg, userId: userIdArg };
  }

  if (workspaceSlugArg && userIdArg) {
    const [workspace] = await db
      .select({ id: workspaces.id })
      .from(workspaces)
      .where(and(eq(workspaces.slug, workspaceSlugArg), eq(workspaces.ownerUserId, userIdArg)));

    if (!workspace) {
      throw new Error(`Workspace with slug ${workspaceSlugArg} not found for user ${userIdArg}`);
    }

    return { workspaceId: workspace.id, userId: userIdArg };
  }

  const [membership] = await db
    .select({ workspaceId: memberships.workspaceId, userId: memberships.userId })
    .from(memberships)
    .orderBy(asc(memberships.createdAt));

  if (!membership) {
    throw new Error(
      'No membership found. Pass --workspace-id and --user-id (or --workspace-slug and --user-id).',
    );
  }

  return membership;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  const fileArg = getArg('file') ?? process.env.WORKOUT_SEED_FILE;
  if (!fileArg) {
    throw new Error('Missing --file=/absolute/path/workout-seed.json');
  }

  const filePath = path.resolve(fileArg);
  const dryRun = process.argv.includes('--dry-run');
  const raw = await fs.readFile(filePath, 'utf8');
  const parsedJson = JSON.parse(raw);
  const seed = workoutSeedSchema.parse(parsedJson);

  const db = createDb(databaseUrl);
  const context = await resolveContext(db);

  console.log('[workout-seed] file:', filePath);
  console.log('[workout-seed] workspace:', context.workspaceId, 'user:', context.userId);
  console.log('[workout-seed] exercises:', seed.exercises.length, 'plans:', seed.workoutPlans.length);

  if (dryRun) {
    console.log('[workout-seed] dry-run complete (no writes).');
    return;
  }

  await db.transaction(async (tx) => {
    const exerciseIdBySlug = new Map<string, string>();

    for (const exercise of seed.exercises) {
      const payload = {
        workspaceId: context.workspaceId,
        userId: context.userId,
        name: exercise.name,
        slug: exercise.slug,
        descriptionShort: exercise.descriptionShort,
        descriptionMarkdown: exercise.descriptionMarkdown,
        muscleGroupsJson: Array.from(
          new Set([...exercise.primaryMuscleGroups, ...exercise.secondaryMuscleGroups]),
        ),
        primaryMuscleGroupsJson: exercise.primaryMuscleGroups,
        secondaryMuscleGroupsJson: exercise.secondaryMuscleGroups,
        movementPattern: exercise.movementPattern,
        instructionsJson: exercise.instructions,
        commonMistakesJson: exercise.commonMistakes,
        equipmentJson: exercise.equipment,
        difficulty: exercise.difficulty,
        defaultVideoUrl: exercise.video?.url ?? null,
        videoJson: {
          url: exercise.video?.url ?? null,
          source: exercise.video?.source ?? null,
          title: exercise.video?.title ?? null,
        },
        defaultRestSeconds: exercise.defaultRestSeconds,
        isCustom: exercise.isCustom,
        updatedAt: new Date(),
      };

      const [upserted] = await tx
        .insert(exercises)
        .values(payload)
        .onConflictDoUpdate({
          target: [exercises.workspaceId, exercises.userId, exercises.slug],
          set: payload,
        })
        .returning({ id: exercises.id, slug: exercises.slug });
      if (!upserted) {
        throw new Error(`Failed to upsert exercise "${exercise.slug}"`);
      }

      exerciseIdBySlug.set(upserted.slug, upserted.id);
    }

    for (const plan of seed.workoutPlans) {
      const planPayload = {
        workspaceId: context.workspaceId,
        userId: context.userId,
        name: plan.name,
        slug: plan.slug,
        goal: plan.goal,
        description: plan.description,
        isActive: plan.isActive,
        scheduleHintJson: plan.scheduleHint,
        updatedAt: new Date(),
      };

      const [upsertedPlan] = await tx
        .insert(workoutPlans)
        .values(planPayload)
        .onConflictDoUpdate({
          target: [workoutPlans.workspaceId, workoutPlans.userId, workoutPlans.slug],
          set: planPayload,
        })
        .returning({ id: workoutPlans.id, slug: workoutPlans.slug });
      if (!upsertedPlan) {
        throw new Error(`Failed to upsert workout plan "${plan.slug}"`);
      }

      await tx
        .delete(workoutPlanExercises)
        .where(eq(workoutPlanExercises.workoutPlanId, upsertedPlan.id));

      if (plan.exercises.length > 0) {
        await tx.insert(workoutPlanExercises).values(
          plan.exercises.map((item, index) => {
            const exerciseId = exerciseIdBySlug.get(item.exerciseSlug);
            if (!exerciseId) {
              throw new Error(
                `exerciseSlug "${item.exerciseSlug}" in plan "${plan.slug}" not found in exercises array`,
              );
            }

            return {
              workoutPlanId: upsertedPlan.id,
              exerciseId,
              orderIndex: item.orderIndex ?? index,
              targetSets: item.targetSets,
              targetRepsMin: item.targetRepsMin,
              targetRepsMax: item.targetRepsMax,
              targetWeightValue:
                item.targetWeightValue !== undefined && item.targetWeightValue !== null
                  ? String(item.targetWeightValue)
                  : null,
              targetWeightUnit: item.targetWeightUnit,
              targetRestSeconds: item.targetRestSeconds,
              notes: item.notes,
            };
          }),
        );
      }
    }
  });

  console.log('[workout-seed] import completed successfully');
}

main().catch((error) => {
  console.error('[workout-seed] import failed');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
