import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const cookieStore = await cookies();
  const hasSession = cookieStore.get("has_session")?.value;
  const role = cookieStore.get("role")?.value;

  if (hasSession === "true") {
    if (role === "admin" || role === "instructor") {
      redirect("/admin");
    } else {
      redirect("/dashboard");
    }
  } else {
    redirect("/login");
  }
}
