import { Router } from 'express';
import { createWorkflow, updateWorkflow, deleteWorkflow, getWorkflow, getUserWorkflows } from '../controllers/workflow.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.post('/', authenticate, createWorkflow);
router.get('/', authenticate, getUserWorkflows);
router.get('/:id', authenticate, getWorkflow);
router.put('/:id', authenticate, updateWorkflow);
router.delete('/:id', authenticate, deleteWorkflow);

export default router;