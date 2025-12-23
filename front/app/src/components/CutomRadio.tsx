import RadioGroup, { useRadioGroup } from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import type { FormControlLabelProps } from "@mui/material/FormControlLabel";
import Radio from "@mui/material/Radio";
import styles from "./Selection.module.scss";

interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface RadioProps {
  options: RadioOption[];
  defaultValue?: string;
  value?: string;
  name?: string;
  onChange?: (value: string) => void;
}
interface MyFormControlLabelProps extends FormControlLabelProps {
  isLast?: boolean;
}

function MyFormControlLabel({ isLast, ...props }: MyFormControlLabelProps) {
  const radioGroup = useRadioGroup();
  const checked = radioGroup ? radioGroup.value === props.value : false;

  return (
    <FormControlLabel
      {...props}
      control={
        <Radio
          {...(props.control?.props ?? {})}
          classes={{
            checked: styles.selection_checked,
            root: checked ? styles.selection_checked : undefined,
          }}
          // アイコンのサイズを必要に応じて調整
          sx={{
            "& .MuiSvgIcon-root": {
              fontSize: 14,
            },
            p: 0,
            paddingRight: 0,
          }}
        />
      }
      // ここにFormControlLabelの追加スタイルを記述できます
      sx={{
        gap: 1,
        marginLeft: 0,
        marginRight: isLast ? 0 : 1,
        marginBottom: "1rem",
        p: "0 20px",
        ".MuiFormControlLabel-label": {
          fontSize: "15px",
        },
        "& .Mui-checked + .MuiFormControlLabel-label": {
          fontWeight: "500 !important",
        },
      }}
      classes={{
        label: checked ? styles.selection_label_checked : undefined,
      }}
      className={`${styles.custom_selection_group} ${styles.custom_selection_radio_group}`}
    />
  );
}

export default function CustomRadioGroup({
  options,
  value,
  onChange,
  name = "custom-radio-group",
  defaultValue, // can be removed if not needed
}: RadioProps) {
  // コントロールモード用の安全な値を決める
  // valueがundefinedなら空文字にしとくよ
  const safeValue = typeof value === "string" ? value : "";
  return (
    <div>
      <RadioGroup
        name={name}
        value={safeValue}
        defaultValue={defaultValue}
        row={true}
        onChange={(e) => onChange && onChange(e.target.value)}
      >
        {options.map((option, idx) => (
          <MyFormControlLabel
            key={option.value}
            value={option.value}
            label={option.label}
            control={<Radio />}
            isLast={idx === options.length - 1}
            disabled={option.disabled}
          />
        ))}
      </RadioGroup>
    </div>
  );
}
