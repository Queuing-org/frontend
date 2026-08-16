import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "./config";
import { ApiError, type ApiFieldError } from "./api-error";
import { refreshCsrf } from "./csrf/ensureCsrf";
import {
  getRateLimitRetryDelayMs,
  parseRetryAfterMs,
} from "./rateLimitRetry";

const CSRF_METHODS = new Set(["delete", "patch", "post", "put"]);
const MAX_RATE_LIMIT_RETRIES = 2;
let csrfVersion = 0;

function shouldAttachCsrfHeader(config: InternalAxiosRequestConfig) {
  return CSRF_METHODS.has((config.method ?? "get").toLowerCase());
}

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: { Accept: "application/json" },
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  withXSRFToken: shouldAttachCsrfHeader,
});

type CsrfRetryRequestConfig = InternalAxiosRequestConfig & {
  _csrfRetry?: boolean;
  _csrfVersion?: number;
  _rateLimitRetryCount?: number;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getNestedString(
  value: Record<string, unknown>,
  key: string,
): string | undefined {
  const fieldValue = value[key];

  return typeof fieldValue === "string" ? fieldValue : undefined;
}

function getBackendErrorData(data: unknown) {
  if (!isRecord(data) || !isRecord(data.error)) {
    return {
      code: undefined,
      fieldErrors: undefined,
      message: undefined,
      statusCode: undefined,
    };
  }

  const backendError = data.error;
  const statusCode = backendError.statusCode;
  const rawFieldErrors = backendError.fieldErrors;
  const fieldErrors = Array.isArray(rawFieldErrors)
    ? rawFieldErrors.flatMap((fieldError): ApiFieldError[] => {
        if (
          !isRecord(fieldError) ||
          typeof fieldError.field !== "string" ||
          typeof fieldError.reason !== "string"
        ) {
          return [];
        }

        return [{ field: fieldError.field, reason: fieldError.reason }];
      })
    : [];

  return {
    code: getNestedString(backendError, "code"),
    fieldErrors: fieldErrors.length > 0 ? fieldErrors : undefined,
    message: getNestedString(backendError, "message"),
    statusCode: typeof statusCode === "number" ? statusCode : undefined,
  };
}

function isCsrfRequest(config: InternalAxiosRequestConfig | undefined) {
  return (config?.url ?? "").includes("/api/auth/csrf");
}

function shouldRefreshCsrf(error: AxiosError) {
  const backendError = getBackendErrorData(error.response?.data);
  const status = backendError.statusCode ?? error.response?.status ?? 0;
  const errorText = [backendError.code, backendError.message]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (status === 419) {
    return true;
  }

  return (
    status >= 400 &&
    status < 500 &&
    (errorText.includes("csrf") || errorText.includes("xsrf"))
  );
}

axiosInstance.interceptors.request.use((config) => {
  const csrfConfig = config as CsrfRetryRequestConfig;
  csrfConfig._csrfVersion = csrfVersion;

  return config;
});

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (!axios.isAxiosError(err) || !shouldRefreshCsrf(err)) {
      return Promise.reject(err);
    }

    const config = err.config as CsrfRetryRequestConfig | undefined;
    if (!config || config._csrfRetry || isCsrfRequest(config)) {
      return Promise.reject(err);
    }

    config._csrfRetry = true;
    if ((config._csrfVersion ?? csrfVersion) >= csrfVersion) {
      await refreshCsrf();
      csrfVersion += 1;
    }

    return axiosInstance(config);
  },
);

axiosInstance.interceptors.response.use(
  (res) => res,
  async (err) => {
    const backendError = getBackendErrorData(err?.response?.data);
    const status = backendError.statusCode ?? err?.response?.status ?? 0;
    const retryAfterMs = parseRetryAfterMs(
      err?.response?.headers?.["retry-after"],
    );
    const config = err?.config as CsrfRetryRequestConfig | undefined;
    const method = (config?.method ?? "get").toLowerCase();
    const retryCount = config?._rateLimitRetryCount ?? 0;

    if (
      status === 429 &&
      method === "get" &&
      config &&
      retryCount < MAX_RATE_LIMIT_RETRIES
    ) {
      config._rateLimitRetryCount = retryCount + 1;
      const delayMs = getRateLimitRetryDelayMs(retryAfterMs, retryCount);
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      return axiosInstance(config);
    }

    const message =
      backendError.message ??
      err?.message ??
      "Unknown error";

    return Promise.reject(
      new ApiError({
        status,
        message: String(message),
        code: backendError.code,
        fieldErrors: backendError.fieldErrors,
        retryAfterMs,
      })
    );
  },
);
