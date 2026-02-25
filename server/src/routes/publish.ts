import { Router } from 'express';
import * as controller from '../controllers/publishController';

const router: Router = Router();

router.post('/medium', controller.publishMedium);
router.post('/devto', controller.publishDevto);
router.post('/wordpress', controller.publishWordpress);
router.post('/all', controller.publishAll);
router.get('/medium/status/:postId', controller.statusMedium);

// Unpublish from specific platform
router.delete('/:platform/:postId', controller.unpublishPlatform);

export default router;
