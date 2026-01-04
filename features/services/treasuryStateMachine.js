export const ALLOWED_TRANSITIONS = {
  READY: ["PROCESSING"],
  BLOCKED: ["READY"],
  PENDING: ["EXECUTED"],
  EXECUTED: [],
  PROCESSING: ["PAID", "FAILED"],
};

export function assertValidTransition(from, to) {
  const allowed = ALLOWED_TRANSITIONS[from] || [];

  if (!allowed.includes(to)) {
    throw new Error(
      `Invalid state transition: ${from} → ${to}`
    );
  }
}