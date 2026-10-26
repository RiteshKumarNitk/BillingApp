"use client";

import { useEffect } from "react";

// S7: this used to mirror the session + tenant profile into localStorage ("user_session" /
// "tenant_info"), but nothing ever read those keys back — it only left user PII sitting in the
// browser after the session ended. It now just clears any copies older builds left behind.
export default function SessionSync(_props: { session?: any, tenant?: any }) {
  useEffect(() => {
    try {
      localStorage.removeItem("user_session");
      localStorage.removeItem("tenant_info");
    } catch {
      // Storage can be unavailable (private mode / blocked site data) — nothing to clean then.
    }
  }, []);

  return null;
}
