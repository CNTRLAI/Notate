import Signup from "../components/Authentication/Signup";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();
  if (session) {
    redirect("/dashboard");
  }
  return (
    <div className="flex justify-center items-center h-full pt-12">
      <Signup />
    </div>
  );
}
