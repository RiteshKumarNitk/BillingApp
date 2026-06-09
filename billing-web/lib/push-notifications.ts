import prisma from "@/lib/prisma";

/**
 * Send a push notification to a customer via FCM HTTP v1 API.
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string of service account).
 * Falls back to legacy server key if v1 is not configured.
 */
export async function sendPushNotification(
  customerAccountId: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  try {
    // Get the customer's FCM token
    const account = await prisma.customerAccount.findUnique({
      where: { id: customerAccountId },
      select: { fcmToken: true },
    });

    if (!account?.fcmToken) {
      console.log(`No FCM token for customer ${customerAccountId}, skipping push`);
      return false;
    }

    const fcmToken = account.fcmToken;

    // Try FCM HTTP v1 API first
    const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;

    if (serviceAccountKey && projectId) {
      return await sendViaHttpV1(serviceAccountKey, projectId, fcmToken, title, body, data);
    }

    // Fallback: legacy server key
    const serverKey = process.env.FCM_SERVER_KEY;
    if (serverKey) {
      return await sendViaLegacy(serverKey, fcmToken, title, body, data);
    }

    console.warn("No FCM credentials configured (FIREBASE_SERVICE_ACCOUNT_KEY or FCM_SERVER_KEY)");
    return false;
  } catch (error) {
    console.error("Error sending push notification:", error);
    return false;
  }
}

async function sendViaHttpV1(
  serviceAccountKey: string,
  projectId: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  // Get OAuth2 access token from service account
  const serviceAccount = JSON.parse(serviceAccountKey);
  const accessToken = await getAccessToken(serviceAccount);

  const message = {
    token,
    notification: { title, body },
    data: data || {},
    android: {
      priority: "high" as const,
      notification: {
        channelId: "order_updates",
        sound: "default",
      },
    },
    apns: {
      payload: {
        aps: {
          sound: "default",
          badge: 1,
        },
      },
    },
  };

  const response = await fetch(
    `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    console.error("FCM v1 error:", error);

    // If token is invalid, remove it
    if (response.status === 404 || response.status === 400) {
      await cleanupInvalidToken(token);
    }
    return false;
  }

  return true;
}

async function sendViaLegacy(
  serverKey: string,
  token: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<boolean> {
  const response = await fetch("https://fcm.googleapis.com/fcm/send", {
    method: "POST",
    headers: {
      Authorization: `key=${serverKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: token,
      notification: { title, body, sound: "default" },
      data: data || {},
      priority: "high",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("FCM legacy error:", error);
    if (response.status === 404) {
      await cleanupInvalidToken(token);
    }
    return false;
  }

  return true;
}

async function getAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const jwt = await createJwt(
    serviceAccount.project_id,
    serviceAccount.client_email,
    serviceAccount.private_key,
    now
  );

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await response.json();
  return data.access_token;
}

async function createJwt(
  projectId: string,
  clientEmail: string,
  privateKey: string,
  now: number
): Promise<string> {
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64url = (obj: any) =>
    Buffer.from(JSON.stringify(obj)).toString("base64url");

  const signingInput = `${base64url(header)}.${base64url(payload)}`;

  // Use Node.js crypto for RS256 signing
  const { createSign } = await import("crypto");
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = sign.sign(privateKey, "base64url");

  return `${signingInput}.${signature}`;
}

async function cleanupInvalidToken(token: string): Promise<void> {
  try {
    await prisma.customerAccount.updateMany({
      where: { fcmToken: token },
      data: { fcmToken: null },
    });
    console.log(`Cleaned up invalid FCM token`);
  } catch (error) {
    console.error("Error cleaning up invalid token:", error);
  }
}

/**
 * Send push notification to multiple customers at once.
 */
export async function sendBulkPushNotifications(
  customerAccountIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; failed: number }> {
  let sent = 0;
  let failed = 0;

  for (const id of customerAccountIds) {
    const result = await sendPushNotification(id, title, body, data);
    if (result) sent++;
    else failed++;
  }

  return { sent, failed };
}
