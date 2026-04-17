const SESSION_KEY = "ue_session";

const USERS = [
  { id: "emp_1", username: "jordan",  password: "pass123",  pin: "1001", name: "Jordan Lee",      role: "employee", jobRole: "Yard Worker"   },
  { id: "emp_2", username: "sam",     password: "pass123",  pin: "1002", name: "Sam Torres",      role: "employee", jobRole: "Office Worker" },
  { id: "emp_3", username: "morgan",  password: "pass123",  pin: "1003", name: "Morgan Davis",    role: "employee", jobRole: "Truck Driver"  },
  { id: "emp_4", username: "justin",  password: "pass123",  pin: "1004", name: "Justin Andrews",  role: "employee", jobRole: "Dirt Manager"  },
  { id: "emp_5", username: "alex",    password: "pass123",  pin: "1005", name: "Alex Rivera",     role: "employee", jobRole: "Yard Worker"   },
  { id: "emp_6", username: "taylor",  password: "pass123",  pin: "1006", name: "Taylor Brooks",   role: "employee", jobRole: "Office Worker" },
  { id: "emp_7", username: "casey",   password: "pass123",  pin: "1007", name: "Casey Nguyen",    role: "employee", jobRole: "Truck Driver"  },
  { id: "emp_8", username: "riley",   password: "pass123",  pin: "1008", name: "Riley Simmons",   role: "employee", jobRole: "Dirt Manager"  },
  { id: "emp_9", username: "drew",    password: "pass123",  pin: "1009", name: "Drew Patel",      role: "employee", jobRole: "Yard Worker"   },
  { id: "adm_1", username: "admin",   password: "admin123", pin: "0000", name: "Admin",           role: "admin",    jobRole: null            },
];

export function login(username, password) {
  const user = USERS.find(
    (u) => u.username === username.trim().toLowerCase() && u.password === password
  );
  if (!user) return null;
  const session = { id: user.id, name: user.name, role: user.role, username: user.username, jobRole: user.jobRole };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function loginByPin(pin) {
  const user = USERS.find((u) => u.pin === pin);
  if (!user) return null;
  const session = { id: user.id, name: user.name, role: user.role, username: user.username, jobRole: user.jobRole };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function logout() {
  localStorage.removeItem(SESSION_KEY);
}

export function getSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
  } catch {
    return null;
  }
}

export function getEmployees() {
  return USERS
    .filter((u) => u.role === "employee")
    .map(({ id, name, username, jobRole }) => ({ id, name, username, jobRole }));
}

export function getDefaultRoles() {
  return Object.fromEntries(
    USERS.filter((u) => u.role === "employee" && u.jobRole).map((u) => [u.id, u.jobRole])
  );
}
