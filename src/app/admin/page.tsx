import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import AdminForm from "./admin-form";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  return (
    <main className="section-light min-h-screen py-10">
      <div className="container max-w-3xl">
        <AdminForm />
      </div>
    </main>
  );
}
