import { createClient } from "@vercel/edge-config";

export const MAINTENANCE_CONFIG_KEY = "maintenance";
export const DEFAULT_MAINTENANCE_MESSAGE =
  "보다 안정적인 서비스 제공을 위해 잠시 시스템을 정비하고 있습니다.";

const SEOUL_TIME_ZONE = "Asia/Seoul";
const MAX_MAINTENANCE_MESSAGE_LENGTH = 200;
const ISO_TIMESTAMP_WITH_OFFSET =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/;

export type MaintenanceConfig = {
  enabled: boolean;
  startsAt: string | null;
  endsAt: string | null;
  message: string | null;
};

const DISABLED_MAINTENANCE_CONFIG: MaintenanceConfig = {
  enabled: false,
  startsAt: null,
  endsAt: null,
  message: null,
};

let didReportReadFailure = false;
let didReportMissingConnection = false;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTimestamp(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const timestamp = value.trim();
  if (
    !ISO_TIMESTAMP_WITH_OFFSET.test(timestamp) ||
    !Number.isFinite(Date.parse(timestamp))
  ) {
    return null;
  }

  return timestamp;
}

function parseMessage(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const message = value.trim();
  return message && message.length <= MAX_MAINTENANCE_MESSAGE_LENGTH
    ? message
    : null;
}

export function parseMaintenanceConfig(value: unknown): MaintenanceConfig {
  if (!isRecord(value)) {
    return DISABLED_MAINTENANCE_CONFIG;
  }

  const parsedStartsAt = parseTimestamp(value.startsAt);
  const parsedEndsAt = parseTimestamp(value.endsAt);
  const hasValidWindow =
    parsedStartsAt !== null &&
    parsedEndsAt !== null &&
    Date.parse(parsedStartsAt) < Date.parse(parsedEndsAt);

  return {
    enabled: value.enabled === true,
    startsAt: hasValidWindow ? parsedStartsAt : null,
    endsAt: hasValidWindow ? parsedEndsAt : null,
    message: parseMessage(value.message),
  };
}

export async function getMaintenanceConfig(): Promise<MaintenanceConfig> {
  const connectionString = process.env.EDGE_CONFIG?.trim();
  const isProductionDeployment = process.env.VERCEL_ENV
    ? process.env.VERCEL_ENV === "production"
    : process.env.NODE_ENV === "production";

  if (!connectionString) {
    if (isProductionDeployment && !didReportMissingConnection) {
      didReportMissingConnection = true;
      console.error("[maintenance] EDGE_CONFIG 연결이 설정되지 않았습니다.");
    }

    return DISABLED_MAINTENANCE_CONFIG;
  }

  try {
    const edgeConfig = createClient(connectionString, {
      staleIfError: false,
    });

    return parseMaintenanceConfig(
      await edgeConfig.get(MAINTENANCE_CONFIG_KEY),
    );
  } catch {
    if (!didReportReadFailure) {
      didReportReadFailure = true;
      console.error("[maintenance] Edge Config 조회에 실패했습니다.");
    }

    return DISABLED_MAINTENANCE_CONFIG;
  }
}

const maintenanceDateFormatter = new Intl.DateTimeFormat("ko-KR", {
  month: "long",
  day: "numeric",
  weekday: "short",
  timeZone: SEOUL_TIME_ZONE,
});

const maintenanceDateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  timeZone: SEOUL_TIME_ZONE,
});

const maintenanceTimeFormatter = new Intl.DateTimeFormat("ko-KR", {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
  timeZone: SEOUL_TIME_ZONE,
});

export function formatMaintenanceWindow({
  startsAt,
  endsAt,
}: Pick<MaintenanceConfig, "startsAt" | "endsAt">) {
  if (!startsAt || !endsAt) {
    return null;
  }

  const start = new Date(startsAt);
  const end = new Date(endsAt);
  const startDate = maintenanceDateFormatter.format(start);
  const startTime = maintenanceTimeFormatter.format(start);
  const endTime = maintenanceTimeFormatter.format(end);
  const isSameDate =
    maintenanceDateKeyFormatter.format(start) ===
    maintenanceDateKeyFormatter.format(end);

  if (isSameDate) {
    return `${startDate} ${startTime} ~ ${endTime}`;
  }

  return `${startDate} ${startTime} ~ ${maintenanceDateFormatter.format(end)} ${endTime}`;
}
