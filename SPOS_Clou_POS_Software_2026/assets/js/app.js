/* =========================================================
   SPOS Cloud POS 2026 – Core Application JS
   ========================================================= */

'use strict';

// ── App State ──────────────────────────────────────────────
const SPOS = {
  version: '2026.1.0',
  user: JSON.parse(localStorage.getItem('spos_user') || 'null'),
  activeModule: localStorage.getItem('spos_module') || 'normal',
  licenseKey: localStorage.getItem('spos_license') || null,
  settings: JSON.parse(localStorage.getItem('spos_settings') || '{}'),

  modules: {
    normal:      { name: 'Normal POS',       icon: 'fa-cash-register',  color: '#6C63FF', page: '../pages/pos-normal.html' },
    pharmacy:    { name: 'Pharmacy POS',     icon: 'fa-pills',          color: '#2ECC71', page: '../pages/pos-pharmacy.html' },
    restaurant:  { name: 'Restaurant POS',   icon: 'fa-utensils',       color: '#E74C3C', page: '../pages/pos-restaurant.html' },
    hospital:    { name: 'Hospital POS',     icon: 'fa-hospital',       color: '#3498DB', page: '../pages/pos-hospital.html' },
    pawning:     { name: 'Pawning POS',      icon: 'fa-gem',            color: '#F39C12', page: '../pages/pos-pawning.html' },
    distribution:{ name: 'Distribution POS', icon: 'fa-truck',          color: '#9B59B6', page: '../pages/pos-distribution.html' }
  },

  nav: [
    { section: 'MAIN' },
    { id: 'dashboard',    label: 'Dashboard',         icon: 'fa-th-large',        href: 'dashboard.html' },

    { section: 'POS TERMINALS' },
    { id: 'pos-normal',       label: 'Normal POS',       icon: 'fa-cash-register', href: 'pos-normal.html',       color: '#6C63FF' },
    { id: 'pos-pharmacy',     label: 'Pharmacy POS',     icon: 'fa-pills',         href: 'pos-pharmacy.html',     color: '#2ECC71' },
    { id: 'pos-restaurant',   label: 'Restaurant POS',   icon: 'fa-utensils',      href: 'pos-restaurant.html',   color: '#E74C3C' },
    { id: 'pos-hospital',     label: 'Hospital POS',     icon: 'fa-hospital',      href: 'pos-hospital.html',     color: '#3498DB' },
    { id: 'pos-pawning',      label: 'Pawning POS',      icon: 'fa-gem',           href: 'pos-pawning.html',      color: '#F39C12' },
    { id: 'pos-distribution', label: 'Distribution POS', icon: 'fa-truck',         href: 'pos-distribution.html', color: '#9B59B6' },

    { section: 'INVENTORY' },
    { id: 'products',   label: 'Products',     icon: 'fa-box',       href: 'products.html' },
    { id: 'inventory',  label: 'Inventory',    icon: 'fa-warehouse', href: 'inventory.html' },
    { id: 'suppliers',  label: 'Suppliers',    icon: 'fa-truck-loading', href: 'suppliers.html' },
    { id: 'customers',  label: 'Customers',    icon: 'fa-users',     href: 'customers.html' },

    { section: 'FINANCE' },
    { id: 'sales-history', label: 'Sales History', icon: 'fa-receipt',      href: 'sales-history.html' },
    { id: 'reports',       label: 'Reports',        icon: 'fa-chart-bar',    href: 'reports.html' },
    { id: 'accounts',      label: 'Accounts',       icon: 'fa-book',         href: 'accounts.html' },

    { section: 'SYSTEM' },
    { id: 'users',    label: 'User Management',    icon: 'fa-user-shield', href: 'users.html' },
    { id: 'roles',    label: 'Roles & Permissions',icon: 'fa-key',         href: 'roles.html' },
    { id: 'license',  label: 'License',             icon: 'fa-certificate', href: 'license.html' },
    { id: 'settings', label: 'Settings',            icon: 'fa-cog',         href: 'settings.html' },
  ]
};

