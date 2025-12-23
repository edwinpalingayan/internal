import * as React from "react";
import MuiAccordion from "@mui/material/Accordion";
import MuiAccordionSummary from "@mui/material/AccordionSummary";
import MuiAccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { styled } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import styles from "./CustomAccordion.module.scss";

interface CustomAccordionProps {
  title: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  sx?: object;
}

const CustomAccordionDetails = styled(MuiAccordionDetails)(() => ({
  display: "flex",
  flexDirection: "column",
  gap: "1rem",
  padding: "14px 0",
  "& .MuiAccordionSummary-content.Mui-expanded": {
    margin: "0",
  },
}));

export default function CustomAccordion({
  title,
  children,
  defaultExpanded = false,
  ...rest
}: CustomAccordionProps) {
  // useMediaQuery を使って画面サイズ（タブレット）を検出
  const isMobile = useMediaQuery("(min-width:768px)");

  if (isMobile) {
    // モバイルビュー：アコーディオンを使わずにタイトルと子要素のみを表示
    return (
      <div className={styles.container}>
        <div className={styles.title}>{title}</div>
        <div>{children}</div>
      </div>
    );
  }

  // デスクトップビュー：通常通りアコーディオンをレンダリング
  return (
    <MuiAccordion
      defaultExpanded={defaultExpanded}
      {...rest}
      sx={{
        "&.MuiAccordion-root": {
          border: 0,
          borderBottom: "1px solid #E3E3E3",
          borderRadius: 0,
          boxShadow: "none",
          "&.MuiAccordionSummary-root": {
            padding: 0,
          },
        },
        "&.MuiPaper-root.MuiAccordion-root": {
          "&::before": {
            display: "none",
          },
        },
        ...rest.sx,
      }}
    >
      <MuiAccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls="panel-content"
        id="panel-header"
        sx={{
          "&.MuiAccordionSummary-root": {
            padding: 0,
            minHeight: "64px !important",
            "&.Mui-expanded .MuiAccordionSummary-content": {
              margin: 0,
            },
          },
          "&.Mui-expanded": {
            minHeight: "64px !important",
            margin: "0 !important",
          },
        }}
      >
        <div className={styles.title}>{title}</div>
      </MuiAccordionSummary>
      <CustomAccordionDetails
        sx={{
          "&.MuiAccordionSummary-content": {
            "&.Mui-expanded": {
              margin: 0,
            },
          },
          "&.Mui-expanded": {
            margin: 0,
          },
        }}
      >
        {children}
      </CustomAccordionDetails>
    </MuiAccordion>
  );
}
