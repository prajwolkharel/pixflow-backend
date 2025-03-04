export class HttpError extends Error {
  status: number;
  data?: Record<string, any>;

  constructor(status: number, message: string, data?: Record<string, any>) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.data = data;
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string = 'Resource not found') {
    super(404, message);
  }
}

export class ForbiddenError extends HttpError {
  constructor(message: string = 'Access denied') {
    super(403, message);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(401, message);
  }
}

export class BadRequestError extends HttpError {
  constructor(message: string = 'Bad request', data?: Record<string, any>) {
    super(400, message, data);
  }
}

export class ValidationError extends BadRequestError {
  constructor(message: string = 'Validation failed', errors: { field: string; message: string }[] = []) {
    super(message, { errors });
  }
}

export class ConflictError extends HttpError {
  constructor(message: string = 'Resource conflict') {
    super(409, message);
  }
}

export class InternalServerError extends HttpError {
  constructor(message: string = 'Internal server error') {
    super(500, message);
  }
}