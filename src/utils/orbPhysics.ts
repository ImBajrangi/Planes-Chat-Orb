export interface EyeTrackingInput {
  pointerX: number;
  pointerY: number;
  orbCenterX: number;
  orbCenterY: number;
  orbSize: number;
  maxTravelRatio?: number;
}

export interface EyeOffset {
  x: number;
  y: number;
  distanceRatio: number;
}

export interface OrbGeometry {
  size: number;
  eyeSize: number;
  leftEyeLeft: number;
  rightEyeLeft: number;
  eyeTop: number;
  insetShadowDark: string;
  insetShadowLight: string;
}

/**
 * Computes exact Planes Chat Orb geometry matching the native reference ratios:
 * - eyeSize: size * 0.17 (e.g. 64px -> 10.88px, 36px -> 6.12px)
 * - leftEyeLeft: size * 0.27 (e.g. 64px -> 17.28px, 36px -> 9.72px)
 * - rightEyeLeft: size * 0.56 (e.g. 64px -> 35.84px, 36px -> 20.16px)
 * - eyeTop: size * 0.36 (e.g. 64px -> 23.04px, 36px -> 12.96px)
 */
export function computeOrbGeometry(size: number): OrbGeometry {
  const safeSize = Math.max(24, size);
  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    size: safeSize,
    eyeSize: round2(safeSize * 0.17),
    leftEyeLeft: round2(safeSize * 0.27),
    rightEyeLeft: round2(safeSize * 0.56),
    eyeTop: round2(safeSize * 0.36),
    insetShadowDark: `rgba(0, 0, 0, 0.18) ${round2(-safeSize * 0.06)}px ${round2(-safeSize * 0.08)}px ${round2(safeSize * 0.18)}px inset`,
    insetShadowLight: `rgba(255, 255, 255, 0.9) ${round2(safeSize * 0.03)}px ${round2(safeSize * 0.04)}px ${round2(safeSize * 0.1)}px inset`,
  };
}

/**
 * Computes bounded eye look offset towards the cursor or target point.
 */
export function computeEyeLookOffset(input: EyeTrackingInput): EyeOffset {
  const {
    pointerX,
    pointerY,
    orbCenterX,
    orbCenterY,
    orbSize,
    maxTravelRatio = 0.11,
  } = input;

  const dx = pointerX - orbCenterX;
  const dy = pointerY - orbCenterY;
  const dist = Math.hypot(dx, dy);

  if (dist < 0.001 || orbSize <= 0) {
    return { x: 0, y: 0, distanceRatio: 0 };
  }

  const maxOffsetPx = orbSize * maxTravelRatio;
  const falloffRadius = Math.max(orbSize * 3.5, 180);
  const strength = Math.min(1, dist / falloffRadius);

  const ux = dx / dist;
  const uy = dy / dist;

  const round2 = (n: number) => Math.round(n * 100) / 100;

  return {
    x: round2(ux * maxOffsetPx * strength),
    y: round2(uy * maxOffsetPx * strength),
    distanceRatio: round2(strength),
  };
}

export interface ChatTurnScript {
  prompt: string;
  reasoning?: string[];
  thinkingSeconds?: number;
  response: string;
}

export const DEFAULT_CHAT_SCRIPT: ChatTurnScript[] = [
  {
    prompt:
      'When I save a setting it feels laggy, because I wait for the server before the UI updates. How do people make it feel instant?',
    thinkingSeconds: 2,
    reasoning: [
      'They want optimistic updates.',
      'Update local state right away, send the request in the background.',
      'Reconcile on success, roll back on failure.',
    ],
    response:
      'Update the UI immediately and send the request in the background. That is an optimistic update: you assume success, render the new state right away, and only reconcile once the server responds. The interaction feels instant because you stop waiting on the network for the common case.',
  },
  {
    prompt:
      'Should I still show a spinner, or does optimistic mean no loading state?',
    thinkingSeconds: 2,
    reasoning: [
      'Clarify when to skip spinners vs show subtle indicators.',
      'Fast mutations (<300ms perceived) need zero spinner.',
      'Provide rollback toast if background mutation fails.',
    ],
    response:
      'Skip the blocking spinner on the toggle or button itself—let it flip state immediately. If the request takes longer than 400ms or involves syncing across devices, show a quiet non-blocking "Saving…" indicator in the header and revert with an actionable error toast only if the server rejects it.',
  },
  {
    prompt:
      'How do I prevent race conditions if the user clicks the toggle three times rapidly?',
    thinkingSeconds: 2,
    reasoning: [
      'Rapid toggles create overlapping in-flight requests.',
      'Cancel stale requests with AbortController or sequence IDs.',
      'Only apply server reconciliation from the latest mutation.',
    ],
    response:
      'Attach a monotonically increasing mutation ID or an AbortController to each request. When a new toggle fires, abort the previous in-flight request and ignore any stale responses whose mutation ID is older than the latest user action.',
  },
];

export function getNextScriptTurn(
  script: ChatTurnScript[],
  completedCount: number
): ChatTurnScript {
  if (!script || script.length === 0) {
    return DEFAULT_CHAT_SCRIPT[0];
  }
  return script[completedCount % script.length];
}
