# ТЗ v2: LifeOS / Personal Productivity Hub

## 1. Концепция продукта
Персональное mobile-first приложение для систематизации задач, писем, календаря, тренировок, питания, обучения, контактов, ПЭТ-проектов и личных финансов.

Платформа запуска:
- PWA first;
- дальнейшая упаковка в Android/iOS;
- single-user first, multi-user ready.

## 2. Цели продукта
- дать единый экран управления днём;
- сократить трение при вводе задач, еды, результатов тренировок и заметок;
- связать письма, задачи, календарь и проекты в одну систему;
- поддержать офлайн-критичные сценарии;
- заложить архитектуру под AI, speech, интеграции и рост в портфельный/коммерческий продукт.

## 3. Приоритет MVP
### Критический приоритет
1. Today / ежедневный обзор.
2. Inbox / быстрый захват.
3. Задачи + календарь.
4. Gmail + email-to-task.
5. Тренировки.
6. Питание / КБЖУ.

### Следующий приоритет
7. Обучение.
8. Контакты.
9. ПЭТ-проекты.
10. Финансы.
11. Экспорт.
12. Dark mode.
13. i18n-ready архитектура.

## 4. Что входит в MVP
- авторизация;
- профиль пользователя;
- экран «Сегодня»;
- inbox;
- задачи;
- заметки;
- календарные события;
- список писем и просмотр письма;
- создание задачи из письма;
- связь письма с задачей;
- тренировки: планы, упражнения, подходы, веса, повторы, история;
- питание: блюда, граммовки, дневной баланс КБЖУ;
- обучение: треки, темы, материалы, сессии;
- контакты: простые карточки;
- проекты: статус, next action, milestone;
- финансы: базовые доходы/расходы;
- экспорт JSON/CSV/Markdown;
- тёмная тема;
- i18n-ready структура.

## 5. Что не входит в MVP
- multi-user collaboration;
- push-уведомления;
- полноценный почтовый клиент;
- инвестиции;
- CRM продвинутого уровня;
- шаги/пульс/wearables;
- фотоанализ еды;
- продвинутые workout metrics как обязательная часть;
- полный offline-first для всех модулей.

## 6. Главные сценарии использования
1. Утром открыть «Сегодня» и понять, что важно.
2. Быстро зафиксировать входящее в Inbox текстом или голосом.
3. Открыть тренировку до зала и посмотреть план.
4. В зале идти по плану и записывать результаты.
5. Открыть технику упражнения без потери контекста.
6. После тренировки сразу перейти к питанию.
7. Из письма создать задачу и связать её с проектом.
8. Вечером открыть обучение или проект и получить next step.
9. Перед сном сделать короткий review дня.

## 7. UX-принципы
- scenario-first, не module-first;
- сначала быстрый захват, потом уточнение;
- минимум обязательных полей;
- ключевые действия за 1–3 тапа;
- контекстные quick actions;
- mobile-first интерфейс;
- в тренировке и питании — low-friction input;
- AI и speech только через review/confirmation перед записью в БД.

## 8. Навигация MVP
Нижняя навигация:
1. Сегодня
2. Inbox
3. Тренировка
4. Питание
5. Ещё

Раздел «Ещё»:
- обучение;
- контакты;
- проекты;
- финансы;
- экспорт;
- настройки.

Глобально доступно:
- quick add;
- поиск;
- профиль/настройки;
- при наличии — микрофон для voice capture.

## 9. Screen Map MVP

### 9.1. Core screens
1. Splash / auth bootstrap
2. Login / connect accounts
3. Onboarding
4. Today
5. Inbox list
6. Inbox item detail / triage
7. Task list
8. Task detail
9. Note detail/editor
10. Calendar / event list-day view
11. Event detail
12. Mail threads list
13. Mail message detail
14. Workout preview
15. Active workout mode
16. Exercise technique sheet
17. Workout summary
18. Nutrition dashboard
19. Add meal flow
20. Learning hub
21. Learning track detail
22. Learning session detail
23. Contacts list
24. Contact detail
25. Projects list
26. Project detail
27. Finance summary
28. Transactions list
29. Add transaction flow
30. Export center
31. Settings

### 9.2. Global overlays / sheets / modals
- Quick Add sheet
- Voice Capture sheet
- Email-to-Task sheet
- Task link / relation sheet
- Exercise technique sheet
- Add set sheet (если нужен компактный режим)
- Add meal entry sheet
- Day review sheet
- AI confirmation sheet
- Search sheet
- Filter/sort sheets

