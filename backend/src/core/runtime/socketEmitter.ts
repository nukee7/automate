import { ExecutionEmitter } from './emitter';
import { io } from '../../index';

export class SocketEmitter implements ExecutionEmitter {
  emit(
    executionId: string,
    event: {
      nodeId: string;
      status: 'STARTED' | 'SUCCESS' | 'FAILED';
      output?: any;
      error?: string;
    }
  ) {
    io.to(executionId).emit('execution:update', event);
  }
}