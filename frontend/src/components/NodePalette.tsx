import { Bot, GripVertical, Mail, Webhook } from "lucide-react";

const nodeTypes = [
  { type: "webhook_trigger", label: "Webhook Trigger", icon: Webhook, description: "Trigger via HTTP POST" },
  { type: "ai", label: "AI Node", icon: Bot, description: "Run AI inference" },
  { type: "email", label: "Email Node", icon: Mail, description: "Send an email" },
];

const NodePalette = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="w-60 bg-panel border-r border-border flex flex-col h-full">
      <div className="px-4 py-3 border-b border-border">
        <h2 className="text-xs font-semibold text-foreground uppercase tracking-wider">Nodes</h2>
      </div>
      <div className="p-3 space-y-2 flex-1 overflow-y-auto">
        {nodeTypes.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className="group flex items-center gap-3 p-3 rounded-lg bg-card border border-border cursor-grab active:cursor-grabbing hover:border-primary/30 hover:bg-secondary transition-all"
          >
            <div className="w-8 h-8 rounded-md bg-accent/10 flex items-center justify-center shrink-0">
              <node.icon className="w-4 h-4 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">{node.label}</p>
              <p className="text-[10px] text-muted-foreground">{node.description}</p>
            </div>
            <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;
