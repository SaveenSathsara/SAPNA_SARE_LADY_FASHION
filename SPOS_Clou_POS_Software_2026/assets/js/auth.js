/* =========================================================
   SPOS – Authentication Module
   ========================================================= */

'use strict';

// Default demo users
const DEMO_USERS = [
  { id: 1, username: 'admin',    password: 'admin123',    name: 'Admin User',         role: 'Administrator', email: 'admin@spos.lk',    avatar: 'AU', active: true },
  { id: 2, username: 'manager',  password: 'manager123',  name: 'Store Manager',       role: 'Manager',       email: 'manager@spos.lk',  avatar: 'SM', active: true },
  { id: 3, username: 'cashier',  password: 'cashier123',  name: 'Cashier Staff',       role: 'Cashier',       email: 'cashier@spos.lk',  avatar: 'CS', active: true },
  { id: 4, username: 'pharma',   password: 'pharma123',   name: 'Pharmacy Staff',      role: 'Pharmacist',    email: 'pharma@spos.lk',   avatar: 'PS', active: true },
];

function getUsers() {
  const stored = localStorage.getItem('spos_users');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('spos_users', JSON.stringify(DEMO_USERS));
  return DEMO_USERS;
}

function saveUsers(users) {
  localStorage.setItem('spos_users', JSON.stringify(users));
}

// ── Login ──────────────────────────────────────────────────
function doLogin(username, password) {
  const users = getUsers();
  const user  = users.find(u => u.username === username && u.password === password && u.active);
  if (user) {
    const session = { ...user, loginTime: new Date().toISOString() };
    delete session.password;
    localStorage.setItem('spos_user', JSON.stringify(session));
    SPOS.user = session;
    logActivity(`${user.name} logged in`, 'login');
    return { success: true, user: session };
  }
  return { success: false, error: 'Invalid username or password' };
}

// ── Logout ─────────────────────────────────────────────────
function doLogout() {
  if (SPOS.user) logActivity(`${SPOS.user.name} logged out`, 'logout');
  localStorage.removeItem('spos_user');
  SPOS.user = null;
  window.location.href = '../pages/login.html';
}

// ── Permission Check ───────────────────────────────────────
const ROLE_PERMISSIONS = {
  Administrator: ['*'],
  Manager:       ['dashboard','pos','inventory','products','customers','suppliers','sales','reports','accounts'],
  Cashier:       ['pos','sales','customers'],
  Pharmacist:    ['pos-pharmacy','inventory','products','customers'],
};

function hasPermission(action) {
  if (!SPOS.user) return false;
  const perms = ROLE_PERMISSIONS[SPOS.user.role] || [];
  return perms.includes('*') || perms.includes(action);
}

// ── Activity Log ───────────────────────────────────────────
function logActivity(action, type = 'general') {
  const logs = JSON.parse(localStorage.getItem('spos_activity') || '[]');
  logs.unshift({
    id: Date.now(),
    action,
    type,
    user: SPOS.user?.name || 'System',
    timestamp: new Date().toISOString()
  });
  if (logs.length > 500) logs.splice(500);
  localStorage.setItem('spos_activity', JSON.stringify(logs));
}

function getActivityLogs() {
  return JSON.parse(localStorage.getItem('spos_activity') || '[]');
}

// ── User CRUD ──────────────────────────────────────────────
function addUser(userData) {
  const users = getUsers();
  const newUser = {
    id: Date.now(),
    ...userData,
    active: true,
    createdAt: new Date().toISOString()
  };
  users.push(newUser);
  saveUsers(users);
  logActivity(`User created: ${newUser.name}`, 'user');
  return newUser;
}

function updateUser(id, updates) {
  const users = getUsers();
  const idx = users.findIndex(u => u.id === id);
  if (idx < 0) return null;
  users[idx] = { ...users[idx], ...updates, updatedAt: new Date().toISOString() };
  saveUsers(users);
  logActivity(`User updated: ${users[idx].name}`, 'user');
  return users[idx];
}

function deleteUser(id) {
  const users = getUsers();
  const user = users.find(u => u.id === id);
  const filtered = users.filter(u => u.id !== id);
  saveUsers(filtered);
  logActivity(`User deleted: ${user?.name}`, 'user');
  return true;
}
