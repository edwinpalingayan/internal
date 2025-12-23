import * as React from "react";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import styles from "./CustomTextField.module.scss";

interface SingleFieldProps {
  label?: string;
  variant?: "outlined" | "filled" | "standard";
  value?: string;
  defaultValue?: string;
  name?: string;
  type?: React.InputHTMLAttributes<unknown>["type"];
  placeholder?: string;
  helperText?: string;
  error?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  height?: number | string;
  fullWidth?: boolean;
}

interface CustomTextFieldProps extends SingleFieldProps {
  fields?: SingleFieldProps[];
}

export default function CustomTextField({
  fields,
  ...rest
}: CustomTextFieldProps) {
  const renderFields = () => {
    if (fields && Array.isArray(fields) && fields.length > 0) {
      return fields.map((field, idx) => (
        <TextField
          key={field.name || idx}
          label={field.label}
          variant={field.variant || "outlined"}
          value={field.value}
          defaultValue={field.defaultValue}
          name={field.name}
          type={field.type || "text"}
          placeholder={field.placeholder}
          helperText={field.helperText}
          error={field.error}
          onChange={field.onChange}
          fullWidth={field.fullWidth}
          sx={{
            "& .MuiInputBase-root": {
              height: field.height || 48,
              borderRadius: 0,
            },
            "& .MuiOutlinedInput-root": {
              borderRadius: 0,
              "& fieldset": {
                borderColor: "#888888",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--color-primary-blue, #1847C7)",
              },
            },
          }}
        />
      ));
    } else {
      return (
        <TextField
          label={rest.label}
          variant={rest.variant || "outlined"}
          value={rest.value}
          defaultValue={rest.defaultValue}
          name={rest.name}
          type={rest.type || "text"}
          placeholder={rest.placeholder}
          helperText={rest.helperText}
          error={rest.error}
          onChange={rest.onChange}
          fullWidth={rest.fullWidth}
          className={styles.custom_textarea}
          sx={{
            "& .MuiInputBase-root": {
              height: rest.height || 48,
              borderRadius: 0,
            },
            "& .MuiOutlinedInput-root": {
              borderRadius: 0,
              "& fieldset": {
                borderColor: "#888888",
              },
              "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                borderColor: "var(--color-primary-blue, #1847C7)",
              },
            },
          }}
        />
      );
    }
  };

  return (
    <div className={styles.custom_textarea_title}>
      <Box
        component="form"
        sx={{
          display: "flex",
          gap: 2,
          flexDirection: fields && fields.length > 1 ? "row" : "column",
          "& > *": { flex: 1 },
        }}
        noValidate
        autoComplete="off"
      >
        {renderFields()}
      </Box>
    </div>
  );
}
