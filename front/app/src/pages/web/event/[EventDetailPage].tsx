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

import { Link as LinkIcon, ExpandLessRounded as ExpandLessRoundedIcon, } from '@mui/icons-material';

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

import useMediaQuery from '@mui/material/useMediaQuery';

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


const isValidUrlRegex = (value: string): boolean => {
  const pattern = /^(https?:\/\/)[^\s/$.?#].[^\s]*$/i;
  return pattern.test(value);
};

const containsHiragana = (value: string): boolean => {
  const hiraganaRegex = /[\u3040-\u309F]/;
  return hiraganaRegex.test(value);
};

const containsKatakana = (value: string): boolean => {
  const katakanaRegex = /[\u30A0-\u30FF]/;
  return katakanaRegex.test(value);
};


/* --- Generic DataTable --- */
function DataTable<T extends object>({
  columns,
  rows,
  tableProps,
  headSx,
  cellSx,
}: {
  columns: Array<Omit<ColumnConfig<T>, 'label'> & { label: React.ReactNode }>;
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
const EventDetailPage: React.FC = () => {
  const { eventId } = useParams<{ eventId: string }>();
  const location = useLocation();
  const isMobile = useMediaQuery('(max-width:768px)');
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
    emptyGmsIdError: false,
    patchTtReservationApplicationUpdateFailed: false,
    gmsdbIntegrationCompleted: false,
    schoolDbIntegrationFailed: false,
    yoyakuMoshikomiUpdateCompleted: false,
    rowDataIsEmpty: false,
    patchTtEventUpdated: false,
    patchTtEventFailed: false,
    patchTtEventQualtricsUrlInvalid: false,
    waitingFlgInvalid: false,
    sameClassCdAndPriorityDuplicate: false,
    invalidPriorityValue: false,
    priorityValueDosesNotExist: false,
  });

  const notificationLists: NotificationLists[] = [
    {
      key: 'emptyGmsIdError',
      active: validation.emptyGmsIdError,
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
    {
      key: 'patchTtEventQualtricsUrlInvalid',
      active: validation.patchTtEventQualtricsUrlInvalid,
      message: 'アンケートURLの形式が正しくありません。',
      severity: 'error' as const,
    },
    {
      key: 'waitingFlgInvalid',
      active: validation.waitingFlgInvalid,
      message: 'WTGフラグに無効な値が含まれています。',
      severity: 'error' as const,
    },
    {
      key: 'sameClassCdAndPriorityDuplicate',
      active: validation.sameClassCdAndPriorityDuplicate,
      message: '同じクラスコードに対して重複する優先順位が存在します。',
      severity: 'error' as const,
    },
    {
      key: 'invalidPriorityValue',
      active: validation.invalidPriorityValue,
      message: '優先順位に無効な値が含まれています。',
      severity: 'error' as const,
    },
    {
      key: 'priorityValueDosesNotExist',
      active: validation.priorityValueDosesNotExist,
      message: '優先順位の値が同じクラスコード内で存在しません。',
      severity: 'error' as const,
    },
  ];

  const [gmsValues, setGmsValues] = React.useState<Record<string, string>>({});

  const [priorityValues, setPriorityValues] = React.useState<Record<number, string>>({});

  const initialPriorityRef = React.useRef<Record<number, number>>({});
  const initialWaitingRef = React.useRef<Record<number, boolean>>({});

  React.useEffect(() => {
    if (!eventYoyakuMoshikomi?.data) return;
    setPriorityValues((prev) => {
      const map: Record<number, string> = { ...prev };
      eventYoyakuMoshikomi.data.forEach((r) => {
        if (map[r.ID] === undefined) {
          map[r.ID] = String(r.PRIORITY);
        }
      });
      return map;
    });
  }, [eventYoyakuMoshikomi]);

  React.useEffect(() => {
    if (!eventYoyakuMoshikomi?.data) return;
    if (Object.keys(initialPriorityRef.current).length === 0) {
      const p: Record<number, number> = {};
      const w: Record<number, boolean> = {};
      eventYoyakuMoshikomi.data.forEach((r) => {
        p[r.ID] = Number(r.PRIORITY ?? 0);
        w[r.ID] = String(r.WAITING_FLG) === '1';
      });
      initialPriorityRef.current = p;
      initialWaitingRef.current = w;
    }
  }, [eventYoyakuMoshikomi]);

  React.useEffect(() => {
    if (!eventYoyakuMoshikomi?.data) return;
    setGmsValues((prev) => {
      const next: Record<string, string> = { ...prev };
      eventYoyakuMoshikomi.data.forEach((r) => {
        const id = String(r.ID);
        if (next[id] === undefined) {
          next[id] = r.GMS_KOKYAKU_ID ?? '';
        }
      });
      return next;
    });
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
    if (!eventYoyakuMoshikomi?.data || eventYoyakuMoshikomi.data.length === 0) {
      setValidation((prev) => ({ ...prev, rowDataIsEmpty: true }));
      return;
    }

    const handleTemporarySaveResult = await handleTemporarySave();
    if (!handleTemporarySaveResult) return;

    await new Promise((resolve) => setTimeout(resolve, 750));

    const valuesToSend = eventYoyakuMoshikomi.data.map((row) => {
      const idKey = String(row.ID);
      const rawEdited = gmsValues[idKey];
      const rawOriginal = row.GMS_KOKYAKU_ID ?? '';
      const editedGms = rawEdited !== undefined ? rawEdited : rawOriginal;
      const trimmedGms = String(editedGms ?? '').trim().slice(0, 10);

      return {
        event_id: String(row.EVENT_ID ?? eventId ?? '').slice(0, 12),
        gms_kokyaku_id: trimmedGms,
        koshin_id: String(appPrefix ?? '').slice(0, 30),
      };
    });

    const hasEmptyGmsId = valuesToSend.some((v) => v.gms_kokyaku_id === '' || v.gms_kokyaku_id == null);
    if (hasEmptyGmsId) {
      setValidation((prev) => ({ ...prev, emptyGmsIdError: true }));
      return;
    }

    try {
      const resp = await post('/api/ocrs_f/post_school_tt_moshikomi', valuesToSend);
      console.log('post_school_tt_moshikomi response:', resp);
      setValidation((prev) => ({ ...prev, gmsdbIntegrationCompleted: true, schoolDbIntegrationFailed: false }));
    } catch (error) {
      console.error('post_school_tt_moshikomi failed:', error);
      setValidation((prev) => ({ ...prev, schoolDbIntegrationFailed: true, gmsdbIntegrationCompleted: false }));
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


    // qualtrics_url が有効なURL形式でない場合、エラーを出す
    if (
      qualtrics_url &&
      (
        !isValidUrlRegex(qualtrics_url) ||
        containsHiragana(qualtrics_url) ||
        containsKatakana(qualtrics_url)
      )
    ) {
      setValidation((prev) => ({ ...prev, patchTtEventQualtricsUrlInvalid: true }));
      throw new Error('Invalid Qualtrics URL format');
    }

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

  const handleTemporarySave = async (): Promise<boolean> => {
    setValidation({
      emptyGmsIdError: false,
      patchTtReservationApplicationUpdateFailed: false,
      gmsdbIntegrationCompleted: false,
      schoolDbIntegrationFailed: false,
      yoyakuMoshikomiUpdateCompleted: false,
      rowDataIsEmpty: false,
      patchTtEventUpdated: false,
      patchTtEventFailed: false,
      patchTtEventQualtricsUrlInvalid: false,
      waitingFlgInvalid: false,
      sameClassCdAndPriorityDuplicate: false,
      invalidPriorityValue: false,
      priorityValueDosesNotExist: false,
    });

    if (!eventYoyakuMoshikomi?.data) {
      // データがない場合は処理しない
      setValidation((prev) => ({ ...prev, rowDataIsEmpty: true }));
      return false;
    }

    const baselinePriorityMap = new Map<string, Set<number>>();
    for (const r of eventYoyakuMoshikomi.data) {
      const classCd = String(r.CLASS_CD ?? '');
      const setForClass = baselinePriorityMap.get(classCd) ?? new Set<number>();
      setForClass.add(Number(r.PRIORITY ?? 0));
      baselinePriorityMap.set(classCd, setForClass);
    }

    const classPriorityMap = new Map<string, Set<number>>();
    for (const r of eventYoyakuMoshikomi.data) {
      const prStr = (priorityValues[r.ID] ?? String(r.PRIORITY ?? '')).trim();

      if (prStr === '' || !/^\d+$/.test(prStr)) {
        setValidation((prev) => ({ ...prev, invalidPriorityValue: true }));
        console.warn('Invalid priority detected for ID', r.ID, 'value:', prStr);
        return false;
      }

      const prNum = Number(prStr);
      const classCd = String(r.CLASS_CD ?? '');

      const setForClass = classPriorityMap.get(classCd) ?? new Set<number>();
      if (setForClass.has(prNum)) {
        // 同じクラスコードに対して重複する優先順位が存在します。
        setValidation((prev) => ({ ...prev, sameClassCdAndPriorityDuplicate: true }));
        console.warn('Duplicate priority detected for CLASS_CD', classCd, 'priority', prNum);
        return false;
      }
      setForClass.add(prNum);
      classPriorityMap.set(classCd, setForClass);
    }

    // patch_tt_yoyaku_moshikomiを全データ分実施
    try {
      const targetEventId =
        eventId || (eventYoyakuMoshikomi.data.length > 0 ? String(eventYoyakuMoshikomi.data[0].EVENT_ID) : '');

      // 修正: タイムゾーンのシフトを回避
      const newYoyakuIso = yoyakuKigen ? yoyakuKigen.format('YYYY-MM-DD') : undefined;

      await patchTtEvent(targetEventId, newYoyakuIso, qualtricsUrl ?? undefined, appPrefix);
      await new Promise((resolve) => setTimeout(resolve, 750));

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
        // 可能な限り ID は変更しない
        const idStr = row.ID;
        const eventIdStr = String(row.EVENT_ID ?? '');
        const classCdStr = String(row.CLASS_CD ?? '');
        const priority = Number(priorityValues[row.ID] ?? row.PRIORITY ?? 0);

        const rawEdited = gmsValues[String(row.ID)];
        const rawOriginal = row.GMS_KOKYAKU_ID ?? '';
        const editedGms = rawEdited !== undefined ? rawEdited : rawOriginal;
        const trimmedGms = String(editedGms ?? '').trim().slice(0, 10);

        const koshinId = String(appPrefix ?? '').slice(0, 30);

        if (String(row.WAITING_FLG) === '-') {
          setValidation((prev) => ({ ...prev, waitingFlgInvalid: true }));
          return Promise.reject(new Error(`Invalid WAITING_FLG '-' for id=${idStr}`));
        }

        const payload: Record<string, string | number> = {
          id: row.ID,
          event_id: eventIdStr,
          class_cd: classCdStr,
          priority: priority,
          gms_kokyaku_id: trimmedGms,
          koshin_id: koshinId,
        };

        return post('/api/ocrs_f/patch_tt_yoyaku_moshikomi', payload);
      });

      // 実行して結果を検証
      const results = await Promise.allSettled(requests);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const failed: Array<{ index: number; reason: any }> = [];
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          console.error('patch failed for row index', idx, 'error:', r.reason);
          failed.push({ index: idx, reason: r.reason });
        }
      });

      if (failed.length > 0) {
        setValidation((prev) => ({ ...prev, patchTtReservationApplicationUpdateFailed: true }));
        console.warn('Some updates failed:', failed);
        return false;
      } else {
        setValidation((prev) => ({ ...prev, yoyakuMoshikomiUpdateCompleted: true }));

        // サーバーのリストを更新して、UIに永続化された値を反映します。
        try {
          const refreshedRes = await post<GetEventTtYoyakuMoshikomiResponse>(
            '/api/ocrs_f/get_event_tt_yoyaku_moshikomi',
            { event_id: targetEventId },
          );
            // サーバーから取得した最新データで状態を更新
          setEventYoyakuMoshikomi(refreshedRes);
            // eventYoyakuMoshikomi から gmsValues マップを更新する useEffect
        } catch (err) {
          console.error('Failed to refresh reservation list after save', err);
        }
      }
      return true;
    } catch (err) {
      console.error('temporary save failed (outer):', err);
      setValidation((prev) => ({ ...prev, patchTtReservationApplicationUpdateFailed: true }));
      return false;
    }
  };

  const handlePriorityUpdate = (value: string, row: YoyakuMoshikomiData) => {
    const realTimePriorityValue = value.replace(/\D/g, '').slice(0, 2);

    setPriorityValues((prev) => ({ ...prev, [row.ID]: realTimePriorityValue }));

    setEventYoyakuMoshikomi((prev) => {
      if (!prev || !Array.isArray(prev.data)) return prev;

      const classCd = row.CLASS_CD;

      const waitingPriorities = new Set<string>(
        prev.data
          .filter((r) => r.CLASS_CD === classCd && String(r.WAITING_FLG) === '1')
          .map((r) => String(r.PRIORITY)),
      );

      const existingPriorities = new Set<string>(
        prev.data
          .filter((r) => r.CLASS_CD === classCd)
          .map((r) => String(r.PRIORITY)),
      );

      const newData = prev.data.map((r) => {
        if (r.ID !== row.ID) return r;

        const origPriorityBaseline = initialPriorityRef.current[row.ID];
        const origPriorityStr =
          origPriorityBaseline !== undefined ? String(origPriorityBaseline) : String(row.PRIORITY);

        const origWaitingBaseline =
          initialWaitingRef.current[row.ID] ?? (String(row.WAITING_FLG) === '1');
        const origWaitingFlgStr = origWaitingBaseline ? '1' : '0';

        // typed -> number (keep current if empty)
        const newPriorityNum = realTimePriorityValue === '' ? r.PRIORITY : Number(realTimePriorityValue);
        const newPriorityStr = String(newPriorityNum);

        const newRow = { ...r, PRIORITY: newPriorityNum };

        // PRIORITYが元の値から変更されていない場合、WAITING_FLGを維持する
        if (realTimePriorityValue === '' || !existingPriorities.has(newPriorityStr)) {
          newRow.WAITING_FLG = '-';
        // PRIORITYが元の値と同じなら、元のWAITING_FLGを維持
        } else if (newPriorityStr === origPriorityStr) {
          newRow.WAITING_FLG = origWaitingFlgStr;
        // 新しいPRIORITYが同一CLASS_CD内でWAITING_FLG='1'のPRIORITYと一致する場合、WAITING_FLGを'1'に設定
        } else if (waitingPriorities.has(newPriorityStr)) {
          newRow.WAITING_FLG = '1';
        } else {
          newRow.WAITING_FLG = '0';
        }

        return newRow;
      });

      return { ...prev, data: newData };
    });
  };

  const [sortBy, setSortBy] = React.useState<string | null>(null);
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc' | null>(null);

  const handleSortToggle = (key: string) => {
    if (sortBy !== key) {
      setSortBy(key);
      setSortDir('asc');
    } else {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    }
  };

  // --- 情報表示リスト定義 (柔軟にKey/Label/値/カスタム表示も可) ---

  // 未連携者フィルタの適用
  const filteredRows = React.useMemo(
    () =>
      eventYoyakuMoshikomi?.data?.filter((row) => (filterUnlinked ? Number(row.RENKEI_ZUMI_FLG) !== 1 : true)) ??
      [],
    [eventYoyakuMoshikomi?.data, filterUnlinked]
  );

  const getDisplayedGmsValue = React.useCallback((row: YoyakuMoshikomiData) => {
    return String(gmsValues[String(row.ID)] ?? row.GMS_KOKYAKU_ID ?? '');
  }, [gmsValues]);

  const sortedRows = React.useMemo(() => {
    const rows = [...filteredRows];
    if (!sortBy) return rows;

    if (sortBy === 'EMAIL') {
      rows.sort((a, b) => {
        const va = String((a as YoyakuMoshikomiData).EMAIL ?? '').toLowerCase();
        const vb = String((b as YoyakuMoshikomiData).EMAIL ?? '').toLowerCase();
        const cmp = va.localeCompare(vb, 'ja', { sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    } else if (sortBy === 'GMS_KOKYAKU_ID') {
      rows.sort((a, b) => {
        const sa = getDisplayedGmsValue(a);
        const sb = getDisplayedGmsValue(b);

        // extract digits for numeric comparison
        const da = sa.replace(/\D/g, '');
        const db = sb.replace(/\D/g, '');

        const aIsNum = da !== '';
        const bIsNum = db !== '';

        if (aIsNum && bIsNum) {
          const na = Number(da);
          const nb = Number(db);
          const cmp = na - nb;
          return sortDir === 'asc' ? cmp : -cmp;
        }

        // If one side is numeric and other not, put numeric before non-numeric when ascending
        if (aIsNum && !bIsNum) {
          return sortDir === 'asc' ? -1 : 1;
        }
        if (!aIsNum && bIsNum) {
          return sortDir === 'asc' ? 1 : -1;
        }

        const cmp = sa.localeCompare(sb, 'ja', { sensitivity: 'base' });
        return sortDir === 'asc' ? cmp : -cmp;
      });
    } else if (sortBy === 'CLASS_CD') {
      rows.sort((a, b) => {
        const ca = String(a.CLASS_CD ?? '');
        const cb = String(b.CLASS_CD ?? '');

        const da = ca.replace(/\D/g, '');
        const db = cb.replace(/\D/g, '');

        const aIsNum = da !== '';
        const bIsNum = db !== '';

        let cmp = 0;
        if (aIsNum && bIsNum) {
          cmp = Number(da) - Number(db);
        } else if (aIsNum && !bIsNum) {
          cmp = -1;
        } else if (!aIsNum && bIsNum) {
          cmp = 1;
        } else {
          cmp = ca.localeCompare(cb, 'ja', { sensitivity: 'base' });
        }

        if (cmp !== 0) {
          return sortDir === 'asc' ? cmp : -cmp;
        }

        const pa = Number(priorityValues[a.ID] ?? a.PRIORITY ?? 0);
        const pb = Number(priorityValues[b.ID] ?? b.PRIORITY ?? 0);
        if (pa !== pb) return pa - pb;

        const ida = Number(a.ID ?? 0);
        const idb = Number(b.ID ?? 0);
        return ida - idb;
      });
    }

    return rows;
  }, [filteredRows, sortBy, sortDir, priorityValues, getDisplayedGmsValue]);

  type ExtendedColumnConfig<T> = Omit<ColumnConfig<T>, 'label'> & {
    label: React.ReactNode;
  };
  const columns: Array<ExtendedColumnConfig<YoyakuMoshikomiData>> = [
    {
      label:(
        <Button
          variant="text"
          size="small"
          onClick={() => handleSortToggle('EMAIL')}
          sx={{ textTransform: 'none', padding: '0 8px', minWidth: 0, display: 'flex', alignItems: 'center' }}
        >
          メールアドレス
          <ExpandLessRoundedIcon
            sx={{
              fontSize: '20px',
              marginLeft: '4px',
              transform:
                sortBy === 'EMAIL'  && sortDir === null
                  ? 'rotate(0deg)'
                  : sortBy === 'EMAIL'  && sortDir === 'asc'
                  ? 'rotate(0deg)'
                  : 'rotate(180deg)',
              transition: 'transform 0.3s',
            }}
          />
        </Button>
      ),
      value: 'EMAIL',
      sx: { width: 300 },
    },
    { label: '氏名', value: 'SHIMEI', sx: { width: 150 } },
    {
      label: (
        <Button
          variant="text"
          size="small"
          onClick={() => handleSortToggle('CLASS_CD')}
          sx={{ textTransform: 'none', padding: '0 8px', minWidth: 0 }}
        >
          クラスコード
          <ExpandLessRoundedIcon
            sx={{
              fontSize: '20px',
              marginLeft: '4px',
              transform:
                sortBy === 'CLASS_CD'  && sortDir === null
                  ? 'rotate(0deg)'
                  : sortBy === 'CLASS_CD'  && sortDir === 'asc'
                  ? 'rotate(0deg)'
                  : 'rotate(180deg)',
              transition: 'transform 0.3s',
            }}
          />
        </Button>
      ),
      value: 'CLASS_CD',
      sx: { width: 150 },
    },
    { label: '申込クラス', value: 'CLASS_HYOJI', sx: { width: 250 } },
    {
      label: '優先度',
      value: 'PRIORITY',
      align: 'center',
      sx: { width: 100 },
      render: (row: YoyakuMoshikomiData) => {
        const isUnlinked =
          row.RENKEI_ZUMI_FLG === '0' || row.RENKEI_ZUMI_FLG == null;
        const originalPriorityValue = priorityValues[row.ID] ?? String(row.PRIORITY);

        if (isUnlinked) {
          return (
            <TextField
              size="small"
              variant="outlined"
              type="text"
              value={originalPriorityValue}
              onChange={(e) => handlePriorityUpdate(e.target.value, row)}
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
      // Make GMS顧客番号 header clickable to toggle numeric sort
      label: (
        <Button
          variant="text"
          size="small"
          onClick={() => handleSortToggle('GMS_KOKYAKU_ID')}
          sx={{ textTransform: 'none', padding: '0 8px', minWidth: 0 }}
        >
          GMS顧客番号
          <ExpandLessRoundedIcon
            sx={{
              fontSize: '20px',
              marginLeft: '4px',
              transform:
                sortBy === 'GMS_KOKYAKU_ID'  && sortDir === null
                  ? 'rotate(0deg)'
                  : sortBy === 'GMS_KOKYAKU_ID'  && sortDir === 'asc'
                  ? 'rotate(0deg)'
                  : 'rotate(180deg)',
              transition: 'transform 0.3s',
            }}
          />
        </Button>
      ),
      align: 'center',
      sx: { width: 250 },
      render: (row: YoyakuMoshikomiData) => {
        const isUnlinked =
          row.RENKEI_ZUMI_FLG === '0' || Number(row.RENKEI_ZUMI_FLG) === 0 || row.RENKEI_ZUMI_FLG == null;
        const originalGmsValues = gmsValues[String(row.ID)] ?? row.GMS_KOKYAKU_ID ?? '';

        if (isUnlinked) {
          return (
            <TextField
              size="small"
              variant="outlined"
              type="text"
              value={originalGmsValues}
              onChange={(e) => {
                const realTimeGmsValues = e.target.value.replace(/\D/g, '').slice(0, 10);

                // check if realTimeGmsValues has some empty value''
                setGmsValues((prev) => ({ ...prev, [String(row.ID)]: realTimeGmsValues }));
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
            <Grid container justifyContent="flex-start" alignItems={isMobile ? "center" : "flex-end"} flexDirection="column" spacing={2} gap={isMobile ? '20px': ''}>
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
                {eventDetail?.URL ? <QRCode value={eventDetail.URL} size={isMobile ? 140 : 70} /> : <Typography color="error">URLがありません</Typography>}
              </Grid>
              <Grid sx={{ width: isMobile ? '100%' : 'auto', marginLeft: 'auto' }}>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{ padding: '4px 8px', height: '40px', width: isMobile ? '100%' : 'auto' }}
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
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? '20px' : 0 }}>
            <Box sx={{ width: isMobile ? '100% !important' : 'auto'}}>
              <Button variant="outlined" size={!isMobile ? 'small' : 'large'} sx={{ width: isMobile ? '100% !important' : 'auto', padding: '4px 8px', height: '40px' }} startIcon={<LinkIcon />} onClick={handleGmsdbLink}>
                GMSDB連携
              </Button>
            </Box>
            <Box>
              <Checkbox checked={filterUnlinked} onChange={(e) => setFilterUnlinked(e.target.checked)} sx={{ display: 'inline-block', padding: 0, margin: '2px 8px 0 0' }} />
              未連携者に絞り込み
              <Button variant="contained" sx={{ minWidth: '140px', padding: '4px 12px', height: '40px', marginLeft: '40px' }} onClick={handleTemporarySave}>
                一時保存
              </Button>
            </Box>
          </Box>

          {eventYoyakuMoshikomi && (
            <DataTable
              columns={columns}
              rows={sortedRows}
              tableProps={{
                sx: { border: '1px solid #DDDDDD', minWidth: 650 },
              }}
              headSx={{ backgroundColor: '#F7F7F7' }}
              cellSx={{
                borderTop: '1px solid #DDDDDD',
                padding: '10px 8px',
              }}
            />
          )}
        </>
      )}
    </MainContainer>
  );
};

export default EventDetailPage;