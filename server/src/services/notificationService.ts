import axios from "axios";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { Resend } from "resend";

import { config } from "../config";
import {
  NOTIFICATION_CHANNEL_STATUS,
  NOTIFICATION_COPY,
  NOTIFICATION_LINKS,
  type NotificationChannelStatus,
  type ScheduledPublishOutcome,
} from "../constants/notifications";
import type { NotificationResult, ScheduledPublishNotificationPayload } from "../types";
import { logger } from "../utils/logger";

dayjs.extend(utc);

const SLACK_ERROR_MAX_LEN = 280;

/** Escape text inserted into HTML email bodies. */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Prevent SMTP header injection in email subjects. */
function sanitizeEmailSubjectPart(value: string): string {
  return value.replace(/[\r\n]/g, " ").trim();
}

/** Allow only http(s) or same-app relative paths in email href attributes. */
function safeEmailHref(url: string): string {
  if (url.startsWith("/")) {
    return escapeHtml(url);
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return escapeHtml(parsed.href);
    }
  } catch {
    // reject javascript:, data:, and malformed URLs
  }
  return "#";
}

type SlackBlock = Record<string, unknown>;

function getClientAppBaseUrl(): string {
  const explicit = (config.canonicalBaseUrl || config.siteUrl || "").replace(/\/$/, "");
  if (explicit) return explicit;

  const corsOrigin = (config.corsOrigin || "").split(",")[0]?.trim().replace(/\/$/, "");
  return corsOrigin || "";
}

function buildEditorLink(postId: string): string {
  const base = getClientAppBaseUrl();
  const path = `${NOTIFICATION_LINKS.EDITOR_PATH_PREFIX}/${postId}`;
  return base ? `${base}${path}` : path;
}

function buildDashboardLink(): string {
  const base = getClientAppBaseUrl();
  return base ? `${base}${NOTIFICATION_LINKS.DASHBOARD_PATH}` : NOTIFICATION_LINKS.DASHBOARD_PATH;
}

function outcomeSubject(outcome: ScheduledPublishOutcome, title: string): string {
  const safeTitle = sanitizeEmailSubjectPart(title);
  switch (outcome) {
    case "success":
      return NOTIFICATION_COPY.EMAIL_SUBJECT_SUCCESS(safeTitle);
    case "partial":
      return NOTIFICATION_COPY.EMAIL_SUBJECT_PARTIAL(safeTitle);
    case "failed":
      return NOTIFICATION_COPY.EMAIL_SUBJECT_FAILED(safeTitle);
    case "skipped_no_credentials":
      return NOTIFICATION_COPY.EMAIL_SUBJECT_SKIPPED(safeTitle);
    default:
      return NOTIFICATION_COPY.EMAIL_SUBJECT_FAILED(safeTitle);
  }
}

function slackHeaderText(outcome: ScheduledPublishOutcome): string {
  const emoji = NOTIFICATION_COPY.SLACK_EMOJI[outcome];
  const title = NOTIFICATION_COPY.SLACK_HEADER[outcome];
  return `${emoji} ${title}`;
}

function formatScheduledFor(date: Date): string {
  return dayjs(date).utc().format("MMM D, YYYY · h:mm A [UTC]");
}