## 10. User Flows MVP

### Flow 1. Старт дня
Today -> Task detail / Event detail / Mail message detail / Workout preview / Nutrition dashboard

### Flow 2. Быстрый захват
Любой экран -> Quick Add / Voice Capture -> Inbox item created -> Inbox triage -> Task / Note / Event / Meal / Expense / Contact / Project idea

### Flow 3. Email to Task
Today or Mail threads -> Mail message detail -> Create task from email -> Task edit confirm -> Task detail -> optional link to Project / Event / Note

### Flow 4. Подготовка к тренировке
Today -> Workout preview -> Start workout -> Active workout mode

### Flow 5. Активная тренировка
Active workout mode -> Exercise card -> Add/complete set -> Next exercise -> Technique sheet (optional) -> return to same exercise -> Finish workout -> Workout summary

### Flow 6. После тренировки к питанию
Workout summary -> Add meal -> Meal entries -> Nutrition dashboard

### Flow 7. Ввод еды
Nutrition dashboard -> Add meal -> Quick text parse or manual entry -> Confirm -> Nutrition dashboard updated

### Flow 8. Вечернее обучение
Today evening block or More -> Learning hub -> Track detail -> Session start/log -> Session saved -> back to Today/Hub

### Flow 9. Вечерний проектный контекст
Today evening block or More -> Projects list -> Project detail -> Open related task / add note / update milestone / set next action

### Flow 10. Review дня
Today -> Day review sheet -> complete/rollover tasks -> short note -> save

## 11. Ключевые элементы экранов

### Today
- Focus block;
- top tasks;
- events/calls;
- emails requiring action;
- workout card;
- nutrition summary;
- evening suggestion block.

Quick actions:
- добавить задачу;
- открыть inbox;
- создать заметку;
- открыть письмо;
- открыть тренировку;
- добавить еду.

### Inbox
- список необработанного входящего;
- фильтр по типу источника;
- triage actions: task / note / event / expense / meal / ignore / archive.

### Mail message detail
- subject;
- sender;
- snippet/body;
- action state;
- create task;
- link to existing task/project;
- mark processed.

### Workout preview
- название тренировки;
- цель;
- упражнения;
- длительность;
- последние результаты;
- кнопка «Начать тренировку».

### Active workout mode
- одно активное упражнение в фокусе;
- target scheme;
- previous result;
- set list;
- быстрый ввод веса/повторов;
- complete set;
- rest timer;
- техника/видео;
- next/previous exercise;
- finish workout.

### Workout summary
- итог тренировки;
- completed exercises;
- краткий прогресс;
- CTA: добавить еду.

### Nutrition dashboard
- дневная цель;
- съедено;
- осталось;
- белки/жиры/углеводы;
- meals list;
- quick add meal.

### Learning hub
- активный трек;
- next topic;
- backlog materials;
- completed progress;
- start session.

### Project detail
- статус;
- purpose;
- next action;
- current milestone;
- related tasks;
- notes/history.

## 12. Доменные bounded contexts
Core:
- Identity & Access
- User Preferences
- Inbox & Capture
- Tasks
- Notes
- Calendar & Events
- Relations / Attachments / Tags

Feature:
- Mail Integration
- Workouts
- Nutrition
- Learning
- Contacts
- Projects
- Finance
- Export
- AI / Speech

Platform:
- Audit Log
- Sync Jobs
- File Storage Metadata
- Localization Metadata
- Feature Flags

## 13. Архитектура
- modular monolith;
- monorepo;
- PostgreSQL как главный source of truth;
- background workers для sync/AI/export;
- REST-first API `/api/v1`;
- typed DTO + validation;
- PWA клиент + backend API + worker;
- future-native ready.

## 14. Рекомендуемый стек
Frontend:
- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- Zustand
- React Hook Form
- Zod

Backend:
- TypeScript API
- Drizzle ORM
- PostgreSQL
- object storage для файлов
- jobs/queues для background operations

