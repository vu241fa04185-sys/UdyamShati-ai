const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const profileController = require('../controllers/profileController');
const aiOrchestrator = require('../controllers/aiOrchestrator');
const mapsController = require('../controllers/mapsController');
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
router.post('/nlp/parse', aiOrchestrator.parseNLP);

// Google Maps & Hyper-Local Intelligence routes
router.post('/maps/nearby', mapsController.getNearbyPlaces);
router.get('/maps/places', mapsController.getPlaces);
router.get('/maps/place/:placeId', mapsController.getPlaceDetails);
router.post('/maps/street-view', mapsController.checkStreetView);
router.post('/maps/directions', mapsController.getDirections);
router.post('/maps/market-analysis', mapsController.getMarketAnalysis);
router.get('/maps/categories', mapsController.getCategories);

module.exports = router;
