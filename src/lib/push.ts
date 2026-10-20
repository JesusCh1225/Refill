import webpush from "web-push";
import { prisma } from "@/lib/prisma";

const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT!;

if (vapidPublic && vapidPrivate && vapidSubject) {
  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
}

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/** userId에 등록된 모든 기기로 푸시 전송. 만료된 구독은 자동 삭제. */
export async function sendPushToUser(userId: number, payload: PushPayload) {
  if (!vapidPublic || !vapidPrivate) return;

  const subs = await prisma.pushSubscription.findMany({
    where: { userId },
    select: { id: true, endpoint: true, p256dh: true, auth: true },
  });

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify(payload),
        );
      } catch (err: any) {
        // 410 Gone / 404 Not Found → 만료된 구독 삭제
        if (err.statusCode === 410 || err.statusCode === 404) {
          await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {});
        }
      }
    }),
  );
}
