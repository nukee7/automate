import { Bot, GripVertical, Mail, Webhook, Github, MessageSquare, Zap, Cpu, Send } from "lucide-react";

const nodeCategories = [
  {
    label: "Triggers",
    description: "Start your workflow",
    icon: Zap,
    color: "text-green-400",
    bgColor: "bg-green-400/10",
    borderColor: "border-green-400/20",
    nodes: [
      { type: "github_trigger", label: "GitHub", icon: Github, description: "Trigger on GitHub events" },
      { type: "slack_trigger", label: "Slack", icon: MessageSquare, description: "Trigger on Slack events" },
      { type: "webhook_trigger", label: "Webhook", icon: Webhook, description: "Generic HTTP POST trigger" },
    ],
  },
  {
    label: "Process",
    description: "Transform & analyze",
    icon: Cpu,
    color: "text-blue-400",
    bgColor: "bg-blue-400/10",
    borderColor: "border-blue-400/20",
    nodes: [
      { type: "ai", label: "AI", icon: Bot, description: "Run AI inference" },
    ],
  },
  {
    label: "Output",
    description: "Send results",
    icon: Send,
    color: "text-orange-400",
    bgColor: "bg-orange-400/10",
    borderColor: "border-orange-400/20",
    nodes: [
      { type: "email", label: "Email", icon: Mail, description: "Send an email" },
    ],
  },
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
      <div className="flex-1 overflow-y-auto">
        {nodeCategories.map((category) => (
          <div key={category.label}>
            {/* Category header */}
            <div className="px-4 py-2.5 flex items-center gap-2 border-b border-border/50">
              <category.icon className={`w-3.5 h-3.5 ${category.color}`} />
              <div>
                <p className={`text-[11px] font-semibold uppercase tracking-wider ${category.color}`}>
                  {category.label}
                </p>
                <p className="text-[9px] text-muted-foreground/50">{category.description}</p>
              </div>
            </div>

            {/* Nodes */}
            <div className="p-2 space-y-1.5">
              {category.nodes.map((node) => (
                <div
                  key={node.type}
                  draggable
                  onDragStart={(e) => onDragStart(e, node.type)}
                  className={`group flex items-center gap-3 p-2.5 rounded-lg bg-card border ${category.borderColor} cursor-grab active:cursor-grabbing hover:border-primary/30 hover:bg-secondary transition-all`}
                >
                  <div className={`w-7 h-7 rounded-md ${category.bgColor} flex items-center justify-center shrink-0`}>
                    <node.icon className={`w-3.5 h-3.5 ${category.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{node.label}</p>
                    <p className="text-[9px] text-muted-foreground">{node.description}</p>
                  </div>
                  <GripVertical className="w-3 h-3 text-muted-foreground/30 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Flow guide */}
        <div className="px-4 py-3 border-t border-border/50">
          <p className="text-[9px] text-muted-foreground/40 uppercase tracking-wider font-medium mb-2">Flow</p>
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50">
            <span className="text-green-400">Trigger</span>
            <span>→</span>
            <span className="text-blue-400">Process</span>
            <span>→</span>
            <span className="text-orange-400">Output</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodePalette;
