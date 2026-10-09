// A minimal cross-page signal: pages that write journey-relevant data (saving a
// grant, moving a pipeline stage, generating a licensing checklist) call
// notifyJourneyUpdated() so any mounted JourneyTaskBar/sidebar badge can refresh
// without polling or a shared state/context layer.
const EVENT_NAME = "journey:updated";

export function notifyJourneyUpdated(): void {
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function onJourneyUpdated(handler: () => void): () => void {
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
}
