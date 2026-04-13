const express = require('express');
const router = express.Router();
const { getLiveMatches } = require('../controllers/sportsController');

// GET /api/sports/live
router.get('/live', getLiveMatches);

module.exports = router;
