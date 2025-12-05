import type { CourseTerm } from '@/types/SchoolTmClassSerchResponse';

export interface GetSchoolClassDetailsResponse {
  name: string;
  count: number;
  data: SchoolClassDetails[];
}

export interface SchoolClassDetails extends CourseTerm {
  [key: string]: unknown;
  CLASS_CD: string;
  KAIKO_KI: string; // 受講期
  KAISAI_KO_CD: string;
  KAISAI_KO_MEI: string; // 開催校
  KAMOKU_CD: string;
  KAMOKU_MEI: string;
  CLASS_MEI: string; // クラス名
  CLASS_LABEL_MEI: string | null; // プログラム名
  ZANSEKI_SU: string; // 空き状況
  KOSHI_MEI: string; // 講師
  KOSHI_URL: string; // 講師URL
  DAY_SU: number; // 回数
  HYOJI_JYUN: number; // 表示順
  YOBI_CD: number; // 曜日 e.g. 1:日曜日, 2:月曜日
  KAISAI_JIKAN: string; // 時間 e.g. "18:30~20:00"
  DAY1_KAISAI_JIKAN_KAISHI: string; // ISO date string DAY2
  DAY1_KAISAI_JIKAN_SYURYO: string; // ISO date string DAY1
  DAY2_KAISAI_JIKAN_KAISHI: string; // ISO date string DAY2
  DAY2_KAISAI_JIKAN_SYURYO: string; // ISO date string DAY2
  DAY3_KAISAI_JIKAN_KAISHI: string; // ISO date string DAY3
  DAY3_KAISAI_JIKAN_SYURYO: string; // ISO date string DAY3
  DAY4_KAISAI_JIKAN_KAISHI: string; // ISO date string DAY4
  DAY4_KAISAI_JIKAN_SYURYO: string; // ISO date string DAY4
  DAY5_KAISAI_JIKAN_KAISHI: string; // ISO date string DAY5
  DAY5_KAISAI_JIKAN_SYURYO: string; // ISO date string DAY5
  DAY6_KAISAI_JIKAN_KAISHI: string; // ISO date string DAY6
  DAY6_KAISAI_JIKAN_SYURYO: string; // ISO date string DAY6
  BIKO: string | null; // 備考
}

// 型安全のための全てのDAY系キーだよ
export type DayKaisaiJikanKey =
  | 'DAY1_KAISAI_JIKAN_KAISHI'
  | 'DAY2_KAISAI_JIKAN_KAISHI'
  | 'DAY3_KAISAI_JIKAN_KAISHI'
  | 'DAY4_KAISAI_JIKAN_KAISHI'
  | 'DAY5_KAISAI_JIKAN_KAISHI'
  | 'DAY6_KAISAI_JIKAN_KAISHI';
