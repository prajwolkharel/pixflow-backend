export class ValidationError extends Error {
  status: number;
  errors: { field: string; message: string }[];

  constructor(message: string, errors: { field: string; message: string }[]) {
    super(message);
    this.status = 400;
    this.errors = errors;
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  status: number;

  constructor(message: string) {
    super(message);
    this.status = 400;
    this.name = 'AuthenticationError';
  }
}