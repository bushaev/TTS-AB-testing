import { styled as muiStyled } from '@mui/material/styles';
import { Box, Paper, Button } from '@mui/material';
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

export const StyledAudioPlayer = muiStyled(AudioPlayer)(({ theme }) => ({
  '&.rhap_container': {
    background: theme.palette.background.paper,
    boxShadow: 'none',
  },
  '.rhap_main-controls-button, .rhap_volume-button': {
    color: theme.palette.primary.main,
  },
  '.rhap_progress-indicator, .rhap_volume-indicator': {
    background: theme.palette.primary.main,
  },
  '.rhap_progress-filled, .rhap_volume-bar': {
    background: theme.palette.secondary.main,
  },
}));

export const AppContainer = muiStyled(Box)(({ theme }) => ({
  maxWidth: '1000px',
  margin: '0 auto',
  padding: theme.spacing(4),
  background: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[4],
}));

export const StyledPaper = muiStyled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

export const SelectedModelIndicator = muiStyled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  background: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
  padding: theme.spacing(0.5, 1),
  borderRadius: '0 0 0 8px',
  fontWeight: 'bold',
}));

export const NavigationButton = muiStyled(Button)(({ theme }) => ({
  fontSize: '1.1rem',
  padding: theme.spacing(1.2, 3.5),
  minWidth: '130px',
}));

export const NavigationContainer = muiStyled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(3),
  marginTop: theme.spacing(4),
})); 