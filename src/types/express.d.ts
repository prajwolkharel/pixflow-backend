import { SuccessResponse, ErrorResponse } from './response.types';

declare module 'express-serve-static-core' {
  interface Response {
    ok: SuccessResponse;
    fail: ErrorResponse;
  }
}