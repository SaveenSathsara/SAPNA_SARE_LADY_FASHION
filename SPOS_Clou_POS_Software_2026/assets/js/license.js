/* =========================================================
   SPOS – License Management
   ========================================================= */

'use strict';

const LICENSE_TIERS = {
  TRIAL:        { name: 'Trial',        days: 30,  modules: ['normal'],                                                        maxUsers: 1,   maxProducts: 50 },
  STANDARD:     { name: 'Standard',     days: 365, modules: ['normal', 'pharmacy'],                                             maxUsers: 5,   maxProducts: 500 },
  PROFESSIONAL: { name: 'Professional', days: 365, modules: ['normal', 'pharmacy', 'restaurant', 'hospital'],                  maxUsers: 20,  maxProducts: 5000 },
  ENTERPRISE:   { name: 'Enterprise',   days: 365, modules: ['normal', 'pharmacy', 'restaurant', 'hospital', 'pawning', 'distribution'], maxUsers: 999, maxProducts: 999999 },
};

// Demo valid license keys (in real system these would be server-validated)
const VALID_LICENSES = {
  'SPOS-TRIAL-2026-DEMO1':  { tier: 'TRIAL',        issuedTo: 'Demo Business',           issuedDate: '2026-01-01', expiryDate: '2026-12-31' },
  'SPOS-STD-2026-AB1234':   { tier: 'STANDARD',     issuedTo: 'ABC Supermarket',         issuedDate: '2026-01-01', expiryDate: '2026-12-31' },
  'SPOS-PRO-2026-XY5678':   { tier: 'PROFESSIONAL', issuedTo: 'City Medical Centre',     issuedDate: '2026-01-01', expiryDate: '2026-12-31' },
  'SPOS-ENT-2026-ZZ9999':   { tier: 'ENTERPRISE',   issuedTo: 'MegaMart Holdings (Pvt)', issuedDate: '2026-01-01', expiryDate: '2026-12-31' },
};

// ── License State ──────────────────────────────────────────
const LicenseManager = {
  _license: null,

  init() {
    const stored = localStorage.getItem('spos_license_data');
    if (stored) this._license = JSON.parse(stored);
    else        this._activateTrial(); // auto-activate trial
    return this;
  },

  _activateTrial() {
    const trial = {
      key:        'SPOS-TRIAL-2026-DEMO1',
      tier:       'TRIAL',
      issuedTo:   'Demo Business',
      issuedDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 30*24*3600*1000).toISOString().split('T')[0],
      activatedAt: new Date().toISOString(),
      machineId:  this._getMachineId(),
    };
    this._license = trial;
    localStorage.setItem('spos_license_data', JSON.stringify(trial));
  },

  activate(key) {
    const trimmed = key.trim().toUpperCase();
    const info    = VALID_LICENSES[trimmed];
    if (!info) return { success: false, error: 'Invalid license key. Please check and try again.' };

    const expiry = new Date(info.expiryDate);
    if (expiry < new Date()) return { success: false, error: 'This license key has expired.' };

    const license = {
      key:        trimmed,
      ...info,
      activatedAt: new Date().toISOString(),
      machineId:  this._getMachineId(),
    };
    this._license = license;
    localStorage.setItem('spos_license_data', JSON.stringify(license));
    logActivity?.(`License activated: ${trimmed}`, 'license');
    return { success: true, license };
  },

  deactivate() {
    this._license = null;
    localStorage.removeItem('spos_license_data');
    this._activateTrial();
    logActivity?.('License deactivated – reverted to Trial', 'license');
  },

  get isValid() {
    if (!this._license) return false;
    return new Date(this._license.expiryDate) >= new Date();
  },

  get tier() {
    return this._license?.tier || 'TRIAL';
  },

  get tierInfo() {
    return LICENSE_TIERS[this.tier] || LICENSE_TIERS.TRIAL;
  },

  get license() {
    return this._license;
  },

  get daysRemaining() {
    if (!this._license) return 0;
    const diff = new Date(this._license.expiryDate) - new Date();
    return Math.max(0, Math.ceil(diff / (1000 * 3600 * 24)));
  },

  get expiryStatus() {
    const days = this.daysRemaining;
    if (days === 0)   return { label: 'Expired', class: 'danger' };
    if (days <= 7)    return { label: `${days}d left`, class: 'danger' };
    if (days <= 30)   return { label: `${days}d left`, class: 'warning' };
    return { label: `${days}d left`, class: 'success' };
  },

  isModuleAllowed(moduleKey) {
    return this.tierInfo.modules.includes(moduleKey);
  },

  _getMachineId() {
    let id = localStorage.getItem('spos_machine_id');
    if (!id) {
      id = 'MACH-' + Math.random().toString(36).substr(2,8).toUpperCase() + '-' + Date.now().toString(36).toUpperCase();
      localStorage.setItem('spos_machine_id', id);
    }
    return id;
  },

  getUsageReport() {
    return {
      currentUsers:    getUsers?.()?.length || 0,
      maxUsers:        this.tierInfo.maxUsers,
      currentProducts: (JSON.parse(localStorage.getItem('spos_products') || '[]')).length,
      maxProducts:     this.tierInfo.maxProducts,
      totalSales:      JSON.parse(localStorage.getItem('spos_sales') || '[]').length,
    };
  },
};

// ── Initialize on load ─────────────────────────────────────
LicenseManager.init();
