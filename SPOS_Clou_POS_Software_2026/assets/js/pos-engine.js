/* =========================================================
   SPOS – POS Engine (Cart / Billing)
   ========================================================= */

'use strict';

class POSEngine {
  constructor(moduleType = 'normal') {
    this.moduleType  = moduleType;
    this.cart        = [];
    this.customer    = null;
    this.discount    = 0;        // flat discount
    this.discountPct = 0;        // percentage discount
    this.taxRate     = 0.18;     // 18% VAT
    this.payMethod   = 'cash';
    this.heldSales   = JSON.parse(sessionStorage.getItem('spos_held') || '[]');
    this.invoiceNo   = this._nextInvoiceNo();
  }

  // ── Products Catalog ──────────────────────────────────────
  static PRODUCTS = {
    normal: [
      { id: 'P001', name: 'Mineral Water 1L',     price: 90,   icon: '💧', category: 'Beverages', sku: 'BEV001', stock: 200 },
      { id: 'P002', name: 'Coca Cola 330ml',       price: 160,  icon: '🥤', category: 'Beverages', sku: 'BEV002', stock: 150 },
      { id: 'P003', name: 'Sunflower Oil 1L',      price: 580,  icon: '🫙', category: 'Grocery',   sku: 'GRC001', stock: 80 },
      { id: 'P004', name: 'Wheat Flour 1kg',       price: 220,  icon: '🌾', category: 'Grocery',   sku: 'GRC002', stock: 120 },
      { id: 'P005', name: 'White Sugar 1kg',       price: 240,  icon: '🍚', category: 'Grocery',   sku: 'GRC003', stock: 90 },
      { id: 'P006', name: 'Chocolate Bar',         price: 350,  icon: '🍫', category: 'Snacks',    sku: 'SNK001', stock: 60 },
      { id: 'P007', name: 'Biscuit Pack',          price: 180,  icon: '🍪', category: 'Snacks',    sku: 'SNK002', stock: 75 },
      { id: 'P008', name: 'Fresh Milk 1L',         price: 300,  icon: '🥛', category: 'Dairy',     sku: 'DRY001', stock: 40 },
      { id: 'P009', name: 'Cheddar Cheese 250g',   price: 620,  icon: '🧀', category: 'Dairy',     sku: 'DRY002', stock: 25 },
      { id: 'P010', name: 'Eggs (Tray 30)',        price: 1200, icon: '🥚', category: 'Dairy',     sku: 'DRY003', stock: 30 },
      { id: 'P011', name: 'Basmati Rice 5kg',      price: 2200, icon: '🍚', category: 'Grocery',   sku: 'GRC004', stock: 50 },
      { id: 'P012', name: 'Shampoo 400ml',         price: 780,  icon: '🧴', category: 'Personal',  sku: 'PRS001', stock: 45 },
      { id: 'P013', name: 'Soap Bar',              price: 120,  icon: '🧼', category: 'Personal',  sku: 'PRS002', stock: 100 },
      { id: 'P014', name: 'Toothpaste 150g',       price: 340,  icon: '🪥', category: 'Personal',  sku: 'PRS003', stock: 55 },
      { id: 'P015', name: 'Notebook A4',           price: 450,  icon: '📓', category: 'Stationery',sku: 'STN001', stock: 30 },
      { id: 'P016', name: 'Ball Point Pen',        price: 45,   icon: '✏️', category: 'Stationery',sku: 'STN002', stock: 200 },
    ],
    pharmacy: [
      { id: 'MED001', name: 'Paracetamol 500mg', price: 15,   icon: '💊', category: 'Analgesics', sku: 'ANA001', stock: 500, rx: false, expiry: '2026-12-31' },
      { id: 'MED002', name: 'Amoxicillin 250mg', price: 45,   icon: '💊', category: 'Antibiotics', sku: 'ANT001', stock: 300, rx: true,  expiry: '2026-08-30' },
      { id: 'MED003', name: 'Metformin 500mg',   price: 30,   icon: '💊', category: 'Diabetes',   sku: 'DIA001', stock: 400, rx: true,  expiry: '2027-01-15' },
      { id: 'MED004', name: 'Omeprazole 20mg',   price: 28,   icon: '💊', category: 'GI',         sku: 'GI001',  stock: 250, rx: false, expiry: '2026-09-30' },
      { id: 'MED005', name: 'Cetrizine 10mg',    price: 20,   icon: '💊', category: 'Allergy',    sku: 'ALL001', stock: 450, rx: false, expiry: '2027-03-01' },
      { id: 'MED006', name: 'Ibuprofen 400mg',   price: 22,   icon: '💊', category: 'Analgesics', sku: 'ANA002', stock: 380, rx: false, expiry: '2026-11-30' },
      { id: 'MED007', name: 'Vitamin C 500mg',   price: 35,   icon: '🍊', category: 'Vitamins',   sku: 'VIT001', stock: 600, rx: false, expiry: '2027-06-30' },
      { id: 'MED008', name: 'Syrup Cough 100ml', price: 185,  icon: '🧪', category: 'Cough',      sku: 'CGH001', stock: 120, rx: false, expiry: '2026-07-15' },
      { id: 'MED009', name: 'Insulin Glargine',  price: 3200, icon: '💉', category: 'Diabetes',   sku: 'DIA002', stock: 50,  rx: true,  expiry: '2026-10-01' },
      { id: 'MED010', name: 'Blood Pressure Kit',price: 5800, icon: '🩺', category: 'Equipment',  sku: 'EQP001', stock: 15,  rx: false, expiry: '2030-01-01' },
      { id: 'MED011', name: 'Surgical Gloves',   price: 350,  icon: '🧤', category: 'Equipment',  sku: 'EQP002', stock: 80,  rx: false, expiry: '2028-01-01' },
      { id: 'MED012', name: 'Face Mask (Box 50)',price: 1200, icon: '😷', category: 'Equipment',  sku: 'EQP003', stock: 40,  rx: false, expiry: '2028-01-01' },
    ],
    restaurant: [
      { id: 'R001', name: 'Fried Rice',        price: 680,  icon: '🍳', category: 'Mains',    sku: 'MN001', stock: 99 },
      { id: 'R002', name: 'Kottu Roti',        price: 750,  icon: '🍱', category: 'Mains',    sku: 'MN002', stock: 99 },
      { id: 'R003', name: 'Chicken Curry',     price: 900,  icon: '🍛', category: 'Mains',    sku: 'MN003', stock: 99 },
      { id: 'R004', name: 'Fish & Chips',      price: 1200, icon: '🐟', category: 'Mains',    sku: 'MN004', stock: 99 },
      { id: 'R005', name: 'Veg Burger',        price: 650,  icon: '🍔', category: 'Mains',    sku: 'MN005', stock: 99 },
      { id: 'R006', name: 'Spring Rolls (6)',  price: 550,  icon: '🥢', category: 'Starters', sku: 'ST001', stock: 99 },
      { id: 'R007', name: 'Soup of the Day',   price: 450,  icon: '🍲', category: 'Starters', sku: 'ST002', stock: 99 },
      { id: 'R008', name: 'Garlic Bread',      price: 350,  icon: '🥖', category: 'Starters', sku: 'ST003', stock: 99 },
      { id: 'R009', name: 'Chocolate Lava',    price: 480,  icon: '🍮', category: 'Desserts', sku: 'DS001', stock: 99 },
      { id: 'R010', name: 'Ice Cream (2 Scoop)',price: 380, icon: '🍨', category: 'Desserts', sku: 'DS002', stock: 99 },
      { id: 'R011', name: 'Fresh Lime Juice',  price: 280,  icon: '🍋', category: 'Drinks',   sku: 'DR001', stock: 99 },
      { id: 'R012', name: 'Milk Tea',          price: 220,  icon: '🍵', category: 'Drinks',   sku: 'DR002', stock: 99 },
      { id: 'R013', name: 'Coca Cola 330ml',   price: 200,  icon: '🥤', category: 'Drinks',   sku: 'DR003', stock: 99 },
      { id: 'R014', name: 'Mineral Water',     price: 100,  icon: '💧', category: 'Drinks',   sku: 'DR004', stock: 99 },
    ],
    hospital: [
      { id: 'H001', name: 'OPD Consultation',    price: 1500, icon: '👨‍⚕️', category: 'Consultation', sku: 'CON001', stock: 99 },
      { id: 'H002', name: 'Specialist Fee',       price: 3500, icon: '🏥', category: 'Consultation', sku: 'CON002', stock: 99 },
      { id: 'H003', name: 'CBC Blood Test',       price: 1800, icon: '🩸', category: 'Lab Tests',    sku: 'LAB001', stock: 99 },
      { id: 'H004', name: 'Urine Test',           price: 900,  icon: '🧪', category: 'Lab Tests',    sku: 'LAB002', stock: 99 },
      { id: 'H005', name: 'X-Ray Chest',          price: 2500, icon: '🩻', category: 'Radiology',   sku: 'RAD001', stock: 99 },
      { id: 'H006', name: 'Ultrasound Scan',      price: 4500, icon: '📡', category: 'Radiology',   sku: 'RAD002', stock: 99 },
      { id: 'H007', name: 'ECG',                  price: 1200, icon: '❤️', category: 'Cardiology',  sku: 'CAR001', stock: 99 },
      { id: 'H008', name: 'Ward Bed (per day)',   price: 3000, icon: '🛏️', category: 'Ward',        sku: 'WRD001', stock: 20 },
      { id: 'H009', name: 'ICU Bed (per day)',    price: 8000, icon: '🏨', category: 'Ward',        sku: 'WRD002', stock: 5 },
      { id: 'H010', name: 'Dressing & Bandage',  price: 800,  icon: '🩹', category: 'Procedures',  sku: 'PRC001', stock: 99 },
      { id: 'H011', name: 'IV Drip Setup',        price: 2200, icon: '💉', category: 'Procedures',  sku: 'PRC002', stock: 50 },
    ],
    distribution: [
      { id: 'D001', name: 'Cola (Case 24)',      price: 3840, icon: '🥤', category: 'Beverages',  sku: 'DIS001', stock: 200 },
      { id: 'D002', name: 'Water (Case 24)',     price: 1800, icon: '💧', category: 'Beverages',  sku: 'DIS002', stock: 300 },
      { id: 'D003', name: 'Biscuits (Box 48)',   price: 7200, icon: '🍪', category: 'Snacks',     sku: 'DIS003', stock: 100 },
      { id: 'D004', name: 'Instant Noodles',     price: 2400, icon: '🍜', category: 'Grocery',    sku: 'DIS004', stock: 150 },
      { id: 'D005', name: 'Soap (Box 100)',      price: 12000,icon: '🧼', category: 'Personal',   sku: 'DIS005', stock: 80 },
      { id: 'D006', name: 'Detergent 5kg',       price: 4500, icon: '🧴', category: 'Cleaning',   sku: 'DIS006', stock: 60 },
      { id: 'D007', name: 'Rice 50kg',           price: 22000,icon: '🍚', category: 'Grocery',    sku: 'DIS007', stock: 40 },
      { id: 'D008', name: 'Sugar 50kg',          price: 12000,icon: '🍚', category: 'Grocery',    sku: 'DIS008', stock: 35 },
    ]
  };

