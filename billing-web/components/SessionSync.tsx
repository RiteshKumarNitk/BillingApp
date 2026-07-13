"use client";

import { useEffect } from "react";

export default function SessionSync({ session, tenant }: { session: any, tenant?: any }) {
  useEffect(() => {
    if (session) {
      localStorage.setItem("user_session", JSON.stringify(session));
      if (tenant) {
        localStorage.setItem("tenant_info", JSON.stringify(tenant));
      }
    }
  }, [session, tenant]);

  return null;
}
