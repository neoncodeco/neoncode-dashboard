import { after } from "next/server";
import getDB from "@/lib/mongodb";
import { getAppBaseUrl } from "@/lib/emailNotifications";
import { buildPlatformNotificationEmail } from "@/lib/emailTemplates";
import { sendEmail } from "@/lib/mailer";

const DEFAULT_DELAY_MS = 5_000;
const COLLECTION = "notification_email_queue";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function getNotificationEmailDelayMs() {
  const raw = Number(process.env.ADMIN_NOTIFICATION_EMAIL_DELAY_MS || DEFAULT_DELAY_MS);
  return Number.isFinite(raw) && raw >= 0 ? raw : DEFAULT_DELAY_MS;
}

function resolveQueueSecret() {
  return (
    process.env.NOTIFICATION_QUEUE_SECRET?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    process.env.INTERNAL_API_SECRET?.trim() ||
    ""
  );
}

function resolveProcessUrl(baseUrl = "") {
  const origin =
    baseUrl?.trim() ||
    process.env.APP_BASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    "http://localhost:3000";
  return `${origin.replace(/\/+$/, "")}/api/internal/admin-notification-email-queue/process`;
}

export function isValidQueueSecret(headerValue) {
  const secret = resolveQueueSecret();
  if (!secret) return false;
  return String(headerValue || "").trim() === secret;
}

function formatPublishedAt(value) {
  if (!value) return "Just now";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function resolvePublisherName(createdBy) {
  const name = String(createdBy?.name || "").trim();
  if (name) return name;
  return "Neon Code Team";
}

export function buildAdminBroadcastUserEmail({
  title,
  message,
  userName,
  baseUrl,
  publishedAt,
  createdBy,
}) {
  const dashboardUrl = `${baseUrl || getAppBaseUrl()}/user-dashboard/overview`;

  return buildPlatformNotificationEmail({
    title: String(title || "Platform Update").trim() || "Platform Update",
    message: String(message || "").trim(),
    userName,
    publishedAt: formatPublishedAt(publishedAt),
    publisherName: resolvePublisherName(createdBy),
    dashboardUrl,
  });
}

async function collectUserRecipients(db) {
  const users = await db
    .collection("users")
    .find(
      { email: { $exists: true, $ne: "" } },
      { projection: { email: 1, name: 1, userId: 1 } }
    )
    .toArray();

  const seen = new Set();
  const recipients = [];

  for (const user of users) {
    const email = String(user.email || "").trim().toLowerCase();
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    recipients.push({
      email,
      name: String(user.name || "").trim() || email.split("@")[0] || "User",
      userId: user.userId || "",
      sent: false,
      sentAt: null,
      error: null,
    });
  }

  return recipients;
}

export async function enqueueAdminNotificationEmails(
  db,
  { notificationId, title, message, publishedAt, createdBy, baseUrl }
) {
  const recipients = await collectUserRecipients(db);
  if (!recipients.length) {
    return { ok: false, error: "No user emails found", total: 0 };
  }

  const now = new Date();
  const queueDoc = {
    notificationId: String(notificationId),
    title: String(title || "").trim(),
    message: String(message || "").trim(),
    publishedAt: publishedAt ? new Date(publishedAt) : now,
    createdBy: createdBy || null,
    baseUrl: baseUrl || getAppBaseUrl(),
    recipients,
    total: recipients.length,
    sentCount: 0,
    failedCount: 0,
    currentIndex: 0,
    status: "pending",
    delayMs: getNotificationEmailDelayMs(),
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    startedAt: null,
  };

  const result = await db.collection(COLLECTION).insertOne(queueDoc);

  await db.collection("notifications").updateOne(
    { _id: notificationId },
    {
      $set: {
        emailDispatch: {
          status: "queued",
          queueId: String(result.insertedId),
          total: recipients.length,
          sent: 0,
          failed: 0,
          delayMs: queueDoc.delayMs,
          startedAt: null,
          completedAt: null,
        },
        updatedAt: now,
      },
    }
  );

  return {
    ok: true,
    queueId: String(result.insertedId),
    total: recipients.length,
    delayMs: queueDoc.delayMs,
  };
}

async function updateNotificationDispatch(db, queue) {
  if (!queue?.notificationId) return;

  let notificationId = queue.notificationId;
  try {
    const { ObjectId } = await import("mongodb");
    if (ObjectId.isValid(notificationId)) {
      notificationId = new ObjectId(notificationId);
    }
  } catch {
    /* keep string id */
  }

  await db.collection("notifications").updateOne(
    { _id: notificationId },
    {
      $set: {
        emailDispatch: {
          status: queue.status,
          queueId: String(queue._id),
          total: queue.total,
          sent: queue.sentCount,
          failed: queue.failedCount,
          delayMs: queue.delayMs,
          startedAt: queue.startedAt || null,
          completedAt: queue.completedAt || null,
        },
        updatedAt: new Date(),
      },
    }
  );
}

function scheduleNextQueueStep(queueId, delayMs, baseUrl = "") {
  after(async () => {
    try {
      if (delayMs > 0) await sleep(delayMs);

      const secret = resolveQueueSecret();
      if (secret && baseUrl) {
        const response = await fetch(resolveProcessUrl(baseUrl), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-queue-secret": secret,
          },
          body: JSON.stringify({ queueId: String(queueId) }),
          cache: "no-store",
        });

        if (response.ok) return;
        console.warn("[adminNotificationEmailQueue] HTTP step failed, falling back to in-process.");
      }

      await processAdminNotificationEmailQueueStep(queueId);
    } catch (error) {
      console.error("[adminNotificationEmailQueue] next step failed:", error);
    }
  });
}

