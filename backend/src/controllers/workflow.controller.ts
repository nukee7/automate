import { Request, Response } from 'express';
import * as workflowService from '../services/workflow.service';

export const createWorkflow = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId as string;

    const workflow = await workflowService.createWorkflow(
      req.body,
      userId
    );

    return res.status(201).json(workflow);
  } catch {
    return res.status(500).json({
      error: 'Failed to create workflow'
    });
  }
};

export const getUserWorkflows = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId as string;
    const workflows = await workflowService.getUserWorkflows(userId);
    return res.json(workflows);
  } catch {
    return res.status(500).json({
      error: 'Failed to fetch workflows'
    });
  }
};

export const updateWorkflow = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId as string;
    const id = req.params.id as string;

    const workflow = await workflowService.updateWorkflow(id, req.body, userId);
    return res.json(workflow);
  } catch {
    return res.status(500).json({
      error: 'Failed to update workflow'
    });
  }
};

export const deleteWorkflow = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).userId as string;
    const id = req.params.id as string;
    await workflowService.deleteWorkflow(id, userId);
    return res.json({ success: true });
  } catch {
    return res.status(500).json({
      error: 'Failed to delete workflow'
    });
  }
};

export const getWorkflow = async (
  req: Request,
  res: Response
) => {
  try {
    const workflow = await workflowService.getWorkflow(
      req.params.id as string
    );

    if (!workflow) {
      return res.status(404).json({
        error: 'Workflow not found'
      });
    }

    return res.json(workflow);
  } catch {
    return res.status(500).json({
      error: 'Failed to fetch workflow'
    });
  }
};