import { BaseNode } from './base.node';
import { ExecutionContext } from '../runtime/context';

export class SlackTriggerNode implements BaseNode {
  async run(context: ExecutionContext) {
    const raw = context.triggerPayload ?? {};

    context.logs.push(`Slack trigger: ${raw.event?.type || raw.type || 'unknown'}`);

    // Slack sends different structures for different event types
    const event = raw.event || {};

    const parsed: Record<string, any> = {
      eventType: event.type || raw.type || null,
      channel: event.channel || null,
      user: event.user || null,
      text: event.text || null,
      timestamp: event.ts || null,
      threadTs: event.thread_ts || null,
      teamId: raw.team_id || null,
    };

    // Message event extras
    if (event.type === 'message') {
      parsed.subtype = event.subtype || null;
      parsed.botId = event.bot_id || null;
    }

    // Reaction events
    if (event.type === 'reaction_added' || event.type === 'reaction_removed') {
      parsed.reaction = event.reaction || null;
      parsed.itemChannel = event.item?.channel || null;
      parsed.itemTs = event.item?.ts || null;
    }

    // App mention
    if (event.type === 'app_mention') {
      parsed.text = event.text || null;
    }

    // Always include raw payload
    parsed.raw = raw;

    return {
      triggeredAt: new Date().toISOString(),
      ...parsed,
    };
  }
}
