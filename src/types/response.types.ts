export interface SuccessResponseParams {
  status: number;
  message: string;
  data?: any;
}

export interface ErrorResponseParams {
  status: number;
  message: string;
  data?: any;
}

export type SuccessResponse = (params: SuccessResponseParams) => void;
export type ErrorResponse = (params: ErrorResponseParams) => void;