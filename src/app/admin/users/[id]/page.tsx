import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/admin";
import Header from "@/components/organisms/Header";
import UserDetail from "./UserDetail";

export default async function AdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const admin = await isAdminSession();
  if (!admin) redirect("/");

  const { id } = await params;

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <UserDetail userId={Number(id)} />
    </div>
  );
}
