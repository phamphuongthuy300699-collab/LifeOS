/**
 * @lifeos/domain-core
 * Shared domain types, base entities, policies
 */

// Entities
export { BaseEntity, WorkspaceEntity } from './entities/base.entity';
export type { BaseEntityProps, WorkspaceEntityProps } from './entities/base.entity';
export { InboxItemEntity } from './entities/inbox-item.entity';
export type { InboxItemProps } from './entities/inbox-item.entity';

// Use Cases
export { TriageInboxItemUseCase } from './use-cases/triage-inbox-item';
export type {
  TriageInboxItemInput,
  TriageInboxItemOutput,
  ITriageHandler,
} from './use-cases/triage-inbox-item';
