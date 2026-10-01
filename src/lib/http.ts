/** status 付きの想定内エラー（401 / 400 など）を route から投げる */
export function httpError(message: string, status: number): Error & { status: number } {
  const error = new Error(message) as Error & { status: number };
  error.status = status;
  return error;
}

export function readErrorStatus(error: unknown): number {
  if (
    typeof error === "object" &&
    error &&
    "status" in error &&
    typeof (error as { status: unknown }).status === "number"
  ) {
    return (error as { status: number }).status;
  }
  return 500;
}

export function readErrorMessage(error: unknown, status: number): string {
  if (status < 500 && error instanceof Error) return error.message;
  return "Internal server error";
}
