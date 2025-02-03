"use server";
import Header from "@/src/components/UserHeader/Header";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  console.log(session);
  if (!session) {
    redirect("/");
  }
  return (
    <div className="flex flex-col h-screen">
      <Header />
      {children}
    </div>
  );
}
