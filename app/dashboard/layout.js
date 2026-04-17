import DashboardShell from "./DashboardShell";

export const metadata = {
  title: "Unified Employee",
};

export default function DashboardLayout({ children }) {
  return <DashboardShell>{children}</DashboardShell>;
}
