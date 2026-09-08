const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const aiOrchestrator = require('../controllers/aiOrchestrator');
const { verifyToken } = require('../middleware/auth');

// Auth routes
router.post('/auth/login', authController.login);
router.post('/auth/demo-login', authController.demoLogin);

// Profile routes
router.get('/profile', verifyToken, profileController.getProfile);
router.post('/profile', verifyToken, profileController.updateProfile);

// AI Orchestrator routes
router.post('/chat', verifyToken, aiOrchestrator.handleChat);
router.post('/recommendations', verifyToken, aiOrchestrator.getRecommendations);
router.post('/market-analysis', verifyToken, aiOrchestrator.analyzeMarket);
router.get('/competitors', verifyToken, aiOrchestrator.getCompetitors);
router.post('/financial-analysis', verifyToken, aiOrchestrator.structureFinances);
router.post('/scheme-matching', verifyToken, aiOrchestrator.evaluateSchemes);
router.post('/simulation', verifyToken, aiOrchestrator.simulateWhatIf);
router.post('/rag/search', verifyToken, aiOrchestrator.searchRAG);

// Meta data routes
router.get('/catalog', aiOrchestrator.getCatalog);
router.get('/locations', aiOrchestrator.getLocations);

module.exports = router;
