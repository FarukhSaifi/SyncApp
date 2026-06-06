import { Router } from 'express';
import * as controller from '../controllers/publishController';
import { authenticateToken } from '../utils/auth';

const router: Router = Router();

router.use(authenticateToken);

router.post('/medium', controller.publishMedium);
router.post('/devto', controller.publishDevto);
router.post('/wordpress', controller.publishWordpress);
router.post('/all', controller.publishAll);
router.get('/medium/status/:postId', controller.statusMedium);

// Unpublish from specific platform
router.delete('/:platform/:postId', controller.unpublishPlatform);

export default router;
