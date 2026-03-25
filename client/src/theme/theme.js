import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4285f4',
      light: '#75a7ff',
      dark: '#3367d6',
      contrastText: '#fff',
    },
    secondary: {
      main: '#34a853',
      light: '#6ad67a',
      dark: '#1e7e34',
      contrastText: '#fff',
    },
    background: {
      default: '#f4f6f8',
      paper: '#ffffff',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
    divider: '#e2e8f0',
    grey: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },
    success: {
      main: '#34a853',
      light: '#e8f5e9',
    },
    warning: {
      main: '#fbbc04',
      light: '#fff8e1',
    },
    error: {
      main: '#ea4335',
      light: '#fce8e6',
    },
    info: {
      main: '#4285f4',
      light: '#e8f0fe',
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.75rem',
      fontWeight: 700,
      letterSpacing: '-0.025em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.375rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '0.875rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '0.9375rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.8125rem',
      lineHeight: 1.5,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
      fontSize: '0.875rem',
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
  },
  shape: {
    borderRadius: 10,
  },
  shadows: [
    'none',
    '0 1px 2px 0 rgba(0,0,0,0.05)',
    '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
    '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
    '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.1)',
    '0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
    '0 25px 50px -12px rgba(0,0,0,0.25)',
    // Fill remaining indices with the last shadow
    ...Array(18).fill('0 25px 50px -12px rgba(0,0,0,0.25)'),
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '8px 20px',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
          },
        },
        outlined: {
          borderColor: '#e2e8f0',
          '&:hover': {
            borderColor: '#cbd5e1',
            backgroundColor: '#f8fafc',
          },
        },
        sizeSmall: {
          padding: '6px 14px',
          fontSize: '0.8125rem',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          border: '1px solid #e2e8f0',
          boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1), 0 1px 2px -1px rgba(0,0,0,0.1)',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        outlined: {
          borderColor: '#e2e8f0',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#e2e8f0',
            },
            '&:hover fieldset': {
              borderColor: '#cbd5e1',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4285f4',
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.75rem',
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#e2e8f0',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#94a3b8',
          '&.Mui-checked': {
            color: '#4285f4',
          },
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: '#4285f4',
            color: '#fff',
            '&:hover': {
              backgroundColor: '#3367d6',
            },
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: 'none',
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: '12px !important',
          border: '1px solid #e2e8f0',
          boxShadow: 'none',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
          },
        },
      },
    },
  },
  spacing: 8,
});

export default theme;
