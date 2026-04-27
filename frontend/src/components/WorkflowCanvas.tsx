import { useCallback, useRef } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  EdgeChange,
  NodeChange,
  ReactFlowProvider,
  ReactFlowInstance,
} from "reactflow";
import "reactflow/dist/style.css";
import AINode from "./AINode";
import EmailNode from "./EmailNode";
import WebhookNode from "./WebhookNode";
import { useWorkflowStore } from "@/store/workflowStore";

const nodeTypes = { ai: AINode, email: EmailNode, webhook_trigger: WebhookNode };

let nodeId = 0;
const getId = () => `node_${++nodeId}`;

const WorkflowCanvasInner = () => {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance | null>(null);

  const nodes = useWorkflowStore((s) => s.nodes);
  const edges = useWorkflowStore((s) => s.edges);
  const setNodes = useWorkflowStore((s) => s.setNodes);
  const setEdges = useWorkflowStore((s) => s.setEdges);
  const selectNode = useWorkflowStore((s) => s.selectNode);

  const onConnect = useCallback(
    (params: Connection) => setEdges(addEdge({ ...params, animated: true }, edges)),
    [edges, setEdges]
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setNodes(applyNodeChanges(changes, nodes)),
    [nodes, setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => setEdges(applyEdgeChanges(changes, edges)),
    [edges, setEdges]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: any) => {
    selectNode(node.id);
  }, [selectNode]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type || !reactFlowInstance.current || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = reactFlowInstance.current.project({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      const defaultConfigs: Record<string, any> = {
        email: { to: "", from: "", cc: "", bcc: "", subject: "", message: "", html: "", retries: 0 },
        webhook_trigger: { retries: 0 },
        ai: { prompt: "", retries: 0 },
      };

      const labels: Record<string, string> = {
        email: "Email Node",
        webhook_trigger: "Webhook Trigger",
        ai: "AI Node",
      };

      const newNode = {
        id: getId(),
        type,
        position,
        data: {
          label: labels[type] || type,
          config: defaultConfigs[type] || { retries: 0 },
        },
      };

      setNodes(nodes.concat(newNode));
    },
    [nodes, setNodes]
  );

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onInit={(instance) => { reactFlowInstance.current = instance; }}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-canvas"
      >
        <Background color="hsl(220 14% 18%)" gap={20} size={1} />
        <Controls />
        <MiniMap
          nodeColor={() => "hsl(150 60% 50%)"}
          maskColor="rgba(0,0,0,0.7)"
        />
      </ReactFlow>
    </div>
  );
};

const WorkflowCanvas = () => (
  <ReactFlowProvider>
    <WorkflowCanvasInner />
  </ReactFlowProvider>
);

export default WorkflowCanvas;