## 15. Структура монорепозитория
- apps/web
- apps/api
- apps/worker
- packages/domain-core
- packages/domain-tasks
- packages/domain-notes
- packages/domain-calendar
- packages/domain-mail
- packages/domain-workouts
- packages/domain-nutrition
- packages/domain-learning
- packages/domain-contacts
- packages/domain-projects
- packages/domain-finance
- packages/domain-export
- packages/domain-ai
- packages/db
- packages/auth
- packages/ui
- packages/i18n
- packages/config
- packages/shared
- packages/integrations-google
- packages/integrations-yandex
- packages/testing
- docs/product
- docs/architecture
- docs/adr
- docs/api
- docs/db
- docs/ux

## 16. Канонические сущности

### Identity / access
- User
- Workspace
- Membership
- ExternalAccount

### Core capture / productivity
- InboxItem
- Task
- TaskRelation
- Note
- NoteRelation
- Event
- Reminder
- Tag
- EntityTag
- Attachment
- AttachmentRelation

### Mail
- MailAccount
- MailThread
- MailMessage
- MailActionState

### Workouts
- Exercise
- WorkoutPlan
- WorkoutPlanExercise
- WorkoutSession
- WorkoutSessionExercise
- WorkoutSet
- WorkoutPersonalRecord

### Nutrition
- NutritionGoal
- FoodItem
- Meal
- MealEntry
- DailyNutritionSummaryMaterialized (optional)

### Learning
- LearningTrack
- LearningTopic
- LearningMaterial
- LearningSession

### Contacts
- Contact
- ContactInteraction

### Projects
- Project
- ProjectMilestone
- ProjectNote

### Finance
- FinanceCategory
- FinanceAccount
- Transaction

### Export / platform
- ExportJob
- ActivityLog
- SyncJob

### AI / speech
- VoiceCapture
- VoiceCaptureSegment
- AIJob
- AIResult
- AIFeedback
- AIUsageLog

## 17. Ключевые поля сущностей

### User
- id, email, display_name, avatar_url?, timezone, locale, theme, onboarding_state, created_at, updated_at

### Workspace
- id, owner_user_id, name, slug, plan_type, created_at, updated_at

### ExternalAccount
- id, user_id, provider, provider_account_id, email?, scopes_json, access_token_encrypted, refresh_token_encrypted, token_expires_at?, sync_enabled, metadata_json?, created_at, updated_at

### InboxItem
- id, workspace_id, user_id, source_type, source_ref_type?, source_ref_id?, title?, raw_text?, normalized_text?, status, capture_channel, captured_at, triaged_at?, created_entity_type?, created_entity_id?, metadata_json?

### Task
- id, workspace_id, user_id, project_id?, parent_task_id?, title, description?, status, priority, due_at?, scheduled_start_at?, scheduled_end_at?, estimate_minutes?, source_type?, source_ref_type?, source_ref_id?, created_from_inbox_item_id?, completed_at?, sort_order?, created_at, updated_at, archived_at?

### Note
- id, workspace_id, user_id, title?, body_markdown, note_type, source_type?, source_ref_type?, source_ref_id?, created_from_inbox_item_id?, created_at, updated_at, archived_at?

### Event
- id, workspace_id, user_id, external_calendar_id?, external_event_id?, title, description?, location?, event_type, starts_at, ends_at, timezone, source_provider?, meeting_url?, status, created_at, updated_at

### MailMessage
- id, workspace_id, user_id, mail_thread_id, provider_message_id, from_json, to_json, cc_json?, sent_at, subject, snippet?, body_text?, body_html?, direction, is_unread, has_attachments, labels_json?, web_url?, imported_at

### MailActionState
- id, workspace_id, user_id, mail_message_id, triage_status, linked_task_id?, linked_project_id?, action_note?, snoozed_until?, updated_at

### Exercise
- id, workspace_id, user_id, name, slug, description_short?, description_markdown?, muscle_groups_json, equipment_json?, difficulty?, default_video_url?, default_rest_seconds?, is_custom, created_at, updated_at

### WorkoutPlan
- id, workspace_id, user_id, name, goal?, description?, is_active, schedule_hint_json?, created_at, updated_at

### WorkoutSession
- id, workspace_id, user_id, workout_plan_id?, started_at, ended_at?, session_status, perceived_intensity?, notes?, created_at, updated_at

### WorkoutSet
- id, workout_session_exercise_id, set_number, weight_value?, reps_count?, duration_seconds?, distance_meters?, rpe?, rir?, is_warmup, is_completed, completed_at?

### NutritionGoal
- id, workspace_id, user_id, calories_target?, protein_target_g?, fat_target_g?, carbs_target_g?, effective_from, effective_to?

