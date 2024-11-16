import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useLocalStorageState from "use-local-storage-state";
import { styled as muiStyled } from '@mui/material/styles';
import {
   Typography,
  Paper,
  Box,
  Button,
  ThemeProvider,
  createTheme,
  CssBaseline,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from "@mui/material";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';
import axios from 'axios';
import { Grid } from '@mui/material';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

// Change this import
import { LoremIpsum } from 'lorem-ipsum';

// Add this styled component definition
const StyledAudioPlayer = muiStyled(AudioPlayer)(({ theme }) => ({
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

interface AudioFile {
  name: string;
  path: string;
}

interface Model {
  name: string;
  folderPath: string;
  files: AudioFile[];
}

interface ModelStats {
  totalComparisons: number;
  modelSelections: Record<string, number>;
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
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: theme.shadows[8],
  },
}));

const SelectedModelIndicator = muiStyled(Box)(({ theme }) => ({
  position: 'absolute',
  top: 0,
  right: 0,
  background: theme.palette.secondary.main,
  color: theme.palette.secondary.contrastText,
  padding: theme.spacing(0.5, 1),
  borderRadius: '0 0 0 8px',
  fontWeight: 'bold',
}));

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#78909c', // A muted blue-grey
    },
    secondary: {
      main: '#a1887f', // A muted brown
    },
    background: {
      default: '#121212',
      paper: '#1E1E1E',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#9e9e9e', // Light grey for headings
    },
    h6: {
      fontWeight: 600,
      color: '#bdbdbd', // Slightly lighter grey for subheadings
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 20,
        },
        contained: {
          backgroundColor: '#546e7a', // Darker blue-grey for buttons
          '&:hover': {
            backgroundColor: '#455a64', // Even darker on hover
          },
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

// Update the generateRandomSentence function
const generateRandomSentence = () => {
  const lorem = new LoremIpsum();
  return lorem.generateSentences(1);
};

const NavigationButton = muiStyled(Button)(({ theme }) => ({
  fontSize: '1.1rem',
  padding: theme.spacing(1.2, 3.5),
  minWidth: '130px',
}));

const NavigationContainer = muiStyled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'center',
  gap: theme.spacing(3),
  marginTop: theme.spacing(4),
}));

const API_BASE_URL = 'http://localhost:3001/api';

// First, remove the NameDialog from useMemo and define it as a component
// Add this component definition before the App component
const NameDialog = ({ 
  open, 
  name, 
  onNameChange, 
  onSubmit 
}: {
  open: boolean;
  name: string;
  onNameChange: (name: string) => void;
  onSubmit: () => void;
}) => (
  <Dialog 
    open={open} 
    onClose={(e, reason) => {
      if (reason !== 'backdropClick') onSubmit();
    }}
    disableEscapeKeyDown
  >
    <DialogTitle>Welcome!</DialogTitle>
    <DialogContent>
      <Typography variant="body1" gutterBottom sx={{ mt: 2 }}>
        Please enter your name to continue:
      </Typography>
      <TextField
        autoFocus
        margin="dense"
        fullWidth
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') onSubmit();
        }}
        autoComplete="off"
        inputProps={{
          autoComplete: 'off',
          'data-lpignore': 'true',
          'data-form-type': 'other',
        }}
        type="text"
        placeholder="Enter your name"
        name="display-name"
      />
    </DialogContent>
    <DialogActions>
      <Button 
        onClick={onSubmit}
        disabled={!name.trim()}
        variant="contained"
        color="primary"
      >
        Continue
      </Button>
    </DialogActions>
  </Dialog>
);

// Add these constants before the App component
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

