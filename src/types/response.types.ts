export interface SuccessResponseParams {
  status: number;
  message: string;
  data?: any;
}

export interface ErrorResponseParams {
  status: number;
  message: string;
  data?: { errors?: { field: string; message: string }[]; errorCode?: string } | null;
}

export type SuccessResponse = (params: SuccessResponseParams) => void;
export type ErrorResponse = (params: ErrorResponseParams) => void;