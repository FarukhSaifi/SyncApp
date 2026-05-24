import { Router } from 'express';
import { authenticateToken } from '../utils/auth';
import * as aiController from '../controllers/aiController';

const router: Router = Router();

// All AI routes require authentication
router.post('/generate', authenticateToken, aiController.postGenerate);
router.post('/generate-image', authenticateToken, aiController.postGenerateImage);
router.post('/edit', authenticateToken, aiController.postEdit);

export default router;
