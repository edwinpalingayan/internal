export interface YoyakuMoshikomiData {
  EVENT_ID: string;
  ID: number;
  EMAIL: string;
  SHIMEI: string;
  CLASS_CD: string;
  CLASS_HYOJI: string;
  PRIORITY: number;
  WAITING_FLG: string;
  GMS_KOKYAKU_ID: string | null;
  MOSHIKOMI_NO: string;
  MOSHIKOMI_GYO: number;
  RENKEI_ZUMI_FLG: string;
}

export interface GetEventTtYoyakuMoshikomiResponse {
  name: string; // "get_event_tt_yoyaku_moshikomi"
  count: number;
  data: YoyakuMoshikomiData[];
}
