import { createTheme, darken } from "@mui/material/styles";

declare module "@mui/material/styles" {
  interface Palette {
    customGray: Palette["primary"];
  }
  interface PaletteOptions {
    customGray?: PaletteOptions["primary"];
  }
}

// オプション: Buttonのcolorプロップに"customGray"を追加できるように拡張する
declare module "@mui/material/Button" {
  interface ButtonPropsColorOverrides {
    customGray: true;
  }
}

const primaryMain = "#1847c7";
const secondaryMain = "#ff9819";
const grayMain = "#E1E1E1";

const theme = createTheme({
  typography: {
    fontFamily:
      "'Noto Sans JP', 'Red Hat Display', 'Roboto', 'Helvetica', 'Arial', sans-serif",
  },
  palette: {
    primary: {
      main: primaryMain,
      contrastText: "#ffffff",
    },
    secondary: {
      main: secondaryMain,
      contrastText: "#ffffff",
    },
    customGray: {
      main: grayMain,
      contrastText: "#333333",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          height: 52,
          boxShadow: "none",
          [theme.breakpoints.down("sm")]: {
            height: 58,
          },
          ...(ownerState.variant === "contained" &&
            ownerState.color === "primary" && {
              "&:hover": {
                backgroundColor: darken(primaryMain, 0.1),
                boxShadow: "none",
              },
            }),
          ...(ownerState.variant === "contained" &&
            ownerState.color === "secondary" && {
              "&:hover": {
                backgroundColor: "#E38715 !important",
                boxShadow: "none",
              },
            }),
          ...(ownerState.variant === "contained" &&
            ownerState.color === "customGray" && {
              "&:hover": {
                backgroundColor: darken(grayMain, 0.1),
                boxShadow: "none",
              },
            }),
        }),
      },
    },
  },
});

export default theme;
