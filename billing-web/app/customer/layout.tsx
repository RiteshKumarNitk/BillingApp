"use client";

import { usePathname } from "next/navigation";
import { CustomerBottomNav, CustomerTopBar } from "./CustomerNav";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname.startsWith("/customer/auth");

  return (
    <div className="min-h-screen bg-[#FFFDF5]">
      {!isAuthPage && <CustomerTopBar />}
      <main className={isAuthPage ? "" : "pb-20"}>{children}</main>
      {!isAuthPage && <CustomerBottomNav />}
    </div>
  );
}
