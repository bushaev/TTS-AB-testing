import express from 'express';
import { 
  saveComparisons,
  getModelStats,
  getUserModelStats 
} from '../controllers/userStateController';

export const router = express.Router();

router.post('/:userId/comparisons', saveComparisons);
router.get('/stats/models', getModelStats);
router.get('/stats/:userId/models', getUserModelStats);