  // ── Cart Operations ────────────────────────────────────────
  addItem(product, qty = 1) {
    const existing = this.cart.find(i => i.id === product.id);
    if (existing) {
      existing.qty = Math.min(existing.qty + qty, product.stock || 9999);
    } else {
      this.cart.push({ ...product, qty, lineDiscount: 0 });
    }
    this.onCartUpdate?.();
    return this.cart;
  }

  removeItem(id) {
    this.cart = this.cart.filter(i => i.id !== id);
    this.onCartUpdate?.();
  }

  updateQty(id, qty) {
    const item = this.cart.find(i => i.id === id);
    if (!item) return;
    if (qty <= 0) this.removeItem(id);
    else item.qty = qty;
    this.onCartUpdate?.();
  }

  clearCart() {
    this.cart = [];
    this.customer = null;
    this.discount = 0;
    this.discountPct = 0;
    this.payMethod = 'cash';
    this.invoiceNo = this._nextInvoiceNo();
    this.onCartUpdate?.();
  }

  holdSale() {
    if (!this.cart.length) return false;
    this.heldSales.push({ cart: [...this.cart], customer: this.customer, time: new Date().toISOString(), invoiceNo: this.invoiceNo });
    sessionStorage.setItem('spos_held', JSON.stringify(this.heldSales));
    this.clearCart();
    return true;
  }

