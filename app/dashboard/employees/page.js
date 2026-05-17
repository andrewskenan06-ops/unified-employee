"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "@/lib/auth";
import { roleStyle } from "@/lib/constants";

export default function EmployeesPage() {
  const router = useRouter();
  const [session, setSession]   = useState(null);
  const [employees, setEmployees] = useState([]);
  const [jobRoles, setJobRoles] = useState([]);
  const [editing, setEditing]   = useState(null);
  const [loading, setLoading]   = useState(true);

  const rolesMap = useMemo(() => Object.fromEntries(jobRoles.map(r => [r.name, r.color])), [jobRoles]);

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    if (s.role !== "admin") { router.replace("/dashboard"); return; }
    setSession(s);

    Promise.all([
      fetch("/api/employees").then(r => r.json()),
      fetch("/api/job-roles").then(r => r.json()),
    ]).then(([emps, roles]) => {
      setEmployees(emps);
      setJobRoles(roles);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [router]);

  if (!session || loading) return null;

  async function assignRole(employeeId, jobRole) {
    await fetch(`/api/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobRole }),
    });
    setEmployees(emps => emps.map(e => e.id === employeeId ? { ...e, jobRole } : e));
    setEditing(null);
  }

  async function clearRole(employeeId) {
    await fetch(`/api/employees/${employeeId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobRole: null }),
    });
    setEmployees(emps => emps.map(e => e.id === employeeId ? { ...e, jobRole: null } : e));
  }

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Employees</h1>
        <p className="text-sm text-gray-400 mt-0.5">Assign job roles to your team members.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {employees.map((emp) => {
          const jobRole  = emp.jobRole || null;
          const style    = jobRole ? roleStyle(rolesMap[jobRole]) : null;
          const isOpen   = editing === emp.id;
          const initials = emp.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

          return (
            <div key={emp.id} className="px-6 py-5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary">{emp.name}</p>
                  <p className="text-xs text-gray-400">@{emp.username}</p>
                </div>
                {jobRole && !isOpen && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                    {jobRole}
                  </span>
                )}
                {!isOpen && (
                  <button
                    onClick={() => setEditing(emp.id)}
                    className="text-xs font-semibold text-gray-400 hover:text-primary border border-gray-200 hover:border-primary/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {jobRole ? "Change" : "Assign Role"}
                  </button>
                )}
                {isOpen && (
                  <button onClick={() => setEditing(null)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                    Cancel
                  </button>
                )}
              </div>

              {isOpen && (
                <div className="mt-4 ml-14 flex flex-wrap gap-2">
                  {jobRoles.map((r) => {
                    const s      = roleStyle(rolesMap[r.name]);
                    const active = jobRole === r.name;
                    return (
                      <button
                        key={r.name}
                        onClick={() => assignRole(emp.id, r.name)}
                        className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
                          active
                            ? `${s.bg} ${s.text} ${s.border ?? ""} shadow-sm`
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:border-primary/30 hover:text-primary"
                        }`}
                      >
                        {active && <span className="mr-1">✓</span>}{r.name}
                      </button>
                    );
                  })}
                  {jobRole && (
                    <button
                      onClick={() => clearRole(emp.id)}
                      className="text-xs font-semibold px-4 py-2 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 transition-colors"
                    >
                      Remove role
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
