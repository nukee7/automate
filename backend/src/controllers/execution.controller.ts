import { Request, Response } from 'express';
import { executionService } from '../services/execution.service';

/**
 * Run Workflow
 */
export const runWorkflow = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId as string;
    const workflowId = req.params.workflowId as string;

    const executionId = await executionService.start(
      workflowId,
      userId
    );

    return res.status(202).json({ executionId });
  } catch (error) {
    return res.status(500).json({
      error: 'Failed to start execution'
    });
  }
};

/**
 * Get Execution by executionId
 */
export const getExecution = async (
  req: Request,
  res: Response
) => {
  try {
    const executionId = req.params.executionId as string;

    const execution = await executionService.getExecution(
      executionId
    );

    if (!execution) {
      return res.status(404).json({
        error: 'Execution not found'
      });
    }

    return res.json(execution);
  } catch {
    return res.status(500).json({
      error: 'Failed to fetch execution'
    });
  }
};

/**
 * Delete an execution
 */
export const deleteExecution = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId as string;
    const executionId = req.params.executionId as string;
    await executionService.deleteExecution(executionId, userId);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({
      error: 'Failed to delete execution'
    });
  }
};

/**
 * Get all executions for the authenticated user
 */
export const getUserExecutions = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId as string;
    const executions = await executionService.getUserExecutions(userId);
    return res.json(executions);
  } catch {
    return res.status(500).json({
      error: 'Failed to fetch executions'
    });
  }
};

/**
 * Get all executions for a workflow
 */
export const getWorkflowExecutions = async (
  req: Request,
  res: Response
) => {
  try {
    const workflowId = req.params.workflowId as string;

    const executions =
      await executionService.getWorkflowExecutions(
        workflowId
      );

    return res.json(executions);
  } catch {
    return res.status(500).json({
      error: 'Failed to fetch executions'
    });
  }
};