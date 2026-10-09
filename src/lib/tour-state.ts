// Per-viewer "have they seen this already" flags for the journey task goal
// popup and completion celebration. Browser-storage only — losing this just
// means a goal popup shows again, never a correctness issue.
const STORAGE_KEY = "blueprints:tour-state";

interface TourState {
  [stepKey: string]: { goalSeen?: boolean; celebrated?: boolean };
}

function readState(): TourState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writeState(state: TourState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore (private browsing, storage disabled, etc.)
  }
}

export function hasSeenGoal(stepKey: string): boolean {
  return Boolean(readState()[stepKey]?.goalSeen);
}

export function markGoalSeen(stepKey: string): void {
  const state = readState();
  state[stepKey] = { ...state[stepKey], goalSeen: true };
  writeState(state);
}

export function hasCelebrated(stepKey: string): boolean {
  return Boolean(readState()[stepKey]?.celebrated);
}

export function markCelebrated(stepKey: string): void {
  const state = readState();
  state[stepKey] = { ...state[stepKey], celebrated: true };
  writeState(state);
}
