import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const STATE_DIR = path.join(__dirname, '../../data/state');
const COMPARISONS_FILE = path.join(STATE_DIR, 'comparisons.json');

interface Comparison {
  userId: string;
  fileIndex: number;
  selectedModel: string;
  timestamp: string;
}


// Read comparisons file
const readComparisons = async (): Promise<Comparison[]> => {
  try {
    const data = await fs.readFile(COMPARISONS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

// Write comparisons to file
const writeComparisons = async (comparisons: Comparison[]) => {
  await fs.writeFile(COMPARISONS_FILE, JSON.stringify(comparisons, null, 2));
};

// New function to save multiple comparisons
export const saveComparisons = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const newComparisons: Array<{ fileIndex: number; selectedModel: string }> = req.body;
    
    const existingComparisons = await readComparisons();
    
    // Remove previous comparisons for this user
    const filteredComparisons = existingComparisons.filter(c => c.userId !== userId);
    
    // Add new comparisons with timestamp
    const comparisonsToAdd = newComparisons.map(comparison => ({
      userId,
      fileIndex: comparison.fileIndex,
      selectedModel: comparison.selectedModel,
      timestamp: new Date().toISOString()
    }));
    
    const updatedComparisons = [...filteredComparisons, ...comparisonsToAdd];
    await writeComparisons(updatedComparisons);
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving comparisons:', error);
    res.status(500).json({ error: 'Failed to save comparisons' });
  }
};

export const getModelStats = async (_req: Request, res: Response) => {
  /**
   * Returns the number of times each model was selected and the number of times each model was selected for each file.
   */
  try {
    const comparisons = await readComparisons();
    
    // Calculate statistics
    const stats: Record<string, { total: number; byFile: Record<number, number> }> = {};
    
    comparisons.forEach(comparison => {
      if (!stats[comparison.selectedModel]) {
        stats[comparison.selectedModel] = { total: 0, byFile: {} };
      }
      
      stats[comparison.selectedModel].total++;
      
      if (!stats[comparison.selectedModel].byFile[comparison.fileIndex]) {
        stats[comparison.selectedModel].byFile[comparison.fileIndex] = 0;
      }
      stats[comparison.selectedModel].byFile[comparison.fileIndex]++;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting model stats:', error);
    res.status(500).json({ error: 'Failed to get model statistics' });
  }
};

export const getUserModelStats = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const comparisons = await readComparisons();
    
    // Filter comparisons for specific user
    const userComparisons = comparisons.filter(comp => comp.userId === userId);
    
    // Calculate statistics for user
    const stats: Record<string, { total: number; byFile: Record<number, number> }> = {};
    
    userComparisons.forEach(comparison => {
      if (!stats[comparison.selectedModel]) {
        stats[comparison.selectedModel] = { total: 0, byFile: {} };
      }
      
      stats[comparison.selectedModel].total++;
      
      if (!stats[comparison.selectedModel].byFile[comparison.fileIndex]) {
        stats[comparison.selectedModel].byFile[comparison.fileIndex] = 0;
      }
      stats[comparison.selectedModel].byFile[comparison.fileIndex]++;
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error getting user model stats:', error);
    res.status(500).json({ error: 'Failed to get user model statistics' });
  }
}; 