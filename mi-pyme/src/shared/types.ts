/**
 * Shared types and interfaces for Mi-Pyme services.
 *
 * These types are framework-agnostic and can be used by Server Actions,
 * API Routes, or future Nest.js services.
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface SortParams {
  field?: string;
  order?: "asc" | "desc";
}

export interface FilterParams {
  search?: string;
  activo?: boolean;
  [key: string]: unknown;
}

/**
 * Error hierarchy for business logic errors.
 * These are safe to expose to clients (no internal details leaked).
 */
export class BusinessError extends Error {
  constructor(
    message: string,
    public code: string = "BUSINESS_ERROR",
    public status: number = 400
  ) {
    super(message);
    this.name = "BusinessError";
  }
}

export class ValidationError extends BusinessError {
  constructor(message: string, public details?: Record<string, unknown>) {
    super(message, "VALIDATION_ERROR", 422);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends BusinessError {
  constructor(resource: string, id?: string) {
    super(
      id ? `${resource} con id ${id} no encontrado` : `${resource} no encontrado`,
      "NOT_FOUND",
      404
    );
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends BusinessError {
  constructor(message: string = "No autorizado") {
    super(message, "UNAUTHORIZED", 401);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends BusinessError {
  constructor(message: string = "Acceso denegado") {
    super(message, "FORBIDDEN", 403);
    this.name = "ForbiddenError";
  }
}

export class ConflictError extends BusinessError {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    this.name = "ConflictError";
  }
}