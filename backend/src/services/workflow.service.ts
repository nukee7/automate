import prisma from '../config/prisma';

export async function createWorkflow(data: any, userId: string) {
  return prisma.workflow.create({
    data: {
      name: data.name,
      description: data.description,
      definition: data.definition,
      userId
    }
  });
}

export async function getWorkflow(id: string) {
  return prisma.workflow.findUnique({
    where: { id }
  });
}