### FoodItem
- id, workspace_id, user_id, name, brand?, calories_per_100g?, protein_per_100g?, fat_per_100g?, carbs_per_100g?, source_type, is_custom, created_at

### Meal
- id, workspace_id, user_id, meal_type, consumed_at, source_type, source_ref_type?, source_ref_id?, notes?, created_at, updated_at

### MealEntry
- id, meal_id, food_item_id?, raw_name, grams?, portion_count?, calories?, protein_g?, fat_g?, carbs_g?, estimation_mode, confidence?, created_at

### LearningTrack
- id, workspace_id, user_id, name, description?, status, goal?, created_at, updated_at

### LearningTopic
- id, learning_track_id, parent_topic_id?, name, description?, status, order_index

### LearningMaterial
- id, workspace_id, user_id, learning_track_id?, topic_id?, title, material_type, url?, source_note_id?, status, estimate_minutes?, metadata_json?, created_at

### Contact
- id, workspace_id, user_id, first_name?, last_name?, display_name, company?, role_title?, primary_email?, primary_phone?, short_profile?, notes_markdown?, last_interaction_at?, source_type?, external_provider_id?, created_at, updated_at

### Project
- id, workspace_id, user_id, name, slug, description?, status, purpose?, current_next_action?, current_milestone?, repo_url?, last_activity_at?, created_at, updated_at

### ProjectMilestone
- id, project_id, title, description?, target_date?, status, order_index

### FinanceCategory
- id, workspace_id, user_id, name, direction, color_token?, parent_category_id?, created_at

### FinanceAccount
- id, workspace_id, user_id, name, account_type, currency_code, is_archived, created_at

### Transaction
- id, workspace_id, user_id, finance_account_id?, category_id?, direction, amount_minor, currency_code, transaction_at, description?, source_type, source_ref_type?, source_ref_id?, created_at, updated_at

### ExportJob
- id, workspace_id, user_id, export_type, format, status, filter_json?, file_attachment_id?, started_at?, finished_at?, created_at

### ActivityLog
- id, workspace_id, user_id, entity_type, entity_id, action_type, payload_json?, created_at

### SyncJob
- id, workspace_id, user_id, integration_type, entity_scope, status, run_mode, cursor?, error_message?, started_at?, finished_at?, created_at

### VoiceCapture
- id, user_id, source_type, language, raw_audio_url?, raw_text, normalized_text, is_final, confidence?, created_at

### VoiceCaptureSegment
- id, voice_capture_id, text, start_ms?, end_ms?, confidence?, order_index

### AIJob
- id, user_id, task_name, provider, model, status, input_ref_type, input_ref_id, prompt_version, started_at, finished_at, error_code?, estimated_cost?, actual_cost?

### AIResult
- id, ai_job_id, output_json, output_text?, confidence?, schema_version, requires_confirmation, confirmed_at?, rejected_at?

### AIFeedback
- id, ai_result_id, user_id, feedback_type, comment?, corrected_output_json?, created_at

### AIUsageLog
- id, user_id, provider, model, tokens_in?, tokens_out?, cost?, latency_ms?, success, created_at

## 18. Ключевые связи
- Workspace 1..n Membership
- User 1..n ExternalAccount
- Workspace 1..n Task / Note / Event / Project / Contact / Transaction / WorkoutPlan / Meal / InboxItem
- MailMessage n..m Task через relations
- Project 1..n Task
- Project 1..n ProjectMilestone
- WorkoutPlan 1..n WorkoutPlanExercise
- WorkoutSession 1..n WorkoutSessionExercise
- WorkoutSessionExercise 1..n WorkoutSet
- Meal 1..n MealEntry
- LearningTrack 1..n Topic / Material / Session
- Contact 1..n ContactInteraction
- Attachment n..m entities через AttachmentRelation
- Tag n..m entities через EntityTag

## 19. Правила целостности
- все пользовательские сущности имеют workspace_id;
- все связи workspace-scoped;
- денежные суммы в minor units;
- время хранится в UTC, отображается по timezone пользователя;
- soft delete для основных сущностей;
- внешние идентификаторы не смешиваются с внутренними;
- AI-результаты не коммитятся без подтверждения;
- сохраняется источник происхождения сущности.

## 20. API v1

### Auth / profile
- POST /api/v1/auth/login
- POST /api/v1/auth/logout
- GET /api/v1/me
- PATCH /api/v1/me/preferences

