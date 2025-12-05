import type { GetEventTtEventResponse } from '@/types/EventTtEventResponse';

/**
 * イベントIDに一致するイベントの有効期間（YUKO_KIGEN）および開始日時（EVENT_START_TIME）を現在日付と比較して有効かどうか判定します。
 * @param eventDetails イベント詳細オブジェクト（GetEventTtEventResponse）
 * @param eventId チェック対象のEVENT_ID（例: 'E-0000010121'）
 * @returns 指定イベントが有効期間内かつ開始日時が未来の場合はtrue、そうでない場合はfalse
 */
export function validateEventPeriod(
  eventDetails: GetEventTtEventResponse | null,
  eventId: string | null,
): boolean {
  if (!eventDetails || !eventDetails.data || eventDetails.data.length === 0 || !eventId)
    return false;

  const now = Date.now();

  // 対象イベントIDで検索
  const event = eventDetails.data.find((e) => e.EVENT_ID === eventId);

  if (!event) return false;

  // イベント開始日時および有効期限
  const eventStart = new Date(event.EVENT_START_TIME).getTime();
  const validUntil = new Date(event.YUKO_KIGEN).getTime();

  // 開始日時が未来かつ有効期限内であること
  // (開始前の場合のみ有効。開始日時が過去なら expired)
  const isValid = now <= validUntil && now < eventStart;

  // ログ（本番では削除推奨）
  console.log(
    `[validateEventPeriod] EVENT_ID: ${event.EVENT_ID}, 現在時刻: ${new Date(
      now,
    ).toISOString()}, 開始: ${event.EVENT_START_TIME}, 有効期限: ${event.YUKO_KIGEN}, 判定: ${isValid}`,
  );

  return isValid;
}
