import * as React from 'react';
import { Stack, Typography } from '@mui/material';
import { FormTextField } from '@/components/FormTextField';

type LabeledFieldProps = React.ComponentProps<typeof FormTextField> & {
  labelText?: string;
  labelWidth?: number | string;
  fieldwidth?: number | string;
  required?: boolean;
  backgroundColor?: string;
  height?: number | string;
  // For dual fields
  placeholder1?: string;
  value1?: string;
  onChange1?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur1?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  placeholder2?: string;
  value2?: string;
  onChange2?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  onBlur2?: React.FocusEventHandler<HTMLInputElement | HTMLTextAreaElement>;
  error2?: boolean;
  helperText2?: string;
  // For button
  hasButton?: boolean;
  buttonLabel?: React.ReactNode;
  onButtonClick?: () => void;
  buttonDisabled?: boolean;
  buttonProps?: React.ComponentProps<'button'>;
  sxcontainer?: React.CSSProperties | object;
  sxlabel?: React.CSSProperties | object;
  sxfield?: React.CSSProperties | object;
  sxfieldinner?: React.CSSProperties | object;
};

export const LabeledField: React.FC<LabeledFieldProps> = ({
  labelText,
  labelWidth = 360,
  // fieldwidth = '100%',
  required = false,
  height = 70,
  backgroundColor = '#F7F7F7',

  // Dual field props
  placeholder1,
  value1,
  onChange1,
  onBlur1,
  placeholder2,
  value2,
  onChange2,
  onBlur2,
  error2,
  helperText2,

  // Button props
  hasButton,
  buttonLabel,
  onButtonClick,
  buttonDisabled,
  buttonProps,
  ...tfProps
}) => {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      alignItems={{ xs: 'stretch', md: 'center' }}
      sx={{
        width: '100%',
        borderTop: 'solid 1px #DDDDDD',
        borderRight: 'solid 1px #DDDDDD',
        marginTop: '0 !important',
        ...(tfProps.sxcontainer as object),
      }}
    >
      {/* for label */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent={'space-between'}
        alignItems={'center'}
        sx={{
          backgroundColor: backgroundColor,
          minWidth: { md: labelWidth },
          minHeight: { md: height, xs: '45px' },
          padding: '0 24px',
          borderBottom: 'solid 1px #DDDDDD',
          borderLeft: 'solid 1px #DDDDDD',
          ...(tfProps.sxlabel as object),
        }}
      >
        <Typography variant="body2" sx={{ textAlign: 'left', fontSize: '15px' }}>
          {labelText}
        </Typography>
        {required && (
          <Typography
            component="span"
            sx={{
              color: '#FFFFFF',
              fontSize: '15px',
              padding: '2px 4px',
              backgroundColor: '#C82220',
              height: 'fit-content',
            }}
          >
            必須
          </Typography>
        )}
      </Stack>
      {/* for input area */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent={'space-between'}
        alignItems={'center'}
        sx={{
          width: { sm: '100%', md: '100%' },
          height: { sm: 'auto', md: height },
          padding: { md: '10px', lg: '24px' },
          borderBottom: 'solid 1px #DDDDDD',
          borderLeft: 'solid 1px #DDDDDD',
          ...(tfProps.sxfield as object),
        }}
      >
        <FormTextField
          multiField={!!placeholder2}
          value={value1}
          value2={value2}
          placeholder={placeholder1}
          placeholder2={placeholder2}
          onChange={onChange1}
          onChange2={onChange2}
          onBlur={onBlur1}
          onBlur2={onBlur2}
          error2={error2}
          helperText2={helperText2}
          hasButton={hasButton}
          buttonLabel={buttonLabel}
          onButtonClick={onButtonClick}
          buttonDisabled={buttonDisabled}
          buttonProps={buttonProps}
          error={!!tfProps.error}
          {...tfProps}
          sxfieldinner={tfProps.sxfieldinner as object}
          // sx={{ width: { sm: '80%', md: fieldwidth } }}
        />
      </Stack>
    </Stack>
  );
};
