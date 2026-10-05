import { INTAKE_MAX_ITEMS } from "../../../src/lib/constants.ts";

export const DEFAULT_PICKUP_LIMIT = 15;
export const DEFAULT_MAX_AGE_HOURS = 48;

export type PickupConfig = {
  baseUrl: string | null;
  ingestSecret: string | null;
  dryRun: boolean;
  autoApprove: boolean;
  limit: number;
  maxAgeHours: number;
  headless: boolean;
  fixtureFile: string | null;
};

function readFlag(value: string | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function readInt(value: string | undefined, fallback: number, name: string): number {
  if (value == null || value.trim() === "") return fallback;
  if (!/^\d+$/.test(value.trim())) {
    throw new Error(`${name} must be an integer`);
  }
  return Number(value.trim());
}

export function readPickupConfig(
  env: Record<string, string | undefined>,
): PickupConfig {
  const limit = readInt(env.X_PICKUP_LIMIT, DEFAULT_PICKUP_LIMIT, "X_PICKUP_LIMIT");
  if (limit < 1 || limit > INTAKE_MAX_ITEMS) {
    throw new Error(`X_PICKUP_LIMIT must be an integer from 1 to ${INTAKE_MAX_ITEMS}`);
  }
  const maxAgeHours = readInt(
    env.X_PICKUP_MAX_AGE_HOURS,
    DEFAULT_MAX_AGE_HOURS,
    "X_PICKUP_MAX_AGE_HOURS",
  );
  if (maxAgeHours < 1 || maxAgeHours > 24 * 14) {
    throw new Error("X_PICKUP_MAX_AGE_HOURS must be an integer from 1 to 336");
  }

  const dryRun = readFlag(env.X_PICKUP_DRY_RUN);
  const baseUrl = (env.APP_BASE_URL || env.BASE_URL || "").trim().replace(/\/$/, "") || null;
  const ingestSecret = env.INGEST_SECRET?.trim() || null;
  if (!dryRun && (!baseUrl || !ingestSecret)) {
    throw new Error(
      "APP_BASE_URL (or BASE_URL) and INGEST_SECRET are required unless X_PICKUP_DRY_RUN=1",
    );
  }

  return {
    baseUrl,
    ingestSecret,
    dryRun,
    autoApprove: readFlag(env.X_PICKUP_AUTO_APPROVE),
    limit,
    maxAgeHours,
    headless: env.X_PICKUP_HEADLESS !== "0",
    fixtureFile: env.X_PICKUP_FIXTURE_FILE?.trim() || null,
  };
}
