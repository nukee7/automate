import axios from "axios";

const API = "http://localhost:8000/api";

let token: string;
let workflowId: string;
let executionId: string;

async function login() {
  const res = await axios.post(`${API}/auth/login`, {
    email: "nikhil@test.com",
    password: "123456"
  });

  token = res.data.token;

  console.log("Login success");
}

async function createWorkflow() {
  const workflow = {
    name: "AI Test Workflow",
    description: "Simple AI workflow",
    definition: {
      nodes: [
        {
          id: "node1",
          type: "ai",
          config: {
            prompt: "Say hello"
          }
        }
      ],
      edges: []
    }
  };

  const res = await axios.post(
    `${API}/workflows`,
    workflow,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  workflowId = res.data.id;

  console.log("Workflow created:", workflowId);
}

async function executeWorkflow() {
  const res = await axios.post(
    `${API}/executions/${workflowId}/run`,
    {},
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  executionId = res.data.executionId;

  console.log("Execution started:", executionId);
}

async function checkExecution() {
  await new Promise((r) => setTimeout(r, 4000));

  const res = await axios.get(
    `${API}/executions/${executionId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  console.log("Execution result:", res.data);
}

async function runTest() {
  try {
    await login();
    await createWorkflow();
    await executeWorkflow();
    await checkExecution();

    console.log("Test completed successfully");
  } catch (err: any) {
    console.error("Test failed:", err.response?.data || err.message);
  }
}

runTest();