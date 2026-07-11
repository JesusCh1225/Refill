import { auth } from "@/auth";

export async function isAdminSession(): Promise<boolean> {
  const session = await auth();
  return (
    !!process.env.ADMIN_EMAIL &&
    session?.user?.email === process.env.ADMIN_EMAIL
  );
}
