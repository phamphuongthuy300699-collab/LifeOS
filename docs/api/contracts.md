# API Contracts (Current Map)

## Auth
| Endpoint | Method | Auth | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/api/v1/auth/google` | GET | No | Start Google OAuth | Query: optional state | `302` redirect to Google consent |
| `/api/v1/auth/google/callback` | GET | No | OAuth callback finalize and redirect to web callback | Query: `code`, `state` | `302` redirect to `/auth/google/callback#...tokens` |
| `/api/v1/auth/me` | GET | Yes | Current user/workspace/integration status | Header: Bearer token | `{ user, workspaceId, integrations }` |
| `/api/v1/auth/logout` | POST | Optional | Client-side session cleanup endpoint | none | `{ ok: true }` style payload |

## Today
| Endpoint | Method | Auth | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/api/v1/today` | GET | Yes | Execution dashboard data | none | `{ focusBlock, pendingInboxCount, topTasks, dueTodayTasks, overdueTasks, scheduledTasks, events, emailsRequiringAction }` |

## Inbox
| Endpoint | Method | Auth | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/api/v1/inbox` | GET | Yes | Unified triage stream | Query: `type,status,sourceProvider,limit,cursor` | `{ items, counts, filters, page }` |
| `/api/v1/inbox-items` | GET | Yes | Raw capture list | none | `{ items }` |
| `/api/v1/inbox-items` | POST | Yes | Create capture item | `{ rawText, captureChannel? }` | `InboxItem` |
| `/api/v1/inbox-items/:id` | PATCH | Yes | Update capture status | `{ status }` | `InboxItem` |
| `/api/v1/inbox-items/:id/triage` | POST | Yes | Convert capture to entity | `{ targetType, title, body? }` | `{ inboxItem, createdEntityType, createdEntityId }` |

## Mail
| Endpoint | Method | Auth | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/api/v1/mail/sync` | POST | Yes | Manual Gmail sync | none | `{ importedCount, updatedCount, threadsCount, messagesCount, ... }` |
| `/api/v1/mail/threads` | GET | Yes | Mail list with action state | none | `{ messages }` |
| `/api/v1/mail/messages/:id` | GET | Yes | Mail detail | Path `id` | `{ message }` |
| `/api/v1/mail/messages/:id/action-state` | PATCH | Yes | Update triage status | Query/body `triageStatus` | `{ state, requestId }` |
| `/api/v1/mail/messages/:id/create-task` | POST | Yes | Convert mail to task | none | `{ task, state }` |

## Tasks
| Endpoint | Method | Auth | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/api/v1/tasks` | GET | Yes | List tasks | Query: `status,includeCompleted,projectId,dueBefore` | `{ items }` |
| `/api/v1/tasks` | POST | Yes | Create task | create-task DTO | `Task + requestId` |
| `/api/v1/tasks/:id` | GET | Yes | Task detail | Path `id` | `TaskDetails` (subtasks/relations/milestones/sourceEmail) |
| `/api/v1/tasks/:id` | PATCH | Yes | Update task | update-task DTO | `Task + requestId` |
| `/api/v1/tasks/:id/complete` | POST | Yes | Mark done | none | `Task + requestId` |
| `/api/v1/tasks/:id/snooze` | POST | Yes | Reschedule | `{ dueAt?, scheduledStartAt?, scheduledEndAt? }` | `Task + requestId` |
| `/api/v1/tasks/:id/subtasks` | POST | Yes | Create subtask | subtask DTO | `Task + requestId` |
| `/api/v1/tasks/:id/link` | POST | Yes | Link relation entity | `{ relatedEntityType, relatedEntityId, relationKind?, metadataJson? }` | `TaskRelation + requestId` |

## Calendar
| Endpoint | Method | Auth | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/api/v1/calendar/today` | GET | Yes | Calendar today slice | none | `{ dueToday, scheduledToday, events, overdue }` |
| `/api/v1/calendar/upcoming` | GET | Yes | Next 7 days slice | none | `{ rangeStart, rangeEnd, tasks, events }` |
| `/api/v1/calendar/overdue` | GET | Yes | Overdue tasks slice | none | `{ items, total }` |
| `/api/v1/calendar/events` | GET | Yes | Event feed for calendar UI | Query: `from,to,sourceProvider,limit` | `{ items, filters }` |
| `/api/v1/calendar/google/sync` | POST | Yes | Manual Google Calendar import | Query: `from,to,calendarId,limit` | `{ requestId, importedCount, updatedCount, totalGoogleEvents, ... }` |

## Events
| Endpoint | Method | Auth | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/api/v1/events` | GET | Yes | List events | Query: `from,to` | `{ items }` |
| `/api/v1/events` | POST | Yes | Create event | create-event DTO | `Event + requestId` |
| `/api/v1/events/:id` | GET | Yes | Event detail | Path `id` | `Event` |
| `/api/v1/events/:id` | PATCH | Yes | Update event | update-event DTO | `Event + requestId` |

## Workouts
| Endpoint | Method | Auth | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/api/v1/exercises` | GET/POST/PATCH | Yes | Exercise catalog/custom items | DTO/query | list/item |
| `/api/v1/workout-plans` | GET/POST | Yes | Plans and plan creation | DTO/query | list/item |
| `/api/v1/workout-sessions` | POST | Yes | Start session | `{ workoutPlanId }` | `Session + exercises + requestId` |
| `/api/v1/workout-sessions/:id` | GET/PATCH | Yes | Session detail/update | DTO | session payload |
| `/api/v1/workout-sessions/:id/complete` | POST | Yes | Complete session | summary payload | completed session |
| `/api/v1/workout-sets/:id` | PATCH | Yes | Update set result | set payload | set payload |

## Nutrition
| Endpoint | Method | Auth | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/api/v1/nutrition/daily` | GET | Yes | Daily nutrition aggregate | Query: date | daily summary |
| `/api/v1/nutrition-goals/current` | PATCH | Yes | Save active macro goals | `{ caloriesTarget, proteinTargetG, fatTargetG, carbsTargetG }` | active goal + requestId |
| `/api/v1/meals` | POST/PATCH | Yes | Create/update meals | meal DTO | meal payload |
| `/api/v1/meals/:id/entries` | POST/PATCH | Yes | Create/update meal entries | entry DTO | entry payload |
| `/api/v1/food-items` | GET | Yes | Food item search/list | query | list |

## Projects and Milestones
| Endpoint | Method | Auth | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/api/v1/projects` | GET/POST | Yes | List/create projects | DTO | `{ items }`/item |
| `/api/v1/projects/:id` | GET/PATCH | Yes | Project detail/update | DTO | item |
| `/api/v1/projects/:id/milestones` | GET/POST | Yes | List/create milestones in project | DTO | `{ items }`/item |
| `/api/v1/project-milestones/:id` | PATCH | Yes | Update milestone | DTO | milestone |

## Debug
| Endpoint | Method | Auth | Purpose | Request | Response |
|---|---|---|---|---|---|
| `/api/v1/debug/current-user-stats` | GET | Yes | Counts for current user/workspace | none | `{ userId, workspaceId, counts, ... }` |
| `/api/v1/debug/health-write` | GET | Yes | Write-path health probe | none | `{ status, requestId, elapsedMs, readBackFound, ... }` |