### Today
- GET /api/v1/today
- GET /api/v1/today/summary

### Inbox
- GET /api/v1/inbox-items
- POST /api/v1/inbox-items
- PATCH /api/v1/inbox-items/:id
- POST /api/v1/inbox-items/:id/triage

### Tasks
- GET /api/v1/tasks
- POST /api/v1/tasks
- GET /api/v1/tasks/:id
- PATCH /api/v1/tasks/:id
- POST /api/v1/tasks/:id/complete
- POST /api/v1/tasks/:id/snooze
- POST /api/v1/tasks/:id/link

### Notes
- GET /api/v1/notes
- POST /api/v1/notes
- GET /api/v1/notes/:id
- PATCH /api/v1/notes/:id

### Events
- GET /api/v1/events
- POST /api/v1/events
- GET /api/v1/events/:id
- PATCH /api/v1/events/:id

### Mail
- GET /api/v1/mail/threads
- GET /api/v1/mail/messages/:id
- POST /api/v1/mail/messages/:id/create-task
- PATCH /api/v1/mail/messages/:id/action-state
- POST /api/v1/mail/sync

### Workouts
- GET /api/v1/exercises
- POST /api/v1/exercises
- GET /api/v1/workout-plans
- POST /api/v1/workout-plans
- POST /api/v1/workout-sessions
- GET /api/v1/workout-sessions/:id
- PATCH /api/v1/workout-sessions/:id
- POST /api/v1/workout-sessions/:id/sets
- PATCH /api/v1/workout-sets/:id

### Nutrition
- GET /api/v1/nutrition/daily
- GET /api/v1/food-items
- POST /api/v1/meals
- PATCH /api/v1/meals/:id
- POST /api/v1/meals/:id/entries
- PATCH /api/v1/meal-entries/:id
- PATCH /api/v1/nutrition-goals/current

### Learning
- GET /api/v1/learning/tracks
- POST /api/v1/learning/tracks
- GET /api/v1/learning/materials
- POST /api/v1/learning/materials
- POST /api/v1/learning/sessions

### Contacts
- GET /api/v1/contacts
- POST /api/v1/contacts
- GET /api/v1/contacts/:id
- PATCH /api/v1/contacts/:id

### Projects
- GET /api/v1/projects
- POST /api/v1/projects
- GET /api/v1/projects/:id
- PATCH /api/v1/projects/:id
- POST /api/v1/projects/:id/milestones

### Finance
- GET /api/v1/transactions
- POST /api/v1/transactions
- PATCH /api/v1/transactions/:id
- GET /api/v1/finance/summary

### Export
- POST /api/v1/exports
- GET /api/v1/exports
- GET /api/v1/exports/:id

### AI / speech
- POST /api/v1/speech/transcribe
- POST /api/v1/ai/parse-quick-capture
- POST /api/v1/ai/parse-meal
- POST /api/v1/ai/summarize-email
- POST /api/v1/ai/parse-learning-markdown

## 21. Offline / sync
Оффлайн в MVP:
- просмотр последних Today данных из кеша;
- создание InboxItem;
- создание/редактирование Note;
- изменение статуса Task;
- локальные черновики.

Синхронизация позже:
- mail refresh;
- calendar refresh;
- export generation;
- AI jobs;
- full reconciliation.

Подход:
- optimistic UI;
- client-side outbox queue;
- retry при появлении сети;
- conflict policy: last-write-wins для простых сущностей, manual review для сложных.

## 22. AI / Speech

### Speech
Назначение:
- quick capture;
- заметка голосом;
- задача голосом;
- еда голосом;
- короткие комментарии.

Не основной ввод для:
- подходов в тренировке;
- финансовых операций;
- сложных форм.

Абстракция:
- SpeechProvider
- реализации: web local / native platform / native whisper / server fallback

Pipeline:
- capture -> transcript -> parse -> confirmation -> commit

### AI
Назначение:
- parse quick capture;
- parse meal text;
- summarize email;
- extract email actions;
- parse learning markdown;
- suggest next learning/project step;
- summarize day.

Правила:
- только через backend gateway;
- schema-first structured outputs;
- critical write paths только с confirmation;
- free/cheap models только для non-critical задач.

## 23. Интеграции
### MVP
- Google Calendar
- Gmail

### Planned later
- Yandex Calendar
- Yandex Mail
- voice local-native extensions