// ── Auth Guard ─────────────────────────────────────────────
function requireAuth() {
  const path = window.location.pathname;
  
  // Allow admin and lock screens unconditionally
  if (path.includes('admin-license.html') || path.includes('license-lock.html')) {
    return;
  }

  // Check global license lock
  const licenseState = localStorage.getItem('spos_license_state');
  if (licenseState !== 'APPROVED') {
    window.location.href = getBasePath() + 'pages/license-lock.html';
    return;
  }

  // Check user authentication
  if (!SPOS.user && !path.includes('login.html')) {
    window.location.href = getBasePath() + 'pages/login.html';
  }
}

function getBasePath() {
  const path = window.location.pathname;
  if (path.includes('/pages/')) return '../';
  return '';
}

function isInPages() {
  return window.location.pathname.includes('/pages/');
}

// ── Sidebar Builder ────────────────────────────────────────
function buildSidebar(activeId) {
  const base = isInPages() ? '' : 'pages/';
  const mod  = SPOS.modules[SPOS.activeModule] || SPOS.modules.normal;

  let navHTML = '';
  let inPosSection = false;
  for (const item of SPOS.nav) {
    if (item.section) {
      inPosSection = (item.section === 'POS TERMINALS');
      navHTML += `<div class="nav-section-label">${item.section}</div>`;
      continue;
    }
    
    // License filtering for POS Terminals
    if (inPosSection && item.id.startsWith('pos-')) {
      const moduleName = item.id.replace('pos-', '');
      if (window.LicenseManager && !window.LicenseManager.isModuleAllowed(moduleName)) {
        continue;
      }
    }
    const isActive = item.id === activeId ? 'active' : '';
    const colorStyle = item.color ? `style="color:${item.color}"` : '';
    const badge = item.badge ? `<span class="nav-badge">${item.badge}</span>` : '';
    navHTML += `
      <a class="nav-item ${isActive}" href="${base}${item.href}" id="nav-${item.id}">
        <span class="nav-icon" ${colorStyle}><i class="fas ${item.icon}"></i></span>
        <span class="nav-text">${item.label}</span>
        ${badge}
      </a>`;
  }

  return `
  <aside class="sidebar" id="sidebar">
    <div class="sidebar-logo">
      <div class="logo-mark">SP</div>
      <div class="logo-text">
        <div class="logo-name">SPOS Cloud</div>
        <div class="logo-sub">POS Software 2026</div>
      </div>
    </div>
    <div class="active-module-badge">
      <div class="module-dot"></div>
      <div class="module-info">
        <div class="module-label">Active Module</div>
        <div class="module-name" id="active-module-name">${mod.name}</div>
      </div>
    </div>
    <nav class="sidebar-nav" id="sidebar-nav">${navHTML}</nav>
    <div class="sidebar-footer">
      <div class="user-card" onclick="toggleUserMenu()">
        <div class="avatar">${getUserInitials()}</div>
        <div class="user-info">
          <div class="user-name">${SPOS.user?.name || 'Admin User'}</div>
          <div class="user-role">${SPOS.user?.role || 'Administrator'}</div>
        </div>
        <i class="fas fa-chevron-right" style="color:var(--text-muted);font-size:0.7rem;"></i>
      </div>
    </div>
  </aside>`;
}

// ── Topbar Builder ─────────────────────────────────────────
function buildTopbar(title) {
  const time = new Date();
  const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  const dateStr = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return `
  <header class="topbar" id="topbar">
    <div class="topbar-left">
      <button class="mobile-menu-btn" onclick="toggleMobileSidebar()" id="mobile-menu-btn">
        <i class="fas fa-bars"></i>
      </button>
      <div class="topbar-search">
        <i class="fas fa-search" style="color:var(--text-muted);font-size:0.8rem;"></i>
        <input type="text" placeholder="Search products, customers, invoices..." id="global-search">
      </div>
    </div>
    <div class="topbar-right">
      <div class="datetime-chip" id="topbar-clock">
        <span class="datetime-time">${timeStr}</span>
        <span class="datetime-date">${dateStr}</span>
      </div>
      <button class="topbar-btn" onclick="toggleNotif()" id="notif-btn" data-tooltip="Notifications">
        <i class="fas fa-bell"></i>
        <span class="notif-dot"></span>
      </button>
      <button class="topbar-btn" onclick="window.location.href='${getBasePath()}pages/settings.html'" data-tooltip="Settings">
        <i class="fas fa-cog"></i>
      </button>
    </div>
  </header>`;
}

