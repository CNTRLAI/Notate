"use server";
import Header from "@/src/components/UserHeader/Header";
export default async function UserLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <Header />
      {children}
    </div>
  );
}
