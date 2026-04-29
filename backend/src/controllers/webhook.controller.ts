import { Request, Response } from 'express';
import * as workflowService from '../services/workflow.service';
import { executionService } from '../services/execution.service';
import { getIO } from '../config/socket';

export const ingestWebhook = async (req: Request, res: Response) => {
  try {
    const token = req.params.token as string;

    const workflow = await workflowService.getWorkflowByToken(token);

    if (!workflow || !workflow.isActive) {
      return res.status(404).json({ error: 'Webhook not found' });
    }

    const executionId = await executionService.start(
      workflow.id,
      workflow.userId,
      req.body
    );

    // Notify any frontend clients watching this workflow
    const io = getIO();
    io.to(`workflow:${workflow.id}`).emit('workflow:new-execution', {
      executionId,
      workflowId: workflow.id,
    });

    return res.status(202).json({ executionId });
  } catch {
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
};
