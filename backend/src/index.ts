import express from 'express';
import dotenv from 'dotenv';
import http from 'http';

import authRoutes from './routes/auth.route';
import executionRoutes from './routes/execution.route';
import workflowRoutes from './routes/workflow.route';

import { initSocket } from './config/socket';
import type { Socket } from 'socket.io';

dotenv.config();

const app = express();
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
export const io = initSocket(server);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/workflows', workflowRoutes);

app.get('/', (_, res) => {
  res.send('TaskPilot API Running');
});

// Socket Handler
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('execution:subscribe', (executionId: string) => {
    socket.join(executionId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 8000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on ${PORT}`);
});