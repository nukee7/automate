import { WorkflowExecutionEmitter } from './emitter';
import { getIO } from '../../config/socket';

export class SocketWorkflowEmitter implements WorkflowExecutionEmitter {
  emit(
    executionId: string,
    event: {
      nodeId: string;
      status: 'STARTED' | 'SUCCESS' | 'FAILED';
      output?: any;
      error?: string;
    }
  ) {
    getIO().to(executionId).emit('execution:update', event);
  }
}