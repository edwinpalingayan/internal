/**
 * Checks if the 'evid' param in the URL is valid.
 * @param eventDetailsRef - A ref object containing event details, expected to have a .current property with a data array.
 * @returns {string|null} An error message if invalid, otherwise null.
 */
export function validateEventIdFromUrl(
  eventDetailsRef: React.RefObject<{ data: Array<{ EVENT_ID: string }> }>,
): string | null {
  const searchParams = new URLSearchParams(window.location.search);
  const evid = searchParams.get("evid");

  if (!evid || evid === "null") return "イベントIDが必要です。";

  const validEventIds =
    eventDetailsRef.current?.data?.map((ev) => ev.EVENT_ID) ?? [];

  if (!validEventIds.includes(evid)) return "無効なイベントIDです。";

  return null;
}
