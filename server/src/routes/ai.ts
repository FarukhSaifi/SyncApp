import { Router } from 'express';
import { authenticateToken } from '../utils/auth';
import * as aiController from '../controllers/aiController';

const router: Router = Router();

// All AI routes require authentication
router.post('/outline', authenticateToken, aiController.postOutline);
router.post('/draft', authenticateToken, aiController.postDraft);
router.post('/generate', authenticateToken, aiController.postGenerate);
router.post('/generate-image', authenticateToken, aiController.postGenerateImage);

export default router;
