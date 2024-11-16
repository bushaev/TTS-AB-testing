import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';

interface AudioFile {
  name: string;
  path: string;
}

interface Model {
  name: string;
  folderPath: string;
  files: AudioFile[];
}

export const getModels = async (_req: Request, res: Response) => {
  try {
    // In a real app, this would come from a database
    const models: Model[] = [
      {
        name: "Model A",
        folderPath: "model1",
        files: [
          { name: "sample1.wav", path: "model1/sample1.wav" },
          { name: "sample2.wav", path: "model1/sample2.wav" },
          { name: "sample3.wav", path: "model1/sample3.wav" },
        ],
      },
      // ... other models
    ];
    
    res.json(models);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch models' });
  }
};

export const getAudioFile = async (req: Request, res: Response) => {
  try {
    const { modelId, fileName } = req.params;
    const filePath = path.join(__dirname, `../../audio/${modelId}/${fileName}`);
    
    await fs.access(filePath);
    res.sendFile(filePath);
  } catch (error) {
    res.status(404).json({ error: 'Audio file not found' });
  }
}; 