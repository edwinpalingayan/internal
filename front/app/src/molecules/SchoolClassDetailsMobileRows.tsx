// =============================================================================
// クラス選択画面 科目で選ぶ モバイル版
// =============================================================================
import React, { useState } from 'react';

import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';

import AddCircleOutlineOutlinedIcon from '@mui/icons-material/AddCircleOutlineOutlined';
import CheckIcon from '@mui/icons-material/Check';
import RemoveCircleOutlineOutlinedIcon from '@mui/icons-material/RemoveCircleOutlineOutlined';

import MainContainer from '@/layouts/MainLayout/MainLayout';
import CustomButton from '@/components/CustomButton';
import styles from '@/molecules/SchoolClassDetails.module.scss';

import type { SchoolClassDetails } from '@/types/SchoolClassDetailsResponse';

// カスタム Paper コンポーネント
type CustomPaperProps = { withColon?: boolean; padding?: string };
const CustomPaper = styled(Paper, {
  shouldForwardProp: (prop) => prop !== 'withColon' && prop !== 'padding',
})<CustomPaperProps>(({ withColon, padding }) => ({
  padding: padding ?? '10px 0',
  textAlign: 'left',
  color: '#333333',
  fontSize: 16,
  fontWeight: 500,
  margin: 0,
  position: withColon ? 'relative' : undefined,
  ...(withColon && {
    '&::after': {
      content: '":"',
      display: 'block',
      position: 'absolute',
      top: '45%',
      right: 0,
      transform: 'translateY(-50%)',
    },
  }),
}));

const CustomGridHead = styled(Grid)(() => ({
  position: 'relative',
  '&::after': {
    content: '":"',
    display: 'block',
    position: 'absolute',
    top: '45%',
    right: 0,
    transform: 'translateY(-50%)',
  },
}));

type TimeRangeDisplayProps = {
  duration: string;
  showBreak?: boolean;
  hasJst?: boolean;
};
const TimeRangeDisplay: React.FC<TimeRangeDisplayProps> = ({
  duration,
  showBreak = true,
  hasJst = true,
}) => (
  <>
    {duration}
    {showBreak && <br />}
    {hasJst &&
      (!showBreak ? (
        <span style={{ marginLeft: '8px' }}>JST</span>
      ) : (
        <span style={{ fontSize: '11px' }}>JST</span>
      ))}
  </>
);
// 曜日表示コンポーネント
type WeekdayDisplayProps = {
  weekdCode: number;
};
const WeekdayDisplay: React.FC<WeekdayDisplayProps> = ({ weekdCode }) => {
  const weekdMap: Record<number, string> = {
    1: '（月）',
    2: '（火）',
    3: '（水）',
    4: '（木）',
    5: '（金）',
    6: '（土）',
    7: '（日）',
  };
  return <span>{weekdMap[weekdCode] || '-'}</span>;
};

// 各フィールドの設定。カスタムレンダラーも使える
const dayFields = Array.from({ length: 6 }).map((_, i) => ({
  label: `DAY${i + 1}`,
  valueKey: `DAY${i + 1}_KAISAI_JIKAN_KAISHI`,
  isDayCell: true,
  withColon: false,
}));

const detailConfig: Array<{
  label: string;
  valueKey: keyof SchoolClassDetails | string;
  withColon?: boolean;
  isLink?: boolean;
  isDayCell?: boolean;
  isTime?: boolean;
  isWeek?: boolean;
  render?: (
    row: SchoolClassDetails,
    DayCell: React.FC<{ isoDayCellDate: string }>,
  ) => React.ReactNode;
}> = [
  { label: '開催校', valueKey: 'KAISAI_KO_MEI', withColon: true },
  { label: 'プログラム', valueKey: 'CLASS_LABEL_MEI', withColon: true },
  { label: 'クラス', valueKey: 'CLASS_MEI', withColon: false },
  { label: '空き状況', valueKey: 'ZANSEKI_SU', withColon: false },
  {
    label: '講師',
    valueKey: 'KOSHI_MEI',
    isLink: true,
    withColon: false,
    render: (row) => (
      <Link href={`${row.KOSHI_URL}`} target="_blank" rel="noopener noreferrer">
        {row.KOSHI_MEI}
      </Link>
    ),
  },
  {
    label: '回数:',
    valueKey: 'DAY_SU',
    withColon: false,
    render: (row) => <>全{row.DAY_SU}回</>,
  },
  ...dayFields,
  {
    label: '曜日',
    valueKey: 'YOBI_CD',
    isWeek: true,
    withColon: false,
    render: (row) => <WeekdayDisplay weekdCode={row.YOBI_CD} />,
  },
  {
    label: '時間',
    valueKey: 'KAISAI_JIKAN',
    isTime: true,
    withColon: false,
    render: (row) => (
      <TimeRangeDisplay duration={row.KAISAI_JIKAN} showBreak={false} hasJst={false} />
    ),
  },
  { label: '備考', valueKey: 'BIKO', withColon: false },
];

