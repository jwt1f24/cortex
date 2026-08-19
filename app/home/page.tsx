import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function HomePage() {
  // session validation
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div>
      <h1>Welcome to Cortex.</h1>
    </div>
  );
}
