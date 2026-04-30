import { nodeRegistry } from './node.registry';
import { AINode } from '../nodes/ai.node';
import { EmailNode } from '../nodes/email.node';
import { TriggerNode } from '../nodes/trigger.node';
import { WebhookTriggerNode } from '../nodes/webhook_trigger.node';
import { GithubTriggerNode } from '../nodes/github_trigger.node';
import { SlackTriggerNode } from '../nodes/slack_trigger.node';

// Register all nodes here

nodeRegistry.register('trigger', new TriggerNode());
nodeRegistry.register('ai', new AINode());
nodeRegistry.register('email', new EmailNode());
nodeRegistry.register('webhook_trigger', new WebhookTriggerNode());
nodeRegistry.register('github_trigger', new GithubTriggerNode());
nodeRegistry.register('slack_trigger', new SlackTriggerNode());