  recallSale(idx) {
    const held = this.heldSales[idx];
    if (!held) return false;
    this.cart       = held.cart;
    this.customer   = held.customer;
    this.invoiceNo  = held.invoiceNo;
    this.heldSales.splice(idx, 1);
    sessionStorage.setItem('spos_held', JSON.stringify(this.heldSales));
    this.onCartUpdate?.();
    return true;
  }

  // ── Calculations ───────────────────────────────────────────
  get subtotal() {
    return this.cart.reduce((s, i) => s + (i.price * i.qty) - (i.lineDiscount || 0), 0);
  }

  get discountAmount() {
    const pctAmt = this.subtotal * (this.discountPct / 100);
    return this.discount + pctAmt;
  }

  get taxableAmount() {
    return Math.max(0, this.subtotal - this.discountAmount);
  }

  get taxAmount() {
    return this.taxableAmount * this.taxRate;
  }

  get total() {
    return this.taxableAmount + this.taxAmount;
  }

  get itemCount() {
    return this.cart.reduce((s, i) => s + i.qty, 0);
  }

  // ── Checkout ───────────────────────────────────────────────
  checkout(tenderedAmount = 0) {
    if (!this.cart.length) return null;

    const sale = {
      invoiceNo:  this.invoiceNo,
      module:     this.moduleType,
      items:      [...this.cart],
      customer:   this.customer,
      subtotal:   this.subtotal,
      discount:   this.discountAmount,
      tax:        this.taxAmount,
      total:      this.total,
      tendered:   tenderedAmount,
      change:     Math.max(0, tenderedAmount - this.total),
      payMethod:  this.payMethod,
      cashier:    SPOS.user?.name || 'Admin',
      timestamp:  new Date().toISOString(),
    };

    // Save to sales history
    const sales = JSON.parse(localStorage.getItem('spos_sales') || '[]');
    sales.unshift(sale);
    localStorage.setItem('spos_sales', JSON.stringify(sales));

    logActivity?.(`Sale: ${sale.invoiceNo} – LKR ${sale.total.toFixed(2)}`, 'sale');

    this.clearCart();
    return sale;
  }

