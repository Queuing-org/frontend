import axios from "axios";
import { API_BASE_URL } from "../config";

let bootPromise: Promise<void> | null = null;
let refreshPromise: Promise<void> | null = null;

function requestCsrf(): Promise<void> {
  return axios
    .get("/api/auth/csrf", {
      baseURL: API_BASE_URL,
      withCredentials: true,
      headers: { Accept: "application/json" },
    })
    .then(() => undefined);
}

/**
 * 서버가 XSRF-TOKEN 쿠키를 내려주도록 1회 호출
 * - 중복 호출되어도 네트워크는 1번만 나가게 막음
 */
export function ensureCsrf({ force = false } = {}): Promise<void> {
  if (force) {
    if (!refreshPromise) {
      bootPromise = null;
      refreshPromise = requestCsrf()
        .catch((error) => {
          bootPromise = null;
          throw error;
        })
        .finally(() => {
          refreshPromise = null;
        });
      bootPromise = refreshPromise;
    }

    return refreshPromise;
  }

  if (!bootPromise) {
    bootPromise = requestCsrf().catch((error) => {
      bootPromise = null;
      throw error;
    });
  }

  return bootPromise;
}

export function refreshCsrf(): Promise<void> {
  return ensureCsrf({ force: true });
}
