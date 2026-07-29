export class ApiError extends Error {
  status: number;
  code?: string;
  retryAfterMs?: number;

  constructor(args: {
    status: number;
    message: string;
    code?: string;
    retryAfterMs?: number;
  }) {
    super(args.message);
    this.name = "ApiError";
    this.status = args.status;
    this.code = args.code;
    this.retryAfterMs = args.retryAfterMs;
  }
}
