import { redirect } from "next/navigation";
import { isAdminSession } from "@/lib/admin";
import Header from "@/components/organisms/Header";
import AdminDashboard from "./AdminDashboard";

export default async function AdminPage() {
  const admin = await isAdminSession();
  if (!admin) redirect("/");

  return (
    <div className="min-h-screen bg-surface-page">
      <Header />
      <AdminDashboard />
    </div>
  );
}
