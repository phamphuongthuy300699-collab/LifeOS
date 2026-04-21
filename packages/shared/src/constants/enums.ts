/**
 * All domain enums — single source of truth.
 * Used in DB schema (pgEnum), Zod validators, and TypeScript types.
 */

// ── Inbox ──────────────────────────────────────────────
export const InboxSourceType = [
  'manual',
  'voice',
  'email',
  'ai',
  'api',
] as const;
export type InboxSourceType = (typeof InboxSourceType)[number];

export const InboxStatus = ['pending', 'triaged', 'archived'] as const;
export type InboxStatus = (typeof InboxStatus)[number];

export const CaptureChannel = [
  'quick_add',
  'voice',
  'email_forward',
  'api',
] as const;
export type CaptureChannel = (typeof CaptureChannel)[number];

export const TriageTargetType = [
  'task',
  'note',
  'event',
  'meal',
  'expense',
  'contact',
  'project_idea',
  'ignore',
] as const;
export type TriageTargetType = (typeof TriageTargetType)[number];

// ── Tasks ──────────────────────────────────────────────
export const TaskStatus = [
  'inbox',
  'todo',
  'in_progress',
  'waiting',
  'done',
  'cancelled',
] as const;
export type TaskStatus = (typeof TaskStatus)[number];

export const TaskPriority = [
  'urgent',
  'high',
  'medium',
  'low',
  'none',
] as const;
export type TaskPriority = (typeof TaskPriority)[number];

// ── Notes ──────────────────────────────────────────────
export const NoteType = [
  'general',
  'meeting',
  'daily_review',
  'project_note',
  'learning_note',
] as const;
export type NoteType = (typeof NoteType)[number];

// ── Events ─────────────────────────────────────────────
export const EventType = [
  'meeting',
  'call',
  'deadline',
  'block',
  'personal',
] as const;
export type EventType = (typeof EventType)[number];

export const EventStatus = ['confirmed', 'tentative', 'cancelled'] as const;
export type EventStatus = (typeof EventStatus)[number];

// ── Mail ───────────────────────────────────────────────
export const MailDirection = ['inbound', 'outbound'] as const;
export type MailDirection = (typeof MailDirection)[number];

export const MailTriageStatus = [
  'unprocessed',
  'action_needed',
  'task_created',
  'delegated',
  'reference',
  'done',
] as const;
export type MailTriageStatus = (typeof MailTriageStatus)[number];

// ── Workouts ───────────────────────────────────────────
export const SessionStatus = [
  'planned',
  'active',
  'completed',
  'cancelled',
] as const;
export type SessionStatus = (typeof SessionStatus)[number];

export const Difficulty = ['beginner', 'intermediate', 'advanced'] as const;
export type Difficulty = (typeof Difficulty)[number];

// ── Nutrition ──────────────────────────────────────────
export const MealType = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'pre_workout',
  'post_workout',
] as const;
export type MealType = (typeof MealType)[number];

export const EstimationMode = [
  'manual',
  'ai_parsed',
  'barcode',
  'favorite',
] as const;
export type EstimationMode = (typeof EstimationMode)[number];

// ── Learning ───────────────────────────────────────────
export const LearningStatus = [
  'backlog',
  'active',
  'completed',
  'paused',
  'archived',
] as const;
export type LearningStatus = (typeof LearningStatus)[number];

export const MaterialType = [
  'article',
  'video',
  'book',
  'course',
  'podcast',
  'note',
] as const;
export type MaterialType = (typeof MaterialType)[number];

// ── Projects ───────────────────────────────────────────
export const ProjectStatus = [
  'idea',
  'active',
  'paused',
  'completed',
  'archived',
] as const;
export type ProjectStatus = (typeof ProjectStatus)[number];

// ── Finance ────────────────────────────────────────────
export const FinanceDirection = ['income', 'expense'] as const;
export type FinanceDirection = (typeof FinanceDirection)[number];

export const AccountType = [
  'cash',
  'debit_card',
  'credit_card',
  'savings',
  'other',
] as const;
export type AccountType = (typeof AccountType)[number];

// ── Export ──────────────────────────────────────────────
export const ExportFormat = ['json', 'csv', 'markdown'] as const;
export type ExportFormat = (typeof ExportFormat)[number];

export const ExportStatus = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const;
export type ExportStatus = (typeof ExportStatus)[number];

// ── AI ─────────────────────────────────────────────────
export const AIJobStatus = [
  'pending',
  'processing',
  'completed',
  'failed',
] as const;
export type AIJobStatus = (typeof AIJobStatus)[number];

export const AIFeedbackType = [
  'accepted',
  'rejected',
  'corrected',
] as const;
export type AIFeedbackType = (typeof AIFeedbackType)[number];

// ── Sync ───────────────────────────────────────────────
export const SyncStatus = [
  'pending',
  'running',
  'completed',
  'failed',
] as const;
export type SyncStatus = (typeof SyncStatus)[number];

export const SyncRunMode = ['manual', 'scheduled', 'webhook'] as const;
export type SyncRunMode = (typeof SyncRunMode)[number];

// ── Common / cross-domain ──────────────────────────────
export const SourceType = [
  'manual',
  'inbox',
  'email',
  'voice',
  'ai',
  'import',
  'api',
] as const;
export type SourceType = (typeof SourceType)[number];

export const Theme = ['light', 'dark', 'system'] as const;
export type Theme = (typeof Theme)[number];

export const Locale = ['ru', 'en'] as const;
export type Locale = (typeof Locale)[number];

export const OnboardingState = [
  'pending',
  'in_progress',
  'completed',
] as const;
export type OnboardingState = (typeof OnboardingState)[number];

export const MembershipRole = ['owner', 'admin', 'member'] as const;
export type MembershipRole = (typeof MembershipRole)[number];

export const OAuthProvider = ['google', 'yandex'] as const;
export type OAuthProvider = (typeof OAuthProvider)[number];

export const PlanType = ['personal', 'team', 'enterprise'] as const;
export type PlanType = (typeof PlanType)[number];
