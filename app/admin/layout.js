import AdminShellWrapper from "./AdminShellWrapper";

export const metadata = { title: "Admin — Unified Employee" };

export default function AdminLayout({ children }) {
  return <AdminShellWrapper>{children}</AdminShellWrapper>;
}
