import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Typography, Box, Button, ThemeProvider, CssBaseline, Grid, FormControlLabel, Checkbox } from "@mui/material";
import axios from 'axios';
import { StyledAudioPlayer, AppContainer, StyledPaper, SelectedModelIndicator, NavigationButton, NavigationContainer } from "./styles/index";
import { theme } from "./theme";
import { NameDialog } from "./components/NameDialog";
import { StatsDialog } from "./components/StatsDialog";
import { Model, ModelStats, ShuffleMapping, ShuffleMappings } from "./types";

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [models, setModels] = useState<Model[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [currentSentence, setCurrentSentence] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(!localStorage.getItem('userName'));
  const [userId, setUserId] = useState(() => localStorage.getItem('userName') || '');
  const [inputName, setInputName] = useState('');

  const [showStats, setShowStats] = useState(false);
  const [modelStats, setModelStats] = useState<ModelStats | null>(null);

  const [selections, setSelections] = useState<Record<number, string>>({});

  const audioRefs = useRef<(HTMLAudioElement | null)[]>([]);

  const [isAnonymousMode, setIsAnonymousMode] = useState(() => 
    localStorage.getItem('isAnonymousMode') !== 'false'
  );

  const [shuffleMappings, setShuffleMappings] = useState<ShuffleMappings>(() => {
    const saved = localStorage.getItem('shuffleMappings');
    return saved ? JSON.parse(saved) : {};
  });

  const pauseAllAudio = useCallback(() => {
    document.querySelectorAll('audio').forEach(audio => audio.pause());
  }, []);

  const getAudioUrl = useCallback((filePath: string) => {
    return `${API_BASE_URL}/audio/file/${filePath}`;
  }, []);

  const updateCurrentSentence = useCallback((index: number) => {
    setCurrentSentence(models[0]?.files[index]?.sentence ?? null);
  }, [models]);

  const fetchModelStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/state/stats/models`);
      setModelStats(response.data);
    } catch (error) {
      console.error('Failed to fetch model stats:', error);
    }
  }, []);

  const generateShuffleMapping = useCallback((length: number, fileIndex: number) => {
    const indices = Array.from({ length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    const mapping: ShuffleMapping = {};
    indices.forEach((originalIndex, displayIndex) => {
      mapping[displayIndex] = originalIndex;
    });
    
    setShuffleMappings(prev => {
      const newMappings = {
        ...prev,
        [fileIndex]: mapping
      };
      localStorage.setItem('shuffleMappings', JSON.stringify(newMappings));
      return newMappings;
    });
    
    return mapping;
  }, []);

  const handleModelSelection = useCallback((displayIndex: number) => {
    const currentMapping = shuffleMappings[currentFileIndex];
    if (!currentMapping) return;
    
    const originalIndex = currentMapping[displayIndex];
    const modelName = models[originalIndex].name;
    
    setSelections(prevSelections => {
      const newSelections = { ...prevSelections };
      
      if (prevSelections[currentFileIndex] === modelName) {
        delete newSelections[currentFileIndex];
      } else {
        newSelections[currentFileIndex] = modelName;
      }
      
      return newSelections;
    });
  }, [currentFileIndex, models, shuffleMappings]);

  const handleNext = useCallback(async () => {
    setCurrentFileIndex((prevIndex) => {
      const isLastSample = models.length > 0 && prevIndex >= models[0].files.length - 1;

      if (isLastSample && userId) {
        const comparisons = Object.entries(selections).map(([fileIndex, modelName]) => ({
          fileIndex: parseInt(fileIndex),
          selectedModel: modelName
        }));
        
        axios.post(`${API_BASE_URL}/state/${userId}/comparisons`, comparisons)
          .then(() => {
            return fetchModelStats();
          })
          .then(() => {
            setShowStats(true);
          })
          .catch(error => {
            console.error('Failed to save comparisons:', error);
          });
          
        return prevIndex;
      }
      
      const nextIndex = Math.min(prevIndex + 1, models[0].files.length - 1);
      updateCurrentSentence(nextIndex);
      return nextIndex;
    });
    
    pauseAllAudio();
  }, [models, selections, fetchModelStats, userId, updateCurrentSentence, pauseAllAudio]);

  const handlePrevious = useCallback(() => {
    setCurrentFileIndex((prevIndex) => {
      if (prevIndex > 0) {
        updateCurrentSentence(prevIndex - 1);
        return prevIndex - 1;
      }
      return prevIndex;
    });
    pauseAllAudio();
  }, [updateCurrentSentence, pauseAllAudio]);

  const handleNameSubmit = useCallback(() => {
    if (inputName.trim()) {
      const newUserId = inputName.trim();
      localStorage.setItem('userName', newUserId);
      setUserId(newUserId);
      setDialogOpen(false);
    }
  }, [inputName]);

  const handleResetName = useCallback(() => {
    localStorage.removeItem('userName');
    setUserId('');
    setInputName('');
    setDialogOpen(true);
  }, []);

  const currentFiles = useMemo(() => {
    return models.map(model => model.files[currentFileIndex]).filter(Boolean);
  }, [models, currentFileIndex]);

  const getDisplayName = useCallback((modelName: string, index: number) => {
    return isAnonymousMode ? `Model ${index + 1}` : modelName;
  }, [isAnonymousMode]);

  const handleAnonymousModeToggle = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.checked;
    setIsAnonymousMode(newValue);
    localStorage.setItem('isAnonymousMode', String(newValue));
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const modelsResponse = await axios.get(`${API_BASE_URL}/audio/models`);
        setModels(modelsResponse.data);
        
        if (!shuffleMappings[0]) {
          generateShuffleMapping(modelsResponse.data.length, 0);
        }
        
        if (modelsResponse.data[0]?.files[0]?.sentence) {
          setCurrentSentence(modelsResponse.data[0].files[0].sentence);
        }
      } catch (error) {
        console.error('Failed to initialize app:', error);
      }
    };

    initializeApp();
  }, [generateShuffleMapping, shuffleMappings]);

  useEffect(() => {
    if (models.length > 0 && !shuffleMappings[currentFileIndex]) {
      generateShuffleMapping(models.length, currentFileIndex);
    }
  }, [currentFileIndex, models.length, shuffleMappings, generateShuffleMapping]);

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
        
        <Box display="flex" justifyContent="center" mb={2}>
          <FormControlLabel
            control={
              <Checkbox
                checked={isAnonymousMode}
                onChange={handleAnonymousModeToggle}
                color="primary"
              />
            }
            label="Hide model names"
          />
        </Box>

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
          {models.map((_, displayIndex) => {
            const currentMapping = shuffleMappings[currentFileIndex];
            if (!currentMapping) return null;
            
            const originalIndex = currentMapping[displayIndex];
            const model = models[originalIndex];
            
            return (
              <Grid 
                item 
                xs={12}
                sm={6}
                lg={6}
                key={`${model.name}-${currentFileIndex}-${displayIndex}`}
                style={{ width: '100%' }}
              >
                <StyledPaper onClick={() => handleModelSelection(displayIndex)}>
                  <Box p={3} position="relative">
                    {selections[currentFileIndex] === model.name && (
                      <SelectedModelIndicator>Selected</SelectedModelIndicator>
                    )}
                    <Typography variant="h6" color="secondary" gutterBottom>
                      {getDisplayName(model.name, displayIndex)}
                    </Typography>
                    {currentFiles[originalIndex] && (
                      <Box mt={2}>
                        <Typography variant="body1" color="textSecondary">
                          {currentFiles[originalIndex].name}
                        </Typography>
                        <StyledAudioPlayer
                          ref={(element: any) => {
                            if (element && element.audio) {
                              audioRefs.current[originalIndex] = element.audio.current;
                            }
                          }}
                          src={getAudioUrl(currentFiles[originalIndex].path)}
                          onError={(e: Event) => {
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
            );
          })}
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
            disabled={currentFileIndex === models[0].files.length - 1 && !selections[currentFileIndex]}
          >
            {currentFileIndex === models[0].files.length - 1 ? 'Show Results' : 'Next'}
          </NavigationButton>
        </NavigationContainer>
        <StatsDialog 
          open={showStats}
          onClose={() => {
            setShowStats(false);
            setCurrentFileIndex(0);
            setSelections({});
          }}
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
