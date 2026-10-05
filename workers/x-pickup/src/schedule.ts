/** GAS の createXSignalTrigger と同じ時刻（Asia/Tokyo、毎時0分） */
export const GAS_X_INGEST_HOURS_JST = [4, 9, 12, 15, 18, 21] as const;

/** 収集はこの分数だけ先に終わらせ、承認済みなら同じ回の要約に間に合わせる */
export const PICKUP_LEAD_MINUTES = 15;

/**
 * GitHub Actions の cron は UTC。
 * JST の取り込み時刻の leadMinutes 前を、分と時の列に直す。
 */
export function pickupCronUtc(
  hoursJst: readonly number[] = GAS_X_INGEST_HOURS_JST,
  leadMinutes = PICKUP_LEAD_MINUTES,
): string {
  const slots = hoursJst.map((hour) => {
    let total = hour * 60 - leadMinutes - 9 * 60;
    total = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
    return { hour: Math.floor(total / 60), minute: total % 60 };
  });
  const minute = slots[0]?.minute;
  if (minute == null || slots.some((slot) => slot.minute !== minute)) {
    throw new Error("Pickup times must share one UTC minute");
  }
  const hours = [...new Set(slots.map((slot) => slot.hour))].sort((a, b) => a - b);
  return `${minute} ${hours.join(",")} * * *`;
}
