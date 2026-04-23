/**
 * Note repository interface.
 */
import type { NoteEntity } from '../entities/note.entity';
import type { NoteType } from '@lifeos/shared';
import type { PaginatedResponse } from '@lifeos/shared';

export interface NoteFilter {
  workspaceId: string;
  userId: string;
  noteType?: NoteType;
  includeArchived?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface INoteRepository {
  findById(id: string): Promise<NoteEntity | null>;
  findMany(filter: NoteFilter): Promise<PaginatedResponse<NoteEntity>>;
  create(entity: NoteEntity): Promise<NoteEntity>;
  update(entity: NoteEntity): Promise<NoteEntity>;
  delete(id: string): Promise<void>;
}
