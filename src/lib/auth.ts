import { auth } from "@/auth";

export async function getSessionUserId(): Promise<number | null> {
  const session = await auth();
  const id = (session?.user as any)?.id;
  return typeof id === "number" ? id : null;
}
