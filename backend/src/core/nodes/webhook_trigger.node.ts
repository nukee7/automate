import { BaseNode } from './base.node';
import { ExecutionContext } from '../runtime/context';

export class WebhookTriggerNode implements BaseNode {
  async run(context: ExecutionContext, config: Record<string, any>) {
    const payload = context.triggerPayload ?? {};

    context.logs.push('Webhook trigger received');

    return {
      triggeredAt: new Date().toISOString(),
      payload,
    };
  }
}
