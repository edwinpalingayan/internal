import * as React from 'react';
import { useEffect, useRef, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Checkbox,
  CircularProgress,
  FormControl,
  Grid,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Select,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import 'dayjs/locale/ja';

import MainContainer from '@/layouts/MainLayout/MainLayout';
import { CustomDatePicker } from '@/components/CustomDatePicker';
import { get } from '@/services/apiService';
import { URL_PREFIX } from '@/utils/config';
// import { validateEventPeriod } from '@/utils/validateEventPeriod';
import type { GetEventTtEventResponse, EventTtEvent } from '@/types/EventTtEventResponse';

// ---- Dayjs Setup ----
dayjs.locale('ja');
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault('Asia/Tokyo');

export const DateCell: React.FC<{ isoDateCellDate: string }> = ({ isoDateCellDate }) => {
  const d = dayjs.utc(isoDateCellDate).tz('Asia/Tokyo');
  const weekday = ['日', '月', '火', '水', '木', '金', '土'][d.day()];
  return (
    <>
      {d.format('YYYY/M/D')}（{weekday}）
    </>
  );
};

export const DurationCell: React.FC<{
  isoStartDurationCellDate: string;
  isoEndDurationCellDate: string;
}> = ({ isoStartDurationCellDate, isoEndDurationCellDate }) => {
  const start = dayjs.utc(isoStartDurationCellDate).tz('Asia/Tokyo');
  const end = dayjs.utc(isoEndDurationCellDate).tz('Asia/Tokyo');
  return (
    <>
      {start.format('HH:mm')} 〜 {end.format('HH:mm')}
    </>
  );
};

// ---- Filter Controls ----
type FilterOption = { label: string; value: string };
type FilterProps = {
  label: string;
  children: React.ReactNode;
};
const FilterRow: React.FC<FilterProps> = ({ label, children }) => (
  <Grid container size={{ lg: 4, xs: 8 }} columnSpacing={1}>
    <Grid size={{ md: 3, xs: 4 }} sx={{ textAlign: 'left', alignContent: 'center' }}>
      <Typography variant="body2">{label}</Typography>
    </Grid>
    <Grid size={'grow'}>{children}</Grid>
  </Grid>
);

type EventTypeCheckboxesProps = {
  options: FilterOption[];
  selected: string[];
  onChange: (value: string) => void;
  sx?: React.CSSProperties;
};
const EventTypeCheckboxes: React.FC<EventTypeCheckboxesProps> = ({
  options,
  selected,
  onChange,
  sx,
}) => (
  <Grid container spacing={1} sx={sx}>
    {[...options].reverse().map((option) => (
      <label key={option.value} style={{ marginRight: '1em' }}>
        <Checkbox
          checked={selected.includes(option.value)}
          onChange={() => onChange(option.value)}
          value={option.value}
          sx={{ padding: '9px 0', marginRight: '8px' }}
        />
        {option.label}
      </label>
    ))}
  </Grid>
);

type LocationSelectProps = {
  options: FilterOption[];
  selected: string | null;
  onChange: (event: SelectChangeEvent) => void;
};
const LocationSelect: React.FC<LocationSelectProps> = ({ options, selected, onChange }) => (
  <FormControl fullWidth>
    <Select
      value={selected || ''}
      onChange={onChange}
      displayEmpty
      inputProps={{ 'aria-label': 'Without label' }}
      sx={{ textAlign: 'left' }}
    >
      <MenuItem value="">
        <Typography component="span" sx={{ color: '#C4C4C4' }}>
          開催校を選択してください
        </Typography>
      </MenuItem>
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

// ---- Event Table ----
type EventsTableProps = {
  events: EventTtEvent[];
  onDetailClick?: (event: EventTtEvent) => void;
};
const EventsTable: React.FC<EventsTableProps> = ({ events, onDetailClick }) => (
  <TableContainer
    component={Paper}
    sx={{
      borderRadius: 0,
      boxShadow: 'none',
      borderTop: '1px solid #DDDDDD',
      borderRight: '1px solid #DDDDDD',
      borderBottom: 'none',
    }}
  >
    <Table
      sx={{
        minWidth: 650,
        '& .MuiTableCell-root': {
          borderLeft: '1px solid #DDDDDD',
        },
      }}
      aria-label="events table"
    >
      <TableHead>
        <TableRow sx={{ backgroundColor: '#F7F7F7' }}>
          <TableCell align="left" sx={{ width: '290px' }}>
            開催日
          </TableCell>
          <TableCell align="left" sx={{ width: '150px' }}>
            開催校
          </TableCell>
          <TableCell align="left" sx={{ width: '200px' }}>
            イベント区分
          </TableCell>
          <TableCell align="left" sx={{ width: 'auto' }}>
            イベント名
          </TableCell>
          <TableCell align="left"></TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {!events.length && (
          <TableRow>
            <TableCell colSpan={5} align="center">
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                イベントが見つかりませんでした
              </Typography>
            </TableCell>
          </TableRow>
        )}
        {events.map((event, idx) => (
          <TableRow key={idx}>
            {/* 開催日 */}
            <TableCell align="left">
              <DateCell isoDateCellDate={event.EVENT_START_TIME} />{' '}
              <DurationCell
                isoStartDurationCellDate={event.EVENT_START_TIME}
                isoEndDurationCellDate={event.EVENT_END_TIME}
              />
            </TableCell>
            {/* 開催校 */}
            <TableCell align="left">{event.KAISAI_KO_MEI}</TableCell>
            {/* イベント区分 */}
            <TableCell align="left">{event.EVENT_KBN_MEI}</TableCell>
            {/* イベント名 */}
            <TableCell align="left">{event.EVENT_MEI}</TableCell>
            {/* 詳細ボタン */}
            <TableCell align="right">
              <Button
                variant="outlined"
                sx={{ width: '60px', height: '30px' }}
                onClick={() => onDetailClick?.(event)}
              >
                詳細
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </TableContainer>
);

// ---- Main Component ----
export default function EventDateSelector() {
  const navigate = useNavigate();
  const hasFetched = useRef(false);
  const eventDetails = useRef<GetEventTtEventResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [selectedEventTypes, setSelectedEventTypes] = useState<string[]>([]);

  // イベント詳細を取得
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    (async () => {
      setTimeout(async () => {
        try {
          // ■イベント一覧取得
          // https://dev-ocrs.intranet.globis.ac.jp/api/ocrs_internal/get_event_tt_event_list
          const res = await get<GetEventTtEventResponse>('/api/ocrs_f/get_event_tt_event_list');
          eventDetails.current = res;
          setLoading(false);
        } catch (error) {
          console.error('API request failed:', error);
          setLoading(false);
        }
      }, 300);
    })();
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const data = useMemo(() => eventDetails.current?.data || [], [loading]);

  // Dynamic filter extraction
  const eventTypeOptions = useMemo<FilterOption[]>(
    () =>
      Array.from(new Set(data.map((event) => event.EVENT_KBN_MEI))).map((type) => ({
        label: type,
        value: type,
      })),
    [data],
  );

  const locationOptions = useMemo<FilterOption[]>(
    () =>
      Array.from(new Set(data.map((event) => event.KAISAI_KO_MEI))).map((name) => ({
        label: name,
        value: name,
      })),
    [data],
  );

  // フィルター処理：すべてのフィルターを同時に適用
  const filteredEvents = useMemo(() => {
    const filtered = data.filter((event) => {
      const matchType =
        selectedEventTypes.length === 0 || selectedEventTypes.includes(event.EVENT_KBN_MEI);
      const matchLocation = !selectedLocation || event.KAISAI_KO_MEI === selectedLocation;
      const matchDate = !selectedDate || dayjs(event.EVENT_START_TIME).isSame(selectedDate, 'day');
      return matchType && matchLocation && matchDate;
    });

    return [...filtered].sort(
      (a, b) => dayjs(b.EVENT_START_TIME).valueOf() - dayjs(a.EVENT_START_TIME).valueOf(),
    );
  }, [data, selectedEventTypes, selectedLocation, selectedDate]);

  // ハンドラー
  const handleEventTypeChange = (value: string) => {
    setSelectedEventTypes((prev) =>
      prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value],
    );
  };

  const handleLocationChange = (event: SelectChangeEvent) => {
    setSelectedLocation(event.target.value);
  };

  const handleDateChange = (newValue: Dayjs | null) => {
    setSelectedDate(newValue);
  };

   const handleDetailClick = (event: EventTtEvent) => {
    navigate(`${URL_PREFIX}/web/event/${event.EVENT_ID}`, {
      state: {
        eventId: event.EVENT_ID,
        eventName: event.EVENT_MEI,
        reservationDeadline: event.YOYAKU_KIGEN,
        qualtricsUrl: event.QUALTRICS_URL,
        url: event.URL,
        locationName: event.KAISAI_KO_MEI,
        eventTypeName: event.EVENT_KBN_MEI,
      },
    });
  };

  return (
    <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column', marginTop: '8rem' }}>
      <MainContainer
        containerSx={{ width: 'calc(100vw - 2rem)', boxShadow: 'none' }}
        boxSx={{ padding: '50px' }}
      >
        <Grid container direction="column" spacing={2}>
          {loading ? (
            <CircularProgress size={70} sx={{ display: 'block', margin: '4rem auto' }} />
          ) : (
            <>
              {/* フィルターセクション */}
              <FilterRow label="開催日">
                <CustomDatePicker
                  width="100%"
                  value={selectedDate}
                  setValue={setSelectedDate}
                  onChange={handleDateChange}
                />
              </FilterRow>
              <FilterRow label="開催校">
                <LocationSelect
                  options={locationOptions}
                  selected={selectedLocation}
                  onChange={handleLocationChange}
                />
              </FilterRow>
              <FilterRow label="イベント区分">
                <EventTypeCheckboxes
                  options={eventTypeOptions}
                  selected={selectedEventTypes}
                  onChange={handleEventTypeChange}
                  sx={{
                    display: 'flex !important',
                    justifyContent: 'flex-start',
                    flexWrap: 'wrap',
                  }}
                />
              </FilterRow>
              {/* テーブルセクション */}
              <EventsTable events={filteredEvents} onDetailClick={handleDetailClick} />
            </>
          )}
        </Grid>
      </MainContainer>
    </div>
  );
}