// レンダリング用のヘルパー関数
function renderDetailValue(
  conf: (typeof detailConfig)[number],
  row: SchoolClassDetails,
  DayCell: React.FC<{ isoDayCellDate: string }>,
): React.ReactNode {
  // カスタムレンダラーが指定されている場合
  if (typeof conf.render === 'function') {
    const rendered = conf.render(row, DayCell);
    if (
      rendered === undefined ||
      rendered === null ||
      (typeof rendered === 'object' &&
        !Array.isArray(rendered) &&
        Object.keys(rendered).length === 0)
    ) {
      return null;
    }
    return rendered;
  }
  // 設定に基づくデフォルトの処理
  if (conf.isDayCell) {
    const val = row[conf.valueKey as keyof SchoolClassDetails] as string | undefined;
    if (!val) return '-';
    return <DayCell isoDayCellDate={val} />;
  }
  if (conf.isWeek) {
    const val = row[conf.valueKey as keyof SchoolClassDetails] as number | undefined;
    return <WeekdayDisplay weekdCode={val ?? 0} />;
  }
  if (conf.isTime) {
    const val = row[conf.valueKey as keyof SchoolClassDetails] as string | undefined;
    return <TimeRangeDisplay duration={val ?? ''} showBreak={false} hasJst={false} />;
  }
  if (conf.isLink) {
    const val = row[conf.valueKey as keyof SchoolClassDetails] as string | undefined;
    if (!val) return '-';
    return (
      <Link href={`/teachers/${encodeURIComponent(val)}`} target="_blank" rel="noopener noreferrer">
        {val}
      </Link>
    );
  }
  const val = row[conf.valueKey as keyof SchoolClassDetails];
  if (val !== undefined && val !== null && val !== '') {
    if (typeof val === 'object' && !Array.isArray(val) && !React.isValidElement(val)) {
      return null;
    }
    if (
      typeof val === 'string' ||
      typeof val === 'number' ||
      typeof val === 'boolean' ||
      React.isValidElement(val)
    ) {
      return val;
    }
    return null;
  }
  return '-';
}

type SchoolClassDetailsViewerMobileRowsProps = {
  subjectTitle: string | undefined;
  subjectOptions: { value: string; label: string }[];
  subjectRowsMap: Record<string, SchoolClassDetails[]>;
  DayCell: React.FC<{ isoDayCellDate: string }>;
  DayCellHead: React.FC<{ isoDayCellDate: string }>;
  checked: boolean[];
  handleCheckboxChange: (
    index: number,
    row: SchoolClassDetails,
  ) => (event: React.ChangeEvent<HTMLInputElement> | { target: { checked: boolean } }) => void;
  rows: SchoolClassDetails[];
};

export const SchoolClassDetailsViewerMobileRows: React.FC<
  SchoolClassDetailsViewerMobileRowsProps
