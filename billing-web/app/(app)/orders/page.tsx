import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/nextauth";
import { redirect } from "next/navigation";
import OrderQueueClient from "./OrderQueueClient";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/auth/login");

  return <OrderQueueClient />;
}