function truncateForSlack(value: string, max = SLACK_ERROR_MAX_LEN): string {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function platformSummary(payload: ScheduledPublishNotificationPayload): string {
  const ok = payload.successes?.length ?? 0;
  const failed = payload.errors?.length ?? 0;
  const total = ok + failed;
  if (total === 0) return "—";
  return NOTIFICATION_COPY.SLACK_LABEL_PLATFORMS_SUMMARY(ok, total);
}

function buildSlackBlocks(payload: ScheduledPublishNotificationPayload): SlackBlock[] {
  const blocks: SlackBlock[] = [
    {
      type: "header",
      text: { type: "plain_text", text: slackHeaderText(payload.outcome), emoji: true },
    },
    {
      type: "section",
      text: { type: "mrkdwn", text: `*${payload.title}*` },
    },
  ];

  const contextElements: Array<{ type: "mrkdwn"; text: string }> = [];
  if (payload.authorName) {
    contextElements.push({
      type: "mrkdwn",
      text: `${NOTIFICATION_COPY.SLACK_LABEL_AUTHOR}: *${payload.authorName}*`,
    });
  }
  if (payload.scheduledFor) {
    contextElements.push({
      type: "mrkdwn",
      text: `${NOTIFICATION_COPY.SLACK_LABEL_SCHEDULED}: ${formatScheduledFor(payload.scheduledFor)}`,
    });
  }
  if (contextElements.length > 0) {
    blocks.push({ type: "context", elements: contextElements });
  }

  blocks.push({ type: "divider" });
  blocks.push({
    type: "section",
    fields: [
      {
        type: "mrkdwn",
        text: `*${NOTIFICATION_COPY.SLACK_LABEL_OUTCOME}*\n${NOTIFICATION_COPY.OUTCOME_LABEL[payload.outcome]}`,
      },
      {
        type: "mrkdwn",
        text: `*${NOTIFICATION_COPY.SLACK_LABEL_PLATFORMS}*\n${platformSummary(payload)}`,
      },
    ],
  });

  if (payload.successes?.length) {
    const bullets = payload.successes.map((s) => `• ${s}`).join("\n");
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*${NOTIFICATION_COPY.SLACK_LABEL_SUCCEEDED}*\n${bullets}` },
    });
  }

  if (payload.errors?.length) {
    const bullets = payload.errors.map((e) => `• *${e.platform}:* ${truncateForSlack(e.error)}`).join("\n");
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*${NOTIFICATION_COPY.SLACK_LABEL_FAILED}*\n${bullets}` },
    });
  }

  blocks.push({
    type: "actions",
    elements: [
      {
        type: "button",
        text: { type: "plain_text", text: NOTIFICATION_COPY.SLACK_BUTTON_EDITOR, emoji: true },
        url: buildEditorLink(payload.postId),
        style: "primary",
      },
      {
        type: "button",
        text: { type: "plain_text", text: NOTIFICATION_COPY.SLACK_BUTTON_DASHBOARD, emoji: true },
        url: buildDashboardLink(),
      },
    ],
  });

  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: NOTIFICATION_COPY.SLACK_FOOTER }],
  });

  return blocks;
}

