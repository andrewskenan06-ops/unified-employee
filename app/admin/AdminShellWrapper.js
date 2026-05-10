"use client";
import { usePathname } from "next/navigation";
import AdminShell from "./AdminShell";

export default function AdminShellWrapper({ children }) {
  const pathname = usePathname();
  if (pathname === "/admin/login") return children;
  return <AdminShell>{children}</AdminShell>;
}
