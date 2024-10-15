import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useLocalStorageState from "use-local-storage-state";
import { styled as muiStyled } from '@mui/material/styles';
import {
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Box,
  Button,
  Grid,
  ThemeProvider,
  createTheme,
  CssBaseline,
} from "@mui/material";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import { blue, purple } from '@mui/material/colors';

interface AudioFile {
  name: string;
  path: string;
}

interface Model {
  name: string;
  folderPath: string;
  files: AudioFile[];
}

const AppContainer = muiStyled(Box)(({ theme }) => ({
  maxWidth: '1000px',
  margin: '0 auto',
  padding: theme.spacing(4),
  background: theme.palette.background.default,
  borderRadius: theme.shape.borderRadius,
  boxShadow: theme.shadows[4],
}));

const StyledPaper = muiStyled(Paper)(({ theme }) => ({
  background: theme.palette.background.paper,
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

const StyledAudioPlayer = muiStyled(AudioPlayer)(({ theme }) => ({
  '&.rhap_container': {
    background: theme.palette.background.paper,
    boxShadow: 'none',
  },
  '.rhap_main-controls-button, .rhap_volume-button': {
    color: theme.palette.primary.main,
  },
  '.rhap_progress-indicator, .rhap_progress-filled, .rhap_volume-indicator': {
    background: theme.palette.secondary.main,
  },
}));

const STORAGE_VERSION = 6;

const initialModels: Model[] = [
  {
    name: "Model A",
    folderPath: "model1",
    files: [
      { name: "sample1.wav", path: "model1/sample1.wav" },
      { name: "sample2.wav", path: "model1/sample2.wav" },
      { name: "sample3.wav", path: "model1/sample3.wav" },
    ],
  },
  {
    name: "Model B",
    folderPath: "model2",
    files: [
      { name: "sample1.wav", path: "model2/sample1.wav" },
      { name: "sample2.wav", path: "model2/sample2.wav" },
      { name: "sample3.wav", path: "model2/sample3.wav" },
    ],
  },
];

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: blue,
    secondary: purple,
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
        },
      },
    },
  },
});

function App() {
  const [storageVersion] = useLocalStorageState<number>("tts_models_version", {
    defaultValue: STORAGE_VERSION,
  });

  const [models, setModels] = useLocalStorageState<Model[]>("tts_models", {
    defaultValue: initialModels,
  });

  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  useEffect(() => {
    if (storageVersion !== STORAGE_VERSION) {
      localStorage.removeItem("tts_models");
      localStorage.setItem("tts_models_version", STORAGE_VERSION.toString());
      setModels(initialModels);
    }
  }, [storageVersion, setModels]);

  const handleModelSelection = useCallback((modelName: string) => {
    setSelectedModel(modelName);
  }, []);

  const getAudioUrl = useCallback((filePath: string) => {
    return `/web-2024-template/${filePath}`;
  }, []);

  const handleNext = useCallback(() => {
    setCurrentFileIndex((prevIndex) => {
      if (models.length > 0 && prevIndex < models[0].files.length - 1) {
        return prevIndex + 1;
      }
      return prevIndex;
    });
    setSelectedModel(null);
    // Pause all audio players
    audioRefs.current.forEach(player => player?.pause());
  }, [models]);

  const handlePrevious = useCallback(() => {
    setCurrentFileIndex((prevIndex) => {
      if (prevIndex > 0) {
        return prevIndex - 1;
      }
      return prevIndex;
    });
    setSelectedModel(null);
    // Pause all audio players
    audioRefs.current.forEach(player => player?.pause());
  }, []);

  const currentFiles = useMemo(() => {
    return models.map(model => model.files[currentFileIndex]).filter(Boolean);
  }, [models, currentFileIndex]);

  if (models.length === 0) {
    return <Typography>Loading models...</Typography>;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContainer>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          TTS Model Comparison
        </Typography>
        <Grid container spacing={3}>
          {models.map((model, index) => (
            <Grid item xs={12} sm={6} key={model.name}>
              <StyledPaper>
                <Box p={3}>
                  <Typography variant="h6" color="secondary" gutterBottom>
                    {model.name}
                  </Typography>
                  {currentFiles[index] && (
                    <Box mt={2}>
                      <Typography variant="body1" color="textSecondary">
                        {currentFiles[index].name}
                      </Typography>
                      <StyledAudioPlayer
                        ref={(element: any) => {
                          if (element && element.audio) {
                            audioRefs.current[index] = element.audio.current;
                          }
                        }}
                        src={getAudioUrl(currentFiles[index].path)}
                        onError={(e: Error) => {
                          console.error("Error loading audio:", e);
                        }}
                        autoPlay={false}
                        autoPlayAfterSrcChange={false}
                      />
                    </Box>
                  )}
                </Box>
              </StyledPaper>
            </Grid>
          ))}
        </Grid>
        <Box mt={4}>
          <RadioGroup
            row
            value={selectedModel || ""}
            onChange={(e) => handleModelSelection(e.target.value)}
          >
            <Typography variant="body1" component="span" style={{ marginRight: '1rem' }} color="textSecondary">
              Preferred model:
            </Typography>
            {models.map((model) => (
              <FormControlLabel
                key={model.name}
                value={model.name}
                control={<Radio color="secondary" />}
                label={model.name}
              />
            ))}
          </RadioGroup>
        </Box>
        <Box mt={4} display="flex" justifyContent="space-between">
          <Button
            variant="contained"
            color="primary"
            onClick={handlePrevious}
            disabled={currentFileIndex === 0}
          >
            Previous
          </Button>
          <Button 
            variant="contained"
            color="primary"
            onClick={handleNext} 
            disabled={currentFileIndex === models[0].files.length - 1}
          >
            Next
          </Button>
        </Box>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