// ── Init Page ──────────────────────────────────────────────
function initPage(pageId, pageTitle) {
  requireAuth();

  // Inject sidebar + topbar
  const layout = document.getElementById('app-layout');
  if (layout) {
    const sidebar = buildSidebar(pageId);
    const topbar  = buildTopbar(pageTitle);
    const content = document.getElementById('page-content')?.innerHTML || '';

    layout.innerHTML = `
      ${sidebar}
      <div class="main-content" id="main-content">
        ${topbar}
        <div class="page-body" id="page-body">
          ${content}
        </div>
      </div>
    `;
  }

  startClock();
  initToastContainer();
  animatePageIn();
}

// ── Clock ──────────────────────────────────────────────────
function startClock() {
  const update = () => {
    const el = document.getElementById('topbar-clock');
    if (!el) return;
    const t = new Date();
    el.querySelector('.datetime-time').textContent = t.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    el.querySelector('.datetime-date').textContent = t.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };
  update();
  setInterval(update, 1000);
}

// ── Toast Notifications ────────────────────────────────────
function initToastContainer() {
  if (!document.getElementById('toast-container')) {
    const d = document.createElement('div');
    d.id = 'toast-container';
    document.body.appendChild(d);
  }
}

function showToast(msg, type = 'info', duration = 3500) {
  const icons = { success: 'fa-check-circle', warning: 'fa-exclamation-triangle', error: 'fa-times-circle', info: 'fa-info-circle' };
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info} toast-icon" style="color:var(--${type === 'error' ? 'danger' : type === 'success' ? 'success' : type === 'warning' ? 'warning' : 'info'})"></i><span class="toast-msg">${msg}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.animation = 'none'; toast.style.opacity = '0'; toast.style.transition = '0.3s'; setTimeout(() => toast.remove(), 400); }, duration);
}

// ── Page Animation ─────────────────────────────────────────
function animatePageIn() {
  const body = document.getElementById('page-body');
  if (body) {
    body.style.opacity = '0';
    body.style.transform = 'translateY(12px)';
    requestAnimationFrame(() => {
      body.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      body.style.opacity = '1';
      body.style.transform = 'translateY(0)';
    });
  }
}

// ── Mobile Sidebar ─────────────────────────────────────────
function toggleMobileSidebar() {
  document.getElementById('sidebar')?.classList.toggle('mobile-open');
}

// ── User Menu ──────────────────────────────────────────────
function toggleUserMenu() {
  const actions = [
    { label: 'My Profile', icon: 'fa-user', action: () => window.location.href = getBasePath() + 'pages/users.html' },
    { label: 'Settings',   icon: 'fa-cog',  action: () => window.location.href = getBasePath() + 'pages/settings.html' },
    { label: 'Logout',     icon: 'fa-sign-out-alt', action: logout, danger: true },
  ];
  showContextMenu(actions);
}

function logout() {
  localStorage.removeItem('spos_user');
  window.location.href = getBasePath() + 'pages/login.html';
}

// ── Context Menu ───────────────────────────────────────────
function showContextMenu(items, x, y) {
  removeContextMenu();
  const menu = document.createElement('div');
  menu.id = 'ctx-menu';
  menu.style.cssText = `position:fixed;bottom:70px;left:14px;z-index:9999;`;
  menu.className = 'dropdown-menu';
  menu.style.opacity = '1'; menu.style.visibility = 'visible'; menu.style.transform = 'none';
  items.forEach(item => {
    const btn = document.createElement('button');
    btn.className = `dropdown-item ${item.danger ? 'danger' : ''}`;
    btn.innerHTML = `<i class="fas ${item.icon}"></i> ${item.label}`;
    btn.onclick = () => { item.action(); removeContextMenu(); };
    menu.appendChild(btn);
  });
  document.body.appendChild(menu);
  setTimeout(() => document.addEventListener('click', removeContextMenu, { once: true }), 100);
}

function removeContextMenu() { document.getElementById('ctx-menu')?.remove(); }

