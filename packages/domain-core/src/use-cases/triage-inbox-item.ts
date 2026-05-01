/**
 * Triage inbox item use case.
 * Converts a pending InboxItem into the target entity (task, note, etc.).
 */
import type { Result } from '@lifeos/shared';
import { err } from '@lifeos/shared';
import type { TriageTargetType } from '@lifeos/shared';

export interface TriageInboxItemInput {
  inboxItemId: string;
  targetType: TriageTargetType;
  workspaceId: string;
  userId: string;
  /** Title/content extracted from the inbox item */
  title: string;
  /** Optional body content */
  body?: string;
}

export interface TriageInboxItemOutput {
  entityType: TriageTargetType;
  entityId: string;
}

/**
 * Interface for the triage use-case dependencies.
 * Concrete implementations are in the API layer.
 */
export interface ITriageHandler {
  createFromInbox(input: TriageInboxItemInput): Promise<Result<TriageInboxItemOutput>>;
}

/**
 * Use case orchestrator — delegates to the appropriate handler
 * based on target type.
 */
export class TriageInboxItemUseCase {
  constructor(
    private handlers: Record<string, ITriageHandler>,
  ) {}

  async execute(input: TriageInboxItemInput): Promise<Result<TriageInboxItemOutput>> {
    const handler = this.handlers[input.targetType];
    if (!handler) {
      return err({
        code: 'UNSUPPORTED_TRIAGE_TYPE',
        message: `Triage target type "${input.targetType}" is not supported yet`,
      });
    }

    return handler.createFromInbox(input);
  }
}
