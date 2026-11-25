/**
 * L'Amour Atelier — Hybrid Storage, Auth, Live Chat & Booking Client (v5)
 * Tự động kết nối PHP API (`api.php`) khi chạy trên XAMPP / Hosting PHP;
 * Tự động fallback mượt mà sang localStorage nếu mở tĩnh không có PHP.
 */

import { createInitialSeedDb, TEMPLATES, DEFAULT_PACKAGES_V9, buildTrialConfig, createInvitationFromTemplate } from './data.js?v=14';
import { runLocalChatbot, DEFAULT_CHATBOT_CONFIG } from './chatbot.js?v=14';

const LOCAL_KEY = 'lamour_wedding_studio_db_v5';
const AUTH_TOKEN_KEY = 'lamour_auth_token_v5';
const AUTH_USER_KEY = 'lamour_auth_user_v5';
const CHAT_THREAD_KEY = 'lamour_chat_thread_id_v5';
const CLOUD_API_ORIGIN_KEY = 'lamour_cloud_api_origin_v13';
const DEFAULT_CLOUD_API_ORIGIN = 'https://frabjous-stardust-68eadc.netlify.app';
const ADMIN_PASS_HASH = 'd54ddb187125b418d32c2e86b7706ffe729d53d6ef56222411145e583e7f75bd';

export function isStrictGmail(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e || e.includes('..')) return false;
  return /^[a-z0-9](?:[a-z0-9._+-]{1,62}[a-z0-9])?@gmail\.com$/i.test(e);
}

export function sanitizeVnPhone10(val) {
  return String(val || '').replace(/\D/g, '').slice(0, 10);
}

export function validateVnPhone10(val) {
  const raw = String(val || '').trim();
  if (!raw) {
    return { ok: false, digits: '', error: 'Vui lòng nhập số điện thoại (bắt buộc đủ 10 chữ số).' };
  }
  if (/[^0-9\s]/.test(raw)) {
    return { ok: false, digits: sanitizeVnPhone10(raw), error: 'Số điện thoại chỉ được nhập chữ số (0–9), không nhập chữ hoặc ký tự đặc biệt.' };
  }
  const digits = raw.replace(/\D/g, '');
  if (digits.length !== 10) {
    return { ok: false, digits, error: `Số điện thoại phải đủ đúng 10 chữ số (hiện tại mới có ${digits.length}/10 số).` };
  }
  if (!/^0(?:3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])\d{7}$/.test(digits)) {
    return { ok: false, digits, error: 'Đầu số điện thoại Việt Nam không hợp lệ (hợp lệ: 03x, 05x, 07x, 08x, 09x đủ 10 số).' };
  }
  if (/^0\d(\d)\1{7}$/.test(digits) || /(\d)\1{7}$/.test(digits)) {
    return { ok: false, digits, error: 'Số điện thoại không hợp lệ (số lặp giả). Vui lòng nhập số điện thoại thật.' };
  }
  return { ok: true, digits, error: '' };
}

export function isValidVnPhone10(val) {
  return validateVnPhone10(val).ok;
}

