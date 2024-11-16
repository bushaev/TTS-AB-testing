import express from 'express';
import path from 'path';
import fs from 'fs/promises';

const router = express.Router();
const AUDIO_DIR = path.join(__dirname, '../../audio');
const SENTENCES_PATH = path.join(AUDIO_DIR, 'sentences.txt');

interface AudioFile {
  name: string;
  path: string;
  sentence: string;
}

interface Model {
  name: string;
  folderPath: string;
  files: AudioFile[];
}

// Get all models and their audio files
router.get('/models', async (_req, res) => {
  try {
    // Read sentences file
    let sentences: string[] = [];
    try {
      const sentencesContent = await fs.readFile(SENTENCES_PATH, 'utf-8');
      sentences = sentencesContent.split('\n').filter(line => line.trim());
    } catch (error) {
      console.error('Error reading sentences file:', error);
      sentences = [];
    }

    // Read all directories in the audio folder
    const modelDirs = await fs.readdir(AUDIO_DIR);
    
    let sentenceIndex = 0; // Keep track of the current sentence index
    
    // Create model objects for each directory
    const modelsWithNull = await Promise.all(
      modelDirs.map(async (dir) => {
        const modelPath = path.join(AUDIO_DIR, dir);
        const stats = await fs.stat(modelPath);
        
        // Skip if not a directory
        if (!stats.isDirectory()) return null;

        // Read all files in the model directory
        const files = await fs.readdir(modelPath);
        const audioFiles = files
          .filter(file => file.endsWith('.wav') || file.endsWith('.mp3'))
          .map(file => {
            // Assign sentence and increment index, wrapping around if needed
            const sentence = sentences[sentenceIndex] || '';
            sentenceIndex = (sentenceIndex + 1) % Math.max(1, sentences.length);
            
            return {
              name: file,
              path: `${dir}/${file}`,
              sentence
            };
          });

        return {
          name: dir,
          folderPath: dir,
          files: audioFiles
        };
      })
    );

    // Filter out null values and send the models
    const models: Model[] = modelsWithNull.filter((model): model is Model => model !== null);
    res.json(models);
  } catch (error) {
    console.error('Error reading models:', error);
    res.status(500).json({ error: 'Failed to read models' });
  }
});

// Serve audio files
router.get('/file/:modelPath(*)', (req, res) => {
  const filePath = path.join(AUDIO_DIR, req.params.modelPath);
  res.sendFile(filePath);
});

export { router }; 