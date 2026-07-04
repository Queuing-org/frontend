import axios, {
  type AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { API_BASE_URL } from "./config";
import { ApiError } from "./api-error";
import { refreshCsrf } from "./csrf/ensureCsrf";

const CSRF_METHODS = new Set(["delete", "patch", "post", "put"]);
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
  if (!isRecord(data)) {
    return {
      code: undefined,
      message: typeof data === "string" ? data : undefined,
      statusCode: undefined,
    };
  }

  const error = data.error;
  const backendError = isRecord(error) ? error : data;
  const statusCode = backendError.statusCode;

  return {
    code: getNestedString(backendError, "code"),
    message:
      getNestedString(backendError, "message") ??
      getNestedString(data, "message"),
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
  (err) => {
    const status = err?.response?.status ?? 0;

    const backendError = err?.response?.data?.error;
    const backendStatus = backendError?.statusCode;
    const backendCode = backendError?.code;
    const backendMessage = backendError?.message;

    const message =
      backendMessage ??
      err?.response?.data?.message ??
      err?.response?.data ??
      err?.message ??
      "Unknown error";

    const finalStatus = backendStatus ?? status;

    return Promise.reject(
      new ApiError({
        status: finalStatus,
        message: String(message),
        code: backendCode,
      })
    );
  }
);