function sha256Fallback(ascii) {
  const rightRotate = (v, a) => (v >>> a) | (v << (32 - a));
  const maxWord = Math.pow(2, 32);
  let result = '';
  const words = [];
  const asciiBitLength = ascii.length * 8;
  const hash = [];
  const k = [];
  let primeCounter = 0;
  const isComposite = {};
  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (let i = 0; i < 313; i += candidate) isComposite[i] = candidate;
      hash[primeCounter] = (Math.pow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (Math.pow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  ascii += '\x80';
  while (ascii.length % 64 - 56) ascii += '\x00';
  for (let i = 0; i < ascii.length; i++) {
    const j = ascii.charCodeAt(i);
    words[i >> 2] |= j << ((3 - i) % 4) * 8;
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;
  for (let j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash.slice(0);
    for (let i = 0; i < 64; i++) {
      const w15 = w[i - 15], w2 = w[i - 2];
      const a = hash[0], e = hash[4];
      const temp1 = hash[7] + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) + ((e & hash[5]) ^ (~e & hash[6])) + k[i] +
        (w[i] = i < 16 ? w[i] : (w[i - 16] + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) + w[i - 7] + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) | 0);
      const temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      hash.unshift((temp1 + temp2) | 0);
      hash[4] = (hash[4] + temp1) | 0;
      hash.pop();
    }
    for (let i = 0; i < 8; i++) hash[i] = (hash[i] + oldHash[i]) | 0;
  }
  for (let i = 0; i < 8; i++) {
    for (let j = 3; j + 1; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

async function hashLocalPassword(pw) {
  const input = 'lamour_v6:' + String(pw || '');
  if (typeof crypto !== 'undefined' && crypto.subtle && typeof TextEncoder !== 'undefined') {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (_) {}
  }
  const utf8 = unescape(encodeURIComponent(input));
  return sha256Fallback(utf8);
}

class StorageService {
  constructor() {
    this.backendMode = 'checking'; // 'netlify' | 'php' | 'local'
    this.apiBase = '';
    this.apiOrigin = '';
    this.oauthInfo = {};
    this.aiAgentReady = false;
    this.paymentWebhookActive = false;
    this.paymentWebhookUrl = '';
    this.authToken = localStorage.getItem(AUTH_TOKEN_KEY) || '';
    try {
      this.currentUser = JSON.parse(localStorage.getItem(AUTH_USER_KEY) || 'null');
    } catch (_) {
      this.currentUser = null;
    }
  }

  getConfiguredCloudOrigin() {
    try {
      const qsApi = new URLSearchParams(window.location.search).get('api');
      if (qsApi && /^https?:\/\//i.test(qsApi)) {
        const clean = qsApi.replace(/\/+$/, '').replace(/\/api$/i, '');
        localStorage.setItem(CLOUD_API_ORIGIN_KEY, clean);
        return clean;
      }
      const saved = (localStorage.getItem(CLOUD_API_ORIGIN_KEY) || '').trim();
      if (saved && /^https?:\/\//i.test(saved)) return saved.replace(/\/+$/, '').replace(/\/api$/i, '');
    } catch (_) {}
    return DEFAULT_CLOUD_API_ORIGIN;
  }

  isCloudOnline() {
    return this.backendMode === 'netlify' || this.backendMode === 'php';
  }

  apiUrl(qs) {
    return `${this.apiBase || '/api'}?${qs}`;
  }

  resolveMediaUrl(url) {
    if (!url) return url;
    if (this.apiOrigin && typeof url === 'string' && url.startsWith('/api?')) {
      return `${this.apiOrigin}${url}`;
    }
    return url;
  }

  setSession(token, user) {
    this.authToken = token || '';
    this.currentUser = user || null;
    if (token) localStorage.setItem(AUTH_TOKEN_KEY, token);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
    if (user) localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_USER_KEY);
  }

  clearSession() {
    this.setSession('', null);
  }

  getChatThreadId() {
    let tid = localStorage.getItem(CHAT_THREAD_KEY);
    if (!tid) {
      tid = 'th_' + Math.random().toString(36).slice(2, 10);
      localStorage.setItem(CHAT_THREAD_KEY, tid);
    }
    return tid;
  }

  authHeaders(extra = {}) {
    const h = { ...extra };
    if (this.authToken) h['X-Auth-Token'] = this.authToken;
    return h;
  }

  async tryConnectNetlifyApi(baseEndpoint, originPrefix = '') {
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timer = controller ? setTimeout(() => controller.abort(), 5000) : null;
    try {
      const res = await fetch(`${baseEndpoint}?action=ping`, {
        cache: 'no-store',
        ...(controller ? { signal: controller.signal } : {}),
      });
      const ct = (res.headers.get('content-type') || '').toLowerCase();
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data && data.ok) {
          this.backendMode = 'netlify';
          this.apiBase = baseEndpoint;
          this.apiOrigin = originPrefix;
          this.oauthInfo = data.oauth || {};
          this.aiAgentReady = Boolean(data.aiAgentReady);
          this.paymentWebhookActive = Boolean(data.paymentWebhookActive);
          this.paymentWebhookUrl = data.paymentWebhookUrl || `${originPrefix || window.location.origin}/api?action=payment_webhook`;
          if (!data.hasDb) {
            await fetch(`${baseEndpoint}?action=init`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(createInitialSeedDb()),
            });
          }
          if (this.authToken) await this.verifySession();
          return true;
        }
      }
    } catch (_) {} finally {
      if (timer) clearTimeout(timer);
    }
    return false;
  }

  async detectBackend() {
    const isFile = window.location.protocol === 'file:';
    const isGithubPages = window.location.hostname.endsWith('.github.io');
    if (isFile) {
      this.backendMode = 'local';
      this.apiBase = '';
      this.apiOrigin = '';
      this.ensureLocalSeed();
      return 'local';
    }

    const cloudOrigin = this.getConfiguredCloudOrigin();

    // On GitHub Pages (*.github.io), connect directly over HTTPS CORS to our Netlify Cloud Backend (/api)!
    if (isGithubPages) {
      if (cloudOrigin && await this.tryConnectNetlifyApi(`${cloudOrigin}/api`, cloudOrigin)) {
        return 'netlify';
      }
      this.backendMode = 'local';
      this.apiBase = '';
      this.apiOrigin = '';
      this.ensureLocalSeed();
      return 'local';
    }

    // 1. Try same-origin Netlify Functions Cloud Backend (/api) first
    if (await this.tryConnectNetlifyApi('/api', '')) {
      return 'netlify';
    }

    // 2. Try PHP Hosting / XAMPP Backend (api.php)
    if (!window.location.hostname.endsWith('.netlify.app')) {
      try {
        const res = await fetch('api.php?action=ping', { cache: 'no-store' });
        const ct = (res.headers.get('content-type') || '').toLowerCase();
        if (res.ok && ct.includes('application/json')) {
          const data = await res.json();
          if (data && data.ok) {
            this.backendMode = 'php';
            this.apiBase = 'api.php';
            this.apiOrigin = '';
            this.oauthInfo = data.oauth || {};
            if (!data.hasDb) {
              await fetch('api.php?action=init', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createInitialSeedDb()),
              });
            }
            if (this.authToken) await this.verifySession();
            return 'php';
          }
        }
      } catch (_) {}

      // 3. Fallback to configured Cloud API origin for other static hosts
      if (cloudOrigin && cloudOrigin !== window.location.origin) {
        if (await this.tryConnectNetlifyApi(`${cloudOrigin}/api`, cloudOrigin)) {
          return 'netlify';
        }
      }
    }

    this.backendMode = 'local';
    this.apiBase = '';
    this.apiOrigin = '';
    this.ensureLocalSeed();
    return 'local';
  }

  ensureLocalSeed() {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) {
      const seed = createInitialSeedDb();
      seed.users = [
        {
          id: 'usr_admin_master',
          role: 'admin',
          provider: 'gmail',
          name: 'Quản Trị Viên Studio',
          email: 'lochoipes@gmail.com',
          phone: '0354248177',
          passwordSha256: ADMIN_PASS_HASH,
          createdAt: new Date().toISOString(),
        },
      ];
      localStorage.setItem(LOCAL_KEY, JSON.stringify(seed));
      return;
    }
    try {
      const db = JSON.parse(raw);
      let changed = false;
      const admin = (db.users || []).find(u => (u.email || '').toLowerCase() === 'lochoipes@gmail.com');
      if (admin && !admin.passwordSha256) {
        admin.passwordSha256 = ADMIN_PASS_HASH;
        delete admin.passwordPlain;
        changed = true;
      }
      // Ensure new built-in trial templates & v9 feature-focused packages are synced into existing localStorage DB
      if (Array.isArray(db.templates)) {
        const existingIds = new Set(db.templates.map(t => t.id));
        TEMPLATES.forEach(t => {
          if (t.isTrialTemplate && !existingIds.has(t.id)) {
            db.templates.push(JSON.parse(JSON.stringify(t)));
            changed = true;
          }
        });
      }
      if ((db.version || 0) < 9) {
        db.version = 9;
        db.settings = db.settings || {};
        db.settings.packages = JSON.parse(JSON.stringify(DEFAULT_PACKAGES_V9));
        if (db.chatbotConfig && Array.isArray(db.chatbotConfig.rules)) {
          db.chatbotConfig.rules = JSON.parse(JSON.stringify(DEFAULT_CHATBOT_CONFIG.rules));
        }
        changed = true;
      }
      if ((db.version || 0) < 11) {
        db.version = 11;
        db.chatbotConfig = db.chatbotConfig || JSON.parse(JSON.stringify(DEFAULT_CHATBOT_CONFIG));
        db.chatbotConfig.customerQuickPrompts = JSON.parse(JSON.stringify(DEFAULT_CHATBOT_CONFIG.customerQuickPrompts));
        changed = true;
      }
      if (changed) localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
    } catch (_) {}
  }

  readLocalDb() {
    this.ensureLocalSeed();
    try {
      return JSON.parse(localStorage.getItem(LOCAL_KEY));
    } catch (_) {
      localStorage.removeItem(LOCAL_KEY);
      this.ensureLocalSeed();
      return JSON.parse(localStorage.getItem(LOCAL_KEY));
    }
  }

  writeLocalDb(db) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        if (!this._bc) this._bc = new BroadcastChannel('lamour_live_sync_v10');
        this._bc.postMessage({ type: 'db_updated', at: Date.now() });
      }
    } catch (_) {}
  }

  subscribeSync(callback) {
    const onStorage = e => {
      if (!e.key || e.key === LOCAL_KEY) callback();
    };
    window.addEventListener('storage', onStorage);
    let bc = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('lamour_live_sync_v10');
        bc.onmessage = () => callback();
      } catch (_) {}
    }
    return () => {
      window.removeEventListener('storage', onStorage);
      try { bc?.close(); } catch (_) {}
    };
  }

  /* ===================== AUTHENTICATION ===================== */
  async verifySession() {
    if (!this.authToken) return null;
    if (this.isCloudOnline()) {
      try {
        const res = await fetch(this.apiUrl('action=auth_me'), { headers: this.authHeaders(), cache: 'no-store' });
        const data = await res.json();
        if (res.ok && data.ok && data.user) {
          this.setSession(this.authToken, data.user);
          return data.user;
        }
      } catch (_) {}
      this.clearSession();
      return null;
    }
    return this.currentUser;
  }

  async completeOAuthToken(token) {
    if (!token) return null;
    this.authToken = token;
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    return await this.verifySession();
  }

  async sendGmailOtp(email) {
    if (!isStrictGmail(email)) {
      throw new Error('Vui lòng nhập đúng địa chỉ Gmail hợp lệ (định dạng tenban@gmail.com)');
    }
    if (!this.isCloudOnline()) {
      throw new Error('Gửi mã OTP Gmail cần chạy trên hệ thống Backend');
    }
    const res = await fetch(this.apiUrl('action=auth_gmail_otp_send'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Không gửi được mã xác thực Gmail');
    return data;
  }

  async loginWithFacebookToken(accessToken) {
    if (!this.isCloudOnline()) {
      throw new Error('Đăng nhập Facebook trực tiếp cần chạy trên Netlify Cloud Backend hoặc PHP Backend');
    }
    const res = await fetch(this.apiUrl('action=auth_login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider: 'facebook_token', accessToken }),
    });
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error(data.error || 'Đăng nhập Facebook thất bại');
    this.setSession(data.token, data.user);
    return data.user;
  }

  async authLogin({ identifier = '', password = '', provider = 'password', loginMethod = 'auto', email = '', name = '', phone = '' }) {
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl('action=auth_login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password, provider, loginMethod, email, name, phone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Đăng nhập thất bại');
      this.setSession(data.token, data.user);
      return data.user;
    }

    const db = this.readLocalDb();
    db.users = db.users || [];
    if (loginMethod === 'phone') {
      const ck = validateVnPhone10(identifier);
      if (!ck.ok) {
        throw new Error(ck.error);
      }
    } else if (loginMethod === 'gmail') {
      if (!isStrictGmail(identifier)) {
        throw new Error('Vui lòng nhập đúng địa chỉ Gmail đã tạo (@gmail.com)');
      }
    }

    const norm = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/\D/g, '');
    const found = db.users.find(u => {
      const uEmail = (u.email || '').toLowerCase();
      const uPhone = (u.phone || '').replace(/\D/g, '');
      if (loginMethod === 'phone') return cleanPhone.length >= 9 && uPhone === cleanPhone;
      if (loginMethod === 'gmail') return norm !== '' && uEmail === norm;
      return (uEmail === norm && norm !== '') || (cleanPhone.length >= 9 && uPhone === cleanPhone);
    });
    if (!found) {
      throw new Error(loginMethod === 'gmail'
        ? 'Gmail này chưa được đăng ký tài khoản — Vui lòng nhập đúng Gmail bạn đã tạo hoặc bấm Đăng Ký Mới'
        : 'Sai tài khoản hoặc mật khẩu');
    }
    const enteredHash = await hashLocalPassword(password);
    const validPass = (found.passwordSha256 && found.passwordSha256 === enteredHash) || (found.passwordPlain && found.passwordPlain === password);
    if (!validPass) throw new Error('Mật khẩu không chính xác');
    const safe = { ...found }; delete safe.passwordPlain; delete safe.passwordSha256;
    this.setSession('local_' + found.id, safe);
    return safe;
  }

  async authRegister({ provider = 'gmail', name = '', email = '', confirmEmail = '', phone = '', password = '', otpCode = '' }) {
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl('action=auth_register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, name, email, confirmEmail, phone, password, otpCode }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Đăng ký thất bại');
      this.setSession(data.token, data.user);
      return data.user;
    }
    const db = this.readLocalDb();
    db.users = db.users || [];
    const normEmail = email.trim().toLowerCase();
    const normConfirm = confirmEmail.trim().toLowerCase();
    const rawPhone = String(phone || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    if (!name.trim()) throw new Error('Vui lòng nhập họ và tên');
    if (provider === 'gmail') {
      if (!isStrictGmail(normEmail)) {
        throw new Error('Vui lòng nhập đúng địa chỉ Gmail thật đã tạo (định dạng tenban@gmail.com)');
      }
      if (normConfirm && normConfirm !== normEmail) {
        throw new Error('Gmail nhập lại chưa khớp với Gmail bạn đã tạo');
      }
    }
    if (provider === 'phone') {
      const ck = validateVnPhone10(rawPhone);
      if (!ck.ok) throw new Error(ck.error);
      if (normEmail && !isStrictGmail(normEmail)) {
        throw new Error('Gmail bổ sung phải đúng định dạng @gmail.com');
      }
    } else if (rawPhone) {
      const ck = validateVnPhone10(rawPhone);
      if (!ck.ok) throw new Error(ck.error);
    }
    if (normEmail && db.users.some(u => (u.email || '').toLowerCase() === normEmail)) throw new Error('Gmail này đã được đăng ký, vui lòng đăng nhập');
    if (cleanPhone && db.users.some(u => (u.phone || '').replace(/\D/g, '') === cleanPhone)) throw new Error('SĐT này đã được đăng ký');
    const pwHash = await hashLocalPassword(password);
    const u = { id: 'usr_' + Date.now(), role: 'customer', provider, name: name.trim(), email: normEmail, phone: cleanPhone, passwordSha256: pwHash, createdAt: new Date().toISOString() };
    db.users.push(u);
    this.writeLocalDb(db);
    const safe = { ...u }; delete safe.passwordSha256;
    this.setSession('local_' + u.id, safe);
    return safe;
  }

  async authLogout() {
    if (this.isCloudOnline() && this.authToken) {
      try { await fetch(this.apiUrl('action=auth_logout'), { method: 'POST', headers: this.authHeaders() }); } catch (_) {}
    }
    this.clearSession();
  }

  /* ===================== PUBLIC STORE & CUSTOMER PORTAL ===================== */
  async getPublicStore() {
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl('action=public_store'), { cache: 'no-store' });
      const data = await res.json();
      if (data.ok && data.initialized) {
        if (data.oauth) this.oauthInfo = data.oauth;
        return data;
      }
    }
    const db = this.readLocalDb();
    return {
      ok: true,
      initialized: true,
      settings: db.settings || {},
      templates: db.templates || [],
      chatbotConfig: db.chatbotConfig || DEFAULT_CHATBOT_CONFIG,
      oauth: this.oauthInfo || {},
    };
  }

  async getCustomerPortalData() {
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl('action=customer_portal_data'), { headers: this.authHeaders(), cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Vui lòng đăng nhập');
      return data;
    }
    const db = this.readLocalDb();
    const u = this.currentUser;
    if (!u) throw new Error('Vui lòng đăng nhập');
    const uEmail = (u.email || '').toLowerCase();
    const uPhone = (u.phone || '').replace(/[^0-9+]/g, '');
    const match = (id, em, ph) => (id && id === u.id) || (uEmail && (em || '').toLowerCase() === uEmail) || (uPhone.length >= 8 && (ph || '').replace(/[^0-9+]/g, '') === uPhone);
    return {
      ok: true,
      user: u,
      invitations: (db.invitations || []).filter(i => match(i.order?.userId, i.order?.customerEmail, i.order?.customerPhone)),
      orders: (db.consultations || []).filter(c => c.kind === 'qr_order' && match(c.userId, c.email, c.phone)),
      bookings: (db.bookings || []).filter(b => match(b.userId, b.email, b.phone)),
    };
  }

  /* ===================== ADMIN DATABASE ===================== */
  async getAdminDb() {
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl('action=admin_db'), { headers: this.authHeaders(), cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Cần đăng nhập tài khoản Quản trị');
      return data.db;
    }
    if (!this.currentUser || this.currentUser.role !== 'admin') throw new Error('Cần đăng nhập tài khoản Quản trị');
    return this.readLocalDb();
  }

  async saveAdminDb(db) {
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl('action=admin_save'), {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(db),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không thể lưu dữ liệu');
      return data;
    }
    this.writeLocalDb(db);
    return { ok: true, savedAt: new Date().toISOString() };
  }

  /* ===================== BOOKING & QR ORDER ===================== */
  async submitBooking(payload) {
    const phoneCheck = validateVnPhone10(payload?.phone);
    if (!phoneCheck.ok) throw new Error(phoneCheck.error);
    const cleanPayload = { ...payload, phone: phoneCheck.digits };
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl('action=booking_submit'), {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(cleanPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Đặt lịch thất bại');
      return data;
    }
    const db = this.readLocalDb();
    db.bookings = db.bookings || [];
    const booking = { id: 'bk_' + Date.now(), userId: this.currentUser?.id || '', ...cleanPayload, status: 'pending', createdAt: new Date().toISOString() };
    db.bookings.unshift(booking);
    this.writeLocalDb(db);
    return { ok: true, booking };
  }

  async submitConsultation(payload, { clientToken = '' } = {}) {
    const phoneCheck = validateVnPhone10(payload?.phone);
    if (!phoneCheck.ok) throw new Error(phoneCheck.error);
    const cleanPayload = { ...payload, phone: phoneCheck.digits };
    if (this.isCloudOnline()) {
      const headers = this.authHeaders({ 'Content-Type': 'application/json', ...(clientToken ? { 'X-Client-Token': clientToken } : {}) });
      const res = await fetch(this.apiUrl('action=consultation_submit'), {
        method: 'POST',
        headers,
        body: JSON.stringify(cleanPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không gửi được yêu cầu');
      return data;
    }
    const db = this.readLocalDb();
    db.consultations = db.consultations || [];
    const entry = { id: 'cs_' + Date.now(), userId: this.currentUser?.id || '', email: this.currentUser?.email || '', ...cleanPayload, status: 'new', createdAt: new Date().toISOString() };
    db.consultations.unshift(entry);
    if (payload.invitationId) {
      const inv = (db.invitations || []).find(i => i.id === payload.invitationId);
      if (inv) {
        inv.order = inv.order || {};
        if (payload.packageName) inv.order.packageName = payload.packageName;
        if (payload.amount) inv.order.price = Number(payload.amount);
        if (payload.name) inv.order.customerName = payload.name;
        if (payload.phone) inv.order.customerPhone = payload.phone;
        if (payload.transferCode) inv.order.transferCode = payload.transferCode;
        inv.order.paymentSubmittedAt = new Date().toISOString();
        inv.order.lastOrderId = entry.id;
      }
    }
    this.writeLocalDb(db);
    return { ok: true, entry };
  }

  async completeCheckoutAndDeliver(invitationId, payload, { clientToken = '' } = {}) {
    if (this.isCloudOnline()) {
      const headers = this.authHeaders({ 'Content-Type': 'application/json', ...(clientToken ? { 'X-Client-Token': clientToken } : {}) });
      const res = await fetch(this.apiUrl(`action=checkout_complete&id=${encodeURIComponent(invitationId)}`), {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...payload, invitationId }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không thể hoàn tất thanh toán');
      return data;
    }
    const db = this.readLocalDb();
    const idx = (db.invitations || []).findIndex(i => i.id === invitationId);
    if (idx === -1) throw new Error('Không tìm thấy thiệp cưới này');
    const inv = db.invitations[idx];
    const now = new Date().toISOString();
    const pkgs = db.settings?.packages || DEFAULT_PACKAGES_V9;
    const matchedPkg = pkgs.find(p => p.id === payload.packageId || p.name === payload.packageName);
    const caps = matchedPkg?.capabilities || null;
    const orderEntry = {
      id: 'cs_' + Date.now(),
      userId: this.currentUser?.id || inv.order?.userId || '',
      email: (payload.email || this.currentUser?.email || inv.order?.customerEmail || '').toLowerCase(),
      kind: 'qr_order',
      invitationId,
      autoDelivered: true,
      name: payload.name || this.currentUser?.name || 'Khách hàng',
      phone: payload.phone || this.currentUser?.phone || '',
      templateId: inv.templateId || '',
      templateName: inv.templateName || inv.title || '',
      packageName: payload.packageName || matchedPkg?.name || 'Gói Tiêu Chuẩn',
      amount: Number(payload.amount || matchedPkg?.price || 189000),
      transferCode: payload.transferCode || `THIEP ${invitationId.toUpperCase()}`,
      message: payload.message || 'Khách đã chuyển tiền VietQR và nhận sản phẩm ngay',
      status: 'paid',
      createdAt: now,
    };
    db.consultations = db.consultations || [];
    db.consultations.unshift(orderEntry);

    inv.order = inv.order || {};
    inv.order.customerName = orderEntry.name;
    inv.order.customerPhone = orderEntry.phone;
    if (orderEntry.email) inv.order.customerEmail = orderEntry.email;
    inv.order.packageId = matchedPkg?.id || payload.packageId || '';
    inv.order.packageName = orderEntry.packageName;
    inv.order.price = orderEntry.amount;
    inv.order.transferCode = orderEntry.transferCode;
    inv.order.status = 'paid';
    inv.order.showWatermark = false;
    inv.order.paidAt = now;
    inv.order.lastOrderId = orderEntry.id;
    inv.trial = null;
    inv.permissions = {
      ...(inv.permissions || {}),
      allowMusicChange: caps ? Boolean(caps.hasCustomMusic) : true,
      locked: false,
    };
    if (caps && Array.isArray(inv.sections)) {
      inv.sections = inv.sections.map(sec => {
        if (sec.type === 'guestbook') return { ...sec, enabled: Boolean(caps.hasGuestbook) };
        if (sec.type === 'gift') return { ...sec, enabled: Boolean(caps.hasGiftQr) };
        if (sec.type === 'rsvp') return { ...sec, enabled: Boolean(caps.hasRsvp) };
        return sec;
      });
    }
    inv.updatedAt = now;
    db.invitations[idx] = inv;
    this.writeLocalDb(db);
    return { ok: true, invitation: inv, order: orderEntry };
  }

  async createPaymentOrder(payload, { clientToken = '' } = {}) {
    const phoneCheck = validateVnPhone10(payload?.phone);
    if (!phoneCheck.ok) throw new Error(phoneCheck.error);
    const cleanPayload = { ...payload, phone: phoneCheck.digits };

    if (this.isCloudOnline()) {
      const headers = this.authHeaders({ 'Content-Type': 'application/json', ...(clientToken ? { 'X-Client-Token': clientToken } : {}) });
      const res = await fetch(this.apiUrl('action=payment_create'), {
        method: 'POST',
        headers,
        body: JSON.stringify(cleanPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không tạo được mã QR thanh toán');
      this.paymentWebhookActive = Boolean(data.webhookActive);
      return data;
    }

    // Local fallback when Cloud Backend is not yet reachable
    const db = this.readLocalDb();
    db.invitations = db.invitations || [];
    db.paymentOrders = db.paymentOrders || {};
    const pkgs = db.settings?.packages || DEFAULT_PACKAGES_V9;
    const matchedPkg = pkgs.find(p => p.id === cleanPayload.packageId || p.name === cleanPayload.packageName) || pkgs[1] || pkgs[0];
    const amount = Number(matchedPkg?.price || cleanPayload.amount || 189000);

    let inv = null;
    if (cleanPayload.invitationId) {
      inv = db.invitations.find(i => i.id === cleanPayload.invitationId) || null;
    }
    if (!inv) {
      const tplObj = (db.templates || TEMPLATES).find(t => t.id === cleanPayload.templateId) || (db.templates || TEMPLATES)[0];
      inv = createInvitationFromTemplate(tplObj, {
        customerName: cleanPayload.name,
        customerPhone: cleanPayload.phone,
        customerEmail: cleanPayload.email || this.currentUser?.email || '',
        packageName: matchedPkg?.name || 'Gói Tiêu Chuẩn',
        price: amount,
      });
      inv.order.userId = this.currentUser?.id || '';
      inv.order.status = 'pending_payment';
      db.invitations.unshift(inv);
    }

    const nowMs = Date.now();
    const code = 'LAMOUR' + Math.random().toString(36).replace(/[^a-z0-9]/g, '').toUpperCase().slice(0, 6).padEnd(6, '8');
    const payment = {
      code,
      invitationId: inv.id,
      clientToken: inv.clientToken,
      userId: this.currentUser?.id || inv.order?.userId || '',
      name: cleanPayload.name,
      phone: cleanPayload.phone,
      email: cleanPayload.email || this.currentUser?.email || '',
      templateId: inv.templateId || '',
      templateName: inv.templateName || inv.title || '',
      packageId: matchedPkg?.id || '',
      packageName: matchedPkg?.name || 'Gói Tiêu Chuẩn',
      amount,
      note: cleanPayload.note || '',
      bankCode: db.settings?.paymentBankCode || 'MB',
      bankName: db.settings?.paymentBankName || 'MB Bank — Ngân hàng Quân Đội',
      accountNo: String(db.settings?.paymentAccountNo || '0354248177').replace(/\s+/g, ''),
      accountName: String(db.settings?.paymentAccountName || '').trim(),
      status: inv.order?.status === 'paid' ? 'paid' : 'pending',
      createdAt: new Date(nowMs).toISOString(),
      expiresAt: new Date(nowMs + 15 * 60 * 1000).toISOString(),
      paidAt: inv.order?.paidAt || '',
      bankRef: '',
      gateway: '',
    };
    db.paymentOrders[code] = payment;
    this.writeLocalDb(db);
    return { ok: true, payment, invitationId: inv.id, clientToken: inv.clientToken, webhookActive: false };
  }

  async getPaymentStatus(code) {
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl(`action=payment_status&code=${encodeURIComponent(code)}`), { cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không kiểm tra được trạng thái thanh toán');
      this.paymentWebhookActive = Boolean(data.webhookActive);
      return data;
    }
    const db = this.readLocalDb();
    const payment = (db.paymentOrders || {})[code];
    if (!payment) throw new Error('Không tìm thấy mã giao dịch này');
    const inv = (db.invitations || []).find(i => i.id === payment.invitationId) || null;
    const isPaid = payment.status === 'paid' || inv?.order?.status === 'paid';
    return {
      ok: true,
      status: isPaid ? 'paid' : (Date.now() > Date.parse(payment.expiresAt) ? 'expired' : 'pending'),
      payment,
      invitationId: payment.invitationId,
      clientToken: isPaid ? (inv?.clientToken || payment.clientToken) : '',
      invitation: isPaid ? inv : null,
      webhookActive: false,
    };
  }

  async confirmPaymentDemo(code, { clientToken = '' } = {}) {
    if (this.isCloudOnline()) {
      const headers = this.authHeaders({ 'Content-Type': 'application/json', ...(clientToken ? { 'X-Client-Token': clientToken } : {}) });
      const res = await fetch(this.apiUrl('action=payment_confirm_demo'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ code, clientToken }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Chưa nhận được thông báo thanh toán từ ngân hàng');
      return data;
    }
    const db = this.readLocalDb();
    const payment = (db.paymentOrders || {})[code];
    if (!payment) throw new Error('Không tìm thấy đơn thanh toán');
    const res = await this.completeCheckoutAndDeliver(payment.invitationId, {
      name: payment.name,
      phone: payment.phone,
      email: payment.email,
      packageId: payment.packageId,
      packageName: payment.packageName,
      amount: payment.amount,
      transferCode: payment.code,
      message: payment.note || 'Khách chuyển khoản trực tiếp VietQR MB Bank',
    }, { clientToken: clientToken || payment.clientToken });
    const db2 = this.readLocalDb();
    if (db2.paymentOrders?.[code]) {
      db2.paymentOrders[code].status = 'paid';
      db2.paymentOrders[code].paidAt = new Date().toISOString();
      db2.paymentOrders[code].gateway = 'Direct-QR-Local';
      this.writeLocalDb(db2);
    }
    return { ok: true, status: 'paid', payment: db2.paymentOrders?.[code] || payment, invitation: res.invitation, clientToken: res.invitation?.clientToken || payment.clientToken };
  }

  async customerCreateInvitation(payload) {
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl('action=customer_create_invitation'), {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không thể khởi tạo mẫu thiệp');
      return data.invitation;
    }
    const db = this.readLocalDb();
    const u = this.currentUser;
    if (!u) throw new Error('Vui lòng đăng nhập để tự sửa và lưu mẫu thiệp');
    const tplObj = (db.templates || []).find(t => t.id === payload.templateId);
    const pkgs = db.settings?.packages || [];
    const defaultPkg = pkgs[1] || pkgs[0] || { name: 'Gói Tiêu Chuẩn 3D', price: 229000 };
    const trialDays = tplObj?.isTrialTemplate ? Number(tplObj.trialDays || 1) : (Number(payload.trialDays || 0) || 0);
    const trialCfg = trialDays > 0 ? buildTrialConfig(trialDays) : null;
    const initContent = JSON.parse(JSON.stringify(payload.content || {}));
    if (trialCfg && Array.isArray(initContent.gallery)) {
      initContent.gallery = initContent.gallery.slice(0, trialCfg.limits.maxPhotos);
    }
    const now = new Date().toISOString();
    const newInv = {
      id: 'thiep-' + Math.random().toString(36).slice(2, 10),
      clientToken: 'kh_' + Math.random().toString(36).slice(2, 12),
      templateId: payload.templateId || tplObj?.id || 'nhung-do-co-dien',
      templateName: tplObj?.name || payload.templateName || 'Mẫu Thiệp Cưới',
      title: payload.title || `${initContent.groomName || 'Chú Rể'} & ${initContent.brideName || 'Cô Dâu'}`,
      createdAt: now,
      updatedAt: now,
      trial: trialCfg,
      order: {
        userId: u.id,
        customerName: u.name || 'Khách hàng',
        customerPhone: u.phone || '',
        customerEmail: (u.email || '').toLowerCase(),
        packageName: trialCfg ? `Dùng thử miễn phí ${trialDays} ngày` : defaultPkg.name,
        price: trialCfg ? 0 : Number(defaultPkg.price || 229000),
        status: 'trial',
        showWatermark: true,
        notes: trialCfg ? `Khách kích hoạt mẫu dùng thử ${trialDays} ngày (giới hạn chức năng)` : 'Khách tự chọn mẫu và tùy chỉnh nội dung trực tuyến',
      },
      permissions: { allowMusicChange: !trialCfg, locked: false },
      design: tplObj?.design ? JSON.parse(JSON.stringify(tplObj.design)) : (payload.design || {}),
      sections: payload.sections || [],
      music: payload.music || { trackId: 'canon-d', autoplay: true, volume: 0.65 },
      content: initContent,
      guestForm: payload.guestForm || {},
      guests: [],
      rsvps: [],
      wishes: [],
    };
    db.invitations = db.invitations || [];
    db.invitations.unshift(newInv);
    this.writeLocalDb(db);
    return newInv;
  }

  /* ===================== TWO-WAY LIVE CHAT & CHATBOT ===================== */
  async getChatThread(threadId) {
    const tid = threadId || this.getChatThreadId();
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl(`action=chat_thread&threadId=${encodeURIComponent(tid)}`), { cache: 'no-store' });
      const data = await res.json();
      return data.thread || null;
    }
    const db = this.readLocalDb();
    return (db.chatThreads || []).find(t => t.id === tid) || null;
  }

  async sendChatMessage({ threadId, name, phone, email, text, mode = 'bot', deferBot = true }) {
    const tid = threadId || this.getChatThreadId();
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl('action=chat_send'), {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ threadId: tid, name, phone, email, text, mode, deferBot }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không gửi được tin nhắn');
      return { thread: data.thread, pendingBotReply: data.pendingBotReply || null };
    }
    const db = this.readLocalDb();
    db.chatThreads = db.chatThreads || [];
    let idx = db.chatThreads.findIndex(t => t.id === tid);
    const rawPhone = String(phone || this.currentUser?.phone || '').trim();
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const existingPhone = idx !== -1 ? String(db.chatThreads[idx].customerPhone || '').replace(/\D/g, '') : '';
    const effectivePhone = cleanPhone || existingPhone;

    if (mode === 'direct') {
      const ck = validateVnPhone10(rawPhone || effectivePhone);
      if (!ck.ok) {
        throw new Error(`Để nhắn trực tiếp cho Quản Lý: ${ck.error}`);
      }
    }

    const now = new Date().toISOString();
    if (idx === -1) {
      db.chatThreads.unshift({
        id: tid,
        userId: this.currentUser?.id || '',
        customerName: name || this.currentUser?.name || 'Khách tham quan',
        customerPhone: effectivePhone,
        customerEmail: email || this.currentUser?.email || '',
        botActive: mode !== 'direct',
        waitingForAdmin: mode === 'direct',
        directRequestedAt: mode === 'direct' ? now : '',
        unreadByAdmin: 0,
        updatedAt: now,
        messages: [],
      });
      idx = 0;
    }
    const th = db.chatThreads[idx];
    if (name && name !== 'Khách tham quan') th.customerName = name;
    if (effectivePhone) th.customerPhone = effectivePhone;
    if (email) th.customerEmail = email;
    if (mode === 'direct') {
      th.botActive = false;
      th.waitingForAdmin = true;
      if (!th.directRequestedAt) th.directRequestedAt = now;
    }
    th.messages.push({ id: 'm_' + Date.now(), sender: 'customer', text, createdAt: now });
    th.unreadByAdmin = (th.unreadByAdmin || 0) + 1;
    th.updatedAt = now;

    let pendingBotReply = null;
    const shouldBot = mode !== 'direct' && th.botActive !== false && !th.waitingForAdmin;
    if (shouldBot) {
      const reply = runLocalChatbot(db.chatbotConfig, text);
      if (reply) {
        if (deferBot) pendingBotReply = reply;
        else th.messages.push({ id: 'm_b_' + Date.now(), sender: 'bot', text: reply, createdAt: new Date().toISOString() });
      }
    }
    // Always move updated thread to top so Admin inbox displays it first!
    db.chatThreads.splice(idx, 1);
    db.chatThreads.unshift(th);
    this.writeLocalDb(db);
    return { thread: th, pendingBotReply };
  }

  async requestAiBotReply(threadId, userText, fallbackReply = '') {
    const tid = threadId || this.getChatThreadId();
    if (this.isCloudOnline()) {
      try {
        const res = await fetch(this.apiUrl('action=chat_ai_reply'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ threadId: tid, text: userText }),
        });
        const data = await res.json();
        if (res.ok && data.ok) return data.thread || null;
      } catch (_) {}
    }
    const localReply = fallbackReply || runLocalChatbot(this.readLocalDb().chatbotConfig, userText);
    return await this.commitBotReply(tid, localReply);
  }

  async commitBotReply(threadId, text) {
    const tid = threadId || this.getChatThreadId();
    if (!text) return null;
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl('action=chat_bot_commit'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId: tid, text }),
      });
      const data = await res.json();
      return data.thread || null;
    }
    const db = this.readLocalDb();
    const th = (db.chatThreads || []).find(t => t.id === tid);
    if (!th) return null;
    if (th.botActive !== false && !th.waitingForAdmin) {
      th.messages.push({ id: 'm_b_' + Date.now(), sender: 'bot', text, createdAt: new Date().toISOString() });
      th.updatedAt = new Date().toISOString();
      this.writeLocalDb(db);
    }
    return th;
  }

  async adminReplyChat(threadId, text) {
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl('action=admin_chat_reply'), {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ threadId, text }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không gửi được phản hồi');
      return data.thread;
    }
    const db = this.readLocalDb();
    const idx = (db.chatThreads || []).findIndex(t => t.id === threadId);
    if (idx === -1) throw new Error('Không tìm thấy hội thoại');
    const th = db.chatThreads[idx];
    th.messages.push({ id: 'm_a_' + Date.now(), sender: 'admin', text, createdAt: new Date().toISOString() });
    th.unreadByAdmin = 0;
    th.botActive = false;
    th.waitingForAdmin = false;
    th.updatedAt = new Date().toISOString();
    db.chatThreads.splice(idx, 1);
    db.chatThreads.unshift(th);
    this.writeLocalDb(db);
    return th;
  }

  /* ===================== INVITATIONS & MEDIA ===================== */
  async getInvitation(id, mode = 'guest', token = '') {
    if (this.isCloudOnline()) {
      const url = this.apiUrl(`action=get_invitation&id=${encodeURIComponent(id)}&mode=${encodeURIComponent(mode)}`);
      const headers = this.authHeaders(token ? { 'X-Client-Token': token } : {});
      const res = await fetch(url, { headers, cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không tìm thấy thiệp');
      return data;
    }
    const db = this.readLocalDb();
    const found = (db.invitations || []).find(i => i.id === id);
    if (!found) throw new Error('Không tìm thấy thiệp cưới này');
    if (mode === 'client') {
      const uEmail = (this.currentUser?.email || '').toLowerCase();
      const uPhone = (this.currentUser?.phone || '').replace(/[^0-9+]/g, '');
      const ok = found.clientToken === token
        || this.currentUser?.role === 'admin'
        || (this.currentUser && found.order?.userId === this.currentUser.id)
        || (uEmail && (found.order?.customerEmail || '').toLowerCase() === uEmail)
        || (uPhone.length >= 8 && (found.order?.customerPhone || '').replace(/[^0-9+]/g, '') === uPhone);
      if (!ok) throw new Error('Mã truy cập khách hàng không hợp lệ');
      return { ok: true, invitation: JSON.parse(JSON.stringify(found)), settings: db.settings || {}, templates: db.templates || [] };
    }
    const guestSafe = JSON.parse(JSON.stringify(found));
    delete guestSafe.clientToken; delete guestSafe.guests; delete guestSafe.rsvps;
    guestSafe.order = { status: found.order?.status || 'trial', showWatermark: Boolean(found.order?.showWatermark) };
    guestSafe.wishes = (guestSafe.wishes || []).filter(w => !w.hidden);
    return { ok: true, invitation: guestSafe, settings: db.settings || {} };
  }

  async clientUpdateInvitation(id, token, payload) {
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl(`action=client_update&id=${encodeURIComponent(id)}`), {
        method: 'POST',
        headers: this.authHeaders({ 'Content-Type': 'application/json', 'X-Client-Token': token || '' }),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Lỗi lưu thông tin khách hàng');
      return data.invitation;
    }
    const db = this.readLocalDb();
    const idx = db.invitations.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Không tìm thấy thiệp');
    const inv = db.invitations[idx];
    const isAdmin = this.currentUser?.role === 'admin';
    const trialActive = !isAdmin && inv.order?.status !== 'paid' && Boolean(inv.trial?.enabled);
    const limits = trialActive ? (inv.trial?.limits || {}) : {};
    if (trialActive && inv.trial?.expiresAt && new Date(inv.trial.expiresAt).getTime() <= Date.now()) {
      throw new Error('Bản dùng thử đã hết hạn — Vui lòng thanh toán nâng cấp gói chính thức để mở khóa chỉnh sửa!');
    }
    if (payload.title) inv.title = payload.title;
    if (payload.content) {
      const nextContent = JSON.parse(JSON.stringify(payload.content));
      if (trialActive) {
        const maxPhotos = Number(limits.maxPhotos || 3);
        if (Array.isArray(nextContent.gallery) && nextContent.gallery.length > maxPhotos) {
          throw new Error(`Bản dùng thử giới hạn tối đa ${maxPhotos} ảnh Album. Nâng cấp gói để tải thêm ảnh!`);
        }
        if (!limits.allowGiftQr) nextContent.gift = inv.content?.gift || nextContent.gift;
      }
      inv.content = nextContent;
    }
    if (payload.sections && (!trialActive || limits.allowSectionToggle)) inv.sections = payload.sections;
    if (payload.guestForm) {
      const nextGf = JSON.parse(JSON.stringify(payload.guestForm));
      if (trialActive && !limits.allowCustomRsvpFields) nextGf.customFields = inv.guestForm?.customFields || [];
      inv.guestForm = nextGf;
    }
    if (payload.guests) {
      inv.guests = trialActive ? payload.guests.slice(0, Number(limits.maxGuests || 5)) : payload.guests;
    }
    if (payload.wishes) inv.wishes = payload.wishes;
    if (payload.music && inv.permissions?.allowMusicChange !== false && (!trialActive || limits.allowMusicChange)) inv.music = payload.music;
    if (payload.templateId && payload.templateId !== inv.templateId) {
      const tplObj = (db.templates || []).find(t => t.id === payload.templateId);
      if (tplObj?.design) {
        inv.templateId = tplObj.id;
        inv.templateName = tplObj.name;
        inv.design = JSON.parse(JSON.stringify(tplObj.design));
      }
    }
    if (payload.coverDesign) {
      inv.design = inv.design || {};
      if (payload.coverDesign.coverBackdrop !== undefined) inv.design.coverBackdrop = payload.coverDesign.coverBackdrop;
      if (payload.coverDesign.coverBlur !== undefined) inv.design.coverBlur = Number(payload.coverDesign.coverBlur);
      if (payload.coverDesign.coverOverlay !== undefined) inv.design.coverOverlay = Number(payload.coverDesign.coverOverlay);
    }
    inv.updatedAt = new Date().toISOString();
    db.invitations[idx] = inv;
    this.writeLocalDb(db);
    return inv;
  }

  async guestSubmit(id, payload) {
    if (this.isCloudOnline()) {
      const res = await fetch(this.apiUrl(`action=guest_submit&id=${encodeURIComponent(id)}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Không gửi được phản hồi');
      return data;
    }
    const db = this.readLocalDb();
    const idx = db.invitations.findIndex(i => i.id === id);
    if (idx === -1) throw new Error('Không tìm thấy thiệp');
    const now = new Date().toISOString();
    if (payload.type === 'rsvp' || payload.type === 'both') {
      db.invitations[idx].rsvps = db.invitations[idx].rsvps || [];
      db.invitations[idx].rsvps.unshift({ id: 'r_' + Date.now(), ...payload, createdAt: now });
    }
    let createdWish = null;
    if (payload.wish && payload.wish.trim()) {
      createdWish = { id: 'w_' + Date.now(), name: payload.name, relation: payload.relation || 'Khách mời', message: payload.wish.trim(), createdAt: now, hidden: false };
      db.invitations[idx].wishes = db.invitations[idx].wishes || [];
      db.invitations[idx].wishes.unshift(createdWish);
    }
    this.writeLocalDb(db);
    return { ok: true, wish: createdWish, savedAt: now };
  }

  compressImage(file, maxWidth = 1280, quality = 0.82) {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) { resolve(file); return; }
      const reader = new FileReader();
      reader.onload = e => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
          const canvas = document.createElement('canvas');
          canvas.width = width; canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          canvas.toBlob(blob => resolve(blob ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file), 'image/jpeg', quality);
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async uploadMedia(file, { invId = '', clientToken = '' } = {}) {
    const processed = file.type.startsWith('image/') ? await this.compressImage(file) : file;
    if (this.isCloudOnline()) {
      const form = new FormData();
      form.append('file', processed);
      const headers = this.authHeaders(clientToken ? { 'X-Client-Token': clientToken } : {});
      const res = await fetch(this.apiUrl(`action=upload&id=${encodeURIComponent(invId)}`), { method: 'POST', headers, body: form });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Tải file thất bại');
      return this.resolveMediaUrl(data.url);
    }
    return await this.fileToDataUrl(processed);
  }
}

export const storage = new StorageService();
