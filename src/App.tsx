import { useState, useEffect, useCallback, useMemo } from "react";
import useLocalStorageState from "use-local-storage-state";
import styled from "styled-components";
import {
  Typography,
  Radio,
  RadioGroup,
  FormControlLabel,
  Paper,
  Box,
  Button,
  Grid,
} from "@mui/material";
import AudioPlayer from 'react-h5-audio-player';
import 'react-h5-audio-player/lib/styles.css';

interface AudioFile {
  name: string;
  path: string;
}

interface Model {
  name: string;
  folderPath: string;
  files: AudioFile[];
}

const AppContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 2rem;
`;

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

function App() {
  const [storageVersion] = useLocalStorageState<number>("tts_models_version", {
    defaultValue: STORAGE_VERSION,
  });

  const [models, setModels] = useLocalStorageState<Model[]>("tts_models", {
    defaultValue: initialModels,
  });

  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

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
  }, [models]);

  const handlePrevious = useCallback(() => {
    setCurrentFileIndex((prevIndex) => {
      if (prevIndex > 0) {
        return prevIndex - 1;
      }
      return prevIndex;
    });
    setSelectedModel(null);
  }, []);

  const currentFiles = useMemo(() => {
    return models.map(model => model.files[currentFileIndex]).filter(Boolean);
  }, [models, currentFileIndex]);

  if (models.length === 0) {
    return <Typography>Loading models...</Typography>;
  }

  return (
    <AppContainer>
      <Typography variant="h4" component="h1" gutterBottom>
        TTS Model Comparison
      </Typography>
      <Grid container spacing={2}>
        {models.map((model, index) => (
          <Grid item xs={6} key={model.name}>
            <Paper>
              <Box p={2}>
                <Typography variant="h6">{model.name}</Typography>
                {currentFiles[index] && (
                  <Box mt={2}>
                    <Typography variant="body1">{currentFiles[index].name}</Typography>
                    <AudioPlayer
                      src={getAudioUrl(currentFiles[index].path)}
                      onError={(e: any) => {
                        console.error("Error loading audio:", e);
                      }}
                      style={{ borderRadius: '4px' }}
                    />
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Box mt={2}>
        <RadioGroup
          row
          value={selectedModel || ""}
          onChange={(e) => handleModelSelection(e.target.value)}
        >
          <Typography variant="body1" component="span" style={{ marginRight: '1rem' }}>
            Preferred model:
          </Typography>
          {models.map((model) => (
            <FormControlLabel
              key={model.name}
              value={model.name}
              control={<Radio />}
              label={model.name}
            />
          ))}
        </RadioGroup>
      </Box>
      <Box mt={2} display="flex" justifyContent="space-between">
        <Button variant="contained" onClick={handlePrevious} disabled={currentFileIndex === 0}>
          Previous
        </Button>
        <Button 
          variant="contained" 
          onClick={handleNext} 
          disabled={currentFileIndex === models[0].files.length - 1}
        >
          Next
        </Button>
      </Box>
    </AppContainer>
  );
}

export default App;
