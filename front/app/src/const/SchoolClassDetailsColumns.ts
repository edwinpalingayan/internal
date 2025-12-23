import * as React from "react";

import type { ColumnConfig } from "@/molecules/SchoolClassDetailsViewer";
import {
  WeekdayDisplay,
  DaysDisplay,
} from "@/molecules/SchoolClassDetailsViewer";
import type { SchoolClassDetails } from "@/types/SchoolClassDetailsResponse";
import Link from "@mui/material/Link";
import Checkbox from "@mui/material/Checkbox";

import type { DayKaisaiJikanKey } from "@/types/SchoolClassDetailsResponse";

interface DefaultColumnConfig<T> extends ColumnConfig<T> {
  label: string;
  align?: "center" | "left" | "right";
  sx?: Record<string, unknown>;
  value?: keyof T;
  render?: (
    row: T,
    idx?: number,
    checked?: boolean,
    handle?: (
      idx: number,
      row: T,
    ) => (event: React.ChangeEvent<HTMLInputElement>) => void,
  ) => React.ReactNode;
}

export const defaultColumns: Array<ColumnConfig<SchoolClassDetails>> = [
  {
    label: "希望クラス",
    align: "center",
    sx: {
      width: "70px !important",
      minWidth: "80px",
      maxWidth: "80px !important",
    },
    render: (
      row: SchoolClassDetails,
      idx?: number,
      checked?: boolean,
      handle?: (
        idx: number,
        row: SchoolClassDetails,
      ) => (event: React.ChangeEvent<HTMLInputElement>) => void,
    ) =>
      React.createElement(Checkbox, {
        checked: checked,
        onChange: handle && idx !== undefined ? handle(idx, row) : undefined,
        inputProps: { "aria-label": `希望クラス for row ${idx}` },
      }),
  },
  {
    label: "開催校",
    value: "KAISAI_KO_MEI",
    sx: {
      width: "90px !important",
      minWidth: "90px",
      maxWidth: "90px !important",
    },
  },
  {
    label: "クラス",
    value: "CLASS_MEI",
    sx: {
      width: "70px !important",
      minWidth: "70px",
      maxWidth: "70px !important",
    },
  },
  {
    label: "プログラム",
    value: "CLASS_LABEL_MEI",
    sx: {
      width: "80px !important",
      minWidth: "80px !important",
      maxWidth: "80px !important",
    },
  },
  {
    label: "空き状況",
    render: (row: SchoolClassDetails) => {
      const value = row.ZANSEKI_SU as string | undefined;
      if (value && value.includes("残り")) {
        const match = value.match(/(残り)(.*)/);
        if (match)
          return React.createElement(
            React.Fragment,
            null,
            match[1],
            React.createElement("br", null),
            match[2].trim(),
          );
      }
      return value || "";
    },
    sx: {
      width: "60px !important",
      minWidth: "70px",
      maxWidth: "70px !important",
    },
  },
  {
    label: "講師",
    render: (row: SchoolClassDetails) =>
      React.createElement(
        Link,
        {
          href: `${row.KOSHI_URL}`,
          target: "_blank",
          rel: "noopener noreferrer",
        },
        row.KOSHI_MEI,
      ),
    sx: {
      width: "140px !important",
      minWidth: "140px",
      maxWidth: "140px !important",
    },
  },
  {
    label: "回数",
    render: (row: SchoolClassDetails) =>
      React.createElement(React.Fragment, null, `全${row.DAY_SU}回`),
    sx: {
      width: "50px !important",
      minWidth: "50px",
      maxWidth: "50px !important",
    },
  },
  ...[1, 2, 3, 4, 5, 6].map((day): DefaultColumnConfig<SchoolClassDetails> => {
    const key = `DAY${day}_KAISAI_JIKAN_KAISHI` as DayKaisaiJikanKey;
    return {
      label: `DAY${day}`,
      value: key,
      render: (row: SchoolClassDetails) =>
        row[key]
          ? React.createElement(DaysDisplay, {
              days: row[key] as string,
              showBreak: true,
            })
          : "",
      sx: {
        width: "50px !important",
        minWidth: "50px",
        maxWidth: "50px !important",
      },
    };
  }),
  {
    label: "曜日",
    value: "YOBI_CD",
    render: (row: SchoolClassDetails) =>
      React.createElement(WeekdayDisplay, { weekdCode: Number(row.YOBI_CD) }),
    sx: {
      width: "50px !important",
      minWidth: "50px !important",
      maxWidth: "50px !important",
    },
  },
  {
    label: "時間",
    value: "KAISAI_JIKAN",
    sx: {
      width: "100px !important",
      minWidth: "100px !important",
      maxWidth: "100px !important",
    },
  },
  {
    label: "備考",
    value: "BIKO",
    sx: {
      width: "120px !important",
      minWidth: "120px",
      maxWidth: "120px !important",
    },
  },
];
