/**
 * Runtime boundary validator for API responses.
 * Catches type mismatches, missing required fields, and emits UI alert banners.
 */

export interface BoundaryValidationError {
  endpoint: string;
  field: string;
  expected: string;
  actual: any;
  timestamp: number;
}

type ValidationListener = (error: BoundaryValidationError) => void;
const listeners: Set<ValidationListener> = new Set();

export function onValidationError(listener: ValidationListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyValidationError(err: BoundaryValidationError): void {
  console.error(`[API Boundary Validation Error] at ${err.endpoint}: Field '${err.field}' expected ${err.expected}, got:`, err.actual);
  listeners.forEach((l) => l(err));
}

export function validateObject<T extends object>(
  data: any,
  requiredFields: (keyof T)[],
  endpoint: string,
  expectedTypes?: Partial<Record<keyof T, 'string' | 'number' | 'boolean' | 'object' | 'array'>>
): T {
  if (!data || typeof data !== 'object') {
    notifyValidationError({
      endpoint,
      field: 'ROOT',
      expected: 'object',
      actual: typeof data,
      timestamp: Date.now(),
    });
    return data as T;
  }

  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null) {
      notifyValidationError({
        endpoint,
        field: String(field),
        expected: 'defined',
        actual: data[field],
        timestamp: Date.now(),
      });
    } else if (expectedTypes && expectedTypes[field]) {
      const exp = expectedTypes[field]!;
      const act = Array.isArray(data[field]) ? 'array' : typeof data[field];
      if (exp !== act) {
        notifyValidationError({
          endpoint,
          field: String(field),
          expected: exp,
          actual: act,
          timestamp: Date.now(),
        });
      }
    }
  }

  return data as T;
}
