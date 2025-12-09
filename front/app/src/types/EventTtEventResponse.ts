export interface EventTtEvent {
  EVENT_ID: string;
  EVENT_MEI: string;
  EVENT_KBN: string;
  EVENT_KBN_MEI: string;
  KAISAI_KO_CD: string;
  EVENT_START_TIME: string; // ISO date string
  EVENT_END_TIME: string; // ISO date string
  YUKO_KIGEN: string; // ISO date string
  URL: string;
  TOROKU_BI: string; // ISO date string
  TOROKU_ID: string;
  KOSHIN_BI: string; // ISO date string
  KOSHIN_ID: string;
  APP_KOSHIN_BI: string; // ISO date string
  APP_KOSHIN_ID: string;
  KAISAI_KO_MEI: string; //開催校
  YOYAKU_KIGEN: string; // ISO timestamp
  QUALTRICS_URL: string;
}

export interface GetEventTtEventResponse {
  name: string;
  count: number;
  data: EventTtEvent[];
}
