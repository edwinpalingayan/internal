import * as React from 'react';
import { useLocation, useParams } from 'react-router-dom';

import {
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Grid,
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';

import LinkIcon from '@mui/icons-material/Link';

import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import QRCode from 'react-qr-code';

import MainContainer from '@/layouts/MainLayout/MainLayout';

import { post } from '@/services/apiService';

import type { ColumnConfig } from '@/components/SchoolClassDetailsTable';
import type { EventTtEvent } from '@/types/EventTtEventResponse';
import type {
  GetEventTtYoyakuMoshikomiResponse,
  YoyakuMoshikomiData,
} from '@/types/EventTYoyakuMoshikomiResponse';

import 'dayjs/locale/ja';

import { API_APP_KEY } from '@/utils/config';
import { CustomAlert, type NotificationLists } from '@/components/CustomAlert';

const appPrefix = API_APP_KEY;

// --- Dayjs Setup ---
dayjs.locale('ja');
dayjs.extend(utc);
dayjs.extend(timezone);

/** イベント申込データのテーブルカラム定義 (拡張性重視) */
const columns: Array<ColumnConfig<YoyakuMoshikomiData>> = [
  { label: 'メールアドレス', value: 'EMAIL', sx: { width: 300 } },
  { label: '氏名', value: 'SHIMEI', sx: { width: 150 } },
  { label: 'クラスコード', value: 'CLASS_CD', sx: { width: 120 } },
  { label: '申込クラス', value: 'CLASS_HYOJI', sx: { width: 250 } },
  { label: '優先順位', value: 'PRIORITY', align: 'center', sx: { width: 100 } },
  { label: 'WTGフラグ', value: 'WAITING_FLG', align: 'center', sx: { width: 120 } },
  {
    label: 'GMS顧客番号',
    sx: { width: 250 },
    render: (row) => row.GMS_KOKYAKU_ID ?? '',
  },
];

// --- Utility Components ---
// 日付セル (YYYY/M/D形式)
const DateCell: React.FC<{ iso: string }> = ({ iso }) =>
  iso ? <>{dayjs(iso).format('YYYY/M/D')}</> : <>-</>;

// 時刻セル (HH:mm形式)
const TimeCell: React.FC<{ iso: string }> = ({ iso }) =>
  iso ? <>{dayjs(iso).format('HH:mm')}</> : <>-</>;

/**
 * ジェネリックなテーブル: columns定義で柔軟に表示
 * @template T - row型
 */
function DataTable<T extends object>({
  columns,
  rows,
  tableProps,
  headSx,
  cellSx,
}: {
  columns: Array<ColumnConfig<T>>;
  rows: T[];
  tableProps?: React.ComponentProps<typeof Table>;
  headSx?: object;
  cellSx?: object;
}) {
  return (
    <TableContainer>
      <Table {...tableProps} aria-label="data table">
        <TableHead sx={headSx}>
          <TableRow>
            {columns.map((col) => (
              <TableCell
                key={String(col.value)}
                align={col.align ?? 'left'}
                sx={{
                  ...cellSx,
                  ...col.sx,
                  borderRight: '1px solid #DDDDDD',
                  minWidth: col.sx?.width,
                  maxWidth: col.sx?.width,
                }}
              >
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length > 0 ? (
            rows.map((row, idx) => (
              <TableRow key={(row as { ID?: string | number }).ID ?? idx}>
                {columns.map((col) => (
                  <TableCell
                    key={String(col.value)}
                    align={col.align ?? 'left'}
                    sx={{
                      ...cellSx,
                      ...col.sx,
                      borderRight: '1px solid #DDDDDD',
                      minWidth: col.sx?.width,
                      maxWidth: col.sx?.width,
                    }}
                  >
                    {col.render
                      ? col.render(row, idx, false, () => () => {})
                      : (() => {
                          const value = row[col.value as keyof T];
                          if (React.isValidElement(value)) return value;
                          if (
                            typeof value === 'string' ||
                            typeof value === 'number' ||
                            typeof value === 'boolean' ||
                            value == null
                          ) {
                            return value as React.ReactNode;
                          }
                          if (typeof value === 'object' || typeof value === 'function') {
                            return JSON.stringify(value ?? '');
                          }
                          return String(value ?? '');
                        })()}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} align="center">
                データがありません
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

/**
 * イベント詳細ページ
 * - イベント情報を表示 (Grid/Chip)
 * - 申込数や申込者テーブルを表示
 */
const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  // APIレスポンス保持
  const [eventYoyakuMoshikomi, setEventYoyakuMoshikomi] =
    React.useState<GetEventTtYoyakuMoshikomiResponse | null>(null);

  // 未連携者フィルタ state (default: enabled/checked)
  const [filterUnlinked, setFilterUnlinked] = React.useState(true);

  // location.state経由でイベント一覧取得
  const selectedEvent = React.useMemo(
    () => location.state?.event as EventTtEvent | undefined,
    [location.state],
  );
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!selectedEvent) {
      window.location.replace('/error/ErrorNotFound');
    }
  }, [selectedEvent]);

  const hasFetched = React.useRef(false);

  // 申込データ取得 (初回のみ)
  React.useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    if (!eventId) return;
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const res = await post<GetEventTtYoyakuMoshikomiResponse>(
          '/api/ocrs_f/get_event_tt_yoyaku_moshikomi',
          {
            event_id: eventId,
          },
        );
        setEventYoyakuMoshikomi(res);
        setLoading(false);
      } catch (error) {
        console.error('API request failed:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, [eventId]);

  const [validation, setValidation] = React.useState({
    hasEmptyGmsId: false,
    patchTtReservationApplicationUpdateFailed: false,
    gmsdbIntegrationCompleted: false,
    schoolDbIntegrationFailed: false,
  });

  const notificationLists: NotificationLists[] = [
    {
      key: 'hasEmptyGmsId',
      active: validation.hasEmptyGmsId,
      message: 'GMS顧客IDが未入力のデータがあります',
      severity: 'error' as const,
    },
    {
      key: 'patchTtReservationApplicationUpdateFailed',
      active: validation.patchTtReservationApplicationUpdateFailed,
      message: 'patch_tt_yoyaku_moshikomiの更新に失敗しました',
      severity: 'error' as const,
    },
    {
      key: 'schoolDbIntegrationFailed',
      active: validation.schoolDbIntegrationFailed,
      message: 'SCHOOLDB連携に失敗しました',
      severity: 'error' as const,
    },
    {
      key: 'gmsdbIntegrationCompleted',
      active: validation.gmsdbIntegrationCompleted,
      message: 'GMSDB連携処理が完了しました',
      severity: 'success' as const,
    },
  ];

  // GMSDB連携ボタン処理
  const handleGmsdbLink = async () => {
    if (!eventYoyakuMoshikomi?.data) return;

    // Separate base URL and endpoint as requested
    const baseUrl = 'https://mnt-vc.globis.ac.jp';
    const apiEndpoint = '/api/ext/v1/updateKamokuReserveStatus';
    const url = `${baseUrl}${apiEndpoint}`;

    const headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json',
      authorizationkey: 'GLOBIS_REST_HANDLER',
    };

    // Hard-coded params
    const payload = {
      gmsKokyakuId: '1100417626',
      eventCd: 'E-0000017213',
      syosekiSoufusakiYubinNo: '101-0001',
      syosekiSoufusakiJusyo: '東京都千代田区XXXXXXXX',
      syosekiSoufusakiTelNo: '090-1111-2222',
      yoyakuMoshikomiKbn: '02',
      yoyakuKijitsu: '2025-10-10',
    };

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        console.error('GMSDB integration failed, status:', resp.status);
        setValidation((prev) => ({ ...prev, schoolDbIntegrationFailed: true }));
        return;
      }

      setValidation((prev) => ({ ...prev, gmsdbIntegrationCompleted: true }));
    } catch (err) {
      console.error('GMSDB integration error:', err);
      setValidation((prev) => ({ ...prev, schoolDbIntegrationFailed: true }));
    }
  };

  // 一時保存ボタン処理 patch_tt_yoyaku_moshikomiを全データ分実施
  const handleTemporarySave = async () => {
    if (!eventYoyakuMoshikomi?.data) return;

    // patch_tt_yoyaku_moshikomiを全データ分実施
    try {
      await Promise.all(
        eventYoyakuMoshikomi.data.map((row) =>
          post('/api/ocrs_f/patch_tt_yoyaku_moshikomi', {
            id: row.ID,
            event_id: row.EVENT_ID,
            class_cd: row.CLASS_CD,
            priority: row.PRIORITY,
            gms_kokyaku_id: row.GMS_KOKYAKU_ID,
            koshin_id: appPrefix,
          }),
        ),
      );
    } catch {
      setValidation((prev) => ({ ...prev, patchTtReservationApplicationUpdateFailed: true }));
      return;
    }
  };

  // --- 情報表示リスト定義 (柔軟にKey/Label/値/カスタム表示も可) ---
  const eventInfoList = [
    {
      label: '開催日',
      value: selectedEvent?.EVENT_START_TIME ? (
        <>
          <DateCell iso={selectedEvent.EVENT_START_TIME} />
          <Typography component="span" sx={{ marginLeft: '10px', fontSize: '0.875rem' }}>
            <TimeCell iso={selectedEvent.EVENT_START_TIME} />
          </Typography>
        </>
      ) : (
        '-'
      ),
    },
    { label: '開催校', value: selectedEvent?.KAISAI_KO_MEI ?? '-' },
    { label: 'イベント区分', value: selectedEvent?.EVENT_KBN_MEI ?? '-' },
    { label: 'イベント名', value: selectedEvent?.EVENT_MEI ?? '-' },
    {
      label: 'URL',
      value: selectedEvent?.URL ? (
        <Link href={selectedEvent.URL} target="_blank" rel="noopener noreferrer">
          {selectedEvent.URL}
        </Link>
      ) : (
        '-'
      ),
    },
    {
      label: '申込数',
      value:
        (eventYoyakuMoshikomi?.data ? `${eventYoyakuMoshikomi.data.length}件` : '0件') +
        (eventYoyakuMoshikomi?.data
          ? `（WTG${eventYoyakuMoshikomi.data.filter((row) => Number(row.WAITING_FLG) === 1).length}名）`
          : '0名）'),
    },
  ];

  // 未連携者フィルタの適用
  const filteredRows =
    eventYoyakuMoshikomi?.data?.filter((row) =>
      filterUnlinked ? Number(row.RENKEI_ZUMI_FLG) !== 1 : true,
    ) ?? [];

  return (
    <MainContainer boxSx={{ minWidth: { md: 980 }, minHeight: 500, marginTop: '5rem' }}>
      <Box sx={{ flexGrow: 1, margin: '20px 0' }}>
        <Grid container spacing={1}>
          <Grid size={{ sm: 'grow', md: 8, lg: 6 }}>
            <Box component="ul" sx={{ pl: 0, m: 0 }}>
              {eventInfoList.map((info, idx) => (
                <li
                  key={info.label + idx}
                  style={{ listStyle: 'none', margin: '0 0 16px 0', paddingLeft: 0 }}
                >
                  <Grid columns={11} container spacing={3} alignItems="center">
                    <Grid size="auto" sx={{ textAlign: 'left' }}>
                      <Chip label={info.label} variant="outlined" sx={{ minWidth: '108px' }} />
                    </Grid>
                    <Grid size={8} sx={{ textAlign: 'left' }}>
                      {info.value}
                    </Grid>
                  </Grid>
                </li>
              ))}
            </Box>
          </Grid>
          <Grid size="auto">
            {selectedEvent?.URL ? (
              <QRCode value={selectedEvent.URL} size={70} />
            ) : (
              <Typography color="error">URLがありません</Typography>
            )}
          </Grid>
        </Grid>
      </Box>
      {loading ? (
        <CircularProgress size={70} sx={{ display: 'block', margin: '4rem auto' }} />
      ) : (
        <>
          <CustomAlert notificationLists={notificationLists} sx={{ marginBottom: '20px' }} />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px',
            }}
          >
            <div>
              <Button
                variant="outlined"
                size="small"
                sx={{ padding: '4px 8px', height: '40px' }}
                startIcon={<LinkIcon />}
                onClick={handleGmsdbLink}
              >
                GMSDB連携
              </Button>
            </div>
            <div>
              <Checkbox
                checked={filterUnlinked}
                onChange={(e) => setFilterUnlinked(e.target.checked)}
                sx={{ display: 'inline-block', padding: '0', margin: '2px 8px 0 0' }}
              />
              未連携者に絞り込み {/* //RENKEI_ZUMI_FLG */}
              <Button
                variant="contained"
                sx={{ minWidth: '140px', padding: '4px 12px', height: '40px', marginLeft: '40px' }}
                onClick={handleTemporarySave}
              >
                一時保存
              </Button>
            </div>
          </Box>
          {eventYoyakuMoshikomi && (
            <DataTable
              columns={columns}
              rows={filteredRows}
              tableProps={{
                sx: { border: '1px solid #DDDDDD', minWidth: 650 },
              }}
              headSx={{ backgroundColor: '#F7F7F7' }}
              cellSx={{
                borderTop: '1px solid #DDDDDD',
                padding: '10px 16px',
              }}
            />
          )}
        </>
      )}
    </MainContainer>
  );
};

export default EventDetailPage;