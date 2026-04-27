import express from 'express';
import dotenv from 'dotenv';
import http from 'http';

import authRoutes from './routes/auth.route';
import executionRoutes from './routes/execution.route';
import workflowRoutes from './routes/workflow.route';
import webhookRoutes from './routes/webhook.route';
import './core/registry/register.node';

import { initSocket } from './config/socket';
import { initSocketBridge } from './core/queue/socketBridge';
import type { Socket } from 'socket.io';

dotenv.config();

const app = express();
const allowedOrigin = process.env.FRONTEND_ORIGIN || 'http://localhost:8080';

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', allowedOrigin);
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
export const io = initSocket(server);

// Bridge BullMQ worker events to Socket.IO
initSocketBridge();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/webhooks', webhookRoutes);

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
