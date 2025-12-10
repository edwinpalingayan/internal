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

import { post } from '@/services/apiService';

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
dayjs.tz.setDefault('Asia/Tokyo');

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

  const locState = React.useMemo(() => (location.state ?? {}) as Record<string, unknown>, [location.state]);

  const [seededEvent, setSeededEvent] = React.useState<EventTtEvent | undefined>(() => {
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
  });

  React.useEffect(() => {
    if (locState && (locState.eventId || locState.eventId === 0)) {
      setSeededEvent({
        EVENT_ID: String(locState.eventId),
        EVENT_MEI: (locState.eventName as string) ?? '',
        YOYAKU_KIGEN: (locState.reservationDeadline as string) ?? '',
        QUALTRICS_URL: (locState.qualtricsUrl as string) ?? '',
        URL: (locState.url as string) ?? '',
        KAISAI_KO_MEI: (locState.locationName as string) ?? '',
        EVENT_KBN_MEI: (locState.eventTypeName as string) ?? '',
      } as unknown as EventTtEvent);
    }
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
    patchTtEventFailed: false,
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
      message: '申込情報の一時保存に失敗しました',
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
    {
      key: 'patchTtEventFailed',
      active: validation.patchTtEventFailed,
      message: 'イベント情報の更新に失敗しました。',
      severity: 'error' as const,
    },
  ];

  const [gmsValues, setGmsValues] = React.useState<Record<string, string>>({});

  const [priorityValues, setPriorityValues] = React.useState<Record<number, string>>({});

  React.useEffect(() => {
    if (!eventYoyakuMoshikomi?.data) return;
    const map: Record<number, string> = {};
    eventYoyakuMoshikomi.data.forEach((r) => {
      map[r.ID] = String(r.PRIORITY);
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const normalizeEventShape = (ev: any): EventTtEvent => {
    if (!ev) return ev;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const e = { ...ev } as any;
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

  const inflightEventFetches = React.useMemo(() => new Map<string, Promise<EventTtEvent | undefined>>(), []);

  const fetchEventById = React.useCallback(async (id?: string) => {
    if (!id) return undefined;

    if (inflightEventFetches.has(id)) {
      return inflightEventFetches.get(id);
    }

    const promise = (async () => {
      try {
        try {
          const res = await post<GetEventTtEventResponse>('/api/ocrs_f/get_event_tt_event', { event_id: id });
          if (res) {
            if (res.data) {
              if (Array.isArray(res.data)) {
                const found = res.data.find((ev: EventTtEvent) => String(ev.EVENT_ID) === String(id));
                if (found) return normalizeEventShape(found);
              } else {
                return normalizeEventShape(res.data);
              }
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((res as any).EVENT_ID) return normalizeEventShape(res);
          }
        } catch (err) {
          console.warn('single-event POST failed, falling back to list', err);
        }
      } catch (err) {
        console.error('fetchEventById unexpected error', err);
      }
      return undefined;
    })();

    inflightEventFetches.set(id, promise);

    promise.finally(() => inflightEventFetches.delete(id));

    return promise;
  }, [inflightEventFetches]);

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
        // TODO: 後で削除する。デバッグ: 実際に受信した内容を確認
        console.log('fetched event (normalized):', fetched);
        setEventDetail(fetched);
      } else {
        if (!eventDetail) {
            console.warn('イベントが見つかりませんでした。ID:', eventId);
        }
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  React.useEffect(() => {
    if (!eventDetail) return;

    const serverQual = eventDetail.QUALTRICS_URL ?? '';
    if (serverQual !== qualtricsUrl) {
      setQualtricsUrl(serverQual);
    }

    const parsed = parseToDayjs(eventDetail.YOYAKU_KIGEN);

    if (parsed) {
      if (!yoyakuKigen || !parsed.isSame(yoyakuKigen, 'day')) {
        setYoyakuKigen(parsed);
      }
    } else {
      if (!seededEvent) {
        setYoyakuKigen(null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventDetail]);


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

  // Salesforce link
  const handleSalesforceLink = async () => {
  const baseUrl = 'https://dev-ocrs.globis.ac.jp';
  const apiEndpoint = '/api/ocrs_f/post_kamoku_reserve_status';
  const url = `${baseUrl}${apiEndpoint}`;

  const token = 'QXBwX0E1OSw0NDdiNzM1ZGI4NDlhNjZmNzA4YmFlZjg3MDkzNGU0ZTQ0MjQzMzZkMjE1NTU1N2M4M2JiMmQ3YjRlNmEwMTI0';

  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${token}`,
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
    const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload) });

    if (!res.ok) {
      const text = await res.text().catch(() => null);
      console.error('post_kamoku_reserve_status non-ok response', res.status, text);
      throw new Error(`Request failed: ${res.status}`);
    }

    const data = await res.json().catch(async () => {
      const txt = await res.text();
      return txt;
    });

    console.log('post_kamoku_reserve_status response (parsed):', data);
    return data;
  } catch (err) {
    console.error('salesforce link failed', err);
    throw err;
  }
};

  // GMSDB integration
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
    const GMSDBPayload = {
      gmsKokyakuId: '1100417626',
      eventCd: 'E-0000017213',
      syosekiSoufusakiYubinNo: '101-0001',
      syosekiSoufusakiJusyo: '東京都千代田区XXXXXXXX',
      syosekiSoufusakiTelNo: '090-1111-2222',
      yoyakuMoshikomiKbn: '02',
      yoyakuKijitsu: '2025-10-10',
    };
    try {
      const resp = await fetch(url, { method: 'POST', headers, body: JSON.stringify(GMSDBPayload) });
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
      const resp = await post('/api/ocrs_f/patch_tt_event', payload);

      setValidation((prev) => ({ ...prev, patchTtEventUpdated: true }));
      return resp;
    } catch (error) {
      console.error('patch_tt_event failed:', error);
      setValidation((prev) => ({ ...prev, patchTtEventFailed: true }));
      throw error;
    }
  };

  const handleTemporarySave = async () => {
    setValidation({
      hasEmptyGmsId: false,
      patchTtReservationApplicationUpdateFailed: false,
      gmsdbIntegrationCompleted: false,
      schoolDbIntegrationFailed: false,
      yoyakuMoshikomiUpdateCompleted: false,
      rowDataIsEmpty: false,
      patchTtEventUpdated: false,
      patchTtEventFailed: false,
    });

    if (!eventYoyakuMoshikomi?.data) {
      // データがない場合は処理しない
      setValidation((prev) => ({ ...prev, rowDataIsEmpty: true }));
      return;
    }

    // patch_tt_yoyaku_moshikomiを全データ分実施
    try {
      const targetEventId =
        eventId || (eventYoyakuMoshikomi.data.length > 0 ? String(eventYoyakuMoshikomi.data[0].EVENT_ID) : '');

      // 修正: タイムゾーンのシフトを回避
      const newYoyakuIso = yoyakuKigen ? yoyakuKigen.format('YYYY-MM-DD') : undefined;

      await patchTtEvent(targetEventId, newYoyakuIso, qualtricsUrl ?? undefined, appPrefix);

      setEventDetail((prev) =>
        prev
          ? {
              ...prev,
              QUALTRICS_URL: qualtricsUrl ?? prev.QUALTRICS_URL,
              YOYAKU_KIGEN: newYoyakuIso ?? prev.YOYAKU_KIGEN,
            }
          : prev,
      );

      const refreshed = await fetchEventById(targetEventId);
      if (refreshed) setEventDetail(refreshed);

      const requests = eventYoyakuMoshikomi.data.map((row) => {

        const idStr = String(row.ID ?? '');
        const eventIdStr = String(row.EVENT_ID ?? '');
        const classCdStr = String(row.CLASS_CD ?? '');
        // Build priority as string (from priorityValues string map)
        const priorityStr = String(priorityValues[row.ID] ?? String(row.PRIORITY ?? '')).slice(0, 10);

        const rawEdited = gmsValues[String(row.ID)];
        const rawOriginal = row.GMS_KOKYAKU_ID ?? '';
        const editedGms = rawEdited !== undefined ? rawEdited : rawOriginal;
        const trimmedGms = String(editedGms ?? '').trim().slice(0, 10);

        const koshinId = String(appPrefix ?? '').slice(0, 30);

        // バックエンドの制限に対して長さを検証してから送信する。
        const errs: string[] = [];
        if (idStr.length === 0) errs.push(`IDが空です: ${JSON.stringify(row)}`);
        if (idStr.length !== 10) errs.push(`IDは10文字である必要があります (${idStr.length}文字): ${idStr}`);
        if (eventIdStr.length !== 12) errs.push(`event_idは12文字である必要があります (${eventIdStr.length}文字): ${eventIdStr}`);
        if (classCdStr.length !== 10) errs.push(`class_cdは10文字である必要があります (${classCdStr.length}文字): ${classCdStr}`);
        if (priorityStr.length !== 10) errs.push(`priorityは10文字である必要があります (${priorityStr.length}文字): ${priorityStr}`);
        if (trimmedGms.length !== 10) errs.push(`gms_kokyaku_idは10文字である必要があります (${trimmedGms.length}文字): ${trimmedGms}`);
        if (koshinId.length !== 30) errs.push(`koshin_idは30文字である必要があります (${koshinId.length}文字)`);

        if (errs.length > 0) {
          return Promise.reject(new Error(`Validation failed for id=${idStr}: ${errs.join('; ')}`));
        }

        const payload: Record<string, string> = {
          id: idStr,
          event_id: eventIdStr,
          class_cd: classCdStr,
          priority: priorityStr,
          gms_kokyaku_id: trimmedGms,
          koshin_id: koshinId,
        };

        console.log('patch payload for id=', idStr, payload);

        return post('/api/ocrs_f/patch_tt_yoyaku_moshikomi', payload);
      });

      const results = await Promise.allSettled(requests);

      const failed: Array<{ index: number; reason: any }> = [];
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          console.error('patch failed for row index', idx, 'error:', r.reason);
          failed.push({ index: idx, reason: r.reason });
        } else {
          console.log('patch fulfilled for row index', idx, 'value:', r.value);
        }
      });

      if (failed.length > 0) {
        setValidation((prev) => ({ ...prev, patchTtReservationApplicationUpdateFailed: true }));
        console.warn('Some updates failed:', failed);
      } else {
        setValidation((prev) => ({ ...prev, yoyakuMoshikomiUpdateCompleted: true }));
      }
    } catch (err) {
      console.error('temporary save failed (outer):', err);
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
        const current = priorityValues[row.ID] ?? String(row.PRIORITY);

        if (isUnlinked) {
          return (
            <TextField
              size="small"
              variant="outlined"
              type="number"
              value={current}
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 2);
                setPriorityValues((prev) => ({ ...prev, [row.ID]: digits }));
                console.log('priority onChange', row.ID, digits);
              }}
              inputProps={{
                style: { fontSize: '0.875rem' },
                inputMode: 'numeric',
                pattern: '[0-9]*',
                maxLength: 2,
              }}
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
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                setGmsValues((prev) => ({ ...prev, [String(row.ID)]: digits }));
              }}
              inputProps={{
                style: { fontSize: '0.875rem' },
                inputMode: 'numeric',
                pattern: '[0-9]*',
                maxLength: 10,
              }}
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