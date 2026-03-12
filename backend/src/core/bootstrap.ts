import { nodeRegistry } from './registry/node.registry';

import { TriggerNode } from './nodes/trigger.node';
import { AINode } from './nodes/ai.node';
import { EmailNode } from './nodes/email.node';

export function registerDefaultNodes() {
  nodeRegistry.register('trigger', new TriggerNode());
  nodeRegistry.register('ai', new AINode());
  nodeRegistry.register('email', new EmailNode());
}