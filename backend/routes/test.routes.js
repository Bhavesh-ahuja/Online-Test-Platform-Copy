import express from 'express';
import { createTest, getAllTests, getTestById, submitTest, getTestResult, getMySubmissions, getTestSubmissions } from '../controllers/test.controller.js';
import { authenticateToken, isAdmin } from '../middleware/auth.middleware.js';

const router = express.Router();

// GET /api/tests - Anyone logged in can see tests
router.get('/', authenticateToken, getAllTests);

// POST /api/tests -Only ADMINS can create tests
router.post('/', authenticateToken, isAdmin, createTest);

// GET /api/tests/:id - Get a single test
router.get('/:id', authenticateToken, getTestById);

// Test Taking
router.post('/:id/submit', authenticateToken, submitTest);

// Results
router.get('/results/:submissionId', authenticateToken, getTestResult);

router.get('/my-submissions', authenticateToken, getMySubmissions);

// Admin only: Get all results for a specific test
router.get('/:id/submissions', authenticateToken, isAdmin, getTestSubmissions);

export default router;