import { auth } from "@/auth";

export async function getSessionUserId(): Promise<number | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}
