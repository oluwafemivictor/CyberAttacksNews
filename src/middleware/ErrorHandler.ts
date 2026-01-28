import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../validators/IncidentValidator';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function validationMiddleware(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
): void {
  if (err instanceof ValidationError) {
    res.status(400).json({
      error: {
        status: 400,
        message: 'Validation error',
        field: err.field,
        details: err.message
      }
    });
    return;
  }

  if (Array.isArray(err) && err.every(e => e instanceof ValidationError)) {
    res.status(400).json({
      error: {
        status: 400,
        message: 'Validation errors',
        errors: err.map(e => ({
          field: e.field,
          message: e.message
        }))
      }
    });
    return;
  }
  
  if (err instanceof ApiError) {
    res.status(err.status).json({
      error: {
        status: err.status,
        message: err.message,
        ...(err.details && { details: err.details })
      }
    });
    return;
  }
  
  next(err);
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
