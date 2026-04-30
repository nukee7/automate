import { X } from "lucide-react";
import { useWorkflowStore } from "@/store/workflowStore";

const NodeDeleteButton = ({ nodeId }: { nodeId: string }) => {
  const { nodes, edges, setNodes, setEdges, selectNode } = useWorkflowStore();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNodes(nodes.filter((n) => n.id !== nodeId));
    setEdges(edges.filter((e) => e.source !== nodeId && e.target !== nodeId));
    selectNode(null);
  };

  return (
    <button
      onClick={handleDelete}
      className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground/50 hover:text-status-error hover:border-status-error/50 transition-colors opacity-0 group-hover:opacity-100 z-10"
    >
      <X className="w-3 h-3" />
    </button>
  );
};

export default NodeDeleteButton;
