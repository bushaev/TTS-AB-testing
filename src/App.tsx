import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import useLocalStorageState from "use-local-storage-state";
import { Typography, Box, Button, ThemeProvider, CssBaseline, Grid } from "@mui/material";
import axios from 'axios';
import { StyledAudioPlayer, AppContainer, StyledPaper, SelectedModelIndicator, NavigationButton, NavigationContainer } from "./styles/index";
import { theme } from "./theme";
import { NameDialog } from "./components/NameDialog";
import { StatsDialog } from "./components/StatsDialog";
import { Model, ModelStats } from "./types";
import 'react-h5-audio-player/lib/styles.css';

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [models, setModels] = useLocalStorageState<Model[]>("tts_models", {
    defaultValue: [],
  });

  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  // Update the sentence state to be null initially
  const [currentSentence, setCurrentSentence] = useState<string | null>(null);

  // Replace the userDialog state with these two states
  const [dialogOpen, setDialogOpen] = useState(!localStorage.getItem('userName'));
  const [inputName, setInputName] = useState('');
  const [userId, setUserId] = useState(() => localStorage.getItem('userName') || '');

  const [showStats, setShowStats] = useState(false);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/audio/models`);
        setModels(response.data);
        // Set initial sentence if available
        if (response.data[0]?.files[0]?.sentence) {
          setCurrentSentence(response.data[0].files[0].sentence);
        }
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
    if (!selectedModel || !userId) return;
    
    try {
      await axios.post(`${API_BASE_URL}/state/${userId}`, {
        currentFileIndex,
        selectedModel,
      });
    } catch (error) {
      console.error('Failed to save user state:', error);
    }
  }, [currentFileIndex, selectedModel, userId]);

  // Update handleModelSelection function to save state
  const handleModelSelection = useCallback(async (modelName: string) => {
    setSelectedModel((prevModel) => {
      const newModel = prevModel === modelName ? null : modelName;
      
      if (newModel && userId) {
        axios.post(`${API_BASE_URL}/state/${userId}/comparison`, {
          selectedModel: newModel,
          fileIndex: currentFileIndex
        }).catch(error => {
          console.error('Failed to save comparison:', error);
        });
      }
      
      return newModel;
    });
  }, [currentFileIndex, userId]);

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
      
      // Set the sentence from the next file
      const nextIndex = prevIndex + 1;
      if (models[0]?.files[nextIndex]?.sentence) {
        setCurrentSentence(models[0].files[nextIndex].sentence);
      }
      
      return nextIndex;
    });
    
    setSelectedModel(null);
    audioRefs.current.forEach(player => player?.pause());
    setCurrentSentence(null);
  }, [models, selectedModel, fetchModelStats]);

  const handlePrevious = useCallback(() => {
    setCurrentFileIndex((prevIndex) => {
      if (prevIndex > 0) {
        // Set the sentence from the previous file
        if (models[0]?.files[prevIndex - 1]?.sentence) {
          setCurrentSentence(models[0].files[prevIndex - 1].sentence);
        }
        return prevIndex - 1;
      }
      return prevIndex;
    });
    setSelectedModel(null);
    // Pause all audio players
    audioRefs.current.forEach(player => player?.pause());
    // Generate a new random sentence
    setCurrentSentence(null);
  }, [models]);

  const currentFiles = useMemo(() => {
    return models.map(model => model.files[currentFileIndex]).filter(Boolean);
  }, [models, currentFileIndex]);

  if (models.length === 0) {
    return <Typography>Loading models...</Typography>;
  }

  console.log('Models:', models);
  console.log('Current Files:', currentFiles);

  // Update the handleNameSubmit function
  const handleNameSubmit = useCallback(() => {
    if (inputName.trim()) {
      const newUserId = inputName.trim();
      localStorage.setItem('userName', newUserId);
      setUserId(newUserId);
      setDialogOpen(false);
    }
  }, [inputName]);

  // Update the handleResetName function
  const handleResetName = useCallback(() => {
    localStorage.removeItem('userName');
    setUserId('');
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
        <StatsDialog 
          open={showStats}
          onClose={() => setShowStats(false)}
          stats={modelStats}
        />
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
