import * as React from 'react';
import Checkbox from '@mui/material/Checkbox';
import FormControlLabel from '@mui/material/FormControlLabel';
import type { FormControlLabelProps } from '@mui/material/FormControlLabel';
import FormGroup from '@mui/material/FormGroup';
import styles from './Selection.module.scss';
import CheckIcon from '@mui/icons-material/Check';
import useMediaQuery from '@mui/material/useMediaQuery';

interface CheckboxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CheckboxProps {
  options: CheckboxOption[];
  defaultValues?: string[];
  name?: string;
  onChange?: (values: string[]) => void;
  fullWidth?: boolean;
}

interface CustomFormControlLabelProps extends FormControlLabelProps {
  isLast?: boolean;
  fullWidth?: boolean;
}

function MyFormControlLabel({ fullWidth, isLast, ...props }: CustomFormControlLabelProps) {
  return (
    <FormControlLabel
      {...props}
      control={
        <Checkbox
          {...(props.control?.props ?? {})}
          checked={props.checked}
          icon={<span />}
          checkedIcon={<CheckIcon sx={{ ...(props.checked ? { marginLeft: '10px' } : {}) }} />}
          classes={{
            checked: styles.selection_checkbox_checked,
            root: props.checked ? styles.selection_checkbox_checked : undefined,
          }}
          sx={{
            '& .MuiSvgIcon-root': {
              fontSize: 14,
            },
            p: 0,
            paddingRight: 0,
          }}
        />
      }
      sx={{
        gap: 1,
        marginLeft: 0,
        marginRight: isLast ? 0 : 1,
        marginBottom: '1rem',
        p: '0 2rem 0 1.5rem',
        '.MuiFormControlLabel-label': {
          fontSize: '15px',
        },
        '& .Mui-checked + .MuiFormControlLabel-label': {
          fontWeight: '500 !important',
        },
        ...(fullWidth && { width: '100%' }),
        ...(fullWidth && { marginRight: 0 }),
        // ...(fullWidth && { paddingLeft: '0.938rem' }),
        ...(props.checked ? { paddingLeft: '2rem' } : {}),
      }}
      classes={{
        label: props.checked ? styles.selection_label_checked : undefined,
      }}
      className={styles.custom_selection_group + (fullWidth ? ' ' + styles.full_width : '')}
    />
  );
}

export default function CustomCheckboxGroup({
  options,
  defaultValues = [],
  onChange,
  fullWidth = false,
}: CheckboxProps) {
  // Track if user has interacted
  const [checkedValues, setCheckedValues] = React.useState<string[]>(defaultValues);
  const [isUserInteracted, setIsUserInteracted] = React.useState(false);

  // When defaultValues changes (e.g. after API fetch), update checkedValues
  React.useEffect(() => {
    // Only update checkedValues if user hasn't interacted yet!
    if (!isUserInteracted) {
      setCheckedValues(defaultValues);
    }
  }, [defaultValues, isUserInteracted]);

  const handleChange = (value: string) => (_: React.SyntheticEvent, checked: boolean) => {
    let newValues: string[];
    if (checked) {
      newValues = [...checkedValues, value];
    } else {
      newValues = checkedValues.filter((v) => v !== value);
    }
    setCheckedValues(newValues);
    setIsUserInteracted(true); // User interacted, don't reset from default anymore
    if (onChange) onChange(newValues);
  };

  const isMobile = useMediaQuery('(max-width:768px)');
  const shouldFullWidth = fullWidth && isMobile;

  return (
    <div>
      <FormGroup row>
        {options.map((option, idx) => (
          <MyFormControlLabel
            key={option.value}
            value={option.value}
            label={option.label}
            checked={!!checkedValues.includes(option.value)}
            isLast={idx === options.length - 1}
            onChange={handleChange(option.value)}
            control={<Checkbox />}
            fullWidth={shouldFullWidth}
            disabled={option.disabled}
          />
        ))}
      </FormGroup>
    </div>
  );
}
