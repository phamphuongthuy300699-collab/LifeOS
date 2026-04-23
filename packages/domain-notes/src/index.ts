/**
 * @lifeos/domain-notes
 * Notes domain
 */

// Entities
export { NoteEntity } from './entities/note.entity';
export type { NoteEntityProps } from './entities/note.entity';

// Repository interfaces
export type { INoteRepository, NoteFilter } from './repositories/note.repository';

// DTOs
export {
  createNoteSchema,
  updateNoteSchema,
  noteFilterSchema,
} from './dto/note.dto';
export type {
  CreateNoteDto,
  UpdateNoteDto,
  NoteFilterDto,
} from './dto/note.dto';
