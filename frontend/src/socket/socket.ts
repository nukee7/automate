import { io, Socket } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      // Skip HTTP long-polling — Render's proxy resets held-open polling
      // connections over HTTP/2 (ERR_HTTP2_PING_FAILED / ERR_CONNECTION_RESET).
      // WebSocket connects directly and is supported on Render.
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
      auth: { token: localStorage.getItem("token") },
    });
  }
  return socket;
};

export const subscribeToExecution = (executionId: string) => {
  const s = getSocket();
  s.emit("execution:subscribe", executionId);
};

export const subscribeToWorkflow = (workflowId: string) => {
  const s = getSocket();
  s.emit("workflow:subscribe", workflowId);
};

export const unsubscribeFromWorkflow = (workflowId: string) => {
  const s = getSocket();
  s.emit("workflow:unsubscribe", workflowId);
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
