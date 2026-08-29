import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',

    primary: {
      main: '#1E3A8A',
      light: '#3B5BB0',
      dark: '#152B66',
      contrastText: '#FFFFFF',
    },

    secondary: {
      main: '#4C3F91',
      light: '#6B5CB0',
      dark: '#362C68',
      contrastText: '#FFFFFF',
    },

    error: {
      main: '#DC2626',
      light: '#EF4444',
      dark: '#B91C1C',
    },

    warning: {
      main: '#D97706',
      light: '#F59E0B',
      dark: '#B45309',
    },

    success: {
      main: '#16A34A',
      light: '#22C55E',
      dark: '#15803D',
    },

    info: {
      main: '#4C3F91',
      light: '#6B5CB0',
      dark: '#362C68',
    },

    // Custom token for "sensitive" actions (disbursement, liquidation, etc.)
    // Not a standard MUI palette key - access via theme.palette.sensitive
    sensitive: {
      main: '#E63946',
      light: '#EF5D68',
      dark: '#C42A36',
      contrastText: '#FFFFFF',
    },

    background: {
      default: '#F8F9FC',
      paper: '#FFFFFF',
    },

    text: {
      primary: '#1A1D29',
      // Changed from #6B7280 to the design-token handoff's value, per explicit confirmation -
      // this darkens every existing color="text.secondary" usage app-wide, not just redesigned
      // screens.
      secondary: '#475467',
      // New from the design-token handoff - no standard MUI slot, access via
      // theme.palette.text.muted. (The design's other "muted" value, #6B7280, is what
      // text.secondary used to be - already effectively covered, not duplicated here.)
      muted: '#98A2B3',
    },

    divider: '#E5E7EB',

    // New from the design-token handoff - additive, no equivalent existed before.
    designBorder: {
      input: '#D6DAE3',
      card: '#E5E8EF',
      subtle: '#EEF0F4',
    },
    designBackground: {
      page: '#F3F5F9',
      pageAlt: '#F7F8FB',
      disabledField: '#F7F8FB',
    },

    // Status pill color pairs (background/text) - not a standard MUI palette key, access via
    // theme.palette.statusPill.<name>. Screens with color-coded status chips (Products,
    // Audit Logs, Tenant Users, etc.) should reference these instead of ad hoc colors, so
    // status coloring stays consistent across the app.
    statusPill: {
      green: { bg: '#E7F6EC', text: '#12794A' },
      gray: { bg: '#F2F4F7', text: '#475467' },
      red: { bg: '#FEECEC', text: '#B42318' },
      indigo: { bg: '#EEF0FB', text: '#2A3A8F' },
    },
  },

  typography: {
    fontFamily: [
      'Poppins',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      'Helvetica',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 600 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' },
  },

  shape: {
    borderRadius: 10,
  },

  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          // #E5E8EF is the design-token handoff's card border - within a hair of the
          // previous #E5E7EB, treated as the same token consolidated to one value rather
          // than a meaningful conflict.
          border: '1px solid #E5E8EF',
          borderRadius: 12,
          boxShadow: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 14,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#D6DAE3',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
        },
        containedPrimary: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: '#1E3A8A',
            color: '#FFFFFF',
            '& .MuiListItemIcon-root': {
              color: '#FFFFFF',
            },
            '&:hover': {
              backgroundColor: '#152B66',
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
  },
});

export default theme;
