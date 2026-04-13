import express from 'express';
import { getLiveMatches } from '../controllers/sportsController.js';

const router = express.Router();

// GET /api/sports/live
router.get('/live', getLiveMatches);

export default router;