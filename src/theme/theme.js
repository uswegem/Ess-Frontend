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
      secondary: '#6B7280',
    },

    divider: '#E5E7EB',
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
          border: '1px solid #E5E7EB',
          boxShadow: 'none',
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
