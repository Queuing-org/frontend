export type ApiFieldError = {
  field: string;
  reason: string;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  fieldErrors?: ApiFieldError[];
  retryAfterMs?: number;

  constructor(args: {
    status: number;
    message: string;
    code?: string;
    fieldErrors?: ApiFieldError[];
    retryAfterMs?: number;
  }) {
    super(args.message);
    this.name = "ApiError";
    this.status = args.status;
    this.code = args.code;
    this.fieldErrors = args.fieldErrors;
    this.retryAfterMs = args.retryAfterMs;
  }
}