  _nextInvoiceNo() {
    const count = parseInt(localStorage.getItem('spos_inv_count') || '1000');
    localStorage.setItem('spos_inv_count', count + 1);
    const prefix = { normal: 'NRM', pharmacy: 'PRM', restaurant: 'RST', hospital: 'HSP', pawning: 'PWN', distribution: 'DST' };
    return `${prefix[this.moduleType] || 'INV'}-${count + 1}`;
  }

  // ── Products for Module ────────────────────────────────────
  getProducts(category = null, search = '') {
    const list = POSEngine.PRODUCTS[this.moduleType] || POSEngine.PRODUCTS.normal;
    return list.filter(p => {
      const matchCat  = !category || category === 'All' || p.category === category;
      const matchSrch = !search   || p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSrch;
    });
  }

  getCategories() {
    const list = POSEngine.PRODUCTS[this.moduleType] || POSEngine.PRODUCTS.normal;
    return ['All', ...new Set(list.map(p => p.category))];
  }

  // ── Sales History ──────────────────────────────────────────
  static getSales(module = null, limit = 100) {
    const sales = JSON.parse(localStorage.getItem('spos_sales') || '[]');
    const filtered = module ? sales.filter(s => s.module === module) : sales;
    return filtered.slice(0, limit);
  }

  static getDailySummary() {
    const today = new Date().toDateString();
    const sales = JSON.parse(localStorage.getItem('spos_sales') || '[]');
    const todaySales = sales.filter(s => new Date(s.timestamp).toDateString() === today);
    return {
      count: todaySales.length,
      revenue: todaySales.reduce((s, sale) => s + sale.total, 0),
      tax: todaySales.reduce((s, sale) => s + sale.tax, 0),
      discount: todaySales.reduce((s, sale) => s + sale.discount, 0),
    };
  }
}
