import { Router } from 'express';
import {
  runWorkflow,
  getExecution,
  deleteExecution,
  getUserExecutions,
  getWorkflowExecutions
} from '../controllers/execution.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/all', authenticate, getUserExecutions);
router.post('/:workflowId/run', authenticate, runWorkflow);
router.get('/:executionId', authenticate, getExecution);
router.delete('/:executionId', authenticate, deleteExecution);
router.get('/workflow/:workflowId', authenticate, getWorkflowExecutions);

export default router;