> = ({
  subjectTitle,
  subjectOptions,
  subjectRowsMap,
  DayCell,
  DayCellHead,
  checked,
  handleCheckboxChange,
  rows,
}) => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([]);
  const handleAccordionClick = (idx: number) =>
    setOpenIndexes((prev) => (prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]));

  const subject = subjectOptions.find((s) => s.label === subjectTitle);
  if (!subject) return null;
  rows = subjectRowsMap[subject.value] || [];
  if (!rows.length) return <div>データがありません</div>;

  // サマリーに表示する項目の設定（必要に応じて調整してください）
  const summaryFields = detailConfig.slice(0, 2);

  return (
    <Box sx={{ flexGrow: 1, mb: 0 }}>
      {rows.map((row, idx) => {
        const isOpen = openIndexes.includes(idx);
        return (
          <MainContainer
            key={idx}
            boxSx={{
              padding: '16px 12px',
              marginBottom: '16px',
              width: 'calc(100vw - 2rem)',
            }}
          >
            <div className={styles.subject_category_head}>
              <span className={styles.subject_category_head_date}>
                <DayCellHead isoDayCellDate={row.DAY1_KAISAI_JIKAN_KAISHI} />
              </span>
              <span className={styles.subject_category_head_yobi}>
                <WeekdayDisplay weekdCode={row.YOBI_CD} />
              </span>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
                <span className={styles.subject_category_head_duration}>
                  <TimeRangeDisplay duration={row.KAISAI_JIKAN} showBreak={false} />
                </span>
                <span className={styles.subject_category_head_divider} />
                <span className={styles.subject_category_head_availability}>
                  {typeof row.ZANSEKI_SU === 'string' && !row.ZANSEKI_SU.includes('残り')
                    ? `空き${row.ZANSEKI_SU}`
                    : `${row.ZANSEKI_SU}`}
                </span>
              </div>
            </div>
            <Grid container spacing={1} columns={16} sx={{ mt: 2 }}>
              {summaryFields.map((conf, i) => (
                <React.Fragment key={i}>
                  <CustomGridHead size={5}>
                    <CustomPaper withColon={!!conf.withColon} elevation={0} padding="2px 0">
                      {conf.label}
                    </CustomPaper>
                  </CustomGridHead>
                  <Grid size={11} sx={{ pl: 2 }}>
                    <CustomPaper elevation={0} padding="2px 0">
                      {renderDetailValue(conf, row, DayCell)}
                    </CustomPaper>
                  </Grid>
                </React.Fragment>
              ))}
            </Grid>
            <Collapse in={isOpen} timeout="auto" unmountOnExit>
              <Divider sx={{ width: '100%', marginTop: '20px', marginBottom: '-10px' }} />
              <Grid container spacing={1} columns={16} sx={{ mt: 2 }}>
                {detailConfig
                  .filter(
                    (conf) =>
                      conf.valueKey !== 'CLASS_LABEL_MEI' && conf.valueKey !== 'KAISAI_KO_MEI',
                  )
                  .map((conf, i) => (
                    <React.Fragment key={i}>
                      <CustomGridHead size={5}>
                        <CustomPaper withColon={!!conf.withColon} elevation={0}>
                          {conf.label}
                        </CustomPaper>
                      </CustomGridHead>
                      <Grid size={11} sx={{ pl: 2 }}>
                        <CustomPaper elevation={0}>
                          {renderDetailValue(conf, row, DayCell)}
                        </CustomPaper>
                      </Grid>
                      <Divider sx={{ width: '100%' }} />
                    </React.Fragment>
                  ))}
              </Grid>
            </Collapse>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <CustomButton
                color="primary"
                width={{ sm: '40%' }}
                sx={{ minWidth: '128px' }}
                variant="outlined"
                startIcon={
                  isOpen ? <RemoveCircleOutlineOutlinedIcon /> : <AddCircleOutlineOutlinedIcon />
                }
                onClick={() => handleAccordionClick(idx)}
              >
                {isOpen ? '閉じる' : '詳細をみる'}
              </CustomButton>
              <CustomButton
                color={!checked?.[idx] ? 'customGray' : 'primary'}
                width={{ xs: '100%', sm: '60%' }}
                variant={!checked?.[idx] ? 'outlined' : 'contained'}
                sx={{ color: !checked?.[idx] ? '#333333' : '' }}
                onClick={() =>
                  handleCheckboxChange?.(idx, row)?.({ target: { checked: !checked?.[idx] } })
                }
                startIcon={<CheckIcon />}
              >
                このクラスを希望する
              </CustomButton>
            </div>
          </MainContainer>
        );
      })}
    </Box>
  );
};
