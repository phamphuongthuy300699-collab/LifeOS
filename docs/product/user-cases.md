# User Cases

## 1. Morning Today Review
- Trigger: user opens app in the morning.
- Steps: opens `/today`, checks overdue, due today, scheduled, events, mail requiring action.
- Success: user chooses first concrete actions for the day.

## 2. Inbox Triage
- Trigger: user opens `/inbox`.
- Steps: reviews unified stream, segments by source/type, applies Done/Snooze/Create Task/Plan actions.
- Success: incoming items become planned tasks/events or archived states.

## 3. Email to Task
- Trigger: user opens email item.
- Steps: presses `Create Task`, gets linked task.
- Success: task is created, linked to email source, visible in tasks/today contexts.

## 4. Task to Deadline/Calendar
- Trigger: user opens task detail or quick actions from inbox.
- Steps: sets due date and/or scheduled time.
- Success: task appears in calendar/today lists by date bucket.

## 5. Workout Preview
- Trigger: user opens `/workout`.
- Steps: selects plan, reviews preview, starts session.
- Success: session is created in DB and opens active session screen.

## 6. Active Workout
- Trigger: user in `/workout/session/:id`.
- Steps: logs sets, updates reps/weight/RPE, completes session.
- Success: set and session changes persist after refresh.

## 7. Post-workout Nutrition
- Trigger: session completed.
- Steps: opens nutrition flow, logs meal entries.
- Success: daily nutrition aggregates reflect entries and goals.

## 8. Evening Learning/Project Continuation
- Trigger: user checks remaining work.
- Steps: reviews pending tasks/milestones/learning tracks.
- Success: user schedules continuation items for next day.

## 9. Day Review
- Trigger: end of day.
- Steps: closes completed tasks, snoozes unfinished tasks, checks tomorrow plan.
- Success: inbox and today state are clean for next day.
