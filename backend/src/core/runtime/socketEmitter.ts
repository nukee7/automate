import { getIO } from "../../config/socket";

export class SocketWorkflowEmitter {

  emit(executionId: string, payload: any) {
    try {
      const io = getIO();
      io.to(executionId).emit("execution:event", payload);
    } catch {
      // Worker environment has no socket server
      // So we silently skip websocket emission
      return;
    }
  }
}