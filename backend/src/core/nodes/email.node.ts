import { BaseNode } from './base.node';
import { ExecutionContext } from '../runtime/context';
import { resolveExpressions } from '../expressions/resolver';
import { spawn } from 'child_process';

interface EmailNodeConfig {
  to?: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  from?: string;
  subject?: string;
  message?: string;
  html?: string;
}

export class EmailNode implements BaseNode {
  async run(
    context: ExecutionContext,
    config: Record<string, any>
  ) {
    const resolvedConfig = resolveExpressions(
      config,
      context.data
    ) as EmailNodeConfig;

    const to = this.normalizeRecipients(resolvedConfig.to);
    const cc = this.normalizeRecipients(resolvedConfig.cc);
    const bcc = this.normalizeRecipients(resolvedConfig.bcc);
    const from = (resolvedConfig.from || process.env.EMAIL_FROM || '').trim();
    const subject = (resolvedConfig.subject || 'Taskpilot notification').trim();
    const text = (resolvedConfig.message || '').trim();
    const html = (resolvedConfig.html || '').trim();

    if (to.length === 0) {
      throw new Error('Email Node: `to` recipient is required');
    }

    if (!from) {
      throw new Error('Email Node: `from` is required either in config or EMAIL_FROM env');
    }

    if (!text && !html) {
      throw new Error('Email Node: `message` or `html` content is required');
    }

    const rawEmail = this.buildEmail({
      to,
      cc,
      from,
      subject,
      text,
      html,
    });

    await this.sendWithSendmail(rawEmail);

    context.logs.push(`Email sent to ${to.join(', ')}`);

    return {
      success: true,
      to,
      cc,
      bcc,
      from,
      subject,
      transport: 'sendmail',
      preview: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
    };
  }

  private normalizeRecipients(
    input?: string | string[]
  ): string[] {
    if (!input) {
      return [];
    }

    if (Array.isArray(input)) {
      return input
        .map(value => value.trim())
        .filter(Boolean);
    }

    return input
      .split(',')
      .map(value => value.trim())
      .filter(Boolean);
  }

  private buildEmail({
    to,
    cc,
    from,
    subject,
    text,
    html,
  }: {
    to: string[];
    cc: string[];
    from: string;
    subject: string;
    text: string;
    html: string;
  }): string {
    const boundary = `taskpilot-${Date.now()}`;
    const headers = [
      `From: ${from}`,
      `To: ${to.join(', ')}`,
      cc.length ? `Cc: ${cc.join(', ')}` : '',
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      html
        ? `Content-Type: multipart/alternative; boundary="${boundary}"`
        : 'Content-Type: text/plain; charset="UTF-8"',
    ].filter(Boolean);

    if (!html) {
      return `${headers.join('\n')}\n\n${text}\n`;
    }

    const plainText = text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    return [
      ...headers,
      '',
      `--${boundary}`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      plainText,
      '',
      `--${boundary}`,
      'Content-Type: text/html; charset="UTF-8"',
      '',
      html,
      '',
      `--${boundary}--`,
      '',
    ].join('\n');
  }

  private sendWithSendmail(rawEmail: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const sendmailPath = process.env.SENDMAIL_PATH || '/usr/sbin/sendmail';
      const sendmail = spawn(sendmailPath, ['-t', '-i']);

      let stderr = '';

      sendmail.stderr.on('data', chunk => {
        stderr += chunk.toString();
      });

      sendmail.on('error', error => {
        reject(new Error(`Email Node: failed to start sendmail at ${sendmailPath}: ${error.message}`));
      });

      sendmail.on('close', code => {
        if (code === 0) {
          resolve();
          return;
        }

        reject(
          new Error(
            `Email Node: sendmail exited with code ${code}${stderr ? ` - ${stderr.trim()}` : ''}`
          )
        );
      });

      sendmail.stdin.write(rawEmail);
      sendmail.stdin.end();
    });
  }
}
