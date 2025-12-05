import * as React from 'react';
import Button from '@mui/material/Button';

interface CustomButtonProps extends Omit<React.ComponentProps<typeof Button>, 'variant'> {
  width?: string | number | { [key: string]: string | number };
  padding?: string | number | { [key: string]: string | number };
  variant?: 'text' | 'outlined' | 'contained';
}

export default function CustomButton({ width, padding, sx, ...rest }: CustomButtonProps) {
  return (
    <Button
      {...rest}
      sx={{
        width,
        padding,
        ...sx,
      }}
    />
  );
}
