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
  TextField,
} from '@mui/material';

import LinkIcon from '@mui/icons-material/Link';

import dayjs, { Dayjs } from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import QRCode from 'react-qr-code';

import MainContainer from '@/layouts/MainLayout/MainLayout';

import { post, get } from '@/services/apiService';

import type { ColumnConfig } from '@/components/SchoolClassDetailsTable';
import type { EventTtEvent, GetEventTtEventResponse } from '@/types/EventTtEventResponse';
import type {
  GetEventTtYoyakuMoshikomiResponse,
  YoyakuMoshikomiData,
} from '@/types/EventTYoyakuMoshikomiResponse';

import 'dayjs/locale/ja';

import { API_APP_KEY } from '@/utils/config';
import { CustomAlert, type NotificationLists } from '@/components/CustomAlert';

import { CustomDatePicker } from '@/components/CustomDatePicker';

const appPrefix = API_APP_KEY;


dayjs.locale('ja');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

const parseToDayjs = (value: unknown): Dayjs | null => {
  if (value == null) return null;
  const s = String(value).trim();

  if (s === '' || s === '0000-00-00' || s === '0000-00-00 00:00:00') return null;

  if (/^\d+$/.test(s)) {
    const n = Number(s);
    const dNum = dayjs.tz(n, 'Asia/Tokyo');
    if (dNum.isValid()) return dNum;
  }

  const tryTz = dayjs.tz(s, 'Asia/Tokyo');
  if (tryTz.isValid()) return tryTz;

  const formats = [
    'YYYY-MM-DDTHH:mm:ssZ',
    'YYYY-MM-DDTHH:mm:ss',
    'YYYY-MM-DD HH:mm:ss',
    'YYYY-MM-DD',
    'YYYY/MM/DD',
    'MM/DD/YYYY',
    'YYYYMMDD',
  ];
  for (const fmt of formats) {
    const d = dayjs(s, fmt, true); // strict parse
    if (d.isValid()) {
      return dayjs.tz(d.format(), 'Asia/Tokyo');
    }
  }

  const dLoose = dayjs(s);
  if (dLoose.isValid()) return dayjs.tz(dLoose.format(), 'Asia/Tokyo');

  return null;
}

const DateCell: React.FC<{ iso?: string | null }> = ({ iso }) =>
  iso ? <>{dayjs(iso).format('YYYY/M/D')}</> : <>-</>;

const TimeCell: React.FC<{ iso?: string | null }> = ({ iso }) =>
  iso ? <>{dayjs(iso).format('HH:mm')}</> : <>-</>;

