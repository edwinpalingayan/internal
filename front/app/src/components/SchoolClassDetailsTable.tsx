import * as React from "react";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";

import MainContainer from "@/layouts/MainLayout/MainLayout";

import type { SchoolClassDetails } from "@/types/SchoolClassDetailsResponse";

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

type SchoolClassDetailsTableProps = {
  columns: Array<ColumnConfig<SchoolClassDetails>>;
  rows: SchoolClassDetails[];
  checked?: boolean[];
  handleCheckboxChange: (
    index: number,
    row: SchoolClassDetails,
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
  isMobile?: boolean;
  CustomTableCellWidth?: React.ElementType;
  tableClassName?: string;
  tableHeadClassName?: string;
  tableBodyClassName?: string;
  pcMaxWidth?: string;
};

export function SchoolClassDetailsTable({
  columns,
  rows,
  checked,
  handleCheckboxChange,
  isMobile = false,
  CustomTableCellWidth = TableCell,
  tableClassName,
  tableHeadClassName,
  tableBodyClassName,
  pcMaxWidth,
}: SchoolClassDetailsTableProps) {
  const CellComponent = CustomTableCellWidth ?? TableCell;
  return (
    <MainContainer
      boxSx={isMobile ? { padding: "16px 12px" } : { p: 0 }}
      pcMaxWidth={pcMaxWidth}
    >
      <TableContainer>
        <Table
          sx={{ minWidth: 650 }}
          aria-label="class table"
          className={tableClassName}
        >
          <TableHead className={tableHeadClassName}>
            <TableRow>
              {columns.map((col, idxHead) =>
                col.sx?.width ? (
                  <CellComponent
                    width={parseInt(String(col.sx.width), 10)}
                    key={`${col.label}-${idxHead}`}
                    sx={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#333333 !important",
                      background: "#f7f7f7",
                      borderBottom: "#f7f7f7",
                      padding: "13px 6px",
                      textAlign: "center",
                      ...col.sx,
                    }}
                  >
                    {col.label}
                  </CellComponent>
                ) : (
                  <CellComponent
                    key={`${col.label}-${idxHead}`}
                    sx={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "#333333 !important",
                      background: "#f7f7f7",
                      borderBottom: "#f7f7f7",
                      padding: "13px 6px",
                      textAlign: "center",
                      ...col.sx,
                    }}
                  >
                    {col.label}
                  </CellComponent>
                ),
              )}
            </TableRow>
          </TableHead>
          <TableBody className={tableBodyClassName}>
            {rows.map((row, idx) => (
              <TableRow
                key={
                  row.id?.toString() ||
                  `${row.KAISAI_KO_MEI}-${row.CLASS_MEI}-${row.CLASS_LABEL_MEI}-${idx}`
                }
                sx={{ "&:last-child td, &:last-child th": { border: 0 } }}
              >
                {columns.map((col, idxBody) => (
                  <CellComponent
                    key={`${col.label}-${idxBody}`}
                    align={col.align || "left"}
                    className={
                      col.label === "講師"
                        ? tableBodyClassName + "-link"
                        : undefined
                    }
                    sx={{
                      fontFamily: "$font-primary !important",
                      fontSize: "14px",
                      fontWeight: ["講師"].includes(col.label) ? 500 : 400,
                      color: "#333333 !important",
                      padding: "14px 6px",
                      textAlign: "center",
                      ...col.sx,
                    }}
                  >
                    {col.render
                      ? col.render(
                          row,
                          idx,
                          (checked ?? [])[idx] ?? false,
                          handleCheckboxChange,
                        )
                      : col.value
                        ? (row[
                            col.value as keyof SchoolClassDetails
                          ] as React.ReactNode)
                        : ""}
                  </CellComponent>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </MainContainer>
  );
}
