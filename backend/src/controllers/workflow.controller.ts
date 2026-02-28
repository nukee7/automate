import { Request, Response } from 'express';
import * as workflowService from '../services/workflow.service';

export const createWorkflow = async (req: Request, res: Response) => {
  const userId = (req as any).userId;

  const workflow = await workflowService.createWorkflow(
    req.body,
    userId
  );

  res.status(201).json(workflow);
};

export const getWorkflow = async (req: Request, res: Response) => {
  const workflow = await workflowService.getWorkflow(req.params.id);

  res.json(workflow);
};