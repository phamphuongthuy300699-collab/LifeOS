/**
 * Phase A — Foundation Tables
 *
 * users, workspaces, memberships, external_accounts
 */
import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  pgEnum,
  boolean,
  jsonb,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import {
  Theme,
  Locale,
  OnboardingState,
  MembershipRole,
  OAuthProvider,
  PlanType,
} from '@lifeos/shared';

// ── Enums ──────────────────────────────────────────────

export const themeEnum = pgEnum('theme', Theme);
export const localeEnum = pgEnum('locale', Locale);
export const onboardingStateEnum = pgEnum('onboarding_state', OnboardingState);
export const membershipRoleEnum = pgEnum('membership_role', MembershipRole);
export const oauthProviderEnum = pgEnum('oauth_provider', OAuthProvider);
export const planTypeEnum = pgEnum('plan_type', PlanType);

// ── Users ──────────────────────────────────────────────

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 320 }).notNull().unique(),
  passwordHash: text('password_hash'),
  displayName: varchar('display_name', { length: 200 }).notNull(),
  avatarUrl: text('avatar_url'),
  timezone: varchar('timezone', { length: 64 }).notNull().default('Europe/Moscow'),
  locale: localeEnum('locale').notNull().default('ru'),
  theme: themeEnum('theme').notNull().default('system'),
  onboardingState: onboardingStateEnum('onboarding_state')
    .notNull()
    .default('pending'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Workspaces ─────────────────────────────────────────

export const workspaces = pgTable('workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  ownerUserId: uuid('owner_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 200 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  planType: planTypeEnum('plan_type').notNull().default('personal'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Memberships ────────────────────────────────────────

export const memberships = pgTable('memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: membershipRoleEnum('role').notNull().default('owner'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── External Accounts (OAuth) ──────────────────────────

export const externalAccounts = pgTable('external_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: oauthProviderEnum('provider').notNull(),
  providerAccountId: varchar('provider_account_id', { length: 320 }).notNull(),
  email: varchar('email', { length: 320 }),
  scopesJson: jsonb('scopes_json').$type<string[]>(),
  accessTokenEncrypted: text('access_token_encrypted'),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  syncEnabled: boolean('sync_enabled').notNull().default(false),
  metadataJson: jsonb('metadata_json').$type<Record<string, unknown>>(),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// ── Relations ──────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  workspaces: many(workspaces),
  memberships: many(memberships),
  externalAccounts: many(externalAccounts),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  owner: one(users, {
    fields: [workspaces.ownerUserId],
    references: [users.id],
  }),
  memberships: many(memberships),
}));

export const membershipsRelations = relations(memberships, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [memberships.workspaceId],
    references: [workspaces.id],
  }),
  user: one(users, {
    fields: [memberships.userId],
    references: [users.id],
  }),
}));

export const externalAccountsRelations = relations(
  externalAccounts,
  ({ one }) => ({
    user: one(users, {
      fields: [externalAccounts.userId],
      references: [users.id],
    }),
  }),
);
