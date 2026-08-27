/** Single validation issue surfaced to API consumers. */
export interface ApiErrorDetail {
  /** Dotted path of the offending field, e.g. "body.checkOutDate". */
  path?: string;
  message: string;
}

/** Machine-readable error envelope body (approved Phase 4 contract). */
export interface ApiErrorBody {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  requestId?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorBody;
}

export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}
