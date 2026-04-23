# Sprint 1 Plan and Context

**PROMPT / CONTEXT FOR THE AI ON NEXT LAUNCH:**
> "Мы завершили Sprint 0 (создание монорепозитория, настройка базы данных, всех скелетов пакетов и базовых приложений: api, web, worker). Сейчас мы находимся на этапе старта Sprint 1. Пожалуйста, прочитай этот файл `SPRINT_1_PLAN.md` в корне, чтобы получить задачи на текущий спринт, и начни с реализации первого шага (Step 1: Database Phase B)."

---

## Sprint 1 — Core Productivity (Inbox, Tasks, Notes, Today)

This sprint targets the core foundational features of the productivity workflow: capturing data into the inbox, converting it to tasks/notes, and seeing it on the `Today` screen.

### Proposed Architecture Changes

#### Database (`packages/db`)
Implement Phase B schema tables to support core productivity.
- **inbox.schema.ts**: Table `inbox_items` to store raw text or voice inputs that need to be triaged.
- **tasks.schema.ts**: Tables `tasks` and `task_relations` with proper enums (status, priority) and soft-deletes.
- **notes.schema.ts**: Tables `notes` and `note_relations`. Storing markdown content.
- **Export**: Export the newly added Phase B schemas in `index.ts`.

#### Domain Logic (`packages/domain-*`)
Implement the business logic according to Clean Architecture.
- **domain-tasks**: Add `TaskEntity`, `TaskRepository` interface, Create/Update/Triage use-cases.
- **domain-notes**: Add `NoteEntity`, Create/Update/Link use-cases.
- **domain-core**: Add Inbox-to-Entity generic triaging use-cases.

#### Application API (`apps/api`)
Expose the HTTP endpoints for the client.
- **inbox.routes.ts**: POST `/inbox` (capture), GET `/inbox` (list), POST `/inbox/:id/triage` (convert).
- **tasks.routes.ts**: CRUD for tasks.
- **notes.routes.ts**: CRUD for notes.

#### Web Client (`apps/web`)
Implement the UI in Next.js using `shadcn/ui` components.
- **Inbox Page**: Build out the inbox list view and the quick-triage modal/sheet.
- **Today Page**: Integrate real tasks (`FocusBlock` and `TopTasks`) loaded via React Query from the API.
- **Quick Add Component**: Global floating action button (FAB) for the Quick Add feature, allowing immediate capture to the `inbox_items` table from anywhere in the app.

---

## Tasks Checklist

### Step 1: Database (Phase B)
- [ ] Create `packages/db/src/schema/inbox.schema.ts`
- [ ] Create `packages/db/src/schema/tasks.schema.ts`
- [ ] Create `packages/db/src/schema/notes.schema.ts`
- [ ] Export schemas in `index.ts`
- [ ] Generate migrations (`drizzle-kit generate`)

### Step 2: Domain Skeletons
- [ ] Implement `packages/domain-tasks` logic
- [ ] Implement `packages/domain-notes` logic
- [ ] Implement Inbox triage logic

### Step 3: API Endpoints
- [ ] Create `apps/api/src/routes/inbox.routes.ts`
- [ ] Create `apps/api/src/routes/tasks.routes.ts`
- [ ] Create `apps/api/src/routes/notes.routes.ts`
- [ ] Hook up routes in `app.ts`

### Step 4: Web Application
- [ ] Implement Global Quick Add FAB
- [ ] Implement Inbox List & Triage UI
- [ ] Implement Today Screen actual Task blocks
- [ ] Setup Zustand store for modal dialogs states if needed
