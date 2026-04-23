/**
 * Inbox item entity for the domain layer.
 */
import type { InboxSourceType, InboxStatus, CaptureChannel, TriageTargetType } from '@lifeos/shared';

export interface InboxItemProps {
  id: string;
  workspaceId: string;
  userId: string;
  sourceType: InboxSourceType;
  title: string | null;
  rawText: string | null;
  normalizedText: string | null;
  status: InboxStatus;
  captureChannel: CaptureChannel;
  capturedAt: Date;
  triagedAt: Date | null;
  createdEntityType: TriageTargetType | null;
  createdEntityId: string | null;
}

export class InboxItemEntity {
  constructor(private props: InboxItemProps) {}

  get id() { return this.props.id; }
  get workspaceId() { return this.props.workspaceId; }
  get userId() { return this.props.userId; }
  get status() { return this.props.status; }
  get title() { return this.props.title; }
  get rawText() { return this.props.rawText; }
  get displayText() { return this.props.title || this.props.rawText || ''; }
  get captureChannel() { return this.props.captureChannel; }
  get capturedAt() { return this.props.capturedAt; }

  isPending(): boolean {
    return this.props.status === 'pending';
  }

  triage(entityType: TriageTargetType, entityId: string): void {
    this.props.status = 'triaged';
    this.props.triagedAt = new Date();
    this.props.createdEntityType = entityType;
    this.props.createdEntityId = entityId;
  }

  archive(): void {
    this.props.status = 'archived';
  }
}