export function kickstartAdminNotificationEmailQueue(queueId, baseUrl = "") {
  after(async () => {
    try {
      await processAdminNotificationEmailQueueStep(queueId, baseUrl);
    } catch (error) {
      console.error("[adminNotificationEmailQueue] kickstart failed:", error);
    }
  });
}

export async function processAdminNotificationEmailQueueStep(queueId, baseUrl = "") {
  const { db } = await getDB();
  const { ObjectId } = await import("mongodb");
  const objectId = ObjectId.isValid(queueId) ? new ObjectId(queueId) : null;

  if (!objectId) {
    return { ok: false, error: "Invalid queue id" };
  }

  const queue = await db.collection(COLLECTION).findOne({ _id: objectId });
  if (!queue) {
    return { ok: false, error: "Queue not found" };
  }

  if (queue.status === "completed" || queue.status === "cancelled") {
    return { ok: true, done: true, sent: queue.sentCount, total: queue.total };
  }

  const index = Number(queue.currentIndex) || 0;
  if (index >= queue.recipients.length) {
    const completedAt = new Date();
    await db.collection(COLLECTION).updateOne(
      { _id: objectId },
      { $set: { status: "completed", completedAt, updatedAt: completedAt } }
    );
    const completedQueue = { ...queue, status: "completed", completedAt, sentCount: queue.sentCount };
    await updateNotificationDispatch(db, completedQueue);
    return { ok: true, done: true, sent: queue.sentCount, total: queue.total };
  }

  const now = new Date();
  if (queue.status === "pending") {
    await db.collection(COLLECTION).updateOne(
      { _id: objectId },
      { $set: { status: "processing", startedAt: now, updatedAt: now } }
    );
    queue.status = "processing";
    queue.startedAt = now;
  }

  const recipient = queue.recipients[index];
  let sendError = null;

  try {
    const { subject, html, text } = buildAdminBroadcastUserEmail({
      title: queue.title,
      message: queue.message,
      userName: recipient?.name,
      baseUrl: queue.baseUrl,
      publishedAt: queue.publishedAt,
      createdBy: queue.createdBy,
    });

    const result = await sendEmail({
      to: recipient.email,
      subject,
      html,
      text,
    });

    if (!result.ok) {
      sendError = result.error || "Failed to send email";
    }
  } catch (error) {
    sendError = error?.message || "Failed to send email";
  }

  const nextIndex = index + 1;
  const done = nextIndex >= queue.recipients.length;
  const sentCount = (Number(queue.sentCount) || 0) + (sendError ? 0 : 1);
  const failedCount = (Number(queue.failedCount) || 0) + (sendError ? 1 : 0);
  const completedAt = done ? new Date() : null;

  const recipientUpdate = {
    [`recipients.${index}.sent`]: !sendError,
    [`recipients.${index}.sentAt`]: sendError ? null : new Date(),
    [`recipients.${index}.error`]: sendError,
  };

  await db.collection(COLLECTION).updateOne(
    { _id: objectId },
    {
      $set: {
        currentIndex: nextIndex,
        sentCount,
        failedCount,
        status: done ? "completed" : "processing",
        completedAt,
        updatedAt: new Date(),
        ...recipientUpdate,
      },
    }
  );

  const updatedQueue = {
    ...queue,
    _id: objectId,
    currentIndex: nextIndex,
    sentCount,
    failedCount,
    status: done ? "completed" : "processing",
    completedAt,
    startedAt: queue.startedAt || now,
  };
  await updateNotificationDispatch(db, updatedQueue);

  if (!done) {
    const delayMs = Number(queue.delayMs) || getNotificationEmailDelayMs();
    scheduleNextQueueStep(String(objectId), delayMs, baseUrl || queue.baseUrl || "");
  }

  return {
    ok: true,
    done,
    index,
    email: recipient?.email || null,
    error: sendError,
    sent: sentCount,
    failed: failedCount,
    total: queue.total,
    remaining: Math.max(0, queue.total - nextIndex),
    delayMs: Number(queue.delayMs) || getNotificationEmailDelayMs(),
  };
}
