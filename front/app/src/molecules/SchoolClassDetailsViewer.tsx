// =============================================================================
// クラス選択画面 科目で選ぶ
// =============================================================================
import * as React from "react";

import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

import { styled } from "@mui/material";
import TableCell from "@mui/material/TableCell";
import useMediaQuery from "@mui/material/useMediaQuery";

import { SchoolClassDetailsTable } from "@/components/SchoolClassDetailsTable";
import type { NotificationLists } from "@/components/CustomAlert";
import { defaultColumns } from "@/const/SchoolClassDetailsColumns";
import type { SchoolClassDetails } from "@/types/SchoolClassDetailsResponse";

import styles from "@/molecules/SchoolClassDetails.module.scss";
import { SchoolClassDetailsViewerMobileRows } from "@/molecules/SchoolClassDetailsMobileRows";

// 曜日表示コンポーネント
export type WeekdayDisplayProps = {
  weekdCode: number;
};
export const WeekdayDisplay: React.FC<WeekdayDisplayProps> = ({
  weekdCode,
}) => {
  const weekdMap: Record<number, string> = {
    1: "月",
    2: "火",
    3: "水",
    4: "木",
    5: "金",
    6: "土",
    7: "日",
  };
  return <span>{weekdMap[weekdCode] || "-"}</span>;
};

dayjs.extend(utc);
dayjs.extend(timezone);

export type DayCellProps = {
  isoDayCellDate: string;
  showBreak?: boolean;
  hideJST?: boolean;
};

export const DayCell: React.FC<DayCellProps> = ({
  isoDayCellDate,
  showBreak = true,
  hideJST = false,
}) => (
  <>
    {dayjs(isoDayCellDate).format("MM/DD")}
    {!hideJST && (
      <>
        {showBreak && <br />}
        {!showBreak ? (
          <span style={{ marginLeft: "1rem" }}>JST</span>
        ) : (
          <span style={{ fontSize: "11px" }}>JST</span>
        )}
      </>
    )}
  </>
);

const CustomTableCellWidth = styled(TableCell)(({ width }) => ({
  width: `${width}px !important`,
}));

export type DaysDisplayProps = { days: string; showBreak?: boolean };
export const DaysDisplay: React.FC<DaysDisplayProps> = ({
  days,
  showBreak,
}) => {
  const day = dayjs(days).subtract(1, "day").format("MM/DD");
  return (
    <>
      {day}
      {showBreak && <br />}
      {!showBreak ? (
        <span style={{ marginLeft: "8px" }}>JST</span>
      ) : (
        <span style={{ fontSize: "11px" }}>JST</span>
      )}
    </>
  );
};

// テーブルのカラム設定
type TableCellAlign = "left" | "right" | "inherit" | "center" | "justify";

export type ColumnConfig<T> = {
  label: string;
  value?: keyof T;
  align?: TableCellAlign;
  render?: (
    row: T,
    idx: number,
    checked: boolean,
    handle: (
      index: number,
      row: T,
    ) => (event: React.ChangeEvent<HTMLInputElement>) => void,
  ) => React.ReactNode;
  sx?: React.CSSProperties;
};

type SchoolClassDetailsViewerProps = {
  subjectTitle?: string;
  rows: SchoolClassDetails[];
  columns?: Array<ColumnConfig<SchoolClassDetails>>;
  checkedRows?: boolean[];
  // --- CHANGE: onCheckedChange gets (rowIdx, checked) ---
  onCheckedChange?: (rowIdx: number, checked: boolean) => void;
  subjectOptions?: { value: string; label: string }[];
  subjectRowsMap?: Record<string, SchoolClassDetails[]>;
  hasError?: boolean;
  errorList?: NotificationLists[];
};

export const SchoolClassDetailsViewer: React.FC<
  SchoolClassDetailsViewerProps
> = ({
  subjectTitle,
  rows,
  columns = defaultColumns,
  checkedRows,
  onCheckedChange,
  subjectOptions,
  subjectRowsMap,
  hasError,
}) => {
  const isMobile = useMediaQuery("(max-width:932px)");
  // checkedRows が未定義の場合は、すべて false を使用する
  const checked = checkedRows ?? Array(rows.length).fill(false);

  // スクロール to top if error
  React.useEffect(() => {
    if (hasError) {
      const element = document.getElementById(
        `school-class-details-viewer-alert`,
      );
      console.log(
        "Scroll target element:",
        element,
        "subjectTitle:",
        subjectTitle,
      ); // TODO: remove this log for production
      if (element) {
        const yOffset = -20;
        const y =
          element.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    }
  }, [hasError, subjectTitle]);

  // チェックボックス変更ハンドラー
  const handleCheckboxChange =
    (index: number) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | { target: { checked: boolean } },
    ) => {
      const checkedValue =
        "target" in event && typeof event.target.checked === "boolean"
          ? event.target.checked
          : false;
      onCheckedChange?.(index, checkedValue);

      console.log("チェックしたクラス:", rows[index]); //TODO: remove this log for production
    };

  return (
    <div>
      <div
        className={
          hasError
            ? `${styles.subject_title} ${styles.subject_title_error}`
            : styles.subject_title
        }
      >
        {subjectTitle}
      </div>
      {!isMobile ? (
        <SchoolClassDetailsTable
          columns={columns}
          rows={rows}
          checked={checked}
          handleCheckboxChange={handleCheckboxChange}
          isMobile={isMobile}
          CustomTableCellWidth={CustomTableCellWidth}
          tableClassName={styles.table}
          tableHeadClassName={styles["table-header"]}
          tableBodyClassName={styles["table-body"]}
        />
      ) : (
        <SchoolClassDetailsViewerMobileRows
          subjectTitle={subjectTitle}
          subjectOptions={subjectOptions || []}
          subjectRowsMap={subjectRowsMap || {}}
          DayCellHead={(props) => <DayCell {...props} hideJST={true} />}
          DayCell={(props) => <DayCell {...props} showBreak={false} />}
          checked={checked}
          handleCheckboxChange={handleCheckboxChange}
          rows={rows}
        />
      )}
    </div>
  );
};
