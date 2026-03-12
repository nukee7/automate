import { nodeRegistry } from './node.registry';
import { AINode } from '../nodes/ai.node';
import { EmailNode } from '../nodes/email.node';
import { TriggerNode } from '../nodes/trigger.node';

// Register all nodes here

nodeRegistry.register('trigger', new TriggerNode());
nodeRegistry.register('ai', new AINode());
nodeRegistry.register('email', new EmailNode());