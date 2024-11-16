import express from 'express';
import { 
  saveComparisons,
  getModelStats 
} from '../controllers/userStateController';

export const router = express.Router();

router.post('/:userId/comparisons', saveComparisons);
router.get('/stats/models', getModelStats);