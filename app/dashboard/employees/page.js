"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSession, getEmployees, getDefaultRoles } from "@/lib/auth";

const JOB_ROLES = ["Office Worker", "Yard Worker", "Truck Driver", "Dirt Manager"];

const LS_KEY = "ue_employee_roles";

function loadRoles() {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || "{}"); }
  catch { return {}; }
}

function saveRoles(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

const ROLE_STYLES = {
  "Office Worker": { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200" },
  "Yard Worker":   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
  "Truck Driver":  { bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200" },
  "Dirt Manager":  { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" },
};

export default function EmployeesPage() {
  const router = useRouter();
  const [session, setSession] = useState(null);
  const [roles, setRoles] = useState({});
  const [editing, setEditing] = useState(null); // employee id being edited

  const employees = getEmployees();

  useEffect(() => {
    const s = getSession();
    if (!s) { router.replace("/login"); return; }
    if (s.role !== "admin") { router.replace("/dashboard"); return; }
    setSession(s);
    const stored = loadRoles();
    const seeded = Object.keys(stored).length === 0 ? getDefaultRoles() : stored;
    if (Object.keys(stored).length === 0) saveRoles(seeded);
    setRoles(seeded);
  }, [router]);

  if (!session) return null;

  function assignRole(employeeId, jobRole) {
    const updated = { ...roles, [employeeId]: jobRole };
    saveRoles(updated);
    setRoles(updated);
    setEditing(null);
  }

  function clearRole(employeeId) {
    const updated = { ...roles };
    delete updated[employeeId];
    saveRoles(updated);
    setRoles(updated);
  }

  return (
    <div className="px-8 py-8 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-primary">Employees</h1>
        <p className="text-sm text-gray-400 mt-0.5">Assign job roles to your team members.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
        {employees.map((emp) => {
          const jobRole = roles[emp.id] || null;
          const style   = jobRole ? ROLE_STYLES[jobRole] : null;
          const isOpen  = editing === emp.id;
          const initials = emp.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2);

          return (
            <div key={emp.id} className="px-6 py-5">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {initials}
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-primary">{emp.name}</p>
                  <p className="text-xs text-gray-400">@{emp.username}</p>
                </div>

                {/* Current role badge */}
                {jobRole && !isOpen && (
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${style.bg} ${style.text} ${style.border}`}>
                    {jobRole}
                  </span>
                )}

                {/* Edit / assign button */}
                {!isOpen && (
                  <button
                    onClick={() => setEditing(emp.id)}
                    className="text-xs font-semibold text-gray-400 hover:text-primary border border-gray-200 hover:border-primary/30 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {jobRole ? "Change" : "Assign Role"}
                  </button>
                )}

                {/* Cancel */}
                {isOpen && (
                  <button
                    onClick={() => setEditing(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>

              {/* Role picker — expands inline */}
              {isOpen && (
                <div className="mt-4 ml-14 flex flex-wrap gap-2">
                  {JOB_ROLES.map((r) => {
                    const s = ROLE_STYLES[r];
                    const active = jobRole === r;
                    return (
                      <button
                        key={r}
                        onClick={() => assignRole(emp.id, r)}
                        className={`text-xs font-semibold px-4 py-2 rounded-xl border transition-all ${
                          active
                            ? `${s.bg} ${s.text} ${s.border} shadow-sm`
                            : "bg-gray-50 text-gray-500 border-gray-200 hover:border-primary/30 hover:text-primary"
                        }`}
                      >
                        {active && <span className="mr-1">✓</span>}{r}
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
