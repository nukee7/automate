import { getIO } from '../../config/socket';
import { ExecutionEvent } from '../types/event';

export class SocketWorkflowEmitter {
  emit(executionId: string, event: ExecutionEvent) {
    const io = getIO();
    io.to(executionId).emit('execution:event', event);
  }
}