function buildEmailHtml(payload: ScheduledPublishNotificationPayload): string {
  const editorLink = safeEmailHref(buildEditorLink(payload.postId));
  const dashboardLink = safeEmailHref(buildDashboardLink());
  const accent = NOTIFICATION_COPY.OUTCOME_COLOR[payload.outcome];
  const label = escapeHtml(NOTIFICATION_COPY.OUTCOME_LABEL[payload.outcome]);
  const title = escapeHtml(payload.title);

  const metaRows: string[] = [];
  if (payload.authorName) {
    metaRows.push(
      `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;width:120px;">${NOTIFICATION_COPY.SLACK_LABEL_AUTHOR}</td><td style="padding:8px 0;font-size:14px;">${escapeHtml(payload.authorName)}</td></tr>`,
    );
  }
  if (payload.scheduledFor) {
    metaRows.push(
      `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">${NOTIFICATION_COPY.SLACK_LABEL_SCHEDULED}</td><td style="padding:8px 0;font-size:14px;">${escapeHtml(formatScheduledFor(payload.scheduledFor))}</td></tr>`,
    );
  }
  metaRows.push(
    `<tr><td style="padding:8px 0;color:#64748b;font-size:14px;">${NOTIFICATION_COPY.SLACK_LABEL_PLATFORMS}</td><td style="padding:8px 0;font-size:14px;">${escapeHtml(platformSummary(payload))}</td></tr>`,
  );

  const successesHtml = payload.successes?.length
    ? `<div style="margin-top:16px;"><p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#16a34a;">${NOTIFICATION_COPY.SLACK_LABEL_SUCCEEDED}</p><ul style="margin:0;padding-left:20px;color:#334155;font-size:14px;">${payload.successes.map((s) => `<li style="margin-bottom:4px;">${escapeHtml(s)}</li>`).join("")}</ul></div>`
    : "";

  const errorsHtml = payload.errors?.length
    ? `<div style="margin-top:16px;"><p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#dc2626;">${NOTIFICATION_COPY.SLACK_LABEL_FAILED}</p><ul style="margin:0;padding-left:20px;color:#334155;font-size:14px;">${payload.errors.map((e) => `<li style="margin-bottom:4px;"><strong>${escapeHtml(e.platform)}:</strong> ${escapeHtml(truncateForSlack(e.error, 500))}</li>`).join("")}</ul></div>`
    : "";

  return `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:24px;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;">
    <tr>
      <td style="background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.08);">
        <div style="height:4px;background:${accent};"></div>
        <div style="padding:24px;">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${accent};">${label}</p>
          <h1 style="margin:0 0 20px;font-size:20px;line-height:1.35;color:#0f172a;">${title}</h1>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">${metaRows.join("")}</table>
          ${successesHtml}
          ${errorsHtml}
          <div style="margin-top:24px;">
            <a href="${editorLink}" style="display:inline-block;margin-right:12px;padding:10px 18px;background:${accent};color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">${NOTIFICATION_COPY.EMAIL_CTA_EDITOR}</a>
            <a href="${dashboardLink}" style="display:inline-block;padding:10px 18px;background:#f1f5f9;color:#334155;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">${NOTIFICATION_COPY.EMAIL_CTA_DASHBOARD}</a>
          </div>
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 8px 0;text-align:center;color:#94a3b8;font-size:12px;">${NOTIFICATION_COPY.SLACK_FOOTER}</td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendSlackWebhook(payload: ScheduledPublishNotificationPayload): Promise<NotificationChannelStatus> {
  const webhookUrl = config.slackWebhookUrl;
  if (!webhookUrl) {
    return NOTIFICATION_CHANNEL_STATUS.SKIPPED;
  }

  try {
    const text = `${slackHeaderText(payload.outcome)}: ${payload.title}`;
    const blocks = buildSlackBlocks(payload);
    await axios.post(webhookUrl, { text, blocks }, { timeout: 10_000 });
    return NOTIFICATION_CHANNEL_STATUS.SENT;
  } catch (error) {
    logger.error("Slack scheduled publish notification failed", error as Error, { postId: payload.postId });
    return NOTIFICATION_CHANNEL_STATUS.FAILED;
  }
}

function scheduledPublishIdempotencyKey(payload: ScheduledPublishNotificationPayload): string {
  return `scheduled-publish/${payload.postId}/${payload.outcome}`;
}

async function sendAuthorEmail(payload: ScheduledPublishNotificationPayload): Promise<NotificationChannelStatus> {
  const apiKey = config.resendApiKey;
  const from = config.notificationFromEmail;
  const to = payload.authorEmail?.trim();

  if (!apiKey || !from || !to) {
    return NOTIFICATION_CHANNEL_STATUS.SKIPPED;
  }

  const subject = outcomeSubject(payload.outcome, payload.title);
  const html = buildEmailHtml(payload);
  const resend = new Resend(apiKey);

  const { data, error } = await resend.emails.send(
    {
      from,
      to,
      subject,
      html,
      tags: [
        { name: "event", value: "scheduled-publish" },
        { name: "outcome", value: payload.outcome },
      ],
    },
    { idempotencyKey: scheduledPublishIdempotencyKey(payload) },
  );

  if (error) {
    logger.error("Email scheduled publish notification failed", new Error(error.message), {
      postId: payload.postId,
      resendError: error.name,
    });
    return NOTIFICATION_CHANNEL_STATUS.FAILED;
  }

  logger.info("Scheduled publish notification email sent", { postId: payload.postId, emailId: data?.id });
  return NOTIFICATION_CHANNEL_STATUS.SENT;
}

/** Sends Slack + email notifications for a scheduled publish outcome. */
export async function notifyScheduledPublishResult(
  payload: ScheduledPublishNotificationPayload,
): Promise<NotificationResult> {
  if (config.nodeEnv === "production") {
    if (!config.slackWebhookUrl) logger.warn("SLACK_WEBHOOK_URL not configured — Slack notifications skipped");
    if (!config.resendApiKey || !config.notificationFromEmail) {
      logger.warn("RESEND_API_KEY or NOTIFICATION_FROM_EMAIL not configured — email notifications skipped");
    }
  }

  const [slackResult, emailResult] = await Promise.allSettled([sendSlackWebhook(payload), sendAuthorEmail(payload)]);

  return {
    slack: slackResult.status === "fulfilled" ? slackResult.value : NOTIFICATION_CHANNEL_STATUS.FAILED,
    email: emailResult.status === "fulfilled" ? emailResult.value : NOTIFICATION_CHANNEL_STATUS.FAILED,
  };
}
