import type { SchoolClassDetails } from "@/types/SchoolClassDetailsResponse";

/**
 * クラスの選択数が多すぎる
 * 全科目（KAMOKU_MEI）で3クラス（CLASS_MEI）を超えて選択した場合にエラー。
 * Error if a user selects more than 2 classes across all subjects.
 */
export function validateMaxTwoTotalClasses(
  selected: SchoolClassDetails[],
): boolean {
  return selected.length > 2;
}

/**
 * 同じ科目の重複選択
 * 同一科目（KAMOKU_CD）で2クラス（CLASS_MEI）を超えて選択した場合にエラー。
 * Error if a user selects more than 1 class per subject.
 */
export function validateMaxSingleClassesPerSubject(
  selected: SchoolClassDetails[],
): boolean {
  const countByKamokuCd: Record<string, number> = {};
  selected.forEach((item) => {
    const kamokuCd = item.KAMOKU_CD;
    countByKamokuCd[kamokuCd] = (countByKamokuCd[kamokuCd] || 0) + 1;
  });
  return Object.values(countByKamokuCd).some((count) => count > 1);
}

/**
 * 時間の重複
 * 選択したクラスの開催時間が重なっている場合にエラー
 * Error if the selected class times overlap.
 * Checks using the range: DAYx_KAISAI_JIKAN_KAISHI → DAYx_KAISAI_JIKAN_SYURYO
 */
export function validateTimeConflict(selected: SchoolClassDetails[]): boolean {
  type TimeSlot = { day: number; start: string; end: string };
  const allSlots: TimeSlot[] = [];

  selected.forEach((item) => {
    for (let i = 1; i <= 6; i++) {
      const dayRaw = item[`DAY${i}_YOBI_CD`] ?? item.YOBI_CD ?? 0;
      const day = typeof dayRaw === "number" ? dayRaw : Number(dayRaw) || 0;
      const start = item[`DAY${i}_KAISAI_JIKAN_KAISHI`];
      const end = item[`DAY${i}_KAISAI_JIKAN_SYURYO`];
      if (typeof start === "string" && typeof end === "string" && day) {
        allSlots.push({ day, start, end });
      }
    }
    // グローバルな時間（DAY1-6以外）を持つクラスの場合
    if (
      typeof item.KAISAI_JIKAN_KAISHI === "string" &&
      typeof item.KAISAI_JIKAN_SYURYO === "string" &&
      item.YOBI_CD
    ) {
      allSlots.push({
        day: item.YOBI_CD,
        start: item.KAISAI_JIKAN_KAISHI,
        end: item.KAISAI_JIKAN_SYURYO,
      });
    }
  });

  const slotsByDay: Record<number, TimeSlot[]> = {};
  allSlots.forEach((slot) => {
    if (!slot.day) return;
    slotsByDay[slot.day] = slotsByDay[slot.day] || [];
    slotsByDay[slot.day].push(slot);
  });

  const isOverlap = (a: TimeSlot, b: TimeSlot): boolean => {
    return a.start < b.end && b.start < a.end;
  };

  for (const day in slotsByDay) {
    const slots = slotsByDay[day];
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        if (isOverlap(slots[i], slots[j])) {
          return true;
        }
      }
    }
  }
  return false;
}

/**
 * アラート: 同一日に午前・午後両方のクラスを選択している場合に警告を出す
 * 複数のクラスで、同じ日付（DAYx_KAISAI_JIKAN_KAISHI/終了）に午前・午後両方の時間帯が選択されているかを判定する。
 * 例: 2024-07-01 午前のクラスと午後のクラスを両方選択した場合にtrueを返す。
 * Duplicate Check (Different Subject, Same Date)
 */
export function validateSameDayMorningAfternoon(
  selected: SchoolClassDetails[],
): boolean {
  // マップ: 日付 (YYYY-MM-DD) => 'morning' | 'afternoon' のセット
  const dateSessionMap: Record<string, Set<string>> = {};

  const getSessionType = (start: Date, end: Date) => {
    // 終了時刻が12:00より前なら「午前」、開始時刻が12:00以降なら「午後」
    if (end.getHours() <= 12) return "morning";
    if (start.getHours() >= 12) return "afternoon";

    return "both";
  };

  selected.forEach((item) => {
    for (let i = 1; i <= 6; i++) {
      const startStr = item[`DAY${i}_KAISAI_JIKAN_KAISHI`];
      const endStr = item[`DAY${i}_KAISAI_JIKAN_SYURYO`];
      if (typeof startStr === "string" && typeof endStr === "string") {
        const start = new Date(startStr);
        const end = new Date(endStr);
        const date = start.toISOString().slice(0, 10); // YYYY-MM-DD

        const session = getSessionType(start, end);
        if (!dateSessionMap[date]) dateSessionMap[date] = new Set();
        if (session === "both") {
          dateSessionMap[date].add("morning");
          dateSessionMap[date].add("afternoon");
        } else {
          dateSessionMap[date].add(session);
        }
      }
    }
  });

  // いずれかの日付で午前と午後の両方が選択されている場合に警告を出す
  return Object.values(dateSessionMap).some(
    (sessions) => sessions.has("morning") && sessions.has("afternoon"),
  );
}

/**
 * 全てのバリデーションを行い、結果を返す
 */
export function getValidationResult(selected: SchoolClassDetails[]) {
  const maxTwoTotalClasses = validateMaxTwoTotalClasses(selected);
  const maxSingleClassesPerSubject =
    validateMaxSingleClassesPerSubject(selected);
  const hasTimeConflict = validateTimeConflict(selected);
  const sameDayMorningAfternoon = validateSameDayMorningAfternoon(selected);
  return {
    maxTwoTotalClasses,
    maxSingleClassesPerSubject,
    hasTimeConflict,
    sameDayMorningAfternoon,
    hasAnyError:
      maxTwoTotalClasses || maxSingleClassesPerSubject || hasTimeConflict,
    hasAnyAlert: sameDayMorningAfternoon,
  };
}