## 24. Экспорт
Форматы:
- JSON — canonical machine export
- CSV — analytics/table flows
- Markdown — notes/learning/projects/AI-friendly export

Домены экспорта:
- tasks
- notes
- workouts
- nutrition
- learning
- contacts
- projects
- finance
- daily summary

## 25. Индексы PostgreSQL
- tasks(workspace_id, user_id, status, due_at)
- tasks(workspace_id, user_id, scheduled_start_at)
- inbox_items(workspace_id, user_id, status, captured_at desc)
- events(workspace_id, user_id, starts_at)
- mail_messages(workspace_id, user_id, sent_at desc)
- mail_action_state(workspace_id, user_id, triage_status)
- workout_sessions(workspace_id, user_id, started_at desc)
- meals(workspace_id, user_id, consumed_at)
- transactions(workspace_id, user_id, transaction_at desc)
- activity_log(workspace_id, created_at desc)

## 26. ADR backlog
- PWA-first with future native packaging
- Modular monolith
- PostgreSQL as single source of truth
- Workspace from day one
- REST-first typed API
- AI via backend gateway only
- Speech and AI as separate layers
- Selected offline support in MVP
- Export as first-class capability
- Email as input source, not mail client

## 27. Roadmap по спринтам
### Sprint 0
- monorepo
- CI
- auth foundation
- theme + i18n scaffolding
- db baseline
- app shell

### Sprint 1
- inbox
- tasks
- notes
- quick add
- basic Today

### Sprint 2
- events
- scheduling
- reminders baseline
- Today aggregation

### Sprint 3
- Gmail auth/scopes
- mail sync MVP
- MailActionState
- email-to-task
- today mail widget

### Sprint 4
- exercise library
- workout plan/session/set
- active workout backend flows

### Sprint 5
- nutrition goal
- food items
- meals / entries
- daily nutrition summary
- post-workout nutrition linkage

### Sprint 6
- learning
- contacts
- projects
- evening suggestion blocks

### Sprint 7
- finance
- exports

### Sprint 8
- AI / speech foundation
- parse quick capture
- parse meal
- summarize email

## 28. Критерии готовности MVP foundation
- Today собирается как backend aggregated view;
- email связан с task через стабильную модель;
- workout поддерживает активную сессию и историю;
- nutrition поддерживает ручной и AI-assisted ввод;
- export существует как отдельный домен;
- AI/Speech не ломают доменную модель;
- i18n и dark theme заложены с первого релиза.

## 29. AI-first implementation pack

### 29.1. Что важнее всего для AI coding tools
При разработке через Codex / Claude Code первыми артефактами должны быть:
1. структура монорепозитория;
2. доменные контракты и типы;
3. schema skeleton для БД;
4. API contracts;
5. naming conventions;
6. dependency rules между пакетами;
7. build order.

### 29.2. Порядок генерации проекта через AI
1. Создать monorepo scaffold.
2. Поднять packages/config, packages/shared, packages/i18n.
3. Создать packages/db с schema skeleton и миграциями.
4. Создать domain-core и core feature packages.
5. Создать apps/api с минимальным health/auth/today/inbox/tasks API.
6. Создать apps/web с app shell, auth shell и navigation shell.
7. Добавлять домены по спринтам.

### 29.3. Dependency rules
- apps/web может зависеть от packages/ui, packages/shared, packages/i18n, typed client contracts.
- apps/api может зависеть от всех domain-пакетов, db, auth, integrations, ai.
- apps/worker может зависеть от db, domain-*, integrations, ai.
- domain-* пакеты не зависят от ui.
- domain-* пакеты не должны напрямую зависеть друг от друга циклически.
- общий код переносится в shared или domain-core.
- integrations-* не должны содержать UI.

### 29.4. Рекомендуемый minimum package order
1. packages/config
2. packages/shared
3. packages/i18n
4. packages/db
5. packages/domain-core
6. packages/domain-tasks
7. packages/domain-notes
8. packages/domain-calendar
9. packages/domain-mail
10. packages/domain-workouts
11. packages/domain-nutrition
12. packages/domain-learning
13. packages/domain-contacts
14. packages/domain-projects
15. packages/domain-finance
16. packages/domain-export
17. packages/domain-ai
18. packages/auth
19. packages/ui
20. apps/api
21. apps/web
22. apps/worker

