"use client";

import { useMutation } from "@tanstack/react-query";
import type { ApiError } from "@/src/shared/api/api-error";
import {
  reportChatMessage,
  type ReportChatMessageParams,
} from "../api/reportChatMessage";

export function useReportChatMessage() {
  return useMutation<void, ApiError, ReportChatMessageParams>({
    mutationKey: ["roomChat", "report"],
    mutationFn: reportChatMessage,
  });
}
