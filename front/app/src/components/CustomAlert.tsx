import * as React from 'react';
import { Box, Grow, Alert } from '@mui/material';
import FmdBadOutlinedIcon from '@mui/icons-material/FmdBadOutlined';

import useMediaQuery from '@mui/material/useMediaQuery';

export type NotificationLists = {
  key: string;
  active: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
};

type CustomAlertProps = {
  notificationLists: NotificationLists[];
  sx?: React.CSSProperties;
};
export const CustomAlert: React.FC<CustomAlertProps> = ({ notificationLists, sx }) => {
  const isMobile = useMediaQuery('(max-width:932px)');
  return (
    <>
      {notificationLists
        .filter((err) => err.active)
        .map((err) => (
          <Box key={err.key}>
            <Grow in={err.active} {...(err.active ? { timeout: 1000 } : {})}>
              <Alert
                icon={<FmdBadOutlinedIcon sx={{ marginRight: '-10px !important' }} />}
                severity={err.severity}
                sx={{
                  minHeight: '44px',
                  marginRight: '-10px !important',
                  textAlign: 'left',
                  padding: '0 16px',
                  border: '2px solid',
                  alignItems: 'center',
                  maxWidth: `${isMobile ? 'calc(100vw - 2rem)' : '100%'}`,
                  borderColor: (theme) =>
                    err.severity === 'error'
                      ? '#F04135' // TODO: Globalize colors
                      : err.severity === 'warning'
                        ? '#FF981A' // TODO: Globalize colors
                        : err.severity === 'info'
                          ? theme.palette.info.main
                          : theme.palette.success.main,
                  backgroundColor: (theme) =>
                    err.severity === 'error'
                      ? '#FFF4F2' // TODO: Globalize colors
                      : err.severity === 'warning'
                        ? '#FFF6EB' // TODO: Globalize colors
                        : err.severity === 'info'
                          ? theme.palette.info.light
                          // : theme.palette.success.light,
                          : '#E9F6EB', // TODO: Globalize colors
                  ...sx,
                }}
              >
                {err.message}
              </Alert>
            </Grow>
          </Box>
        ))}
    </>
  );
};
