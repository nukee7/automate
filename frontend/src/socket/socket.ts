import { io, Socket } from "socket.io-client";

const SOCKET_URL = "http://localhost:8000";

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
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

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
