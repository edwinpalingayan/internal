import * as React from 'react';
import dayjs, { Dayjs } from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

import { DatePicker, LocalizationProvider } from '@mui/x-date-pickers';
import DateRangeIcon from '@mui/icons-material/DateRange';

import 'dayjs/locale/ja';

import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ja } from 'date-fns/locale/ja';
// Import Day type
import type { Day } from 'date-fns';
import { colors } from '@mui/material';

// Correctly type weekStartsOn as Day
const customJa = {
  ...ja,
  options: { ...ja.options, weekStartsOn: 1 as Day }, // 0: Sunday, 1: Monday, etc.
};

dayjs.locale('ja');
dayjs.extend(utc);
dayjs.extend(timezone);

export type CustomDatePickerProps = {
  width?: string | number;
  value?: Dayjs | null;
  setValue: React.Dispatch<React.SetStateAction<Dayjs | null>>;
  onChange?: (newValue: Dayjs | null) => void;
};

export const CustomDatePicker: React.FC<CustomDatePickerProps> = ({
  width = '100%',
  value,
  setValue,
  onChange,
}) => {
  const handleChange = (newValue: Date | null) => {
    if (setValue) {
      setValue(newValue ? dayjs(newValue) : null);
    }
    if (onChange) {
      onChange(newValue ? dayjs(newValue) : null);
    }
  };

  const [cleared, setCleared] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (cleared) {
      const timeout = setTimeout(() => {
        setCleared(false);
      }, 1500);
      return () => clearTimeout(timeout);
    }
    return () => {};
  }, [cleared]);

  return (
    <LocalizationProvider
      dateAdapter={AdapterDateFns}
      adapterLocale={customJa}
      dateFormats={{ year: 'yyyy年' }}
    >
      <DatePicker
        label="開催日を選択してください"
        format="yyyy年M月d日"
        slots={{ openPickerIcon: DateRangeIcon }}
        sx={{ width: width }}
        value={value ? value.toDate() : null}
        onChange={handleChange}
        slotProps={{
          textField: {
            helperText: null,
            InputLabelProps: {
              sx: { color: '#C4C4C4' },
            },
          },
          calendarHeader: { format: 'yyyy年MM月' },
          field: { clearable: true, onClear: () => setCleared(true) },
          layout: {
            sx: {
              '& .MuiDayCalendar-weekDayLabel:nth-of-type(6)': { color: colors.blue[900] },
              '& .MuiDayCalendar-weekDayLabel:nth-of-type(7)': { color: colors.red[900] },
            },
          },
          openPickerIcon: {
            sx: { color: '#C4C4C4' },
          },
        }}
      />
    </LocalizationProvider>
  );
};