function App() {
  const [models, setModels] = useLocalStorageState<Model[]>("tts_models", {
    defaultValue: [],
  });

  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  // Add this new state for the current sentence
  const [currentSentence, setCurrentSentence] = useState(generateRandomSentence());

  // Replace the userDialog state with these two states
  const [dialogOpen, setDialogOpen] = useState(!localStorage.getItem('userName'));
  const [inputName, setInputName] = useState('');
  const [userId] = useState(() => localStorage.getItem('userName') || '');

  const [showStats, setShowStats] = useState(false);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/audio/models`);
        setModels(response.data);
      } catch (error) {
        console.error('Failed to fetch models:', error);
      }
    };

    fetchModels();
  }, []);

  useEffect(() => {
    const loadUserState = async () => {
      const userName = localStorage.getItem('userName');
      if (!userName) return;
      
      try {
        const response = await axios.get(`${API_BASE_URL}/state/${userName}`);
        if (response.data) {
          const { currentFileIndex, selectedModel } = response.data;
          setCurrentFileIndex(currentFileIndex);
          setSelectedModel(selectedModel);
        }
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status !== 404) {
          console.error('Failed to load user state:', error);
        }
      }
    };

    loadUserState();
  }, []);

  // Update the getAudioUrl function
  const getAudioUrl = useCallback((filePath: string) => {
    return `${API_BASE_URL}/audio/file/${filePath}`;
  }, []);

  // Update saveUserState function
  const saveUserState = useCallback(async () => {
    const userName = localStorage.getItem('userName');
    if (!selectedModel || !userName) return;
    
    try {
      await axios.post(`${API_BASE_URL}/state/${userName}`, {
        currentFileIndex,
        selectedModel,
      });
    } catch (error) {
      console.error('Failed to save user state:', error);
    }
  }, [currentFileIndex, selectedModel]);

  // Update handleModelSelection function to save state
  const handleModelSelection = useCallback(async (modelName: string) => {
    setSelectedModel((prevModel) => {
      const newModel = prevModel === modelName ? null : modelName;
      
      // Save the comparison if a model was selected
      if (newModel) {
        const userName = localStorage.getItem('userName');
        if (userName) {
          axios.post(`${API_BASE_URL}/state/${userName}/comparison`, {
            selectedModel: newModel,
            fileIndex: currentFileIndex
          }).catch(error => {
            console.error('Failed to save comparison:', error);
          });
        }
      }
      
      return newModel;
    });
  }, [currentFileIndex]);

  // Update fetchModelStats function
  const fetchModelStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/state/stats/models`);
      setModelStats(response.data);
    } catch (error) {
      console.error('Failed to fetch model stats:', error);
    }
  }, []);

  const handleNext = useCallback(async () => {
    setCurrentFileIndex((prevIndex) => {
      const isLastSample = models.length > 0 && prevIndex >= models[0].files.length - 1;
      
      if (isLastSample) {
        if (selectedModel) {
          // Ensure the last comparison is saved before showing stats
          const userName = localStorage.getItem('userName');
          if (userName) {
            axios.post(`${API_BASE_URL}/state/${userName}/comparison`, {
              selectedModel,
              fileIndex: prevIndex
            }).then(() => {
              fetchModelStats();
              setShowStats(true);
            }).catch(error => {
              console.error('Failed to save final comparison:', error);
            });
          }
        }
        return prevIndex;
      }
      
      return prevIndex + 1;
    });
    
    setSelectedModel(null);
    audioRefs.current.forEach(player => player?.pause());
    setCurrentSentence(generateRandomSentence());
  }, [models, selectedModel, fetchModelStats]);

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
    // Generate a new random sentence
    setCurrentSentence(generateRandomSentence());
  }, []);

  const currentFiles = useMemo(() => {
    return models.map(model => model.files[currentFileIndex]).filter(Boolean);
  }, [models, currentFileIndex]);

  if (models.length === 0) {
    return <Typography>Loading models...</Typography>;
  }

  console.log('Models:', models);
  console.log('Current Files:', currentFiles);

  // Update the StatsDialog component inside App function
  const StatsDialog = () => {
    // Transform the stats data for the pie chart
    const chartData = modelStats ? Object.entries(modelStats.modelSelections).map(([name, value]) => ({
      name,
      value,
      percentage: ((value / modelStats.totalComparisons) * 100).toFixed(1)
    })) : [];

    return (
      <Dialog 
        open={showStats} 
        onClose={() => setShowStats(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Model Comparison Results</DialogTitle>
        <DialogContent>
          {modelStats && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Total Comparisons: {modelStats.totalComparisons}
              </Typography>
              
              {/* Add the pie chart */}
              <Box sx={{ width: '100%', height: 400, mt: 2 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={150}
                      label={({ name, percentage }) => `${name} (${percentage}%)`}
                    >
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [
                        `${value} selections (${((value / modelStats.totalComparisons) * 100).toFixed(1)}%)`,
                        'Selections'
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowStats(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  // Update the handleNameSubmit function
  const handleNameSubmit = useCallback(() => {
    if (inputName.trim()) {
      localStorage.setItem('userName', inputName.trim());
      setDialogOpen(false);
    }
  }, [inputName]);

  // Update the handleResetName function
  const handleResetName = useCallback(() => {
    localStorage.removeItem('userName');
    setInputName('');
    setDialogOpen(true);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppContainer>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          TTS Model Comparison
        </Typography>
        <Box display="flex" justifyContent="center" mb={2}>
          <Button
            size="small"
            onClick={handleResetName}
            variant="outlined"
            color="secondary"
          >
            Change Name
          </Button>
        </Box>
        <Typography variant="subtitle1" align="center" color="textSecondary" gutterBottom>
          "{currentSentence}"
        </Typography>
        <Grid container spacing={3}>
          {models.map((model, index) => (
            <Grid 
              item 
              xs={12}
              sm={6}
              lg={6}
              key={model.name}
              style={{ width: '100%' }}
            >
              <StyledPaper onClick={() => handleModelSelection(model.name)}>
                <Box p={3} position="relative">
                  {selectedModel === model.name && (
                    <SelectedModelIndicator>Selected</SelectedModelIndicator>
                  )}
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

        <NavigationContainer>
          <NavigationButton
            variant="contained"
            color="primary"
            onClick={handlePrevious}
            disabled={currentFileIndex === 0}
          >
            Previous
          </NavigationButton>
          <NavigationButton 
            variant="contained"
            color="primary"
            onClick={handleNext} 
            disabled={currentFileIndex === models[0].files.length - 1 && !selectedModel}
          >
            {currentFileIndex === models[0].files.length - 1 ? 'Show Results' : 'Next'}
          </NavigationButton>
        </NavigationContainer>
        <StatsDialog />
        <NameDialog 
          open={dialogOpen}
          name={inputName}
          onNameChange={setInputName}
          onSubmit={handleNameSubmit}
        />
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;
