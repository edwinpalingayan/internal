export interface GetSchoolTmClassSearchResponse {
  name: string;
  count: number;
  data: ClassData[];
}

export interface ClassData {
  KAIKO_KI: CourseTerm[];
  KAISAIKO: HostCampus[];
  KAMOKU: ModuleTitle[];
}

// 開講期 (CourseTerm)
export interface CourseTerm {
  KAIKO_KI: string; // e.g., "202510"
  KAIKO_KI_MEI: string; // e.g., "2025年10月期"
}

// 開催校 (Campus / Location)
export interface HostCampus {
  KAISAI_KO_CD: string; // e.g., "S03"
  KAISAI_KO_MEI: string; // e.g., "名古屋"
  KAISAI_KO_HYOJI_JYUN: number; // 表示順（数値型）
}

// 科目 (Subject)
export interface ModuleTitle {
  KAMOKU_CD: string; // e.g., "I0275"
  KAMOKU_MEI: string; // e.g., "(MBA)マーケティング・経営戦略基礎"
  DEFAULT_FLG: "0" | "1"; // Default flag (string type, but limited to "0" or "1")
  KAMOKU_HYOJI_JYUN: number; // 表示順（数値型）
}