### 29.5. Naming conventions
- таблицы БД: snake_case, plural where appropriate;
- колонки БД: snake_case;
- TypeScript types/interfaces: PascalCase;
- zod schemas: PascalCase + Schema;
- API DTO: PascalCase + Request / Response;
- React components: PascalCase;
- hooks: useXxx;
- server use-cases: verbNoun;
- files: kebab-case, кроме React component files если нужен PascalCase.

### 29.6. Canonical folders inside apps/api
- src/modules/
- src/routes/
- src/lib/
- src/middleware/
- src/jobs/
- src/adapters/
- src/contracts/
- src/config/

### 29.7. Canonical folders inside apps/web
- src/app/
- src/screens/
- src/features/
- src/entities/
- src/widgets/
- src/shared/
- src/providers/
- src/lib/
- src/styles/

### 29.8. Canonical folders inside packages/db
- src/schema/
- src/migrations/
- src/seeds/
- src/client/
- src/repositories/

### 29.9. Domain package template
Каждый domain-* пакет должен содержать:
- entities/
- value-objects/
- dto/
- validators/
- repositories/
- use-cases/
- services/
- policies/
- events/
- index.ts

## 30. DB schema skeleton priority

### 30.1. Phase A — foundation tables
- users
- workspaces
- memberships
- external_accounts
- feature_flags
- activity_logs
- attachments
- attachment_relations
- tags
- entity_tags

### 30.2. Phase B — core productivity
- inbox_items
- tasks
- task_relations
- notes
- note_relations
- events
- reminders

### 30.3. Phase C — mail
- mail_accounts
- mail_threads
- mail_messages
- mail_action_states
- sync_jobs

### 30.4. Phase D — workouts
- exercises
- workout_plans
- workout_plan_exercises
- workout_sessions
- workout_session_exercises
- workout_sets
- workout_personal_records

### 30.5. Phase E — nutrition
- nutrition_goals
- food_items
- meals
- meal_entries
- daily_nutrition_summaries

### 30.6. Phase F — growth and continuity
- learning_tracks
- learning_topics
- learning_materials
- learning_sessions
- contacts
- contact_interactions
- projects
- project_milestones
- project_notes
- finance_categories
- finance_accounts
- transactions
- export_jobs

### 30.7. Phase G — AI / speech
- voice_captures
- voice_capture_segments
- ai_jobs
- ai_results
- ai_feedback
- ai_usage_logs

## 31. API contract priority for AI-assisted development

### 31.1. Must-have contracts first
- GET /api/v1/me
- GET /api/v1/today
- GET /api/v1/inbox-items
- POST /api/v1/inbox-items
- POST /api/v1/inbox-items/:id/triage
- GET /api/v1/tasks
- POST /api/v1/tasks
- PATCH /api/v1/tasks/:id
- GET /api/v1/notes
- POST /api/v1/notes
- GET /api/v1/events
- GET /api/v1/mail/threads
- GET /api/v1/mail/messages/:id
- POST /api/v1/mail/messages/:id/create-task

### 31.2. Second wave contracts
- workout endpoints
- nutrition endpoints
- learning endpoints
- projects endpoints
- finance endpoints
- export endpoints
- ai/speech endpoints

## 32. Seed data pack required for AI-generated local development
Минимальные сиды:
- 1 user
- 1 workspace
- 10 tasks
- 5 notes
- 5 events
- 1 mail account
- 3 threads / 10 messages
- 1 workout plan with 6 exercises
- 2 workout sessions history
- 1 nutrition goal
- 8 food items
- 2 meals today
- 1 learning track
- 2 contacts
- 2 projects
- 6 transactions

## 33. Prompting rules for AI coding tools
- генерировать код пакетами и небольшими шагами;
- сначала schema/types/contracts, потом реализацию;
- не генерировать сразу весь проект одним запросом;
- после каждого шага требовать self-check imports/types/tests;
- использовать существующие naming conventions;
- не смешивать domain logic и UI logic;
- не писать интеграции с внешними API до фиксации внутреннего контракта;
- каждый новый модуль должен иметь README с purpose и boundaries.

## 34. Лучший следующий артефакт для AI coding workflow
Следующий самый полезный артефакт:
- Drizzle schema skeleton + package/file tree + module boundaries.

После него:
- typed API contracts;
- screen-level UI spec.

Именно этот порядок лучше всего подходит для разработки через Codex / Claude Code.

