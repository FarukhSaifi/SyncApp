import { Router } from 'express';
import * as controller from '../controllers/credentialsController';

const router: Router = Router();

router.get('/', controller.list);
router.get('/:platform', controller.get);
router.put('/:platform', controller.upsert);
router.delete('/:platform', controller.remove);

export default router;
