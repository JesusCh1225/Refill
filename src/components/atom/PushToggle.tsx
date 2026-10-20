"use client";

import { usePushNotification } from "@/lib/usePushNotification";

export default function PushToggle() {
  const { supported, permission, subscribed, subscribe, unsubscribe } = usePushNotification();

  if (!supported) return null;
  if (permission === "denied") {
    return (
      <p className="text-[13px] text-text-muted">
        브라우저 설정에서 알림을 허용해주세요.
      </p>
    );
  }

  return (
    <button
      onClick={subscribed ? unsubscribe : subscribe}
      className={`flex items-center gap-2 px-4 h-9 rounded-xl text-[13px] font-semibold border transition-colors cursor-pointer ${
        subscribed
          ? "bg-brand text-white border-brand hover:opacity-85"
          : "bg-white text-text-body border-border-base hover:border-brand hover:text-brand"
      }`}
    >
      {subscribed ? "🔔 알림 켜짐" : "🔕 알림 받기"}
    </button>
  );
}
