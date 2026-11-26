"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { PublicUser } from "@/types/crm";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/me")
      .then(async (res) => {
        if (!res.ok) {
          router.replace("/login");
          return;
        }
        const data = await res.json();
        if (!active) return;
        if (data.user?.role !== "admin") {
          router.replace("/caller");
          return;
        }
        setUser(data.user);
        setChecking(false);
      })
      .catch(() => {
        router.replace("/login");
      });
    return () => {
      active = false;
    };
  }, [router]);

  if (checking || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F5F3]">
        <div className="crm-card px-6 py-4 text-sm text-[#737370]">
          Loading Creightweb Admin...
        </div>
      </div>
    );
  }

  return <AdminShell user={user}>{children}</AdminShell>;
}
