import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';


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