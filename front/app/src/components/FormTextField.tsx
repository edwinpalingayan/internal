import * as React from "react";
import TextField from "@mui/material/TextField";
import type { TextFieldProps } from "@mui/material/TextField";
import { Stack } from "@mui/material";
import CustomButton from "@/components/CustomButton";

export type FormTextFieldProps = Omit<TextFieldProps, "variant"> & {
  errorMessage?: string;
  multiField?: boolean;
  hasButton?: boolean;
  buttonLabel?: React.ReactNode;
  onButtonClick?: () => void;
  buttonDisabled?: boolean;
  buttonProps?: React.ComponentProps<typeof CustomButton>;
  // NEW: Second field props
  value2?: string;
  placeholder2?: string;
  onChange2?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur2?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  error2?: boolean;
  helperText2?: string;
  sxfieldinner?: React.CSSProperties | object;
};

export const FormTextField: React.FC<FormTextFieldProps> = ({
  error,
  errorMessage,
  sx,
  multiField = false,
  hasButton = false,
  buttonLabel = "",
  onButtonClick,
  buttonDisabled = false,
  buttonProps,
  value2,
  placeholder2,
  onChange2,
  onBlur2,
  error2,
  helperText2,
  ...props
}) => {
  if (multiField) {
    return (
      <Stack direction="row" spacing={2} width="100%">
        <TextField
          variant="outlined"
          fullWidth
          error={error}
          helperText={error ? errorMessage : props.helperText}
          sx={{
            margin: { xs: "16px 8px !important" },
            "& .MuiOutlinedInput-root": {
              borderRadius: 0,
              height: 40,
              fontSize: 14,
            },
            "& .MuiOutlinedInput-input": {
              padding: "9.5px 8px !important",
            },

            "& .Mui-disabled": {
              backgroundColor: "#EAEAEA",
            },
            ...sx,
            ...(props.sxfieldinner as object),
          }}
          FormHelperTextProps={{
            sx: {
              marginLeft: 0,
              marginTop: "4px",
              fontSize: 11,
            },
          }}
          {...props}
        />
        <TextField
          variant="outlined"
          fullWidth
          value={value2}
          placeholder={placeholder2}
          onChange={onChange2}
          onBlur={onBlur2}
          error={error2}
          helperText={error2 && helperText2 ? helperText2 : helperText2}
          sx={{
            margin: { xs: "16px 8px !important" },
            "& .MuiOutlinedInput-root": {
              borderRadius: 0,
              height: 40,
              fontSize: 14,
            },
            "& .MuiOutlinedInput-input": {
              padding: "9.5px 8px !important",
            },

            "& .Mui-disabled": {
              backgroundColor: "#EAEAEA",
            },
            ...sx,
            ...(props.sxfieldinner as object),
          }}
          FormHelperTextProps={{
            sx: {
              marginLeft: 0,
              marginTop: "4px",
              fontSize: 11,
            },
          }}
        />
      </Stack>
    );
  }

  if (hasButton) {
    return (
      <Stack direction="row" spacing={2} width="100%">
        <TextField
          variant="outlined"
          fullWidth
          error={error}
          helperText={error ? errorMessage : props.helperText}
          sx={{
            margin: { xs: "16px 8px !important" },
            "& .MuiOutlinedInput-root": {
              borderRadius: 0,
              height: 40,
              fontSize: 14,
            },
            "& .MuiOutlinedInput-input": {
              padding: "9.5px 8px !important",
            },
            "& .Mui-disabled": {
              backgroundColor: "#EAEAEA",
            },
            ...sx,
            ...(props.sxfieldinner as object),
          }}
          FormHelperTextProps={{
            sx: {
              marginLeft: 0,
              marginTop: "4px",
              fontSize: 11,
            },
          }}
          {...props}
        />
        <CustomButton
          color="primary"
          variant="outlined"
          style={{ height: 40, padding: "9.5px 8px !important", minWidth: 120 }}
          onClick={onButtonClick}
          disabled={buttonDisabled}
          loading={buttonProps?.loading}
          {...buttonProps}
        >
          {buttonLabel}
        </CustomButton>
      </Stack>
    );
  }

  // Default single TextField
  return (
    <TextField
      variant="outlined"
      fullWidth
      error={error}
      helperText={error ? errorMessage : props.helperText}
      sx={{
        margin: { xs: "16px 8px !important" },
        "& .MuiOutlinedInput-root": {
          borderRadius: 0,
          fontSize: 14,
        },
        "& .MuiOutlinedInput-input": {
          padding: "9.5px 8px !important",
        },
        "& .Mui-disabled": {
          backgroundColor: "#EAEAEA",
        },
        ...sx,
        ...(props.sxfieldinner as object),
      }}
      FormHelperTextProps={{
        sx: {
          marginLeft: 0,
          marginTop: "4px",
          fontSize: 11,
        },
      }}
      {...props}
    />
  );
};
