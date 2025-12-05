import * as React from 'react';

import Container from '@mui/material/Container';
import CssBaseline from '@mui/material/CssBaseline';
import Paper from '@mui/material/Paper';
import { styled } from '@mui/material/styles';

import type { SxProps } from '@mui/material';

interface MainContainerProps {
  children?: React.ReactNode;
  boxSx?: SxProps;
  containerSx?: object;
  pcMaxWidth?: string;
}

const CustomPaper = styled(Paper)(({ theme }) => ({
  backgroundColor: '#fff',
  padding: theme.spacing(1),
  textAlign: 'center',
  color: '#333333',
  margin: 0,
}));

export default function MainContainer({
  children,
  boxSx,
  containerSx,
  pcMaxWidth = '1450px',
}: MainContainerProps) {
  return (
    <React.Fragment>
      <CssBaseline />
      <Container
        sx={{
          minWidth: { lg: pcMaxWidth, xs: '100%' },
          maxWidth: { md: '980px', xs: '100%' },
          p: { xs: '0' },
          ...containerSx,
        }}
      >
        <CustomPaper
          sx={{
            padding: '16px 30px',
            ...boxSx,
          }}
        >
          {children}
        </CustomPaper>
      </Container>
    </React.Fragment>
  );
}
