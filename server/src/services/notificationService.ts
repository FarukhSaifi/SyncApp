import axios from "axios";

import { config } from "../config";
import {
  NOTIFICATION_CHANNEL_STATUS,
  NOTIFICATION_COPY,
  type NotificationChannelStatus,
  type ScheduledPublishOutcome,
} from "../constants/notifications";
import type { NotificationResult, ScheduledPublishNotificationPayload } from "../types";
import { logger } from "../utils/logger";

function buildEditorLink(postId: string): string {
  const base = (config.canonicalBaseUrl || config.siteUrl || "").replace(/\/$/, "");
  if (!base) return `/editor/${postId}`;
  return `${base}/editor/${postId}`;
}

function outcomeSubject(outcome: ScheduledPublishOutcome, title: string): string {
  switch (outcome) {
    case "success":
      return NOTIFICATION_COPY.EMAIL_SUBJECT_SUCCESS(title);
    case "partial":
      return NOTIFICATION_COPY.EMAIL_SUBJECT_PARTIAL(title);
    case "failed":
      return NOTIFICATION_COPY.EMAIL_SUBJECT_FAILED(title);
    case "skipped_no_credentials":
      return NOTIFICATION_COPY.EMAIL_SUBJECT_SKIPPED(title);
    default:
      return NOTIFICATION_COPY.EMAIL_SUBJECT_FAILED(title);
  }
}

function outcomeSlackTitle(outcome: ScheduledPublishOutcome): string {
  switch (outcome) {
    case "success":
      return NOTIFICATION_COPY.SLACK_TITLE_SUCCESS;
    case "partial":
      return NOTIFICATION_COPY.SLACK_TITLE_PARTIAL;
    case "failed":
      return NOTIFICATION_COPY.SLACK_TITLE_FAILED;
    case "skipped_no_credentials":
      return NOTIFICATION_COPY.SLACK_TITLE_SKIPPED;
    default:
      return NOTIFICATION_COPY.SLACK_TITLE_FAILED;
  }
}

function buildDetailLines(payload: ScheduledPublishNotificationPayload): string[] {
  const lines = [`*Post:* ${payload.title}`, `*Outcome:* ${NOTIFICATION_COPY.OUTCOME_LABEL[payload.outcome]}`];
  if (payload.authorName) lines.push(`*Author:* ${payload.authorName}`);
  if (payload.scheduledFor) {
    lines.push(`*Scheduled for:* ${payload.scheduledFor.toISOString()}`);
  }
  if (payload.successes?.length) {
    lines.push(`*Succeeded:* ${payload.successes.join(", ")}`);
  }
  if (payload.errors?.length) {
    lines.push(`*Errors:* ${payload.errors.map((e) => `${e.platform}: ${e.error}`).join("; ")}`);
  }
  lines.push(`*Editor:* ${buildEditorLink(payload.postId)}`);
  return lines;
}

async function sendSlackWebhook(payload: ScheduledPublishNotificationPayload): Promise<NotificationChannelStatus> {
  const webhookUrl = config.slackWebhookUrl;
  if (!webhookUrl) {
    return NOTIFICATION_CHANNEL_STATUS.SKIPPED;
  }

  try {
    const text = `${outcomeSlackTitle(payload.outcome)}: ${payload.title}`;
    const blocks = [
      {
        type: "section",
        text: { type: "mrkdwn", text: buildDetailLines(payload).join("\n") },
      },
    ];
    await axios.post(webhookUrl, { text, blocks }, { timeout: 10_000 });
    return NOTIFICATION_CHANNEL_STATUS.SENT;
  } catch (error) {
    logger.error("Slack scheduled publish notification failed", error as Error, { postId: payload.postId });
    return NOTIFICATION_CHANNEL_STATUS.FAILED;
  }
}

async function sendAuthorEmail(payload: ScheduledPublishNotificationPayload): Promise<NotificationChannelStatus> {
  const apiKey = config.resendApiKey;
  const from = config.notificationFromEmail;
  const to = payload.authorEmail?.trim();

  if (!apiKey || !from || !to) {
    return NOTIFICATION_CHANNEL_STATUS.SKIPPED;
  }

  const subject = outcomeSubject(payload.outcome, payload.title);
  const editorLink = buildEditorLink(payload.postId);
  const detailHtml = buildDetailLines(payload)
    .map((line) => line.replace(/\*/g, ""))
    .map((line) => `<p>${line}</p>`)
    .join("");

  const html = `
    <h2>${NOTIFICATION_COPY.OUTCOME_LABEL[payload.outcome]}</h2>
    ${detailHtml}
    <p><a href="${editorLink}">Open in editor</a></p>
  `;

  try {
    await axios.post(
      "https://api.resend.com/emails",
      { from, to, subject, html },
      {
        timeout: 10_000,
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      },
    );
    return NOTIFICATION_CHANNEL_STATUS.SENT;
  } catch (error) {
    logger.error("Email scheduled publish notification failed", error as Error, { postId: payload.postId });
    return NOTIFICATION_CHANNEL_STATUS.FAILED;
  }
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
