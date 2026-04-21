/**
 * Common type primitives used across all packages.
 */

/** Branded UUID type for entity IDs */
export type EntityId = string & { readonly __brand: 'EntityId' };

/** ISO 8601 datetime string in UTC */
export type ISODateTime = string & { readonly __brand: 'ISODateTime' };

/** ISO 8601 date string (YYYY-MM-DD) */
export type ISODate = string & { readonly __brand: 'ISODate' };

/** Money in minor units (cents, копейки) */
export type MoneyMinor = number & { readonly __brand: 'MoneyMinor' };

/** Pagination request */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

/** Paginated response wrapper */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    has_more: boolean;
  };
}

/** Standard API error response */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/** Result type for use-case returns */
export type Result<T, E = ApiError> =
  | { ok: true; data: T }
  | { ok: false; error: E };

/** Helper to create success result */
export function ok<T>(data: T): Result<T, never> {
  return { ok: true, data };
}

/** Helper to create error result */
export function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

/** Polymorphic entity reference (for relations, source tracking) */
export interface EntityRef {
  entity_type: string;
  entity_id: EntityId;
}

/** Sort direction */
export type SortDirection = 'asc' | 'desc';