// ── Notification Panel ─────────────────────────────────────
function toggleNotif() {
  const existing = document.getElementById('notif-panel');
  if (existing) { existing.remove(); return; }

  const panel = document.createElement('div');
  panel.id = 'notif-panel';
  panel.className = 'notif-panel';
  panel.style.cssText = 'position:fixed;top:70px;right:10px;z-index:9999;';
  panel.innerHTML = `
    <div class="notif-header"><span>Notifications</span><span class="badge badge-primary">3 new</span></div>
    <div class="notif-item unread">
      <div class="notif-icon" style="width:34px;height:34px;border-radius:50%;background:rgba(108,99,255,0.15);display:flex;align-items:center;justify-content:center;color:#6C63FF;font-size:0.9rem;flex-shrink:0"><i class="fas fa-shopping-cart"></i></div>
      <div class="notif-body"><div class="notif-title">New sale completed – LKR 4,500</div><div class="notif-time">2 minutes ago</div></div>
    </div>
    <div class="notif-item unread">
      <div class="notif-icon" style="width:34px;height:34px;border-radius:50%;background:rgba(243,156,18,0.15);display:flex;align-items:center;justify-content:center;color:#F39C12;font-size:0.9rem;flex-shrink:0"><i class="fas fa-exclamation-triangle"></i></div>
      <div class="notif-body"><div class="notif-title">Low stock alert – Paracetamol 500mg</div><div class="notif-time">15 minutes ago</div></div>
    </div>
    <div class="notif-item unread">
      <div class="notif-icon" style="width:34px;height:34px;border-radius:50%;background:rgba(231,76,60,0.15);display:flex;align-items:center;justify-content:center;color:#E74C3C;font-size:0.9rem;flex-shrink:0"><i class="fas fa-certificate"></i></div>
      <div class="notif-body"><div class="notif-title">License expires in 30 days</div><div class="notif-time">1 hour ago</div></div>
    </div>
    <div class="notif-item">
      <div class="notif-icon" style="width:34px;height:34px;border-radius:50%;background:rgba(46,204,113,0.15);display:flex;align-items:center;justify-content:center;color:#2ECC71;font-size:0.9rem;flex-shrink:0"><i class="fas fa-check"></i></div>
      <div class="notif-body"><div class="notif-title">Daily backup completed</div><div class="notif-time">3 hours ago</div></div>
    </div>
  `;
  document.body.appendChild(panel);
  setTimeout(() => document.addEventListener('click', () => panel.remove(), { once: true }), 100);
}

// ── Modal Helpers ──────────────────────────────────────────
function openModal(id) {
  document.getElementById(id)?.classList.add('active');
}

function closeModal(id) {
  document.getElementById(id)?.classList.remove('active');
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

// ── Tab System ─────────────────────────────────────────────
function initTabs(containerSelector) {
  const containers = document.querySelectorAll(containerSelector || '.tabs');
  containers.forEach(container => {
    const btns = container.querySelectorAll('.tab-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const panes = container.closest('.tab-container')?.querySelectorAll('.tab-pane');
        panes?.forEach(p => {
          p.classList.toggle('active', p.id === target);
        });
      });
    });
  });
}

// ── Currency Formatter ─────────────────────────────────────
function formatCurrency(amount, currency = 'LKR') {
  return `${currency} ${parseFloat(amount).toLocaleString('en-LK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// ── Utility ────────────────────────────────────────────────
function getUserInitials() {
  const name = SPOS.user?.name || 'Admin User';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function generateId(prefix = 'ID') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`;
}

function formatDate(d) {
  return new Date(d || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function debounce(fn, delay = 300) {
  let t;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}

// ── Close dropdowns on outside click ──────────────────────
document.addEventListener('click', e => {
  if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown.open').forEach(d => d.classList.remove('open'));
  }
});

// ── Modal close on overlay click ──────────────────────────
document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
  }
});

// ── ESC key closes modals ──────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeAllModals();
});

// ── Switch POS Module ──────────────────────────────────────
function switchModule(moduleKey) {
  const mod = SPOS.modules[moduleKey];
  if (!mod) return;
  SPOS.activeModule = moduleKey;
  localStorage.setItem('spos_module', moduleKey);
  window.location.href = mod.page;
}

console.log(`%c SPOS Cloud POS 2026 v${SPOS.version} `, 'background:linear-gradient(135deg,#6C63FF,#4ECDC4);color:#fff;font-weight:900;padding:4px 8px;border-radius:4px;');
