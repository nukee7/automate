import { BaseNode } from './base.node';
import { ExecutionContext } from '../runtime/context';

export class GithubTriggerNode implements BaseNode {
  async run(context: ExecutionContext) {
    const raw = context.triggerPayload ?? {};
    const event = context.triggerHeaders?.['x-github-event'] || 'unknown';

    context.logs.push(`GitHub trigger: ${event}`);

    const parsed: Record<string, any> = {
      event,
      action: raw.action || null,
      repository: raw.repository?.full_name || null,
      sender: raw.sender?.login || null,
    };

    if (event === 'push') {
      parsed.ref = raw.ref || null;
      parsed.branch = raw.ref?.replace('refs/heads/', '') || null;
      parsed.commits = (raw.commits || []).map((c: any) => ({
        message: c.message,
        author: c.author?.name || c.author?.username,
        url: c.url,
        added: c.added,
        modified: c.modified,
        removed: c.removed,
      }));
      parsed.headCommit = raw.head_commit?.message || null;
      parsed.pusher = raw.pusher?.name || null;
      parsed.compareUrl = raw.compare || null;
    } else if (event === 'pull_request') {
      parsed.number = raw.pull_request?.number || null;
      parsed.title = raw.pull_request?.title || null;
      parsed.body = raw.pull_request?.body || null;
      parsed.state = raw.pull_request?.state || null;
      parsed.url = raw.pull_request?.html_url || null;
      parsed.author = raw.pull_request?.user?.login || null;
      parsed.base = raw.pull_request?.base?.ref || null;
      parsed.head = raw.pull_request?.head?.ref || null;
    } else if (event === 'issues') {
      parsed.number = raw.issue?.number || null;
      parsed.title = raw.issue?.title || null;
      parsed.body = raw.issue?.body || null;
      parsed.state = raw.issue?.state || null;
      parsed.url = raw.issue?.html_url || null;
      parsed.labels = (raw.issue?.labels || []).map((l: any) => l.name);
    } else if (event === 'issue_comment') {
      parsed.issueNumber = raw.issue?.number || null;
      parsed.issueTitle = raw.issue?.title || null;
      parsed.comment = raw.comment?.body || null;
      parsed.commentAuthor = raw.comment?.user?.login || null;
      parsed.url = raw.comment?.html_url || null;
    }

    // Always include raw payload for anything not parsed
    parsed.raw = raw;

    return {
      triggeredAt: new Date().toISOString(),
      ...parsed,
    };
  }
}
