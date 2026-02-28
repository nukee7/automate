import { WorkflowDefinition } from '../types/workflow';
import { nodeRegistry } from '../registry/node.registry';
import { ExecutionContext } from '../runtime/context';
import { randomUUID } from 'crypto';
import { ExecutionEmitter } from '../runtime/emitter';

export class WorkflowExecutor {
  constructor(
    private emitter?: ExecutionEmitter
  ) { }

  async execute(
    workflow: WorkflowDefinition,
    userId: string
  ): Promise<ExecutionContext> {
    const context: ExecutionContext = {
      executionId: randomUUID(),
      userId,
      data: {},
      logs: [],
    };

    context.logs.push('Execution started');

    const sortedNodes = this.topologicalSort(workflow);

    for (const node of sortedNodes) {
      const implementation = nodeRegistry.get(node.type);

      if (!implementation) {
        throw new Error(`No implementation for node ${node.type}`);
      }

      const retryCount = node.config?.retry ?? 0;
      const onFailure = node.config?.onFailure ?? 'STOP';

      this.emitter?.emit(context.executionId, {
        nodeId: node.id,
        status: 'STARTED',
      });

      let attempt = 0;
      let success = false;
      let lastError: any;

      while (attempt <= retryCount && !success) {
        try {
          attempt++;
          context.logs.push(
            `Executing node ${node.id}, attempt ${attempt}`
          );

          const output = await implementation.run(
            context,
            node.config
          );

          context.data[node.id] = output;

          this.emitter?.emit(context.executionId, {
            nodeId: node.id,
            status: 'SUCCESS',
            output,
          });

          success = true;
        } catch (error: any) {
          lastError = error;
          context.logs.push(
            `Node ${node.id} failed on attempt ${attempt}: ${error.message}`
          );
        }
      }

      if (!success) {
        this.emitter?.emit(context.executionId, {
          nodeId: node.id,
          status: 'FAILED',
          error: lastError?.message,
        });

        if (onFailure === 'STOP') {
          throw lastError;
        }
        // CONTINUE → move to next node
      }
    }

    context.logs.push('Execution completed');
    return context;
  }

  private topologicalSort(workflow: WorkflowDefinition) {
    const { nodes, edges } = workflow;

    const visited = new Set<string>();
    const result: typeof nodes = [];
    const adjacency = new Map<string, string[]>();

    for (const edge of edges) {
      if (!adjacency.has(edge.from)) {
        adjacency.set(edge.from, []);
      }
      adjacency.get(edge.from)!.push(edge.to);
    }

    const dfs = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      visited.add(nodeId);

      for (const neighbor of adjacency.get(nodeId) || []) {
        dfs(neighbor);
      }

      const node = nodes.find(n => n.id === nodeId);
      if (node) result.unshift(node);
    };

    for (const node of nodes) dfs(node.id);
    return result;
  }
}