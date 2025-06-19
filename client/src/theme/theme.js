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
      main: '#5f6368',
      light: '#8e9398',
      dark: '#33363a',
      contrastText: '#fff',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
    text: {
      primary: '#333333',
      secondary: '#5f6368',
    },
    grey: {
      100: '#f8f9fa',
      200: '#f1f3f4',
      300: '#e8eaed',
      400: '#dadce0',
      500: '#9aa0a6',
      600: '#5f6368',
      700: '#3c4043',
      800: '#202124',
    },
  },
  typography: {
    fontFamily: [
      'Roboto',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2.5rem',
      fontWeight: 500,
      color: '#333',
      marginBottom: '1.5rem',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 500,
      color: '#333',
      marginBottom: '1.25rem',
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 500,
      color: '#333',
      marginBottom: '1rem',
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 500,
      color: '#333',
      marginBottom: '1rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
      color: '#333',
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.5,
      color: '#5f6368',
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          padding: '10px 20px',
          textTransform: 'none',
          fontWeight: 500,
          height: '40px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          '&:hover': {
            backgroundColor: '#3367d6',
          },
        },
        outlined: {
          borderColor: '#dadce0',
          color: '#5f6368',
          backgroundColor: '#f1f3f4',
          '&:hover': {
            backgroundColor: '#e4e6e7',
            borderColor: '#c4c7c9',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid #eee',
          borderRadius: 8,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
          transition: 'transform 0.2s, box-shadow 0.2s',
          '&:hover': {
            transform: 'translateY(-5px)',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '& fieldset': {
              borderColor: '#dadce0',
              borderRadius: 6,
            },
            '&:hover fieldset': {
              borderColor: '#c4c7c9',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4285f4',
            },
          },
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: '#5f6368',
          '&.Mui-checked': {
            color: '#4285f4',
          },
        },
      },
    },
  },
  spacing: 8, // 8px base unit
});

export default theme;
