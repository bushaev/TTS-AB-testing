import express from 'express';
import { 
  saveUserState, 
  getUserState, 
  saveComparison,
  getModelStats 
} from '../controllers/userStateController';

export const router = express.Router();

router.post('/:userId', saveUserState);
router.get('/:userId', getUserState);
router.post('/:userId/comparison', saveComparison);
router.get('/stats/models', getModelStats);