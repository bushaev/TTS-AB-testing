import { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';

const STATE_DIR = path.join(__dirname, '../../data/state');
const COMPARISONS_FILE = path.join(STATE_DIR, 'comparisons.json');

interface UserState {
  userId: string;
  currentFileIndex: number;
  selectedModel: string | null;
  lastUpdated: Date;
  comparisons: Array<{
    fileIndex: number;
    selectedModel: string;
    timestamp: Date;
  }>;
}

interface ModelStats {
  totalComparisons: number;
  modelSelections: Record<string, number>;
}

// In-memory storage
const userStates = new Map<string, UserState>();

interface Comparison {
  userId: string;
  selectedModel: string;
  fileIndex: number;
  timestamp: number;
}

// Initialize the comparisons file if it doesn't exist
const initializeComparisons = async () => {
  try {
    await fs.mkdir(STATE_DIR, { recursive: true });
    try {
      await fs.access(COMPARISONS_FILE);
    } catch {
      await fs.writeFile(COMPARISONS_FILE, JSON.stringify([]));
    }
  } catch (error) {
    console.error('Error initializing comparisons:', error);
  }
};

initializeComparisons();

export const getUserState = (req: Request, res: Response) => {
  const { userId } = req.params;
  const state = userStates.get(userId);
  
  if (!state) {
    const initialState = {
      userId,
      currentFileIndex: 0,
      selectedModel: null,
      lastUpdated: new Date(),
      comparisons: [],
    };
    userStates.set(userId, initialState);
    return res.json(initialState);
  }
  
  res.json(state);
};

export const saveUserState = (req: Request, res: Response) => {
  const { userId } = req.params;
  const { currentFileIndex, selectedModel } = req.body;
  
  let state = userStates.get(userId) || {
    userId,
    currentFileIndex: 0,
    selectedModel: null,
    lastUpdated: new Date(),
    comparisons: [],
  };
  
  if (selectedModel && selectedModel !== state.selectedModel) {
    state.comparisons.push({
      fileIndex: currentFileIndex,
      selectedModel,
      timestamp: new Date(),
    });
  }
  
  state = {
    ...state,
    currentFileIndex,
    selectedModel,
    lastUpdated: new Date(),
  };
  
  userStates.set(userId, state);
  res.json(state);
};

export const saveComparison = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const { selectedModel, fileIndex } = req.body;

    const comparison: Comparison = {
      userId,
      selectedModel,
      fileIndex,
      timestamp: Date.now()
    };

    const comparisonsStr = await fs.readFile(COMPARISONS_FILE, 'utf-8');
    const comparisons: Comparison[] = JSON.parse(comparisonsStr);
    comparisons.push(comparison);
    await fs.writeFile(COMPARISONS_FILE, JSON.stringify(comparisons, null, 2));

    res.status(200).json({ message: 'Comparison saved successfully' });
  } catch (error) {
    console.error('Error saving comparison:', error);
    res.status(500).json({ error: 'Failed to save comparison' });
  }
};

export const getModelStats = async (req: Request, res: Response) => {
  try {
    const comparisonsStr = await fs.readFile(COMPARISONS_FILE, 'utf-8');
    const comparisons: Comparison[] = JSON.parse(comparisonsStr);

    const modelSelections: Record<string, number> = {};
    comparisons.forEach(comparison => {
      modelSelections[comparison.selectedModel] = (modelSelections[comparison.selectedModel] || 0) + 1;
    });

    res.json({
      totalComparisons: comparisons.length,
      modelSelections
    });
  } catch (error) {
    console.error('Error getting model stats:', error);
    res.status(500).json({ error: 'Failed to get model stats' });
  }
}; 