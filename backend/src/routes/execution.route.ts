import { Router } from 'express';
import prisma from '../config/prisma';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/:id', authenticate, async (req: any, res: any) => {
  try {
    const execution = await prisma.execution.findUnique({
      where: { id: req.params.id },
    });

    if (!execution) {
      return res.status(404).json({ message: 'Not found' });
    }

    res.json(execution);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;