import { Router } from 'express';
import { createWorkflow, getWorkflow } from '../controllers/workflow.controller';
import { authMiddleware } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, createWorkflow);
router.get('/:id', authMiddleware, getWorkflow);

export default router;