/* --- Generic DataTable --- */
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
                            try {
                              return JSON.stringify(value ?? '');
                            } catch {
                              return String(value ?? '');
                            }
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
/* --- EventDetailPage (version 5, improved YOYAKU_KIGEN handling) --- */
const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  // APIレスポンス保持
  const [eventYoyakuMoshikomi, setEventYoyakuMoshikomi] =
    React.useState<GetEventTtYoyakuMoshikomiResponse | null>(null);

  // 未連携者フィルタ state (default: enabled/checked)
  const [filterUnlinked, setFilterUnlinked] = React.useState(true);

  // Try to seed from compact location.state (sent by EventDateSelector).
  // This gives instant UI while we fetch authoritative data.
  const locState = React.useMemo(() => (location.state ?? {}) as Record<string, unknown>, [location.state]);
  const seededEvent: EventTtEvent | undefined = React.useMemo(() => {
    if (locState && (locState.eventId || locState.eventId === 0)) {
      return {
        EVENT_ID: String(locState.eventId),
        EVENT_MEI: (locState.eventName as string) ?? '',
        YOYAKU_KIGEN: (locState.reservationDeadline as string) ?? '',
        QUALTRICS_URL: (locState.qualtricsUrl as string) ?? '',
        URL: (locState.url as string) ?? '',
        KAISAI_KO_MEI: (locState.locationName as string) ?? '',
        EVENT_KBN_MEI: (locState.eventTypeName as string) ?? '',
      } as unknown as EventTtEvent;
    }
    return undefined;
  }, [locState]);

  const [eventDetail, setEventDetail] = React.useState<EventTtEvent | undefined>(() => seededEvent);
  const [loading, setLoading] = React.useState(true);

  // 入力にバインドされた編集可能なフィールド:
  const [qualtricsUrl, setQualtricsUrl] = React.useState<string>(() => (locState.qualtricsUrl as string) ?? '');
  const [yoyakuKigen, setYoyakuKigen] = React.useState<Dayjs | null>(() => {
    const seed = (locState.reservationDeadline as string) ?? (seededEvent?.YOYAKU_KIGEN ?? undefined);
    return seed ? parseToDayjs(seed) : null;
  });

  // バリデーション / 通知
  const [validation, setValidation] = React.useState({
    hasEmptyGmsId: false,
    patchTtReservationApplicationUpdateFailed: false,
    gmsdbIntegrationCompleted: false,
    schoolDbIntegrationFailed: false,
    yoyakuMoshikomiUpdateCompleted: false,
    rowDataIsEmpty: false,
    patchTtEventUpdated: false,
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
    {
      key: 'yoyakuMoshikomiUpdateCompleted',
      active: validation.yoyakuMoshikomiUpdateCompleted,
      message: '一時保存しました。',
      severity: 'success' as const,
    },
    {
      key: 'rowDataIsEmpty',
      active: validation.rowDataIsEmpty,
      message: 'データがありません。',
      severity: 'error' as const,
    },
    {
      key: 'patchTtEventUpdated',
      active: validation.patchTtEventUpdated,
      message: 'イベント情報を更新しました。',
      severity: 'success' as const,
    },
  ];

  const [gmsValues, setGmsValues] = React.useState<Record<string, string>>({});

  const [priorityValues, setPriorityValues] = React.useState<Record<number, number>>({});

  React.useEffect(() => {
    if (!eventYoyakuMoshikomi?.data) return;
    const map: Record<number, number> = {};
    eventYoyakuMoshikomi.data.forEach((r) => {
      map[r.ID] = r.PRIORITY;
    });
    setPriorityValues(map);
  }, [eventYoyakuMoshikomi]);

  React.useEffect(() => {
    if (!eventYoyakuMoshikomi?.data) return;
    const map: Record<string, string> = {};
    eventYoyakuMoshikomi.data.forEach((r) => {
      map[String(r.ID)] = r.GMS_KOKYAKU_ID ?? '';
    });
    setGmsValues(map);
  }, [eventYoyakuMoshikomi]);

  // NEW: normalizer to map alternate field names to YOYAKU_KIGEN if server uses different key
  const normalizeEventShape = (ev: any): EventTtEvent => {
    if (!ev) return ev;
    const e = { ...ev } as any;
    // if server uses different field names, map them here:
    const altCandidates = [
      'YOYAKU_KIGEN',
      'reservationDeadline',
      'reservation_deadline',
      'yoyaku_kigen',
      'YOYAKU_KIGEN_DATE',
      'YOYAKU_KIGEN_AT',
      'RESERVATION_DEADLINE',
    ];
    if (e.YOYAKU_KIGEN == null) {
      for (const k of altCandidates) {
        if (e[k] != null) {
          e.YOYAKU_KIGEN = e[k];
          break;
        }
      }
    }
    return e as EventTtEvent;
  }

  // Fetch helper: try single-event POST (common), fallback to list
  const fetchEventById = React.useCallback(async (id?: string) => {
    if (!id) return undefined;
    try {
      try {
        const res = await post<GetEventTtEventResponse>('/api/ocrs_f/get_event_tt_event', { event_id: id });
        // DEBUG: log full response shape to help diagnose missing fields
        console.log('get_event_tt_event response:', res);
        if (res) {
          if (res.data) {
            if (Array.isArray(res.data)) {
              const found = res.data.find((ev: EventTtEvent) => String(ev.EVENT_ID) === String(id));
              if (found) return normalizeEventShape(found);
            } else {
              return normalizeEventShape(res.data);
            }
          }
          if ((res as any).EVENT_ID) return normalizeEventShape(res);
        }
      } catch (err) {
        // ignore and try list fallback
        console.warn('single-event POST failed, falling back to list', err);
      }

      // fallback: list
      try {
        const list = await get<GetEventTtEventResponse>('/api/ocrs_f/get_event_tt_event_list');
        console.log('get_event_tt_event_list response:', list);
        if (list?.data && Array.isArray(list.data)) {
          const found = list.data.find((ev: EventTtEvent) => String(ev.EVENT_ID) === String(id));
          if (found) return normalizeEventShape(found);
        } else if (Array.isArray(list)) {
          const found2 = (list as EventTtEvent[]).find((ev) => String(ev.EVENT_ID) === String(id));
          if (found2) return normalizeEventShape(found2);
        }
      } catch (err) {
        // give up
        console.warn('event list fetch failed', err);
      }
    } catch (err) {
      console.error('fetchEventById unexpected error', err);
    }
    return undefined;
  }, []);

  // ALWAYS fetch authoritative event data on mount (or when eventId changes).
  // This guarantees fresh qualtricsUrl / yoyakuKigen after a full reload.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!eventId) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const fetched = await fetchEventById(String(eventId));
      if (cancelled) return;
      if (fetched) {
        // DEBUG: inspect what we actually received
        console.log('fetched event (normalized):', fetched);
        setEventDetail(fetched);
      } else {
        // keep seeded eventDetail (if any) for optimistic UI
        if (!eventDetail) {
          console.warn('Event not found for id', eventId);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]); // intentionally only depend on eventId

  // When authoritative eventDetail changes, update editable inputs but do not clobber user edits.
  React.useEffect(() => {
    if (!eventDetail) return;

    // debug logging — remove in production
    console.log('Fetched eventDetail.YOYAKU_KIGEN:', eventDetail.YOYAKU_KIGEN);

    const serverQual = eventDetail.QUALTRICS_URL ?? '';
    if (serverQual !== qualtricsUrl) {
      setQualtricsUrl(serverQual);
    }

    const parsed = parseToDayjs(eventDetail.YOYAKU_KIGEN);
    console.log('Parsed YOYAKU_KIGEN ->', parsed ? parsed.format() : parsed);

    if (parsed) {
      // If the editable state is null or not the same day, update it.
      if (!yoyakuKigen || !parsed.isSame(yoyakuKigen, 'day')) {
        setYoyakuKigen(parsed);
      }
    } else {
      // server has no date: clear only if there is no meaningful seeded value
      if (!seededEvent) {
        setYoyakuKigen(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventDetail]);

  // Fetch reservation rows (initial)
  const hasFetchedReservations = React.useRef(false);
  React.useEffect(() => {
    if (hasFetchedReservations.current) return;
    hasFetchedReservations.current = true;
    if (!eventId) return;
    const fetchData = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 250));
        const res = await post<GetEventTtYoyakuMoshikomiResponse>(
          '/api/ocrs_f/get_event_tt_yoyaku_moshikomi',
          { event_id: eventId },
        );
        setEventYoyakuMoshikomi(res);
      } catch (error) {
        console.error('get_event_tt_yoyaku_moshikomi failed', error);
      }
    };
    fetchData();
  }, [eventId]);

  // Salesforce link (unchanged)
  const handleSalesforceLink = async () => {
    try {
      await post('https://dev-ocrs.intranet.globis.ac.jp/web/event/' + eventId);
    } catch (err) {
      console.error('salesforce link failed', err);
    }
  };

  // GMSDB integration (unchanged)
  const handleGmsdbLink = async () => {
    if (!eventYoyakuMoshikomi?.data) return;
    const baseUrl = 'https://mnt-vc.globis.ac.jp';
    const apiEndpoint = '/api/ext/v1/updateKamokuReserveStatus';
    const url = `${baseUrl}${apiEndpoint}`;
    const headers = {
      'Content-Type': 'application/json; charset=UTF-8',
      Accept: 'application/json',
      authorizationkey: 'GLOBIS_REST_HANDLER',
    };
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
      const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!resp.ok) {
        setValidation((prev) => ({ ...prev, schoolDbIntegrationFailed: true }));
        return;
      }
      setValidation((prev) => ({ ...prev, gmsdbIntegrationCompleted: true }));
    } catch (err) {
      console.error('GMSDB integration error', err);
      setValidation((prev) => ({ ...prev, schoolDbIntegrationFailed: true }));
    }
  };

  // patch_tt_event
  const patchTtEvent = async (
    event_id: string,
    yoyaku_kigen: string | undefined,
    qualtrics_url: string | undefined,
    koshin_id: string,
  ) => {
    const payload = { event_id, yoyaku_kigen, qualtrics_url, koshin_id };
    try {
      console.debug('patch_tt_event payload:', payload);
      const resp = await post('/api/ocrs_f/patch_tt_event', payload);

      // log server response (inspect for warnings/errors even when status=200)
      console.debug('patch_tt_event response:', resp);

      setValidation((prev) => ({ ...prev, patchTtEventUpdated: true }));

      return resp;
    } catch (error) {
      console.error('patch_tt_event failed:', error);
      throw error;
    }
  };

  // Temporary save: patch event-level fields then patch rows
  const handleTemporarySave = async () => {
    if (!eventYoyakuMoshikomi?.data) {
    // データがない場合は処理しない
      setValidation((prev) => ({ ...prev, rowDataIsEmpty: true }));
      return;
    }

    // patch_tt_yoyaku_moshikomiを全データ分実施
    try {
      const targetEventId =
        eventId || (eventYoyakuMoshikomi.data.length > 0 ? String(eventYoyakuMoshikomi.data[0].EVENT_ID) : '');

      // Build the ISO string we want to persist / show optimistically
      const newYoyakuIso = yoyakuKigen ? yoyakuKigen.toISOString() : undefined;

      // 1) Send patch
      await patchTtEvent(targetEventId, newYoyakuIso, qualtricsUrl ?? undefined, appPrefix);

      // 2) Optimistic update: reflect the patched value in UI immediately
      setEventDetail((prev) =>
        prev
          ? {
              ...prev,
              QUALTRICS_URL: qualtricsUrl ?? prev.QUALTRICS_URL,
              // Use the exact ISO string we sent to the server so UI reflects the same value
              YOYAKU_KIGEN: newYoyakuIso ?? prev.YOYAKU_KIGEN,
            }
          : prev,
      );

      // 3) After optimistic update, try to re-fetch authoritative event detail.
      const refreshed = await fetchEventById(targetEventId);
      if (refreshed) {
        // If server returns something (whether updated or not), prefer server authoritative record
        setEventDetail(refreshed);
      }

      // patch reservation rows (existing behavior)
      await Promise.all(
        eventYoyakuMoshikomi.data.map((row) => {
          const idStr = String(row.ID);
          const priorityNum = priorityValues[row.ID] ?? row.PRIORITY;
          const priorityStr = String(priorityNum);
          const rawEdited = gmsValues[String(row.ID)];
          const rawOriginal = row.GMS_KOKYAKU_ID ?? '';
          const editedGms = rawEdited !== undefined ? rawEdited : rawOriginal;
          const trimmedGms = String(editedGms).trim();
          const gmsPayloadValue = trimmedGms === '' ? null : trimmedGms;
          const payload: Record<string, unknown> = {
            id: idStr,
            event_id: row.EVENT_ID,
            class_cd: row.CLASS_CD,
            priority: priorityStr,
            gms_kokyaku_id: gmsPayloadValue,
            koshin_id: appPrefix,
          };
          return post('/api/ocrs_f/patch_tt_yoyaku_moshikomi', payload);
        }),
      );

      setValidation((prev) => ({ ...prev, yoyakuMoshikomiUpdateCompleted: true }));
    } catch (err) {
      console.error('temporary save failed:', err);
      setValidation((prev) => ({ ...prev, patchTtReservationApplicationUpdateFailed: true }));
    }
  };

  // --- 情報表示リスト定義 (柔軟にKey/Label/値/カスタム表示も可) ---
  const columns: Array<ColumnConfig<YoyakuMoshikomiData>> = [
    { label: 'メールアドレス', value: 'EMAIL', sx: { width: 300 } },
    { label: '氏名', value: 'SHIMEI', sx: { width: 150 } },
    { label: 'クラスコード', value: 'CLASS_CD', sx: { width: 120 } },
    { label: '申込クラス', value: 'CLASS_HYOJI', sx: { width: 250 } },
    {
      label: '優先度',
      value: 'PRIORITY',
      align: 'center',
      sx: { width: 100 },
      render: (row: YoyakuMoshikomiData) => {
        const isUnlinked =
          row.RENKEI_ZUMI_FLG === '0' || Number(row.RENKEI_ZUMI_FLG) === 0 || row.RENKEI_ZUMI_FLG == null;
        const current = priorityValues[row.ID] ?? row.PRIORITY;

        if (isUnlinked) {
          return (
            <TextField
              size="small"
              variant="outlined"
              type="number"
              value={current}
              onChange={(e) =>
                setPriorityValues((prev) => ({ ...prev, [row.ID]: Number(e.target.value) }))
              }
              inputProps={{ style: { fontSize: '0.875rem' }, min: 1 }}
            />
          );
        }
        return row.PRIORITY;
      },
    },
    { label: 'WTGフラグ', value: 'WAITING_FLG', align: 'center', sx: { width: 120 } },
    {
      label: 'GMS顧客番号',
      align: 'center',
      sx: { width: 250 },
      render: (row: YoyakuMoshikomiData) => {
        const isUnlinked =
          row.RENKEI_ZUMI_FLG === '0' || Number(row.RENKEI_ZUMI_FLG) === 0 || row.RENKEI_ZUMI_FLG == null;
        const current = gmsValues[String(row.ID)] ?? row.GMS_KOKYAKU_ID ?? '';

        if (isUnlinked) {
          return (
            <TextField
              size="small"
              variant="outlined"
              value={current}
              onChange={(e) => setGmsValues((prev) => ({ ...prev, [String(row.ID)]: e.target.value }))}
              inputProps={{ style: { fontSize: '0.875rem' } }}
            />
          );
        }
        return row.GMS_KOKYAKU_ID ?? '';
      },
    },
  ];

  // 未連携者フィルタの適用
  const filteredRows =
    eventYoyakuMoshikomi?.data?.filter((row) => (filterUnlinked ? Number(row.RENKEI_ZUMI_FLG) !== 1 : true)) ??
    [];

  // イベント情報リスト定義 (QUALTRICS_URLの編集可能およびYOYAKU_KIGENの日付ピッカーをレンダリング)
  const eventInfoList = [
    {
      label: '開催日',
      value: eventDetail?.EVENT_START_TIME ? (
        <>
          <DateCell iso={eventDetail.EVENT_START_TIME} />
          <Typography component="span" sx={{ marginLeft: '10px', fontSize: '0.875rem' }}>
            <TimeCell iso={eventDetail.EVENT_START_TIME} />
          </Typography>
        </>
      ) : (
        '-'
      ),
    },
    { label: '開催校', value: eventDetail?.KAISAI_KO_MEI ?? '-' },
    { label: 'イベント区分', value: eventDetail?.EVENT_KBN_MEI ?? '-' },
    { label: 'イベント名', value: eventDetail?.EVENT_MEI ?? '-' },
    {
      label: 'アンケートURL',
      value: (
        <TextField
          size="small"
          variant="outlined"
          fullWidth
          value={qualtricsUrl}
          onChange={(e) => setQualtricsUrl(e.target.value)}
          placeholder="アンケートURLを入力してください"
        />
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
    {
      label: '予約期日',
      value: (
        <Box sx={{ maxWidth: 300 }}>
          <CustomDatePicker width="100%" value={yoyakuKigen} setValue={setYoyakuKigen} />
        </Box>
      ),
    },
  ];

  return (
    <MainContainer boxSx={{ minWidth: { md: 980 }, minHeight: 500, marginTop: '5rem' }}>
      <Box sx={{ flexGrow: 1, margin: '20px 0' }}>
        <Grid container direction="row" spacing={2}>
          <Grid sx={{ flexGrow: 1 }}>
            <Box component="ul" sx={{ pl: 0, m: 0 }}>
              {eventInfoList.map((info, idx) => (
                <li key={info.label + idx} style={{ listStyle: 'none', margin: '0 0 16px 0', paddingLeft: 0 }}>
                  <Grid columns={11} container spacing={3} alignItems="center">
                    <Grid sx={{ textAlign: 'left' }}>
                      <Chip label={info.label} variant="outlined" sx={{ minWidth: '108px' }} />
                    </Grid>
                    <Grid sx={{ textAlign: 'left', flex: 1 }}>
                      {info.value}
                    </Grid>
                  </Grid>
                </li>
              ))}
            </Box>
          </Grid>

          <Grid sx={{ flexGrow: 1 }}>
            <Grid container justifyContent="flex-start" alignItems="flex-end" flexDirection="column" spacing={2}>
              <Grid>
                <Chip label="URL" variant="outlined" sx={{ minWidth: '108px', marginRight: '10px' }} />
                {eventDetail?.URL ? (
                  <Link href={eventDetail.URL} target="_blank" rel="noopener noreferrer">
                    {eventDetail.URL}
                  </Link>
                ) : (
                  '-'
                )}
              </Grid>
              <Grid>
                {eventDetail?.URL ? <QRCode value={eventDetail.URL} size={70} /> : <Typography color="error">URLがありません</Typography>}
              </Grid>
              <Grid sx={{ marginLeft: 'auto' }}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ padding: '4px 8px', height: '40px' }}
                  startIcon={<LinkIcon />}
                  onClick={handleSalesforceLink}
                >
                  セールスフォース連携
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <CircularProgress size={70} sx={{ display: 'block', margin: '4rem auto' }} />
      ) : (
        <>
          <CustomAlert notificationLists={notificationLists} sx={{ marginBottom: '20px' }} />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <Button variant="outlined" size="small" sx={{ padding: '4px 8px', height: '40px' }} startIcon={<LinkIcon />} onClick={handleGmsdbLink}>
                GMSDB連携
              </Button>
            </div>
            <div>
              <Checkbox checked={filterUnlinked} onChange={(e) => setFilterUnlinked(e.target.checked)} sx={{ display: 'inline-block', padding: 0, margin: '2px 8px 0 0' }} />
              未連携者に絞り込み
              <Button variant="contained" sx={{ minWidth: '140px', padding: '4px 12px', height: '40px', marginLeft: '40px' }} onClick={handleTemporarySave}>
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