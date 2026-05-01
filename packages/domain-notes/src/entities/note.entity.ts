/**
 * Note entity — domain model.
 */
import { WorkspaceEntity } from '@lifeos/domain-core';
import type { WorkspaceEntityProps } from '@lifeos/domain-core';
import type { NoteType } from '@lifeos/shared';

export interface NoteEntityProps extends WorkspaceEntityProps {
  title: string | null;
  bodyMarkdown: string;
  noteType: NoteType;
  sourceType: string | null;
  createdFromInboxItemId: string | null;
  archivedAt: Date | null;
}

export class NoteEntity extends WorkspaceEntity {
  title: string | null;
  bodyMarkdown: string;
  noteType: NoteType;
  sourceType: string | null;
  createdFromInboxItemId: string | null;
  archivedAt: Date | null;

  constructor(props: NoteEntityProps) {
    super(props);
    this.title = props.title;
    this.bodyMarkdown = props.bodyMarkdown;
    this.noteType = props.noteType;
    this.sourceType = props.sourceType;
    this.createdFromInboxItemId = props.createdFromInboxItemId;
    this.archivedAt = props.archivedAt;
  }

  updateContent(title: string | null, body: string): void {
    this.title = title;
    this.bodyMarkdown = body;
    this.touch();
  }

  archive(): void {
    this.archivedAt = new Date();
    this.touch();
  }

  get displayTitle(): string {
    return this.title || 'Без названия';
  }
}
