# Automate

**Webhook-driven workflow automation engine.** Build workflows visually, trigger them from external services (GitHub, Slack), and watch nodes execute in real-time.

![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=fff)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=fff)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=000)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=fff)
![Redis](https://img.shields.io/badge/Redis-DC382D?logo=redis&logoColor=fff)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=fff)

---

## Architecture

```
External Service                    Frontend (React + ReactFlow)
     │                                       ▲
     │ POST /webhooks/:token                 │ Socket.IO (real-time)
     ▼                                       │
┌─────────────────────────────────────────────┤
│              Express Backend                │
│  Webhook Controller → Execution Service     │
│         │                    │              │
│         │ emit               │ enqueue      │
│         ▼                    ▼              │
│    Socket.IO           BullMQ (Redis)       │
│    Server                    │              │
└──────────────────────────────┤──────────────┘
                               │ dequeue
                               ▼
                    ┌─────────────────────┐
                    │   Worker Process    │
                    │                     │
                    │  Execution Processor│
                    │       ▼             │
                    │  Workflow Executor  │
                    │  (topological sort) │
                    │       ▼             │
                    │  Node Registry      │──── job.updateProgress()
                    │  ┌───────────────┐  │         │
                    │  │Trigger│AI│Email│  │         ▼
                    │  └───────────────┘  │    Socket Bridge
                    └─────────┬───────────┘    (BullMQ → Socket.IO)
                              │
                              ▼
                         PostgreSQL
```

## Features

### Triggers (Start)
- **GitHub Trigger** — Parses push, PR, issue, and comment events with field extraction
- **Slack Trigger** — Parses message, reaction, and app_mention events
- **Generic Webhook** — Accepts any JSON payload via HTTP POST

### Process (Transform)
- **AI Node** — Multi-provider support (OpenAI, Gemini, Anthropic Claude) with runtime provider/model selection, user-supplied API keys, and automatic upstream data injection

### Output (Send)
- **Email Node** — MIME-compliant email via sendmail with template expression support

### Platform
- **Visual DAG Builder** — Drag-and-drop canvas with ReactFlow
- **Real-time Execution** — Per-node status and output streaming via WebSocket
- **Execution History** — View past runs with full logs and node outputs
- **Workflow Management** — Create, update, delete, and load workflows
- **Expression Engine** — `{{ node.node_1.payload.field }}` template syntax for inter-node data flow

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, ReactFlow, Zustand, Socket.IO Client, Tailwind CSS |
| Backend | Express, Socket.IO Server, Prisma ORM |
| Worker | BullMQ (separate process) |
| Queue | Redis |
| Database | PostgreSQL |
| AI Providers | OpenAI API, Google Gemini, Anthropic Claude (via axios) |
| Infrastructure | Docker, Docker Compose |

## How It Works

### 1. Webhook Ingestion
External services POST to `/api/webhooks/:token`. The controller validates the token, extracts source-specific headers (`x-github-event`), and enqueues a BullMQ job. Returns `202 Accepted` immediately.

### 2. Async Execution
The worker dequeues the job, fetches the workflow definition from PostgreSQL, and runs the **Workflow Executor**:
- **Topological sort** (DFS) determines node execution order
- Each node is looked up from the **Node Registry** by type string (plugin pattern)
- Nodes run sequentially with per-node retry and partial failure recovery
- Outputs accumulate in `context.data[nodeId]` for downstream access

### 3. Real-time Streaming
After each node executes, the worker calls `job.updateProgress()`. The **Socket Bridge** in the API server process catches these via BullMQ's QueueEvents (Redis pub/sub) and re-emits them to the correct Socket.IO room. The frontend subscribes and updates the canvas in real-time.

### 4. Live Webhook Detection
When a workflow is open on the canvas, the frontend joins a `workflow:<id>` socket room. When a webhook triggers, the backend emits `workflow:new-execution` to that room. The frontend auto-subscribes to the execution and watches nodes light up — no polling, no manual refresh.

## Key Design Patterns

| Pattern | Where |
|---------|-------|
| Plugin/Registry | `NodeRegistry` — type string → node implementation |
| Strategy | `PROVIDERS` in AI Node — config selects provider at runtime |
| Producer-Consumer | BullMQ queue between API server and worker |
| Pub/Sub Bridge | Socket Bridge — BullMQ events → Socket.IO rooms |
| DAG Execution | Topological sort for dependency-aware node ordering |
| Template Engine | Expression resolver — `{{ }}` syntax with dot-path walking |
| Graceful Degradation | Partial context saved on failure |

## Project Structure

```
backend/
├── src/
│   ├── index.ts                    # API server entry
│   ├── worker.ts                   # BullMQ worker (separate process)
│   ├── core/
│   │   ├── engine/
│   │   │   ├── workflow.executor.ts    # Topo sort + node execution loop
│   │   │   └── execution.processor.ts  # DB wrapper + partial failure
│   │   ├── nodes/
│   │   │   ├── base.node.ts            # BaseNode interface
│   │   │   ├── ai.node.ts             # Multi-provider AI
│   │   │   ├── email.node.ts          # Sendmail
│   │   │   ├── github_trigger.node.ts # GitHub event parser
│   │   │   ├── slack_trigger.node.ts  # Slack event parser
│   │   │   └── webhook_trigger.node.ts# Generic webhook
│   │   ├── registry/
│   │   │   ├── node.registry.ts       # Singleton Map registry
│   │   │   └── register.node.ts       # Registration at startup
│   │   ├── expressions/
│   │   │   └── resolver.ts            # {{ }} template engine
│   │   └── queue/
│   │       ├── socketBridge.ts        # BullMQ → Socket.IO relay
│   │       ├── workflow.ts            # Queue config
│   │       └── redis.ts              # Redis connection
│   ├── controllers/                   # Route handlers
│   ├── services/                      # Business logic
│   ├── routes/                        # Express routes
│   └── middlewares/                   # JWT auth
frontend/
├── src/
│   ├── pages/AutomationPage.tsx       # Main page + socket wiring
│   ├── components/
│   │   ├── WorkflowCanvas.tsx         # ReactFlow canvas
│   │   ├── NodeConfigPanel.tsx        # n8n-style config modal
│   │   ├── NodePalette.tsx            # Categorized node sidebar
│   │   ├── RightSidebar.tsx           # Workflow + execution history
│   │   ├── ExecutionLogs.tsx          # Live log panel
│   │   ├── AINode.tsx                 # AI node component
│   │   ├── EmailNode.tsx              # Email node component
│   │   ├── GithubNode.tsx             # GitHub trigger component
│   │   ├── SlackNode.tsx              # Slack trigger component
│   │   └── WebhookNode.tsx            # Generic webhook component
│   ├── store/
│   │   ├── workflowStore.ts           # Nodes, edges, workflow state
│   │   └── executionStore.ts          # Execution status, outputs, logs
│   └── socket/socket.ts              # Socket.IO client
```

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+

### Run
```bash
docker compose up --build -d
```

### Access
- **Frontend:** http://localhost:8080
- **Backend API:** http://localhost:8000
- **Prisma Studio:** `docker compose exec backend npx prisma studio`

### Connect a Webhook
1. Create a workflow with a trigger node on the canvas
2. Save the workflow — a webhook URL is generated
3. Paste the URL in GitHub (Settings → Webhooks) or any external service
4. Push a commit — watch the workflow execute in real-time on the canvas

## License

This is a webhook test-1 commit.
