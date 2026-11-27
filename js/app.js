/**
 * DaiLo Wedding — Bộ Điều Phối Trung Tâm (v15)
 * - Đăng nhập & Liên kết tài khoản trực tiếp Facebook OAuth 2.0 & Google OAuth 2.0 / GIS
 * - Đăng ký bắt buộc xác thực mã OTP 6 số gửi về Số điện thoại hoặc Gmail (Tài khoản Quản Lý: lochoipes@gmail.com)
 * - Cổng Khách Hàng cá nhân (Liên kết Facebook/Google, Lịch sử mua, Thiệp của tôi, Đặt lịch)
 * - Trang Quản Lý Toàn Diện (AdminManagementCenter)
 * - Khung Chat Trực Tiếp 2 chiều + Chat Bot tự động + Câu Chat Nhanh + Đặt Lịch Tư Vấn + VietQR MB Bank 0354248177
 */

import {
  TEMPLATES,
  NGU_HANH_DATA,
  getTrialState,
  createInvitationFromTemplate,
} from './data.js?v=15';
import {
  EDITORIAL_SAMPLE_PHOTOS,
  getWaxSealSvg,
  getCoverFiligreeFrameSvg,
  resolveBackdropUrl,
} from './artwork.js?v=15';
import { DEFAULT_CHATBOT_CONFIG } from './chatbot.js?v=15';
import { storage, isStrictGmail, sanitizeVnPhone10, validateVnPhone10, isValidVnPhone10 } from './storage.js?v=15';
import { InvitationRenderer, escapeHtml } from './renderer.js?v=15';
import { StudioEditor, buildAbsoluteUrl } from './studio.js?v=15';
import { AdminManagementCenter } from './admin-center.js?v=15';
import { musicEngine } from './audio-fx.js?v=15';
import { icon } from './icons.js?v=15';
import { initGlobalWebFx, bindInteractiveTiltCards, bindScrollStagger } from './web-fx.js?v=15';

const appRoot = document.getElementById('app');
const modalRoot = document.getElementById('modal-root');
const toastRoot = document.getElementById('toast-root');
const chatWidgetRoot = document.getElementById('chat-widget-root');

let activeInstance = null;
let adminDb = null;
let publicStore = null;
let chatOpen = false;
let chatPollTimer = null;
let chatUnsubSync = null;
let chatBotTimer = null;
let chatBotReqSeq = 0;
let chatThinking = false;
let directRequestOpen = false;
let chatDirectPrefill = '';
let currentChatThread = null;
const usedQuickPrompts = new Set();

function normalizePromptKey(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function sanitizePhoneDigits(val) {
  return sanitizeVnPhone10(val);
}

function isValidPhoneDigits(val) {
  return isValidVnPhone10(val);
}

function getPhoneErrorMsg(val) {
  return validateVnPhone10(val).error;
}

function bindNumericPhoneInputs(rootEl) {
  rootEl?.querySelectorAll('[data-numeric-phone]').forEach(inp => {
    inp.addEventListener('input', () => {
      const clean = sanitizePhoneDigits(inp.value);
      if (inp.value !== clean) inp.value = clean;
    });
  });
}

function showToast(message, type = 'info') {
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.textContent = message;
  toastRoot.appendChild(el);
  setTimeout(() => el.remove(), 3600);
}

function formatVnd(n) {
  return Number(n || 0).toLocaleString('vi-VN') + 'đ';
}

function cleanupActive() {
  if (activeInstance && typeof activeInstance.destroy === 'function') {
    activeInstance.destroy();
  }
  activeInstance = null;
  musicEngine.stop();
}

let activeModalCleanup = null;

function closeModal() {
  if (typeof activeModalCleanup === 'function') {
    try { activeModalCleanup(); } catch (_) {}
    activeModalCleanup = null;
  }
  modalRoot.innerHTML = '';
  document.body.classList.remove('modal-open');
}

function openModal(html, { wide = false, cardClass = '', preserveCleanup = false } = {}) {
  if (!preserveCleanup && typeof activeModalCleanup === 'function') {
    try { activeModalCleanup(); } catch (_) {}
    activeModalCleanup = null;
  }
  document.body.classList.add('modal-open');
  modalRoot.innerHTML = `
    <div class="modal-backdrop" data-modal-bg>
      <div class="modal-card ${wide ? 'wide' : ''} ${cardClass}">${html}</div>
    </div>
  `;
  modalRoot.querySelector('[data-modal-bg]')?.addEventListener('click', e => {
    if (e.target === e.currentTarget) closeModal();
  });
  modalRoot.querySelectorAll('[data-close-modal]').forEach(btn => btn.addEventListener('click', closeModal));
}

function navigateTo(params) {
  const url = buildAbsoluteUrl(params);
  window.history.pushState({}, '', url);
  route();
}

function getLiveTemplates() {
  const list = publicStore?.templates;
  return Array.isArray(list) && list.length ? list : TEMPLATES;
}

/**
 * Khách hàng chọn 1 mẫu bất kỳ -> Tự động tạo bản thảo thiệp của riêng khách & mở trang sửa ảnh/nội dung/thanh toán!
 */
async function startCustomerCustomizeTemplate(tplId) {
  if (!storage.currentUser) {
    showToast('Đăng nhập hoặc đăng ký nhanh để lưu ảnh & tự chỉnh sửa mẫu thiệp này', 'info');
    openAuthModal('login', async user => {
      if (user.role === 'admin') {
        navigateTo({ role: 'admin' });
        return;
      }
      await startCustomerCustomizeTemplate(tplId);
    });
    return;
  }

  publicStore = publicStore || await storage.getPublicStore();
  const allTemplates = getLiveTemplates();
  const tplObj = allTemplates.find(t => t.id === tplId) || allTemplates[0] || TEMPLATES[0];
  const trialDays = tplObj?.isTrialTemplate ? Number(tplObj.trialDays || 1) : 0;
  const draft = createInvitationFromTemplate(tplObj.id, { trialDays });
  if (tplObj?.design) draft.design = JSON.parse(JSON.stringify(tplObj.design));
  draft.title = `Thiệp ${tplObj.name}`;

  try {
    showToast(`Đang mở trình chỉnh sửa mẫu "${tplObj.name}"...`, 'info');
    const created = await storage.customerCreateInvitation({
      templateId: tplObj.id,
      templateName: tplObj.name,
      trialDays,
      title: draft.title,
      design: draft.design,
      sections: draft.sections,
      content: draft.content,
      music: draft.music,
      guestForm: draft.guestForm,
    });
    showToast(
      trialDays > 0
        ? `Đã kích hoạt mẫu dùng thử ${trialDays} ngày (giới hạn ảnh & một số tính năng nâng cao). Bạn có thể nâng cấp mở khóa bất cứ lúc nào!`
        : `Đã tạo bản thảo "${tplObj.name}" — Hãy sửa ảnh, nội dung từng phần và bấm Thanh Toán khi ưng ý!`,
      'success'
    );
    navigateTo({ role: 'client', id: created.id, token: created.clientToken });
  } catch (err) {
    showToast(err.message || 'Không thể khởi tạo mẫu thiệp', 'error');
  }
}

function buildOwnerVietQrUrl(settings, amount = 0, memo = 'DAT THIEP CUOI') {
  const bank = settings?.paymentBankCode || 'MB';
  const acc = (settings?.paymentAccountNo || '0354248177').replace(/\s+/g, '');
  const accName = settings?.paymentAccountName || '';
  const qs = new URLSearchParams();
  if (amount > 0) qs.set('amount', String(amount));
  if (memo) qs.set('addInfo', memo);
  if (accName) qs.set('accountName', accName);
  return `https://img.vietqr.io/image/${encodeURIComponent(bank)}-${encodeURIComponent(acc)}-compact2.png?${qs.toString()}`;
}

function openShareLinksModal(inv, mode = 'admin') {
  if (!inv) return;
  if (mode === 'client' && inv.order?.status !== 'paid') {
    showToast('Vui lòng hoàn tất thanh toán để nhận đường link thiệp cưới chính thức.', 'info');
    return;
  }
  const guestUrl = buildAbsoluteUrl({ role: 'guest', id: inv.id });
  const blankUrl = buildAbsoluteUrl({ role: 'guest', id: inv.id, blank: '1' });
  const clientUrl = buildAbsoluteUrl({ role: 'client', id: inv.id, token: inv.clientToken || '' });

  openModal(`
    <div class="modal-head">
      <div>
        <h3>Đường Link Chia Sẻ — ${escapeHtml(inv.title || inv.id)}</h3>
        <small style="color:var(--ui-muted);">Tách biệt hoàn toàn quyền Quản Lý, Cổng Khách Hàng (chỉnh nội dung) và Trang Khách Mời</small>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 16)}</button>
    </div>

    ${mode === 'admin' ? `
      <div class="panel-card" style="padding:14px;margin-bottom:12px;background:var(--ui-surface-soft);">
        <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:var(--ui-brand);">1. Link Cổng Khách Hàng (Gửi Cô Dâu &amp; Chú Rể tự điền nội dung / danh sách khách)</div>
        <div style="font-size:12px;color:var(--ui-muted);margin-bottom:8px;">Khách hàng chỉ có thể đổi chữ, tải ảnh cưới, tạo câu hỏi RSVP và tạo link mời từng người — không thể sửa giao diện mẫu.</div>
        <div class="link-box">
          <code>${escapeHtml(clientUrl)}</code>
          <button type="button" class="btn btn-primary btn-xs" data-copy-link="${escapeHtml(clientUrl)}">Sao chép</button>
          <a class="btn btn-outline btn-xs" href="${escapeHtml(clientUrl)}" target="_blank">Mở thử</a>
        </div>
      </div>
    ` : ''}

    <div class="panel-card" style="padding:14px;margin-bottom:12px;background:var(--ui-surface-soft);">
      <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:var(--ui-success);">${mode === 'admin' ? '2.' : '1.'} Link Trang Khách Mời (Gửi cho khách mời mở thiệp, RSVP &amp; ghi lời chúc)</div>
      <div style="font-size:12px;color:var(--ui-muted);margin-bottom:8px;">Khách mời xem thiệp hoàn chỉnh, mở bìa 3D, nghe nhạc tự phát, xác nhận tham dự và viết sổ lưu bút.</div>
      <div class="link-box">
        <code>${escapeHtml(guestUrl)}</code>
        <button type="button" class="btn btn-primary btn-xs" data-copy-link="${escapeHtml(guestUrl)}">Sao chép</button>
        <a class="btn btn-outline btn-xs" href="${escapeHtml(guestUrl)}" target="_blank">Mở thiệp</a>
      </div>
    </div>

    ${mode === 'admin' ? `
      <div class="panel-card" style="padding:14px;background:var(--ui-surface-soft);">
        <div style="font-weight:700;font-size:13px;margin-bottom:4px;">3. Link Xem Mẫu Trống (0 ảnh cặp đôi, 0 tên — Gửi khách xem thuần giao diện)</div>
        <div class="link-box">
          <code>${escapeHtml(blankUrl)}</code>
          <button type="button" class="btn btn-outline btn-xs" data-copy-link="${escapeHtml(blankUrl)}">Sao chép</button>
          <a class="btn btn-outline btn-xs" href="${escapeHtml(blankUrl)}" target="_blank">Xem thử</a>
        </div>
      </div>
    ` : ''}
  `, { wide: true });

  modalRoot.querySelectorAll('[data-copy-link]').forEach(btn => {
    btn.addEventListener('click', () => {
      navigator.clipboard?.writeText(btn.dataset.copyLink).then(() => showToast('Đã sao chép đường link!', 'success'));
    });
  });
}

/* ============================================================================
   MODAL ĐĂNG NHẬP, ĐĂNG KÝ XÁC THỰC MÃ OTP & LIÊN KẾT FACEBOOK / GOOGLE
   ============================================================================ */
const FACEBOOK_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z"/></svg>';
const GOOGLE_ICON_SVG = '<svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true"><path fill="#EA4335" d="M12 10.2v3.9h5.45c-.24 1.26-.96 2.33-2.04 3.04l3.3 2.56c1.92-1.77 3.03-4.38 3.03-7.48 0-.72-.06-1.42-.19-2.02H12z"/><path fill="#34A853" d="M12 22c2.75 0 5.06-.91 6.75-2.46l-3.3-2.56c-.91.61-2.08.98-3.45.98-2.65 0-4.9-1.79-5.7-4.2H2.89v2.64A10 10 0 0 0 12 22z"/><path fill="#4A90E2" d="M6.3 13.76a5.98 5.98 0 0 1 0-3.52V7.6H2.89a10 10 0 0 0 0 8.8l3.41-2.64z"/><path fill="#FBBC05" d="M12 6.04c1.5 0 2.84.51 3.9 1.52l2.92-2.92C17.05 2.99 14.74 2 12 2A10 10 0 0 0 2.89 7.6l3.41 2.64c.8-2.41 3.05-4.2 5.7-4.2z"/></svg>';

let fbSdkLoadedAppId = '';
function loadFacebookSdk(appId) {
  return new Promise((resolve, reject) => {
    if (window.FB && fbSdkLoadedAppId === appId) { resolve(window.FB); return; }
    window.fbAsyncInit = function () {
      try {
        window.FB.init({ appId, cookie: true, xfbml: false, version: 'v21.0' });
        fbSdkLoadedAppId = appId;
        resolve(window.FB);
      } catch (err) { reject(err); }
    };
    const existing = document.getElementById('facebook-jssdk');
    if (existing) existing.remove();
    const s = document.createElement('script');
    s.id = 'facebook-jssdk';
    s.async = true;
    s.defer = true;
    s.src = 'https://connect.facebook.net/vi_VN/sdk.js';
    s.onerror = () => reject(new Error('Không tải được Facebook SDK'));
    document.head.appendChild(s);
  });
}

let googleGisPromise = null;
function loadGoogleGisSdk() {
  if (window.google?.accounts?.oauth2) return Promise.resolve(window.google);
  if (googleGisPromise) return googleGisPromise;
  googleGisPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-gis-sdk');
    if (existing) existing.remove();
    const s = document.createElement('script');
    s.id = 'google-gis-sdk';
    s.async = true;
    s.defer = true;
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = () => {
      if (window.google?.accounts?.oauth2) resolve(window.google);
      else { googleGisPromise = null; reject(new Error('Google Identity Services không khởi tạo được')); }
    };
    s.onerror = () => { googleGisPromise = null; reject(new Error('Không tải được Google Identity Services')); };
    document.head.appendChild(s);
  });
  return googleGisPromise;
}

function getOAuthConfig() {
  const fbAppId = (publicStore?.oauth?.facebookAppId || storage.oauthInfo?.facebookAppId || publicStore?.settings?.facebookAppId || '').trim();
  const gClientId = (publicStore?.oauth?.googleClientId || storage.oauthInfo?.googleClientId || publicStore?.settings?.googleClientId || '').trim();
  return {
    ...(storage.oauthInfo || {}),
    ...(publicStore?.oauth || {}),
    facebookAppId: fbAppId,
    facebookConfigured: Boolean(fbAppId || storage.oauthInfo?.facebookConfigured || publicStore?.oauth?.facebookConfigured),
    googleClientId: gClientId,
    googleConfigured: Boolean(gClientId || storage.oauthInfo?.googleConfigured || publicStore?.oauth?.googleConfigured),
  };
}

function openSocialSetupInfoModal(provider, { onBack = null } = {}) {
  const oa = getOAuthConfig();
  const backendOrigin = storage.apiOrigin || storage.getConfiguredCloudOrigin() || window.location.origin;
  const isFb = provider === 'facebook';
  const callbackUrl = isFb
    ? (oa.facebookCallbackUrl || `${backendOrigin}/api?action=oauth_facebook_callback`)
    : (oa.googleCallbackUrl || `${backendOrigin}/api?action=oauth_google_callback`);
  const jsOrigin = window.location.origin;

  openModal(`
    <div class="modal-head">
      <h3>${isFb ? 'Liên Kết Đăng Nhập Facebook Trực Tiếp' : 'Liên Kết Tài Khoản Google (Gmail)'}</h3>
      <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 16)}</button>
    </div>
    <div style="font-size:13px;line-height:1.65;color:var(--ui-text);margin-bottom:14px;">
      <p style="margin:0 0 10px;">
        Tính năng <strong>${isFb ? 'Đăng nhập & Liên kết Facebook (OAuth 2.0)' : 'Đăng nhập & Liên kết Google (OAuth 2.0 / GIS)'}</strong> đã sẵn sàng trên hệ thống <strong>DaiLo Wedding</strong> và đang chờ Quản trị viên gắn khóa ứng dụng ${isFb ? 'Meta Developers' : 'Google Cloud'}.
      </p>
      <div style="background:var(--ui-surface-soft);border:1px solid var(--ui-border);border-radius:11px;padding:12px;font-size:12px;margin-bottom:12px;">
        <div style="font-weight:700;color:var(--ui-brand);margin-bottom:6px;">Hướng dẫn kích hoạt trong 2 phút (Quản trị viên):</div>
        ${isFb ? `
          <div>1. Tạo ứng dụng tại <strong>developers.facebook.com</strong> → thêm sản phẩm <strong>Facebook Login</strong>.</div>
          <div>2. Dán Callback URL này vào <em>Valid OAuth Redirect URIs</em>:</div>
          <div class="link-box" style="margin:6px 0;">
            <code>${escapeHtml(callbackUrl)}</code>
            <button type="button" class="btn btn-outline btn-xs" id="btn-copy-oauth-cb">Sao chép</button>
          </div>
          <div>3. Thêm <code>FACEBOOK_APP_ID</code> &amp; <code>FACEBOOK_APP_SECRET</code> trong <strong>Render → Environment Variables</strong> (hoặc dán App ID tại Trang Quản Lý → Cài Đặt).</div>
        ` : `
          <div>1. Mở <strong>console.cloud.google.com</strong> → <em>APIs &amp; Services → Credentials → Create OAuth 2.0 Client ID (Web application)</em>.</div>
          <div>2. Dán URL này vào <em>Authorized redirect URIs</em>:</div>
          <div class="link-box" style="margin:6px 0;">
            <code>${escapeHtml(callbackUrl)}</code>
            <button type="button" class="btn btn-outline btn-xs" id="btn-copy-oauth-cb">Sao chép</button>
          </div>
          <div>3. Dán Origin này vào <em>Authorized JavaScript origins</em>:</div>
          <div class="link-box" style="margin:6px 0;">
            <code>${escapeHtml(jsOrigin)}</code>
            <button type="button" class="btn btn-outline btn-xs" id="btn-copy-oauth-origin">Sao chép</button>
          </div>
          <div>4. Thêm <code>GOOGLE_CLIENT_ID</code> &amp; <code>GOOGLE_CLIENT_SECRET</code> trong <strong>Render → Environment Variables</strong> (hoặc dán Client ID tại Trang Quản Lý → Cài Đặt).</div>
        `}
      </div>
    </div>
    ${onBack
      ? `<button type="button" class="btn btn-primary" style="width:100%;" id="btn-back-social-setup">Quay lại Đăng Nhập / Đăng Ký Bằng SĐT &amp; Gmail (OTP)</button>`
      : `<button type="button" class="btn btn-primary" style="width:100%;" data-close-modal>Đã Hiểu</button>`}
  `, { cardClass: 'auth-modal-card' });

  modalRoot.querySelector('#btn-copy-oauth-cb')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(callbackUrl).then(() => showToast('Đã sao chép Callback URL!', 'success'));
  });
  modalRoot.querySelector('#btn-copy-oauth-origin')?.addEventListener('click', () => {
    navigator.clipboard?.writeText(jsOrigin).then(() => showToast('Đã sao chép JavaScript Origin!', 'success'));
  });
  modalRoot.querySelector('#btn-back-social-setup')?.addEventListener('click', () => onBack?.());
}

async function runFacebookSocialFlow({ mode = 'login', onSuccess = null, onSetupNeeded = null } = {}) {
  const oa = getOAuthConfig();
  const returnTo = `${window.location.origin}${window.location.pathname}`;

  if (mode === 'link') {
    if (storage.isCloudOnline() && oa.facebookServerOAuth) {
      try {
        showToast('Đang chuyển hướng sang Facebook để liên kết tài khoản...', 'info');
        const init = await storage.initSocialLink('facebook', returnTo);
        if (init?.redirectUrl) {
          window.location.href = init.redirectUrl;
          return;
        }
      } catch (err) {
        showToast(err.message || 'Không thể liên kết Facebook', 'error');
        return;
      }
    }
    if (storage.isCloudOnline() && oa.facebookAppId) {
      try {
        showToast('Đang mở cửa sổ xác thực Facebook...', 'info');
        const FB = await loadFacebookSdk(oa.facebookAppId);
        FB.login(async resp => {
          if (!resp?.authResponse?.accessToken) {
            showToast('Bạn đã hủy liên kết Facebook', 'info');
            return;
          }
          try {
            const user = await storage.linkSocialToken({ provider: 'facebook', accessToken: resp.authResponse.accessToken });
            showToast('Đã liên kết tài khoản Facebook thành công!', 'success');
            onSuccess?.(user);
          } catch (err) {
            showToast(err.message || 'Không thể liên kết Facebook', 'error');
          }
        }, { scope: 'public_profile,email' });
      } catch (err) {
        showToast(err.message || 'Không kết nối được Facebook SDK', 'error');
      }
      return;
    }
    onSetupNeeded ? onSetupNeeded() : openSocialSetupInfoModal('facebook');
    return;
  }

  // Login flow
  if (storage.isCloudOnline() && oa.facebookServerOAuth) {
    window.location.href = storage.apiUrl(`action=oauth_facebook_start&returnTo=${encodeURIComponent(returnTo)}`);
    return;
  }
  if (storage.isCloudOnline() && oa.facebookAppId) {
    try {
      showToast('Đang kết nối trực tiếp tới Facebook...', 'info');
      const FB = await loadFacebookSdk(oa.facebookAppId);
      FB.login(async resp => {
        if (!resp?.authResponse?.accessToken) {
          showToast('Bạn đã hủy đăng nhập Facebook', 'info');
          return;
        }
        try {
          const user = await storage.loginWithFacebookToken(resp.authResponse.accessToken);
          closeModal();
          showToast(`Đăng nhập Facebook thành công! Chào mừng ${user.name}`, 'success');
          if (onSuccess) onSuccess(user);
          else route();
        } catch (err) {
          showToast(err.message || 'Không xác thực được phiên Facebook', 'error');
        }
      }, { scope: 'public_profile,email' });
    } catch (err) {
      showToast(err.message || 'Không kết nối được tới Facebook', 'error');
    }
    return;
  }
  onSetupNeeded ? onSetupNeeded() : openSocialSetupInfoModal('facebook');
}

async function runGoogleSocialFlow({ mode = 'login', onSuccess = null, onSetupNeeded = null } = {}) {
  const oa = getOAuthConfig();
  const returnTo = `${window.location.origin}${window.location.pathname}`;

  if (mode === 'link') {
    if (storage.isCloudOnline() && oa.googleServerOAuth) {
      try {
        showToast('Đang chuyển hướng sang Google để liên kết tài khoản...', 'info');
        const init = await storage.initSocialLink('google', returnTo);
        if (init?.redirectUrl) {
          window.location.href = init.redirectUrl;
          return;
        }
      } catch (err) {
        showToast(err.message || 'Không thể liên kết Google', 'error');
        return;
      }
    }
    if (storage.isCloudOnline() && oa.googleClientId) {
      try {
        showToast('Đang mở cửa sổ chọn tài khoản Google...', 'info');
        const g = await loadGoogleGisSdk();
        const client = g.accounts.oauth2.initTokenClient({
          client_id: oa.googleClientId,
          scope: 'openid email profile',
          callback: async resp => {
            if (resp?.error || !resp?.access_token) {
              showToast('Bạn đã hủy liên kết Google', 'info');
              return;
            }
            try {
              const user = await storage.linkSocialToken({ provider: 'google', accessToken: resp.access_token });
              showToast('Đã liên kết tài khoản Google thành công!', 'success');
              onSuccess?.(user);
            } catch (err) {
              showToast(err.message || 'Không thể liên kết Google', 'error');
            }
          },
          error_callback: err => {
            const msg = err?.type === 'popup_failed_to_open'
              ? 'Trình duyệt đang chặn cửa sổ bật lên Google. Vui lòng cho phép popup và thử lại.'
              : 'Bạn đã đóng cửa sổ xác thực Google.';
            showToast(msg, 'info');
          },
        });
        client.requestAccessToken({ prompt: 'select_account' });
      } catch (err) {
        showToast(err.message || 'Không kết nối được Google Sign-In', 'error');
      }
      return;
    }
    onSetupNeeded ? onSetupNeeded() : openSocialSetupInfoModal('google');
    return;
  }

  // Login flow
  if (storage.isCloudOnline() && oa.googleServerOAuth) {
    window.location.href = storage.apiUrl(`action=oauth_google_start&returnTo=${encodeURIComponent(returnTo)}`);
    return;
  }
  if (storage.isCloudOnline() && oa.googleClientId) {
    try {
      showToast('Đang mở cửa sổ đăng nhập Google...', 'info');
      const g = await loadGoogleGisSdk();
      const client = g.accounts.oauth2.initTokenClient({
        client_id: oa.googleClientId,
        scope: 'openid email profile',
        callback: async resp => {
          if (resp?.error || !resp?.access_token) {
            showToast('Bạn đã hủy đăng nhập Google', 'info');
            return;
          }
          try {
            const user = await storage.loginWithGoogleToken({ accessToken: resp.access_token });
            closeModal();
            showToast(`Đăng nhập Google thành công! Chào mừng ${user.name}`, 'success');
            if (onSuccess) onSuccess(user);
            else route();
          } catch (err) {
            showToast(err.message || 'Không xác thực được phiên Google', 'error');
          }
        },
        error_callback: err => {
          const msg = err?.type === 'popup_failed_to_open'
            ? 'Trình duyệt đang chặn cửa sổ bật lên Google. Vui lòng cho phép popup và thử lại.'
            : 'Bạn đã đóng cửa sổ đăng nhập Google.';
          showToast(msg, 'info');
        },
      });
      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      showToast(err.message || 'Không kết nối được Google Sign-In', 'error');
    }
    return;
  }
  onSetupNeeded ? onSetupNeeded() : openSocialSetupInfoModal('google');
}

function openAuthModal(defaultTab = 'login', onSuccessRedirect = null) {
  let activeTab = defaultTab; // 'login' | 'register'
  let loginMethod = 'gmail'; // 'gmail' | 'phone'
  let loginAuthMode = 'password'; // 'password' | 'otp'
  let regProvider = 'phone'; // 'phone' | 'gmail'
  let regTarget = '';
  let regSentTarget = '';
  let regOtpSent = false;
  let regOtpDelivery = '';
  let regPreviewCode = '';
  let regOtpNotice = '';
  let regOtpCodeDraft = '';
  let regVerified = false;
  let regVerificationToken = '';
  let loginOtpTarget = '';
  let loginSentTarget = '';
  let loginOtpSent = false;
  let regCooldownUntil = 0;
  let loginCooldownUntil = 0;
  let cooldownTimer = null;

  const getRemainSec = scope => {
    const until = scope === 'login' ? loginCooldownUntil : regCooldownUntil;
    return Math.max(0, Math.ceil((until - Date.now()) / 1000));
  };

  const stopCooldownTimer = () => {
    if (cooldownTimer) { clearInterval(cooldownTimer); cooldownTimer = null; }
  };

  const syncCooldownBtn = () => {
    const btn = modalRoot.querySelector('[data-otp-send-btn]');
    if (btn) {
      const scope = btn.dataset.otpScope || 'register';
      const remain = getRemainSec(scope);
      const sent = scope === 'login' ? loginOtpSent : regOtpSent;
      if (remain > 0) {
        btn.disabled = true;
        btn.textContent = `Gửi lại (${remain}s)`;
      } else {
        btn.disabled = false;
        btn.textContent = sent ? 'Gửi lại mã' : (scope === 'login' ? 'Gửi mã OTP' : 'Gửi mã xác thực');
      }
    }
    if (getRemainSec('register') <= 0 && getRemainSec('login') <= 0) {
      stopCooldownTimer();
    }
  };

  const ensureCooldownTick = () => {
    if (cooldownTimer) return;
    if (getRemainSec('register') <= 0 && getRemainSec('login') <= 0) return;
    cooldownTimer = setInterval(syncCooldownBtn, 500);
  };

  const startCooldown = (scope, sec = 30) => {
    const safeSec = Math.max(1, Number(sec) || 30);
    const until = Date.now() + safeSec * 1000;
    if (scope === 'login') loginCooldownUntil = until;
    else regCooldownUntil = until;
    syncCooldownBtn();
    ensureCooldownTick();
  };

  const resetRegOtpState = () => {
    regCooldownUntil = 0;
    regSentTarget = '';
    regOtpSent = false;
    regOtpDelivery = '';
    regPreviewCode = '';
    regOtpNotice = '';
    regOtpCodeDraft = '';
    regVerified = false;
    regVerificationToken = '';
    syncCooldownBtn();
  };

  const drawAuth = () => {
    const oa = getOAuthConfig();
    const canLoginOtp = loginMethod === 'gmail' ? Boolean(oa.otpLoginGmailEnabled) : Boolean(oa.otpLoginPhoneEnabled);
    const regRemain = getRemainSec('register');
    const loginRemain = getRemainSec('login');

    openModal(`
      <div class="modal-head" style="border:none;padding-bottom:4px;margin-bottom:8px;">
        <div>
          <h3 style="font-family:'Philosopher',serif;font-size:22px;">DaiLo Wedding</h3>
          <small style="color:var(--ui-muted);">Đăng nhập, liên kết Facebook / Google hoặc đăng ký xác thực mã OTP</small>
        </div>
        <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 16)}</button>
      </div>

      <div class="auth-seg-tabs">
        <button type="button" class="auth-seg-btn ${activeTab === 'login' ? 'active' : ''}" data-auth-tab="login">Đăng Nhập</button>
        <button type="button" class="auth-seg-btn ${activeTab === 'register' ? 'active' : ''}" data-auth-tab="register">Đăng Ký Mới (OTP)</button>
      </div>

      <div class="social-auth-stack">
        <button type="button" class="social-auth-btn is-fb" data-social="facebook">
          ${FACEBOOK_ICON_SVG}
          <span>${oa.facebookConfigured ? 'Tiếp tục trực tiếp với Facebook' : 'Đăng nhập / Liên kết Facebook'}</span>
        </button>
        <button type="button" class="social-auth-btn is-google" data-social="google">
          ${GOOGLE_ICON_SVG}
          <span>${oa.googleConfigured ? 'Tiếp tục trực tiếp với Google' : 'Đăng nhập / Liên kết Google'}</span>
        </button>
      </div>

      <div class="auth-or-divider">hoặc dùng Số điện thoại / Gmail</div>

      ${activeTab === 'login' ? `
        <div class="auth-method-row">
          <button type="button" class="pill ${loginMethod === 'gmail' ? 'active' : ''}" data-login-method="gmail">Bằng Gmail</button>
          <button type="button" class="pill ${loginMethod === 'phone' ? 'active' : ''}" data-login-method="phone">Bằng Số điện thoại</button>
        </div>

        <div class="auth-submode-row">
          <button type="button" class="auth-submode-btn ${loginAuthMode === 'password' ? 'active' : ''}" data-login-auth-mode="password">Dùng Mật khẩu</button>
          <button type="button" class="auth-submode-btn ${loginAuthMode === 'otp' ? 'active' : ''}" data-login-auth-mode="otp">Dùng Mã OTP gửi về</button>
        </div>

        ${loginAuthMode === 'password' ? `
          <form id="auth-login-form">
            ${loginMethod === 'phone' ? `
              <div class="form-group">
                <label>Số điện thoại (bắt buộc đúng 10 chữ số) *</label>
                <input class="input" type="tel" inputmode="numeric" pattern="0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}" maxlength="10" data-numeric-phone name="identifier" required placeholder="VD: 0912345678" autocomplete="tel" />
              </div>
            ` : `
              <div class="form-group">
                <label>Đúng địa chỉ Gmail đã đăng ký (@gmail.com) *</label>
                <input class="input" type="email" name="identifier" required placeholder="tenban@gmail.com" autocomplete="email" />
              </div>
            `}
            <div class="form-group">
              <label>Mật khẩu *</label>
              <input class="input" type="password" name="password" required placeholder="Nhập mật khẩu..." autocomplete="current-password" />
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%;">Đăng Nhập</button>
          </form>
        ` : !canLoginOtp ? `
          <div class="otp-info-box">
            <div style="font-weight:700;color:var(--ui-brand);margin-bottom:4px;">Đăng nhập không mật khẩu bằng OTP</div>
            <p style="margin:0 0 10px;font-size:12px;color:var(--ui-muted);line-height:1.55;">
              Để bảo vệ tài khoản của bạn, đăng nhập trực tiếp bằng mã OTP chỉ mở khi máy chủ đã kết nối dịch vụ gửi ${loginMethod === 'gmail' ? 'Email thật (Resend / Brevo)' : 'SMS thật (eSMS / Twilio)'}. Vui lòng đăng nhập bằng <strong>Mật khẩu</strong> hoặc tài khoản <strong>Facebook / Google</strong> đã liên kết.
            </p>
            <button type="button" class="btn btn-primary btn-sm" style="width:100%;" data-login-auth-mode="password">Chuyển sang Đăng Nhập Bằng Mật Khẩu</button>
          </div>
        ` : `
          <form id="auth-login-otp-form">
            <div class="form-group">
              <label>${loginMethod === 'phone' ? 'Số điện thoại đã đăng ký (10 số) *' : 'Địa chỉ Gmail đã đăng ký (@gmail.com) *'}</label>
              <div style="display:flex;gap:8px;">
                ${loginMethod === 'phone'
                  ? `<input class="input" id="login-otp-target" type="tel" inputmode="numeric" maxlength="10" data-numeric-phone name="identifier" required value="${escapeHtml(loginOtpTarget)}" placeholder="VD: 0912345678" style="flex:1;" />`
                  : `<input class="input" id="login-otp-target" type="email" name="identifier" required value="${escapeHtml(loginOtpTarget)}" placeholder="tenban@gmail.com" style="flex:1;" />`}
                <button type="button" class="btn btn-outline btn-sm" id="btn-send-login-otp" data-otp-send-btn data-otp-scope="login" style="flex-shrink:0;" ${loginRemain > 0 ? 'disabled' : ''}>
                  ${loginRemain > 0 ? `Gửi lại (${loginRemain}s)` : (loginOtpSent ? 'Gửi lại mã' : 'Gửi mã OTP')}
                </button>
              </div>
            </div>
            <div id="login-otp-sent-area">
              ${loginOtpSent ? `
                <div class="otp-info-box is-success" style="margin-bottom:12px;">
                  Đã gửi mã đăng nhập 6 số về ${loginMethod === 'phone' ? 'SMS số ' : 'hộp thư Gmail '}<strong>${escapeHtml(loginSentTarget)}</strong> (hiệu lực 5 phút).
                </div>
                <div class="form-group">
                  <label>Nhập mã OTP 6 số vừa nhận *</label>
                  <input class="input otp-code-input" id="login-otp-code-input" type="tel" inputmode="numeric" maxlength="6" name="otpCode" required placeholder="______" autocomplete="one-time-code" />
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%;">Xác Nhận &amp; Đăng Nhập</button>
              ` : `
                <p style="font-size:12px;color:var(--ui-muted);margin:0;">Bấm <strong>Gửi mã OTP</strong> để nhận mã xác thực 6 số gửi về ${loginMethod === 'phone' ? 'điện thoại' : 'Gmail'} của bạn.</p>
              `}
            </div>
          </form>
        `}
      ` : `
        <div class="auth-method-row">
          <button type="button" class="pill ${regProvider === 'phone' ? 'active' : ''}" data-reg-prov="phone">Bằng Số điện thoại</button>
          <button type="button" class="pill ${regProvider === 'gmail' ? 'active' : ''}" data-reg-prov="gmail">Bằng Gmail thật</button>
        </div>

        <div class="otp-steps-bar">
          <span class="otp-step-pill ${!regVerified ? 'active' : 'done'}">1. Gửi &amp; xác nhận mã 6 số</span>
          <span style="color:var(--ui-muted);">→</span>
          <span class="otp-step-pill ${regVerified ? 'active' : ''}">2. Hoàn tất đăng ký</span>
        </div>

        ${!regVerified ? `
          <div id="reg-otp-step1">
            <div class="form-group">
              <label>${regProvider === 'phone' ? 'Số điện thoại nhận mã xác thực (bắt buộc đúng 10 số) *' : 'Địa chỉ Gmail thật nhận mã xác thực (@gmail.com) *'}</label>
              <div style="display:flex;gap:8px;">
                ${regProvider === 'phone'
                  ? `<input class="input" id="reg-otp-target" type="tel" inputmode="numeric" maxlength="10" data-numeric-phone value="${escapeHtml(regTarget)}" placeholder="VD: 0912345678" autocomplete="tel" style="flex:1;" />`
                  : `<input class="input" id="reg-otp-target" type="email" value="${escapeHtml(regTarget)}" placeholder="tenban@gmail.com" autocomplete="email" style="flex:1;" />`}
                <button type="button" class="btn btn-primary btn-sm" id="btn-send-reg-otp" data-otp-send-btn data-otp-scope="register" style="flex-shrink:0;" ${regRemain > 0 ? 'disabled' : ''}>
                  ${regRemain > 0 ? `Gửi lại (${regRemain}s)` : (regOtpSent ? 'Gửi lại mã' : 'Gửi mã xác thực')}
                </button>
              </div>
              <small style="display:block;margin-top:5px;font-size:11.5px;color:var(--ui-muted);">
                Bắt buộc nhận và xác minh mã 6 số trước khi tạo tài khoản mới tại DaiLo Wedding.
              </small>
            </div>

            <div id="reg-otp-sent-area">
              ${regOtpSent ? `
                ${regOtpDelivery === 'on_screen_fallback' && regPreviewCode ? `
                  <div class="otp-preview-card">
                    <div style="font-size:11.5px;font-weight:700;color:#7b4f10;text-transform:uppercase;letter-spacing:0.6px;">Mã xác thực 6 số cho ${escapeHtml(regSentTarget)}</div>
                    <div class="otp-preview-code">${escapeHtml(regPreviewCode)}</div>
                    <div style="font-size:11.5px;color:#6e5630;line-height:1.45;">${escapeHtml(regOtpNotice || 'Nhập đúng 6 số trên vào ô bên dưới để xác nhận (hiệu lực 5 phút).')}</div>
                  </div>
                ` : `
                  <div class="otp-info-box is-success" style="margin-bottom:12px;">
                    Đã gửi mã xác thực 6 số về ${regProvider === 'phone' ? 'SMS số điện thoại ' : 'hộp thư Gmail '}<strong>${escapeHtml(regSentTarget)}</strong>. Vui lòng kiểm tra và nhập mã bên dưới (hiệu lực 5 phút).
                  </div>
                `}

                <div class="form-group">
                  <label>Nhập mã xác thực 6 số *</label>
                  <input class="input otp-code-input" id="reg-otp-code-input" type="tel" inputmode="numeric" maxlength="6" value="${escapeHtml(regOtpCodeDraft)}" placeholder="Nhập 6 chữ số..." autocomplete="one-time-code" />
                </div>
                <button type="button" class="btn btn-primary" id="btn-verify-reg-otp" style="width:100%;">Xác Nhận Mã Để Tiếp Tục Đăng Ký</button>
              ` : `
                <div class="otp-info-box" style="font-size:12px;color:var(--ui-muted);line-height:1.55;">
                  Nhập ${regProvider === 'phone' ? 'số điện thoại 10 số Việt Nam' : 'địa chỉ Gmail (@gmail.com)'} rồi bấm <strong>Gửi mã xác thực</strong>. Sau khi xác nhận mã 6 số, bạn sẽ đặt mật khẩu và hoàn tất đăng ký.
                </div>
              `}
            </div>
          </div>
        ` : `
          <div class="otp-verified-banner">
            <div>
              <strong>${icon('shield', 14)} Đã xác thực ${regProvider === 'phone' ? 'Số điện thoại' : 'Gmail'}</strong>
              <div style="font-size:12.5px;margin-top:2px;">${escapeHtml(regTarget)}</div>
            </div>
            <button type="button" class="btn btn-outline btn-xs" id="btn-change-reg-target">Đổi</button>
          </div>

          <form id="auth-register-form">
            <div class="form-group"><label>Họ và tên *</label><input class="input" name="name" required placeholder="VD: Nguyễn Bảo Ngọc" autocomplete="name" /></div>
            ${regProvider === 'phone' ? `
              <div class="form-group"><label>Gmail bổ sung (tùy chọn — đúng @gmail.com)</label><input class="input" type="email" name="email" placeholder="tenban@gmail.com" autocomplete="email" /></div>
            ` : `
              <div class="form-group"><label>Số điện thoại / Zalo bổ sung (tùy chọn — 10 số)</label><input class="input" type="tel" inputmode="numeric" maxlength="10" data-numeric-phone name="phone" placeholder="VD: 0912345678" autocomplete="tel" /></div>
            `}
            <div class="form-group"><label>Tạo mật khẩu (tối thiểu 6 ký tự) *</label><input class="input" type="password" name="password" required minlength="6" placeholder="Tạo mật khẩu..." autocomplete="new-password" /></div>
            <button type="submit" class="btn btn-primary" style="width:100%;">Hoàn Tất Đăng Ký Tài Khoản</button>
          </form>
        `}
      `}
    `, { cardClass: 'auth-modal-card', preserveCleanup: true });

    activeModalCleanup = stopCooldownTimer;
    ensureCooldownTick();
    bindNumericPhoneInputs(modalRoot);

    modalRoot.querySelectorAll('[data-auth-tab]').forEach(b => b.addEventListener('click', () => {
      activeTab = b.dataset.authTab;
      drawAuth();
    }));
    modalRoot.querySelectorAll('[data-login-method]').forEach(b => b.addEventListener('click', () => {
      if (loginMethod !== b.dataset.loginMethod) {
        loginMethod = b.dataset.loginMethod;
        loginOtpSent = false;
        loginOtpTarget = '';
        loginSentTarget = '';
        loginCooldownUntil = 0;
      }
      drawAuth();
    }));
    modalRoot.querySelectorAll('[data-login-auth-mode]').forEach(b => b.addEventListener('click', () => {
      loginAuthMode = b.dataset.loginAuthMode;
      drawAuth();
    }));
    modalRoot.querySelectorAll('[data-reg-prov]').forEach(b => b.addEventListener('click', () => {
      if (regProvider !== b.dataset.regProv) {
        regProvider = b.dataset.regProv;
        regTarget = '';
        resetRegOtpState();
      }
      drawAuth();
    }));

    modalRoot.querySelector('[data-social="facebook"]')?.addEventListener('click', () => {
      runFacebookSocialFlow({
        mode: 'login',
        onSuccess: onSuccessRedirect,
        onSetupNeeded: () => openSocialSetupInfoModal('facebook', { onBack: drawAuth }),
      });
    });
    modalRoot.querySelector('[data-social="google"]')?.addEventListener('click', () => {
      runGoogleSocialFlow({
        mode: 'login',
        onSuccess: onSuccessRedirect,
        onSetupNeeded: () => openSocialSetupInfoModal('google', { onBack: drawAuth }),
      });
    });

    // Step 1 Register OTP: target input (changing target after OTP sent invalidates stale OTP immediately!)
    modalRoot.querySelector('#reg-otp-target')?.addEventListener('input', e => {
      regTarget = regProvider === 'phone' ? sanitizePhoneDigits(e.target.value) : e.target.value.trim().toLowerCase();
      if (regProvider === 'phone' && e.target.value !== regTarget) e.target.value = regTarget;
      if (regOtpSent && regTarget !== regSentTarget) {
        resetRegOtpState();
        const area = modalRoot.querySelector('#reg-otp-sent-area');
        if (area) {
          area.innerHTML = `<div class="otp-info-box" style="font-size:12px;color:var(--ui-muted);line-height:1.55;">Bạn vừa thay đổi ${regProvider === 'phone' ? 'số điện thoại' : 'Gmail'}. Vui lòng bấm <strong>Gửi mã xác thực</strong> để nhận mã mới.</div>`;
        }
      }
    });
    modalRoot.querySelector('#reg-otp-target')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        modalRoot.querySelector('#btn-send-reg-otp')?.click();
      }
    });
    modalRoot.querySelector('#reg-otp-code-input')?.addEventListener('input', e => {
      regOtpCodeDraft = e.target.value.replace(/\D/g, '').slice(0, 6);
      if (e.target.value !== regOtpCodeDraft) e.target.value = regOtpCodeDraft;
    });
    modalRoot.querySelector('#reg-otp-code-input')?.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        e.preventDefault();
        modalRoot.querySelector('#btn-verify-reg-otp')?.click();
      }
    });

    modalRoot.querySelector('#btn-send-reg-otp')?.addEventListener('click', async e => {
      const targetInp = modalRoot.querySelector('#reg-otp-target');
      const rawVal = (targetInp?.value || '').trim();
      if (regProvider === 'phone') {
        const ck = validateVnPhone10(rawVal);
        if (!ck.ok) { showToast(ck.error, 'error'); targetInp?.focus(); return; }
        regTarget = ck.digits;
      } else {
        const lower = rawVal.toLowerCase();
        if (!isStrictGmail(lower)) {
          showToast('Vui lòng nhập đúng địa chỉ Gmail thật (@gmail.com) trước khi gửi mã', 'error');
          targetInp?.focus();
          return;
        }
        regTarget = lower;
      }
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Đang gửi...';
      try {
        const res = await storage.sendOtp({ channel: regProvider, target: regTarget, purpose: 'register' });
        regOtpSent = true;
        regSentTarget = regTarget;
        regOtpDelivery = res.delivery || '';
        regPreviewCode = res.previewCode || '';
        regOtpNotice = res.notice || '';
        regOtpCodeDraft = '';
        startCooldown('register', res.cooldownSec || 30);
        showToast(
          res.delivery === 'on_screen_fallback'
            ? `Đã tạo mã xác thực 6 số cho ${regTarget}. Vui lòng nhập mã hiển thị bên dưới!`
            : `Đã gửi mã xác thực 6 số về ${regProvider === 'phone' ? 'SĐT' : 'Gmail'} ${regTarget}!`,
          'success'
        );
        drawAuth();
        modalRoot.querySelector('#reg-otp-code-input')?.focus();
      } catch (err) {
        showToast(err.message || 'Không gửi được mã xác thực', 'error');
        if (err?.retryAfterSec) {
          startCooldown('register', err.retryAfterSec);
        } else {
          btn.disabled = false;
          btn.textContent = regOtpSent ? 'Gửi lại mã' : 'Gửi mã xác thực';
        }
      }
    });

    // Step 1 Register OTP: verify 6-digit code
    modalRoot.querySelector('#btn-verify-reg-otp')?.addEventListener('click', async e => {
      const codeInp = modalRoot.querySelector('#reg-otp-code-input');
      const codeVal = (codeInp?.value || '').replace(/\D/g, '').slice(0, 6);
      if (!regOtpSent || !regSentTarget || regTarget !== regSentTarget) {
        showToast('Vui lòng bấm Gửi mã xác thực cho đúng SĐT/Gmail hiện tại trước.', 'error');
        return;
      }
      if (codeVal.length !== 6) {
        showToast('Vui lòng nhập đủ 6 chữ số mã xác thực', 'error');
        codeInp?.focus();
        return;
      }
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Đang xác minh...';
      try {
        const res = await storage.verifyOtp({ channel: regProvider, target: regSentTarget, code: codeVal, purpose: 'register' });
        regVerified = true;
        regTarget = regSentTarget;
        regVerificationToken = res.verificationToken || '';
        regOtpCodeDraft = codeVal;
        regCooldownUntil = 0;
        syncCooldownBtn();
        showToast(`Xác thực ${regProvider === 'phone' ? 'Số điện thoại' : 'Gmail'} thành công! Hãy tạo mật khẩu để hoàn tất.`, 'success');
        drawAuth();
      } catch (err) {
        showToast(err.message || 'Mã xác thực 6 số không đúng', 'error');
        btn.disabled = false;
        btn.textContent = 'Xác Nhận Mã Để Tiếp Tục Đăng Ký';
      }
    });

    modalRoot.querySelector('#btn-change-reg-target')?.addEventListener('click', () => {
      resetRegOtpState();
      drawAuth();
    });

    // Login with Password
    modalRoot.querySelector('#auth-login-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const rawIdent = fd.get('identifier').toString().trim();
      if (loginMethod === 'phone' && !isValidPhoneDigits(rawIdent)) {
        showToast(getPhoneErrorMsg(rawIdent), 'error');
        return;
      }
      if (loginMethod === 'gmail' && !isStrictGmail(rawIdent)) {
        showToast('Vui lòng nhập đúng địa chỉ Gmail thật đã đăng ký (@gmail.com)', 'error');
        return;
      }
      try {
        const user = await storage.authLogin({
          identifier: loginMethod === 'phone' ? sanitizePhoneDigits(rawIdent) : rawIdent.toLowerCase(),
          password: fd.get('password').toString(),
          loginMethod,
        });
        closeModal();
        showToast(user.role === 'admin' ? 'Đăng nhập Quản Trị thành công' : `Chào mừng ${user.name}!`, 'success');
        if (onSuccessRedirect) onSuccessRedirect(user);
        else if (user.role === 'admin') navigateTo({ role: 'admin' });
        else route();
      } catch (err) {
        showToast(err.message || 'Sai tài khoản hoặc mật khẩu', 'error');
      }
    });

    // Login with Live OTP
    modalRoot.querySelector('#login-otp-target')?.addEventListener('input', e => {
      loginOtpTarget = loginMethod === 'phone' ? sanitizePhoneDigits(e.target.value) : e.target.value.trim().toLowerCase();
      if (loginMethod === 'phone' && e.target.value !== loginOtpTarget) e.target.value = loginOtpTarget;
      if (loginOtpSent && loginOtpTarget !== loginSentTarget) {
        loginOtpSent = false;
        loginSentTarget = '';
        loginCooldownUntil = 0;
        syncCooldownBtn();
        const area = modalRoot.querySelector('#login-otp-sent-area');
        if (area) {
          area.innerHTML = `<p style="font-size:12px;color:var(--ui-muted);margin:0;">Bạn vừa thay đổi ${loginMethod === 'phone' ? 'số điện thoại' : 'Gmail'}. Vui lòng bấm <strong>Gửi mã OTP</strong> để nhận mã mới.</p>`;
        }
      }
    });
    modalRoot.querySelector('#login-otp-code-input')?.addEventListener('input', e => {
      const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
      if (e.target.value !== clean) e.target.value = clean;
    });

    modalRoot.querySelector('#btn-send-login-otp')?.addEventListener('click', async e => {
      const targetInp = modalRoot.querySelector('#login-otp-target');
      const rawVal = (targetInp?.value || '').trim();
      if (loginMethod === 'phone') {
        const ck = validateVnPhone10(rawVal);
        if (!ck.ok) { showToast(ck.error, 'error'); targetInp?.focus(); return; }
        loginOtpTarget = ck.digits;
      } else {
        const lower = rawVal.toLowerCase();
        if (!isStrictGmail(lower)) { showToast('Vui lòng nhập đúng địa chỉ Gmail (@gmail.com)', 'error'); targetInp?.focus(); return; }
        loginOtpTarget = lower;
      }
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Đang gửi...';
      try {
        const res = await storage.sendOtp({ channel: loginMethod, target: loginOtpTarget, purpose: 'login' });
        loginOtpSent = true;
        loginSentTarget = loginOtpTarget;
        startCooldown('login', res.cooldownSec || 30);
        showToast(`Đã gửi mã đăng nhập 6 số về ${loginOtpTarget}!`, 'success');
        drawAuth();
        modalRoot.querySelector('#login-otp-code-input')?.focus();
      } catch (err) {
        showToast(err.message || 'Không gửi được mã đăng nhập', 'error');
        if (err?.retryAfterSec) {
          startCooldown('login', err.retryAfterSec);
        } else {
          btn.disabled = false;
          btn.textContent = loginOtpSent ? 'Gửi lại mã' : 'Gửi mã OTP';
        }
      }
    });

    modalRoot.querySelector('#auth-login-otp-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      if (!loginOtpSent || !loginSentTarget || loginOtpTarget !== loginSentTarget) {
        showToast('Vui lòng bấm Gửi mã OTP cho đúng tài khoản hiện tại.', 'error');
        return;
      }
      const fd = new FormData(e.target);
      const code = (fd.get('otpCode') || '').toString().replace(/\D/g, '').slice(0, 6);
      if (code.length !== 6) { showToast('Vui lòng nhập đủ 6 chữ số mã OTP', 'error'); return; }
      try {
        const user = await storage.loginWithOtp({
          channel: loginMethod,
          identifier: loginSentTarget,
          otpCode: code,
        });
        closeModal();
        showToast(`Đăng nhập thành công! Chào mừng ${user.name}`, 'success');
        if (onSuccessRedirect) onSuccessRedirect(user);
        else route();
      } catch (err) {
        showToast(err.message || 'Mã OTP đăng nhập không đúng', 'error');
      }
    });

    // Step 2 Register Submit (after OTP verified!)
    modalRoot.querySelector('#auth-register-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = fd.get('name').toString().trim();
      const extraEmail = (fd.get('email') || '').toString().trim().toLowerCase();
      const extraPhone = (fd.get('phone') || '').toString().trim();
      const password = fd.get('password').toString();

      const finalEmail = regProvider === 'gmail' ? regTarget : extraEmail;
      const finalPhone = regProvider === 'phone' ? regTarget : sanitizePhoneDigits(extraPhone);

      if (!name) { showToast('Vui lòng nhập họ và tên', 'error'); return; }
      if (regProvider === 'phone' && extraEmail && !isStrictGmail(extraEmail)) {
        showToast('Gmail bổ sung phải đúng định dạng @gmail.com', 'error');
        return;
      }
      if (regProvider === 'gmail' && extraPhone && !isValidPhoneDigits(extraPhone)) {
        showToast(getPhoneErrorMsg(extraPhone), 'error');
        return;
      }
      try {
        const user = await storage.authRegister({
          provider: regProvider,
          name,
          email: finalEmail,
          confirmEmail: finalEmail,
          phone: finalPhone,
          password,
          otpCode: regOtpCodeDraft,
          otpVerificationToken: regVerificationToken,
        });
        closeModal();
        showToast(`Đăng ký thành công! Chào mừng ${user.name} đến với DaiLo Wedding`, 'success');
        if (onSuccessRedirect) onSuccessRedirect(user);
        else route();
      } catch (err) {
        showToast(err.message || 'Đăng ký thất bại', 'error');
      }
    });
  };

  drawAuth();
}

/* ============================================================================
   MODAL ĐẶT LỊCH TƯ VẤN (BOOKING)
   ============================================================================ */
function openBookingModal(settings = {}) {
  const u = storage.currentUser;
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
  const initialPhone = sanitizePhoneDigits(u?.phone || '');
  openModal(`
    <div class="modal-head">
      <div>
        <h3>Đặt Lịch Tư Vấn &amp; Thiết Kế Thiệp</h3>
        <small style="color:var(--ui-muted);">Yêu cầu bắt buộc SĐT Việt Nam đủ 10 số hợp lệ — tư vấn viên liên hệ qua Zalo/SĐT ${escapeHtml(settings.hotline || '0354 248 177')}</small>
      </div>
      <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 16)}</button>
    </div>
    <form id="public-booking-form" novalidate>
      <div class="grid-2">
        <div class="form-group">
          <label>Họ tên của bạn *</label>
          <input class="input" id="bk-name-input" name="name" required value="${escapeHtml(u?.name || '')}" placeholder="VD: Minh Quân" autocomplete="name" />
        </div>
        <div class="form-group">
          <label>Số điện thoại / Zalo (bắt buộc đủ 10 số) *</label>
          <input class="input" id="bk-phone-input" type="tel" inputmode="numeric" pattern="0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}" maxlength="10" data-numeric-phone name="phone" required value="${escapeHtml(initialPhone)}" placeholder="VD: 0912345678" autocomplete="tel" />
          <small id="bk-phone-hint" style="display:block;margin-top:4px;font-size:11.5px;color:var(--ui-muted);">Bắt buộc nhập đúng 10 chữ số (đầu số VN: 03x, 05x, 07x, 08x, 09x)</small>
        </div>
      </div>
      <div class="grid-3">
        <div class="form-group"><label>Ngày hẹn *</label><input class="input" type="date" name="date" required value="${tomorrow}" /></div>
        <div class="form-group">
          <label>Khung giờ</label>
          <select class="select" name="timeSlot">
            <option value="09:00">09:00 Sáng</option><option value="10:30">10:30 Sáng</option>
            <option value="14:00">14:00 Chiều</option><option value="16:00">16:00 Chiều</option>
            <option value="19:30" selected>19:30 Tối</option><option value="21:00">21:00 Tối</option>
          </select>
        </div>
        <div class="form-group">
          <label>Hình thức tư vấn</label>
          <select class="select" name="channel">
            <option value="Zalo Call">Zalo Call</option>
            <option value="Nhắn tin Zalo">Nhắn tin Zalo</option>
            <option value="Gọi điện thoại">Gọi điện thoại</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Nhu cầu của bạn</label>
        <select class="select" name="service">
          <option value="Tư vấn chọn mẫu & màu hợp mệnh Ngũ Hành">Tư vấn chọn mẫu &amp; màu hợp mệnh Ngũ Hành</option>
          <option value="Thiết kế thiệp riêng theo bộ ảnh cưới (Gói 499k)">Thiết kế thiệp riêng theo bộ ảnh cưới (Gói 499k)</option>
          <option value="Tư vấn gói Tiêu Chuẩn 189k / Cao Cấp 299k">Tư vấn gói Tiêu Chuẩn 189k / Cao Cấp 299k</option>
          <option value="Cần hỗ trợ nhập nội dung & tạo link khách mời">Cần hỗ trợ nhập nội dung &amp; tạo link khách mời</option>
        </select>
      </div>
      <div class="form-group"><label>Ghi chú thêm (năm sinh cô dâu chú rể, ngày cưới...)</label><textarea class="textarea" rows="2" name="note" placeholder="VD: Ngày cưới 20/12, chú rể 1996, cô dâu 1998..."></textarea></div>
      <button type="submit" id="bk-submit-btn" class="btn btn-primary" style="width:100%;padding:11px;">Xác Nhận Gửi Yêu Cầu Tư Vấn</button>
    </form>
  `);

  bindNumericPhoneInputs(modalRoot);
  const phoneInp = modalRoot.querySelector('#bk-phone-input');
  const phoneHint = modalRoot.querySelector('#bk-phone-hint');
  const updatePhoneHint = (showEmptyError = false) => {
    if (!phoneInp || !phoneHint) return true;
    const val = phoneInp.value.trim();
    if (!val && !showEmptyError) {
      phoneInp.style.borderColor = '';
      phoneHint.style.color = 'var(--ui-muted)';
      phoneHint.textContent = 'Bắt buộc nhập đúng 10 chữ số (đầu số VN: 03x, 05x, 07x, 08x, 09x)';
      return false;
    }
    const check = validateVnPhone10(val);
    if (check.ok) {
      phoneInp.style.borderColor = 'var(--ui-success)';
      phoneHint.style.color = 'var(--ui-success)';
      phoneHint.textContent = `Số điện thoại hợp lệ (10/10 chữ số: ${check.digits})`;
      return true;
    }
    phoneInp.style.borderColor = 'var(--ui-danger, #c62828)';
    phoneHint.style.color = 'var(--ui-danger, #c62828)';
    phoneHint.textContent = check.error;
    return false;
  };
  phoneInp?.addEventListener('input', () => updatePhoneHint(false));
  if (initialPhone) updatePhoneHint(false);

  modalRoot.querySelector('#public-booking-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const name = fd.get('name').toString().trim();
    const rawPhone = fd.get('phone').toString().trim();
    const dateVal = fd.get('date').toString().trim();
    if (!name) {
      showToast('Vui lòng nhập họ tên của bạn trước khi gửi yêu cầu tư vấn.', 'error');
      modalRoot.querySelector('#bk-name-input')?.focus();
      return;
    }
    const phoneCheck = validateVnPhone10(rawPhone);
    if (!phoneCheck.ok) {
      updatePhoneHint(true);
      showToast(phoneCheck.error, 'error');
      phoneInp?.focus();
      return;
    }
    if (!dateVal) {
      showToast('Vui lòng chọn ngày hẹn tư vấn.', 'error');
      return;
    }
    const submitBtn = modalRoot.querySelector('#bk-submit-btn');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang gửi yêu cầu về Trang Quản Lý...'; }
    try {
      await storage.submitBooking({
        name,
        phone: phoneCheck.digits,
        email: u?.email || '',
        date: dateVal,
        timeSlot: fd.get('timeSlot').toString(),
        channel: fd.get('channel').toString(),
        service: fd.get('service').toString(),
        note: fd.get('note').toString().trim(),
      });
      closeModal();
      showToast(`Đã gửi yêu cầu tư vấn thành công! Quản lý sẽ liên hệ số ${phoneCheck.digits} đúng hẹn.`, 'success');
    } catch (err) {
      showToast(err.message || 'Không thể đặt lịch', 'error');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Xác Nhận Gửi Yêu Cầu Tư Vấn'; }
    }
  });
}

/* ============================================================================
   CHUYỂN THẲNG SANG TRANG THANH TOÁN VIETQR TRỰC TIẾP (?role=checkout)
   ============================================================================ */
function openPaymentQrModal({ templateId = '', pkgIdx = 1 } = {}) {
  closeModal();
  const params = { role: 'checkout', pkg: String(Math.max(0, Number(pkgIdx) || 0)) };
  if (templateId) params.tpl = templateId;
  navigateTo(params);
}

/* ============================================================================
   KHUNG CHAT TRỰC TIẾP 2 CHIỀU + BOT SUY NGHĨ 3–5 GIÂY + NHẮN TRỰC TIẾP QUẢN LÝ
   ============================================================================ */
function cancelBotThinking() {
  chatBotReqSeq++;
  if (chatBotTimer) { clearTimeout(chatBotTimer); chatBotTimer = null; }
  chatThinking = false;
}

function stopChatPolling() {
  if (chatPollTimer) { clearInterval(chatPollTimer); chatPollTimer = null; }
  if (chatUnsubSync) { chatUnsubSync(); chatUnsubSync = null; }
}

function hideChatWidget() {
  chatOpen = false;
  directRequestOpen = false;
  cancelBotThinking();
  stopChatPolling();
  if (chatWidgetRoot) chatWidgetRoot.innerHTML = '';
}

function wantsDirectManager(text) {
  const norm = String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
  return [
    'gap quan ly', 'nhan truc tiep', 'chat truc tiep', 'nguoi that',
    'gap chu shop', 'gap admin', 'noi chuyen truc tiep', 'tro chuyen truc tiep',
    'nhan voi quan ly', 'gap tu van vien', 'tu van truc tiep', 'quan ly oi',
  ].some(k => norm.includes(k));
}

async function openConsultationChat(settings, prefillText = '', { openDirect = false } = {}) {
  chatOpen = true;
  directRequestOpen = Boolean(openDirect);
  if (openDirect && prefillText) chatDirectPrefill = prefillText;
  currentChatThread = await storage.getChatThread();
  renderChatWidget(settings, openDirect ? '' : prefillText);
  startChatPolling(settings);
}

function startChatPolling(settings) {
  stopChatPolling();
  if (!chatOpen) return;
  const syncNow = async () => {
    if (!chatOpen) { stopChatPolling(); return; }
    try {
      const fresh = await storage.getChatThread();
      const prevSig = JSON.stringify(currentChatThread || null);
      const nextSig = JSON.stringify(fresh || null);
      if (prevSig !== nextSig) {
        const prevMsgs = currentChatThread?.messages?.length || 0;
        const freshLast = fresh?.messages?.[fresh.messages.length - 1];
        if (freshLast && freshLast.sender === 'admin' && (fresh.messages.length > prevMsgs)) {
          cancelBotThinking();
        }
        const draftInp = chatWidgetRoot?.querySelector('#chat-msg-input');
        const draftVal = draftInp ? draftInp.value : '';
        const wasFocused = draftInp && document.activeElement === draftInp;
        currentChatThread = fresh;
        renderChatWidget(settings, draftVal);
        if (wasFocused) {
          const nextInp = chatWidgetRoot?.querySelector('#chat-msg-input');
          if (nextInp) { nextInp.focus(); nextInp.setSelectionRange(nextInp.value.length, nextInp.value.length); }
        }
      }
    } catch (_) {}
  };
  chatUnsubSync = storage.subscribeSync(syncNow);
  chatPollTimer = setInterval(syncNow, 2500);
}

function renderChatWidget(settings = {}, prefillText = '') {
  if (!chatWidgetRoot) return;
  const hotline = settings.hotline || '0354 248 177';
  const phoneRaw = (settings.phoneRaw || '0354248177').replace(/\s+/g, '');
  const zaloUrl = settings.zaloUrl || `https://zalo.me/${phoneRaw}`;
  const botCfg = publicStore?.chatbotConfig || DEFAULT_CHATBOT_CONFIG;
  const rawPrompts = botCfg.customerQuickPrompts || DEFAULT_CHATBOT_CONFIG.customerQuickPrompts;
  const msgs = currentChatThread?.messages || [];
  const askedKeys = new Set([
    ...usedQuickPrompts,
    ...msgs.filter(m => m.sender === 'customer').map(m => normalizePromptKey(m.text)),
  ]);
  const quickPrompts = rawPrompts.filter(q => !askedKeys.has(normalizePromptKey(q)));
  const u = storage.currentUser;
  const isWaitingAdmin = Boolean(currentChatThread?.waitingForAdmin);
  const isLiveWithAdmin = Boolean(currentChatThread && currentChatThread.botActive === false);
  const verifiedPhone = sanitizePhoneDigits(currentChatThread?.customerPhone || u?.phone || '');
  const customerDisplayName = (currentChatThread?.customerName && currentChatThread.customerName !== 'Khách tham quan')
    ? currentChatThread.customerName
    : (u?.name || '');

  const headSubtitle = isWaitingAdmin
    ? `Đang chờ Quản Lý phản hồi • SĐT: ${verifiedPhone || hotline}`
    : isLiveWithAdmin
      ? `Đang nhắn trực tiếp cùng Quản Lý • ${hotline}`
      : `Trợ lý AI Agent 24/7 • Hỗ trợ trực tiếp: ${hotline}`;

  chatWidgetRoot.innerHTML = `
    ${chatOpen ? `
      <div class="chat-drawer" role="dialog" aria-label="Khung chat tư vấn trực tiếp">
        <div class="chat-drawer-head">
          <div style="min-width:0;">
            <strong style="display:block;font-size:14px;">Trợ Lý AI &amp; Kết Nối Quản Lý</strong>
            <small style="font-size:11px;opacity:0.88;display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(headSubtitle)}</small>
          </div>
          <button type="button" class="btn btn-ghost btn-xs" style="color:#fff;" id="chat-close-btn">${icon('x', 15)}</button>
        </div>

        <div class="chat-drawer-body" id="chat-thread">
          <div class="chat-bubble bot">
            <div>${escapeHtml(botCfg.greeting || DEFAULT_CHATBOT_CONFIG.greeting)}</div>
            <span class="chat-bubble-meta">Trợ lý AI Studio</span>
          </div>

          ${msgs.map(m => {
            const cls = m.sender === 'customer' ? 'user' : m.sender === 'admin' ? 'studio' : 'bot';
            const label = m.sender === 'customer' ? 'Bạn' : m.sender === 'admin' ? 'Quản Lý Studio (Trực tiếp)' : (m.aiPowered ? 'Trợ lý AI Agent' : 'Trợ lý AI Studio');
            return `<div class="chat-bubble ${cls}"><div>${escapeHtml(m.text)}</div><span class="chat-bubble-meta">${label}</span></div>`;
          }).join('')}

          ${chatThinking ? `
            <div class="chat-bubble bot is-thinking">
              <div class="chat-thinking-row">
                <span>Trợ lý AI đang suy nghĩ</span>
                <span class="chat-typing-dots" aria-hidden="true"><i></i><i></i><i></i></span>
              </div>
              <span class="chat-bubble-meta">Đang phân tích tư vấn (3–5 giây)...</span>
            </div>
          ` : ''}

          ${isWaitingAdmin ? `
            <div class="chat-waiting-card">
              <div class="chat-waiting-head">
                <span class="chat-pulse-dot"></span>
                <strong>Đang chờ Quản Lý phản hồi trực tiếp</strong>
              </div>
              <p>Tin nhắn của bạn đã hiển thị trực tiếp tại Trang Quản Lý. Trợ lý tự động đã tạm dừng — bạn vui lòng chờ trong giây lát, Quản Lý sẽ nhắn trực tiếp tại đây hoặc liên hệ qua SĐT bạn đã để lại.</p>
              <div class="chat-waiting-meta">
                <span><strong>Khách:</strong> ${escapeHtml(customerDisplayName || 'Khách hàng')}</span>
                <span><strong>SĐT xác nhận:</strong> ${escapeHtml(verifiedPhone)}</span>
              </div>
              <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap;">
                <a class="btn btn-outline btn-xs" href="tel:${escapeHtml(phoneRaw)}">Gọi gấp ${escapeHtml(hotline)}</a>
                <a class="btn btn-outline btn-xs" href="${escapeHtml(zaloUrl)}" target="_blank" rel="noopener">Nhắn Zalo nhanh</a>
              </div>
            </div>
          ` : ''}

          ${(!directRequestOpen && !isWaitingAdmin && !isLiveWithAdmin && !chatThinking && quickPrompts.length > 0) ? `
            <div class="chat-quick-chips">
              ${quickPrompts.map(q => `<button type="button" class="chat-quick-chip" data-quick-send="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join('')}
            </div>
          ` : ''}
        </div>

        ${directRequestOpen ? `
          <form class="chat-drawer-form chat-direct-form" id="chat-direct-form" novalidate>
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
              <strong style="font-size:12.5px;color:var(--ui-brand);">Nhắn Trực Tiếp Cho Quản Lý</strong>
              <button type="button" class="btn btn-ghost btn-xs" id="btn-cancel-direct">Quay lại</button>
            </div>
            <p style="margin:0;font-size:11.5px;color:var(--ui-muted);line-height:1.45;">
              Để nhắn trực tiếp cho Quản Lý, bắt buộc nhập <strong>Số điện thoại Việt Nam đủ 10 số hợp lệ</strong> để Quản Lý tiếp nhận ngay.
            </p>
            <div class="grid-2" style="gap:6px;">
              <input class="input" name="name" required placeholder="Tên của bạn *" value="${escapeHtml(customerDisplayName)}" />
              <input class="input" id="chat-direct-phone" type="tel" inputmode="numeric" pattern="0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}" maxlength="10" data-numeric-phone name="phone" required placeholder="SĐT đủ 10 số *" value="${escapeHtml(verifiedPhone)}" />
            </div>
            <small id="chat-direct-phone-hint" style="display:block;font-size:11px;color:var(--ui-muted);">Bắt buộc đủ 10 số (đầu số VN: 03x, 05x, 07x, 08x, 09x)</small>
            <textarea class="textarea" name="text" rows="2" required placeholder="Nhập nội dung cần Quản Lý tư vấn trực tiếp...">${escapeHtml(chatDirectPrefill)}</textarea>
            <button type="submit" class="btn btn-primary btn-sm" style="width:100%;">Gửi Trực Tiếp Cho Quản Lý</button>
          </form>
        ` : `
          <form class="chat-drawer-form" id="chat-live-form">
            <div style="display:flex;gap:6px;">
              <input class="input" id="chat-msg-input" name="text" required placeholder="${isLiveWithAdmin ? 'Nhắn trực tiếp tới Quản Lý...' : 'Nhập câu hỏi của bạn...'}" value="${escapeHtml(prefillText)}" />
              <button type="submit" class="btn btn-primary btn-sm">Gửi</button>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              ${!isLiveWithAdmin ? `
                <button type="button" class="btn btn-gold btn-xs" style="flex:1.4;" id="chat-request-direct">Nhắn trực tiếp Quản Lý</button>
              ` : `
                <span class="badge badge-paid" style="flex:1.2;justify-content:center;padding:5px 8px;">Đang kết nối Quản Lý</span>
              `}
              <button type="button" class="btn btn-outline btn-xs" style="flex:1;" id="chat-open-booking">Đặt lịch</button>
              <button type="button" class="btn btn-outline btn-xs" style="flex:1;" id="chat-open-qr">Quét QR</button>
              <a class="btn btn-outline btn-xs" href="${escapeHtml(zaloUrl)}" target="_blank" rel="noopener">Zalo</a>
            </div>
          </form>
        `}
      </div>
    ` : ''}

    <button type="button" class="chat-fab" id="chat-fab-toggle">
      <span class="chat-pulse-dot"></span>
      <span>${chatOpen ? 'Thu gọn chat' : (isWaitingAdmin ? 'Đang chờ Quản Lý...' : `Chat tư vấn • ${hotline}`)}</span>
    </button>
  `;

  bindNumericPhoneInputs(chatWidgetRoot);

  const threadEl = chatWidgetRoot.querySelector('#chat-thread');
  if (threadEl) threadEl.scrollTop = threadEl.scrollHeight;

  chatWidgetRoot.querySelector('#chat-fab-toggle')?.addEventListener('click', async () => {
    chatOpen = !chatOpen;
    if (chatOpen) {
      currentChatThread = await storage.getChatThread();
      startChatPolling(settings);
    } else {
      stopChatPolling();
    }
    renderChatWidget(settings);
  });

  chatWidgetRoot.querySelector('#chat-close-btn')?.addEventListener('click', () => {
    chatOpen = false;
    directRequestOpen = false;
    stopChatPolling();
    renderChatWidget(settings);
  });

  chatWidgetRoot.querySelector('#chat-request-direct')?.addEventListener('click', () => {
    directRequestOpen = true;
    chatDirectPrefill = chatWidgetRoot.querySelector('#chat-msg-input')?.value.trim() || '';
    renderChatWidget(settings);
  });

  chatWidgetRoot.querySelector('#btn-cancel-direct')?.addEventListener('click', () => {
    directRequestOpen = false;
    chatDirectPrefill = '';
    renderChatWidget(settings);
  });

  const sendLive = async (text, { name = '', phone = '', mode = 'auto' } = {}) => {
    const cleanText = String(text || '').trim();
    if (!cleanText) return;
    const alreadyDirect = Boolean(currentChatThread && (currentChatThread.waitingForAdmin || currentChatThread.botActive === false));

    if (mode !== 'direct' && !alreadyDirect && wantsDirectManager(cleanText)) {
      directRequestOpen = true;
      chatDirectPrefill = cleanText;
      renderChatWidget(settings);
      showToast('Vui lòng nhập Số điện thoại bắt buộc để kết nối trực tiếp Quản Lý', 'info');
      return;
    }

    const effectiveMode = (mode === 'direct' || alreadyDirect) ? 'direct' : 'bot';
    const cleanPhone = sanitizePhoneDigits(phone || currentChatThread?.customerPhone || u?.phone || '');
    if (effectiveMode === 'direct' && !isValidPhoneDigits(cleanPhone)) {
      directRequestOpen = true;
      chatDirectPrefill = cleanText;
      renderChatWidget(settings);
      showToast(getPhoneErrorMsg(cleanPhone), 'error');
      return;
    }

    cancelBotThinking();
    try {
      const res = await storage.sendChatMessage({
        name: name || customerDisplayName || 'Khách tham quan',
        phone: cleanPhone,
        email: u?.email || currentChatThread?.customerEmail || '',
        text: cleanText,
        mode: effectiveMode,
        deferBot: effectiveMode === 'bot',
      });
      currentChatThread = res.thread;
      directRequestOpen = false;
      chatDirectPrefill = '';

      if (effectiveMode === 'bot' && (res.pendingBotReply || storage.isCloudOnline())) {
        chatThinking = true;
        const mySeq = ++chatBotReqSeq;
        renderChatWidget(settings);
        const delayMs = 3000 + Math.floor(Math.random() * 2001); // 3–5 seconds realistic AI thinking delay
        const fallbackText = res.pendingBotReply || '';
        const tid = res.thread?.id || storage.getChatThreadId();

        // Kick off AI Agent generation in parallel with the 3–5s minimum thinking feel
        const aiPromise = storage.requestAiBotReply(tid, cleanText, fallbackText).catch(() => null);
        chatBotTimer = setTimeout(async () => {
          chatBotTimer = null;
          try {
            const committed = await aiPromise;
            if (mySeq !== chatBotReqSeq) return;
            if (committed) currentChatThread = committed;
            else currentChatThread = await storage.getChatThread();
          } catch (_) {
            if (mySeq === chatBotReqSeq) currentChatThread = await storage.getChatThread();
          } finally {
            if (mySeq === chatBotReqSeq) {
              chatThinking = false;
              if (chatOpen) renderChatWidget(settings);
            }
          }
        }, delayMs);
      } else {
        renderChatWidget(settings);
        if (effectiveMode === 'direct' && mode === 'direct') {
          showToast('Đã gửi trực tiếp tới Trang Quản Lý! Vui lòng chờ Quản Lý phản hồi.', 'success');
        }
      }
    } catch (err) {
      showToast(err.message || 'Không gửi được tin nhắn', 'error');
    }
  };

  chatWidgetRoot.querySelectorAll('[data-quick-send]').forEach(chip => {
    chip.addEventListener('click', () => {
      if (chatThinking) return;
      const q = chip.dataset.quickSend || '';
      const key = normalizePromptKey(q);
      if (!key || usedQuickPrompts.has(key)) return;
      usedQuickPrompts.add(key);
      chip.remove();
      sendLive(q);
    });
  });

  chatWidgetRoot.querySelector('#chat-live-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    await sendLive(fd.get('text').toString());
  });

  const directPhoneInp = chatWidgetRoot.querySelector('#chat-direct-phone');
  const directPhoneHint = chatWidgetRoot.querySelector('#chat-direct-phone-hint');
  directPhoneInp?.addEventListener('input', () => {
    if (!directPhoneHint) return;
    const v = directPhoneInp.value.trim();
    if (!v) {
      directPhoneInp.style.borderColor = '';
      directPhoneHint.style.color = 'var(--ui-muted)';
      directPhoneHint.textContent = 'Bắt buộc đủ 10 số (đầu số VN: 03x, 05x, 07x, 08x, 09x)';
      return;
    }
    const ck = validateVnPhone10(v);
    directPhoneInp.style.borderColor = ck.ok ? 'var(--ui-success)' : 'var(--ui-danger, #c62828)';
    directPhoneHint.style.color = ck.ok ? 'var(--ui-success)' : 'var(--ui-danger, #c62828)';
    directPhoneHint.textContent = ck.ok ? `Số điện thoại hợp lệ (10/10 số: ${ck.digits})` : ck.error;
  });

  chatWidgetRoot.querySelector('#chat-direct-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const dName = (fd.get('name') || '').toString().trim();
    const dPhone = (fd.get('phone') || '').toString().trim();
    const dText = (fd.get('text') || '').toString().trim();
    if (!dName) { showToast('Vui lòng nhập tên của bạn', 'error'); return; }
    const ck = validateVnPhone10(dPhone);
    if (!ck.ok) {
      if (directPhoneHint) { directPhoneHint.style.color = 'var(--ui-danger, #c62828)'; directPhoneHint.textContent = ck.error; }
      if (directPhoneInp) { directPhoneInp.style.borderColor = 'var(--ui-danger, #c62828)'; directPhoneInp.focus(); }
      showToast(ck.error, 'error');
      return;
    }
    if (!dText) { showToast('Vui lòng nhập nội dung cần tư vấn', 'error'); return; }
    await sendLive(dText, { name: dName, phone: ck.digits, mode: 'direct' });
  });

  chatWidgetRoot.querySelector('#chat-open-booking')?.addEventListener('click', () => openBookingModal(settings));
  chatWidgetRoot.querySelector('#chat-open-qr')?.addEventListener('click', () => openPaymentQrModal({ pkgIdx: 1, settings }));
}

/* ============================================================================
   SHOWROOM BÁN HÀNG (ĐÃ BỎ 2 NÚT CỔNG KHÁCH HÀNG & QUẢN TRỊ STUDIO -> ĐĂNG NHẬP)
   ============================================================================ */
function renderPosterCardVisual(t, blankMode, idx) {
  const d = t.design || TEMPLATES[0].design;
  const backdropUrl = resolveBackdropUrl(d.coverBackdrop || 'burgundy-roses');
  const sampleImg = EDITORIAL_SAMPLE_PHOTOS.album[idx % EDITORIAL_SAMPLE_PHOTOS.album.length];
  const namesHtml = blankMode ? 'Tên Chú Rể &amp; Cô Dâu' : 'Minh Quân &amp; Bảo Ngọc';
  const subDate = blankMode ? 'MẪU GIAO DIỆN THUẦN' : '20 . 12 . 2026';
  const isDarkTheme = (d.bgColor || '').startsWith('#1');
  const washBg = isDarkTheme
    ? 'linear-gradient(180deg, rgba(16,12,20,0.68) 0%, rgba(16,12,20,0.45) 55%, rgba(12,8,14,0.85) 100%)'
    : `linear-gradient(180deg, ${d.bgGradient1 || '#FFF9F0'}d9 0%, ${d.bgGradient2 || '#FAF0E1'}c2 52%, ${d.bgGradient3 || '#F2E4CE'}e6 100%)`;

  const photoEl = blankMode
    ? `<div style="width:100%;height:100%;background:rgba(255,252,247,0.84);backdrop-filter:blur(4px);display:flex;flex-direction:column;align-items:center;justify-content:center;color:${d.primaryColor};border:1px solid ${d.ornamentColor}55;padding:10px;">
         <span style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:12.5px;color:${d.ornamentColor};">DaiLo</span>
         <span style="font-size:8.5px;letter-spacing:1.4px;margin-top:4px;text-transform:uppercase;font-weight:600;">Khung Ảnh 3:4</span>
       </div>`
    : `<img src="${sampleImg}" alt="${escapeHtml(t.name)}" loading="lazy" />`;

  let bodyHtml = '';
  if (t.posterStyle === 'crest') {
    bodyHtml = `
      <div style="width:38px;height:38px;border-radius:50%;border:1px solid ${d.secondaryColor};display:flex;align-items:center;justify-content:center;color:${d.primaryColor};font-family:serif;font-size:18px;margin-top:12px;margin-bottom:6px;background:rgba(255,255,255,0.22);">囍</div>
      <div style="font-family:'${d.headingFont}',serif;font-size:17px;color:${d.primaryColor};line-height:1.2;">${namesHtml}</div>
      <div style="font-size:8.5px;letter-spacing:1.8px;color:${d.mutedColor};margin-top:3px;">${subDate}</div>
      <div class="poster-visual-photo is-arch" style="border:1.5px solid ${d.secondaryColor};">${photoEl}</div>
    `;
  } else if (t.posterStyle === 'polaroid') {
    bodyHtml = `
      <div style="font-size:8px;letter-spacing:2.4px;color:${d.mutedColor};text-transform:uppercase;margin-top:14px;">SAVE THE DATE</div>
      <div style="font-family:'${d.scriptFont}',cursive;font-size:20px;color:${d.primaryColor};margin-top:3px;">${namesHtml}</div>
      <div class="poster-visual-photo is-polaroid">${photoEl}</div>
    `;
  } else if (t.posterStyle === 'arch') {
    bodyHtml = `
      <div style="width:88%;padding:11px 10px 13px;border-radius:10px 10px 50% 50% / 10px 10px 16px 16px;background:${d.contrastBg || d.primaryColor};color:${d.contrastText || '#fff'};margin-top:10px;margin-bottom:8px;box-shadow:0 8px 18px rgba(0,0,0,0.18);">
        <div style="font-size:7.5px;letter-spacing:2px;opacity:0.8;">WEDDING INVITATION</div>
        <div style="font-family:'${d.headingFont}',serif;font-size:15.5px;margin-top:3px;">${namesHtml}</div>
      </div>
      <div class="poster-visual-photo is-arch" style="border:1.5px solid ${d.secondaryColor};">${photoEl}</div>
    `;
  } else {
    bodyHtml = `
      <div style="font-size:8px;letter-spacing:2.4px;color:${d.mutedColor};text-transform:uppercase;margin-top:14px;">SAVE THE DATE</div>
      <div class="poster-visual-photo" style="border:3px solid #ffffff;transform:rotate(2deg);">${photoEl}</div>
      <div style="width:84%;height:42px;margin-top:-24px;background:${d.contrastBg || d.primaryColor};border-radius:0 0 8px 8px;position:relative;z-index:2;display:flex;align-items:center;justify-content:center;box-shadow:0 8px 18px rgba(0,0,0,0.24);">
        <div style="width:24px;height:24px;">${getWaxSealSvg(d.ornamentStyle === 'song-hy' ? 'song-hy' : 'heart')}</div>
      </div>
      <div style="font-family:'${d.headingFont}',serif;font-size:16px;color:${d.primaryColor};margin-top:9px;">${namesHtml}</div>
    `;
  }

  return `
    ${backdropUrl ? `<div class="poster-bg-blur" style="background-image:url('${escapeHtml(backdropUrl)}');"></div>` : ''}
    <div class="poster-bg-wash" style="background:${washBg};"></div>
    <div class="poster-filigree-wrap" style="--inv-ornament:${d.ornamentColor};">${getCoverFiligreeFrameSvg(d.ornamentStyle)}</div>
    <div class="poster-inner-content">${bodyHtml}</div>
  `;
}

function renderTopAuthControls() {
  const u = storage.currentUser;
  if (!u) {
    return `
      <button type="button" class="btn btn-outline btn-sm btn-pill" data-open-booking-nav>Đặt Lịch Tư Vấn</button>
      <button type="button" class="btn btn-primary btn-sm btn-pill" data-open-auth="login">Đăng Nhập</button>
    `;
  }
  const initial = (u.name || u.email || 'U').trim().charAt(0).toUpperCase();
  if (u.role === 'admin') {
    return `
      <button type="button" class="btn btn-primary btn-sm btn-pill" data-go-admin-center>Trang Quản Lý</button>
      <button type="button" class="user-pill-btn" data-nav-logout title="Đăng xuất">
        <span class="user-avatar-dot">${escapeHtml(initial)}</span>
        <span>${escapeHtml(u.name || 'Quản Trị')}</span>
      </button>
    `;
  }
  return `
    <button type="button" class="btn btn-outline btn-sm btn-pill" data-open-booking-nav>Đặt Lịch</button>
    <button type="button" class="user-pill-btn" data-go-customer-account>
      <span class="user-avatar-dot">${escapeHtml(initial)}</span>
      <span>${escapeHtml(u.name || 'Tài Khoản')}</span>
    </button>
  `;
}

async function renderShowroom(initialBlank = true) {
  cleanupActive();
  publicStore = await storage.getPublicStore();
  const settings = publicStore.settings || {};
  const allTemplates = getLiveTemplates();
  const hotline = settings.hotline || '0354 248 177';
  const bankNo = settings.paymentAccountNo || '0354248177';
  const bankName = settings.paymentBankName || 'MB Bank — Ngân hàng Quân Đội';

  let activeFilter = 'Tất cả';
  let blankMode = initialBlank;

  const categories = ['Tất cả', 'Dùng thử 1–3 ngày', 'Cổ điển', 'Truyền thống', 'Hoàng gia', 'Thiên nhiên', 'Lãng mạn', 'Hiện đại', 'Vintage', 'Tối giản', 'Sang trọng'];
  const elements = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'];
  const heroPetalsHtml = Array.from({ length: 16 }, (_, i) =>
    `<span class="hero-css-petal" style="left:${(i * 6.5 + 2) % 98}%;animation-delay:${(i * 0.85) % 11}s;animation-duration:${9 + (i % 5) * 1.7}s;transform:scale(${0.7 + (i % 3) * 0.28});"></span>`
  ).join('');

  const draw = () => {
    const filtered = allTemplates.filter(t => {
      if (activeFilter === 'Tất cả') return true;
      if (activeFilter === 'Dùng thử 1–3 ngày') return Boolean(t.isTrialTemplate) || t.category === 'Dùng thử';
      if (elements.includes(activeFilter)) return (t.elements || []).includes(activeFilter);
      return t.category === activeFilter;
    });
    const quickQrUrl = buildOwnerVietQrUrl(settings, (settings.packages?.[1]?.price || 189000), 'DAT THIEP CUOI');

    document.title = `${settings.brandName || 'DaiLo Wedding'} — Thiết Kế Thiệp Cưới Online Cao Cấp`;
    appRoot.innerHTML = `
      <header class="top-nav">
        <div class="brand-mark" data-go-store>
          <div class="brand-monogram">DL</div>
          <div>
            <div class="brand-script-name">${escapeHtml(settings.brandName || 'DaiLo Wedding')}</div>
            <div class="brand-sub-status">
              <span class="status-dot ${storage.isCloudOnline() ? 'online' : 'local'}"></span>
              <span>Hotline / Zalo: ${escapeHtml(hotline)}</span>
            </div>
          </div>
        </div>
        <nav class="nav-center-links">
          <a href="#kho-mau">Bộ Sưu Tập Mẫu</a>
          <a href="#bang-gia">Bảng Giá</a>
          <a href="#thanh-toan-tu-van">Thanh Toán &amp; Tư Vấn</a>
        </nav>
        <div class="nav-actions">
          ${renderTopAuthControls()}
        </div>
      </header>

      <section class="store-hero">
        <div class="hero-bg-photo" style="background-image:url('${resolveBackdropUrl('ivory-floral-arch')}');"></div>
        <div class="hero-bg-veil"></div>
        <div class="hero-bokeh-orb" style="width:280px;height:280px;left:-60px;top:30px;"></div>
        <div class="hero-bokeh-orb" style="width:220px;height:220px;right:8%;bottom:-40px;animation-delay:2.2s;"></div>
        <div class="hero-petal-layer">${heroPetalsHtml}</div>

        <div class="store-hero-grid">
          <div>
            <span class="hero-kicker">THIẾT KẾ BIÊN TẬP • PHONG THỦY NGŨ HÀNH</span>
            <h1>Thiệp Cưới <span>Online</span> Chuẩn Thẩm Mỹ Studio</h1>
            <p class="hero-lead">${escapeHtml(settings.tagline || '')}</p>
            <div class="hero-cta-row">
              <a href="#kho-mau" class="btn btn-primary btn-pill" style="padding:12px 26px;">Khám Phá Kho Mẫu</a>
              <button type="button" class="btn btn-gold btn-pill" style="padding:12px 24px;" data-open-live-demo>Mở Thiệp Thực Tế</button>
              <button type="button" class="btn btn-outline btn-pill" style="padding:12px 22px;" data-open-booking-hero>Đặt Lịch Tư Vấn</button>
            </div>
            <div class="hero-pillars">
              <span>Mở bìa 3D &amp; Hoa rơi</span>
              <span>•</span>
              <span>Màu hợp Ngũ Hành</span>
              <span>•</span>
              <span>Thanh toán VietQR MB Bank</span>
            </div>
          </div>

          <div class="phone-cluster" aria-hidden="true">
            <div class="mockup-phone left">
              <div class="mockup-notch"></div>
              <div class="mockup-screen" style="background:url('${resolveBackdropUrl('emerald-garden')}') center/cover;color:#f5f2e9;">
                <div style="position:absolute;inset:0;background:rgba(22,54,38,0.68);backdrop-filter:blur(2px);"></div>
                <div style="position:relative;z-index:2;width:100%;display:flex;flex-direction:column;align-items:center;">
                  <div style="font-size:7.5px;letter-spacing:2.2px;opacity:0.85;">SONG HỶ LỤC BẢO</div>
                  <div style="font-family:'Cormorant Garamond',serif;font-size:17px;font-weight:600;margin:6px 0;">Hoàng Anh &amp; Khánh Linh</div>
                  <div style="width:82%;aspect-ratio:3/4;border-radius:100px 100px 8px 8px;overflow:hidden;border:1.5px solid #d4b97e;margin-top:6px;">
                    <img src="${EDITORIAL_SAMPLE_PHOTOS.album[1]}" alt="" style="width:100%;height:100%;object-fit:cover;" />
                  </div>
                </div>
              </div>
            </div>

            <div class="mockup-phone center">
              <div class="mockup-notch"></div>
              <div class="mockup-screen" style="background:url('${resolveBackdropUrl('burgundy-roses')}') center/cover;color:#fdf7f0;">
                <div style="position:absolute;inset:0;background:rgba(81,20,25,0.62);backdrop-filter:blur(2px);"></div>
                <div class="poster-filigree-wrap" style="--inv-ornament:#e2c07a;">${getCoverFiligreeFrameSvg('botanical-peony')}</div>
                <div style="position:relative;z-index:3;width:100%;display:flex;flex-direction:column;align-items:center;">
                  <div style="font-size:7.5px;letter-spacing:2.4px;opacity:0.9;">TRÂN TRỌNG KÍNH MỜI</div>
                  <div style="width:78%;aspect-ratio:3/4;background:#fff;padding:5px 5px 10px;border-radius:3px;box-shadow:0 12px 24px rgba(0,0,0,0.32);transform:rotate(2.5deg);margin-top:8px;">
                    <img src="${EDITORIAL_SAMPLE_PHOTOS.hero}" alt="" style="width:100%;height:100%;object-fit:cover;" />
                  </div>
                  <div style="width:84%;height:42px;margin-top:-20px;background:#511419;border-radius:0 0 8px 8px;display:flex;align-items:center;justify-content:center;position:relative;z-index:2;border-top:1px solid rgba(235,204,142,0.35);">
                    <div style="width:26px;height:26px;">${getWaxSealSvg('heart')}</div>
                  </div>
                  <div style="font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;margin-top:10px;">Minh Quân &amp; Bảo Ngọc</div>
                  <div style="font-size:9.5px;opacity:0.82;letter-spacing:1px;">20 THÁNG 12, 2026</div>
                </div>
              </div>
            </div>

            <div class="mockup-phone right">
              <div class="mockup-notch"></div>
              <div class="mockup-screen" style="background:url('${resolveBackdropUrl('sakura-blush')}') center/cover;color:#541f31;">
                <div style="position:absolute;inset:0;background:rgba(255,246,249,0.72);backdrop-filter:blur(2px);"></div>
                <div style="position:relative;z-index:2;width:100%;display:flex;flex-direction:column;align-items:center;">
                  <div style="font-size:7.5px;letter-spacing:2.2px;opacity:0.8;">HỒNG PHẤN SAKURA</div>
                  <div style="font-family:'Dancing Script',cursive;font-size:21px;margin:4px 0;">Tuấn Kiệt &amp; Thu Hà</div>
                  <div style="width:78%;aspect-ratio:3/4;background:#fff;padding:5px 5px 14px;transform:rotate(-2.5deg);box-shadow:0 10px 20px rgba(0,0,0,0.16);margin-top:6px;">
                    <img src="${EDITORIAL_SAMPLE_PHOTOS.album[2]}" alt="" style="width:100%;height:100%;object-fit:cover;" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main class="store-container" id="kho-mau">
        <div class="section-header-center" data-reveal>
          <h2>Bộ Sưu Tập Mẫu Thiệp Cưới</h2>
          <p>Hài lòng mẫu nào bấm Đặt &amp; QR để thanh toán ngay • Chưa ưng ý có thể chat trực tiếp hoặc đặt lịch thiết kế riêng</p>
        </div>

        <div class="filter-bar">
          <div class="filter-pills">
            ${categories.map(cat => `<button type="button" class="pill ${activeFilter === cat ? 'active' : ''}" data-filter="${cat}">${cat}</button>`).join('')}
            <span style="width:1px;height:18px;background:var(--ui-border);margin:0 4px;"></span>
            ${elements.map(el => `
              <button type="button" class="pill ${activeFilter === el ? 'active' : ''}" data-filter="${el}">
                <span class="status-dot" style="background:${NGU_HANH_DATA[el].swatch};"></span> Mệnh ${el}
              </button>
            `).join('')}
          </div>
          <label class="blank-switch ${blankMode ? 'active' : ''}">
            <input type="checkbox" id="store-blank-toggle" ${blankMode ? 'checked' : ''} style="accent-color:#c59a57;" />
            <span>Chế độ Mẫu Trống (0 ảnh cặp đôi, 0 tên)</span>
          </label>
        </div>

        <div class="poster-grid">
          ${filtered.map((t, idx) => {
            const isTrial = Boolean(t.isTrialTemplate);
            const tagCls = isTrial ? 'is-trial' : t.tag === 'Mới' ? 'is-new' : t.tag === 'VIP' ? 'is-vip' : '';
            const trialMaxPhotos = Number(t.trialDays || 1) <= 1 ? 3 : Number(t.trialDays) === 2 ? 5 : 6;
            return `
              <article class="poster-card" data-reveal>
                ${t.tag ? `<span class="poster-tag ${tagCls}">${escapeHtml(t.tag)}</span>` : ''}
                <div class="poster-canvas">
                  ${renderPosterCardVisual(t, blankMode, idx)}
                </div>
                <div class="poster-scrim">
                  <h4>${escapeHtml(t.name)}</h4>
                  <div class="poster-meta-line">
                    <span>${isTrial ? `Tối đa ${trialMaxPhotos} ảnh • Khóa QR` : escapeHtml(t.category)}</span>
                    <span>Hợp ${(t.elements || []).join(', ')}</span>
                  </div>
                  <div class="poster-btn-row">
                    <button type="button" class="poster-btn-view" data-preview-tpl="${escapeHtml(t.id)}">Xem mẫu</button>
                    <button type="button" class="poster-btn-order" data-customize-tpl="${escapeHtml(t.id)}">${isTrial ? `Dùng Thử ${t.trialDays || 1} Ngày` : 'Sửa &amp; Mua'}</button>
                  </div>
                </div>
              </article>
            `;
          }).join('')}
        </div>

        <section id="bang-gia" style="margin-top:80px;">
          <div class="section-header-center" data-reveal>
            <h2>Bảng Giá Gói Thiệp Cưới</h2>
            <p>Chia gói hợp lý theo đúng tính năng sử dụng — Giản lược gọn gàng giữa Vị trí bản đồ, Gửi lời chúc, Mã QR mừng cưới &amp; Xác nhận RSVP</p>
          </div>
          <div class="pricing-grid-4">
            ${(settings.packages || []).map((pkg, idx) => `
              <div class="price-card ${idx === 1 || idx === 2 ? 'featured' : ''}" data-reveal>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                  <h3 style="margin:0;font-size:17px;font-weight:700;">${escapeHtml(pkg.name)}</h3>
                  <span class="badge ${idx === 2 ? 'badge-gold' : idx === 1 ? 'badge-brand' : 'badge-trial'}">${escapeHtml(pkg.badge || '')}</span>
                </div>
                <div class="price-amount">${formatVnd(pkg.price)}</div>
                <div class="price-specs-strip">
                  ${pkg.photoLimit ? `<span class="price-spec-pill">${escapeHtml(pkg.photoLimit)}</span>` : ''}
                  ${pkg.duration ? `<span class="price-spec-pill">${escapeHtml(pkg.duration)}</span>` : ''}
                </div>
                <ul class="price-features">
                  ${(pkg.features || []).map(f => `<li><span class="diamond-bullet">◆</span> <span>${escapeHtml(f)}</span></li>`).join('')}
                  ${(pkg.excluded || []).map(ex => `<li style="color:var(--ui-muted);opacity:0.74;font-size:12px;"><span style="flex-shrink:0;">—</span> <span>${escapeHtml(ex)}</span></li>`).join('')}
                </ul>
                <button type="button" class="btn btn-pill ${idx === 1 || idx === 2 ? 'btn-primary' : 'btn-outline'}" data-order-pkg="${idx}">Chọn gói &amp; Thanh toán QR</button>
              </div>
            `).join('')}
          </div>
        </section>

        <section id="thanh-toan-tu-van" class="consult-cta-band" data-reveal>
          <div class="consult-cta-bg" style="background-image:url('${resolveBackdropUrl('burgundy-roses')}');"></div>
          <div>
            <span class="badge badge-gold" style="margin-bottom:12px;">HỖ TRỢ TRỰC TIẾP 1-1</span>
            <h2 style="font-family:'Philosopher',serif;font-size:clamp(26px,3.6vw,36px);margin:0 0 12px;line-height:1.22;">Hài lòng với mẫu chọn — hoặc đặt lịch thiết kế riêng?</h2>
            <p style="font-size:14px;line-height:1.7;opacity:0.86;margin:0 0 22px;">
              Quét mã <strong>VietQR MB Bank (${escapeHtml(bankNo)})</strong> bên cạnh nếu bạn đã ưng mẫu và gói dịch vụ.<br/>
              Hoặc bấm <strong>Chat Tư Vấn / Đặt Lịch Hẹn</strong> để tôi phối màu hợp mệnh và thiết kế riêng theo đúng ý bạn.
            </p>
            <div style="display:flex;gap:10px;flex-wrap:wrap;">
              <button type="button" class="btn btn-gold btn-pill" style="padding:11px 22px;" data-open-chat-band>Mở Khung Chat Tư Vấn</button>
              <button type="button" class="btn btn-primary btn-pill" style="padding:11px 22px;" data-open-booking-band>Đặt Lịch Tư Vấn 1-1</button>
              <a class="btn btn-outline btn-pill" style="background:rgba(255,255,255,0.1);color:#fff;border-color:rgba(255,255,255,0.28);" href="tel:${escapeHtml((settings.phoneRaw || '0354248177').replace(/\s+/g, ''))}">Gọi ${escapeHtml(hotline)}</a>
            </div>
          </div>

          <div class="qr-quick-panel">
            <div style="font-size:11px;font-weight:700;letter-spacing:1.4px;color:var(--ui-brand);text-transform:uppercase;margin-bottom:8px;">MÃ VIETQR ĐẶT THIỆP NHANH</div>
            <img src="${escapeHtml(quickQrUrl)}" alt="VietQR MB Bank ${escapeHtml(bankNo)}" style="width:196px;max-width:100%;border-radius:10px;border:1px solid #e6e0d6;padding:4px;background:#fff;display:block;margin:0 auto 10px;" />
            <div style="font-size:13px;font-weight:700;">${escapeHtml(bankName)}</div>
            <div style="font-size:14px;color:var(--ui-brand);font-weight:700;margin:2px 0;">STK: ${escapeHtml(bankNo)}</div>
            <div style="font-size:11.5px;color:var(--ui-muted);margin-bottom:10px;">Zalo / Hotline xác nhận: <strong>${escapeHtml(hotline)}</strong></div>
            <button type="button" class="btn btn-primary btn-sm" style="width:100%;" data-open-qr-band>Chọn đúng mẫu &amp; số tiền gói</button>
          </div>
        </section>
      </main>
    `;

    appRoot.querySelector('[data-open-auth]')?.addEventListener('click', () => openAuthModal('login'));
    appRoot.querySelector('[data-go-admin-center]')?.addEventListener('click', () => navigateTo({ role: 'admin' }));
    appRoot.querySelector('[data-go-customer-account]')?.addEventListener('click', () => navigateTo({ role: 'account' }));
    appRoot.querySelector('[data-nav-logout]')?.addEventListener('click', async () => { await storage.authLogout(); showToast('Đã đăng xuất', 'info'); route(); });
    appRoot.querySelectorAll('[data-open-booking-nav], [data-open-booking-hero], [data-open-booking-band]').forEach(b => b.addEventListener('click', () => openBookingModal(settings)));
    appRoot.querySelector('[data-open-live-demo]')?.addEventListener('click', () => navigateTo({ role: 'guest', id: 'baongoc-minhquan', guest: 'Quý Khách Danh Dự' }));
    appRoot.querySelectorAll('[data-filter]').forEach(btn => btn.addEventListener('click', () => { activeFilter = btn.dataset.filter; draw(); }));
    appRoot.querySelector('#store-blank-toggle')?.addEventListener('change', e => { blankMode = e.target.checked; draw(); });
    appRoot.querySelector('[data-open-chat-band]')?.addEventListener('click', () => openConsultationChat(settings));
    appRoot.querySelectorAll('[data-open-qr-band]').forEach(b => b.addEventListener('click', () => openPaymentQrModal({ pkgIdx: 1, settings })));
    appRoot.querySelectorAll('[data-order-tpl]').forEach(b => b.addEventListener('click', () => openPaymentQrModal({ templateId: b.dataset.orderTpl, pkgIdx: 1, settings })));
    appRoot.querySelectorAll('[data-customize-tpl]').forEach(b => b.addEventListener('click', () => startCustomerCustomizeTemplate(b.dataset.customizeTpl)));
    appRoot.querySelectorAll('[data-order-pkg]').forEach(b => b.addEventListener('click', () => openPaymentQrModal({ pkgIdx: Number(b.dataset.orderPkg), settings })));
    appRoot.querySelectorAll('[data-preview-tpl]').forEach(btn => {
      btn.addEventListener('click', () => {
        const tplId = btn.dataset.previewTpl;
        const tplObj = allTemplates.find(x => x.id === tplId);
        const demoInv = createInvitationFromTemplate(tplId);
        if (tplObj) demoInv.design = JSON.parse(JSON.stringify(tplObj.design));
        openTemplatePreviewModal(demoInv, tplObj?.name || 'Mẫu Thiệp', tplId, blankMode, settings);
      });
    });

    bindInteractiveTiltCards(appRoot);
    bindScrollStagger(appRoot);
    renderChatWidget(settings);
  };

  draw();
}

function openTemplatePreviewModal(demoInv, tplName, tplId, initialBlank, settings) {
  let isBlank = initialBlank;
  let isDesktop = false;
  openModal(`
    <div class="modal-head">
      <div>
        <h3>Xem mẫu: ${escapeHtml(tplName)}</h3>
        <small style="color:var(--ui-muted);">Trải nghiệm bìa ảnh mờ, mở bìa 3D, nhạc tự phát &amp; hoa rơi</small>
      </div>
      <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;">
        <button type="button" class="btn btn-outline btn-xs" id="modal-toggle-dev">Desktop</button>
        <button type="button" class="btn btn-xs ${isBlank ? 'btn-gold' : 'btn-outline'}" id="modal-toggle-blank">
          ${isBlank ? 'Đang bật Mẫu Trống' : 'Bật Mẫu Trống'}
        </button>
        <button type="button" class="btn btn-outline btn-xs" id="modal-replay-intro">Mở lại bìa</button>
        <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 16)}</button>
      </div>
    </div>
    <div class="modal-preview-wrap">
      <div class="preview-device-frame modal-preview-host" id="modal-inv-host"></div>
    </div>
    <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px;flex-wrap:wrap;">
      <button type="button" class="btn btn-outline btn-sm" id="modal-not-satisfied">Chưa hài lòng? Chat tư vấn thiết kế riêng</button>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button type="button" class="btn btn-gold btn-sm" id="modal-customize-now">Tự Sửa Ảnh &amp; Nội Dung Mẫu Này</button>
        <button type="button" class="btn btn-primary btn-sm" id="modal-order-qr">Quét QR Đặt Nhanh</button>
      </div>
    </div>
  `, { wide: true });

  const host = modalRoot.querySelector('#modal-inv-host');
  const renderer = new InvitationRenderer(host, {
    inPreview: true, blankMode: isBlank, skipIntro: false, brandName: settings.brandName || 'DaiLo Wedding', onToast: showToast,
  });
  renderer.render(demoInv);
  const destroyPreview = () => { renderer.destroy(); musicEngine.stop(); };

  modalRoot.querySelector('#modal-toggle-dev')?.addEventListener('click', e => {
    isDesktop = !isDesktop;
    host.classList.toggle('desktop-mode', isDesktop);
    e.currentTarget.textContent = isDesktop ? 'Mobile' : 'Desktop';
    setTimeout(() => renderer.particleCtrl?.resize(), 280);
  });
  modalRoot.querySelector('#modal-toggle-blank')?.addEventListener('click', e => {
    isBlank = !isBlank;
    e.currentTarget.classList.toggle('btn-gold', isBlank);
    e.currentTarget.classList.toggle('btn-outline', !isBlank);
    e.currentTarget.textContent = isBlank ? 'Đang bật Mẫu Trống' : 'Bật Mẫu Trống';
    renderer.render(demoInv, { blankMode: isBlank });
  });
  modalRoot.querySelector('#modal-replay-intro')?.addEventListener('click', () => renderer.replayIntro());
  modalRoot.querySelector('#modal-customize-now')?.addEventListener('click', () => { destroyPreview(); closeModal(); startCustomerCustomizeTemplate(tplId); });
  modalRoot.querySelector('#modal-order-qr')?.addEventListener('click', () => { destroyPreview(); closeModal(); openPaymentQrModal({ templateId: tplId, pkgIdx: 1, settings }); });
  modalRoot.querySelector('#modal-not-satisfied')?.addEventListener('click', () => { destroyPreview(); closeModal(); openConsultationChat(settings, `Tôi vừa xem mẫu "${tplName}" nhưng muốn chỉnh sửa thêm theo ý riêng.`); });
  modalRoot.querySelectorAll('[data-close-modal], [data-modal-bg]').forEach(el => {
    el.addEventListener('click', e => { if (el.hasAttribute('data-modal-bg') && e.target !== e.currentTarget) return; destroyPreview(); closeModal(); });
  });
}

/* ============================================================================
   TRANG TÀI KHOẢN KHÁCH HÀNG (LỊCH SỬ MUA, THIỆP CỦA TÔI, LỊCH HẸN)
   ============================================================================ */
async function renderCustomerAccountView() {
  cleanupActive();
  publicStore = publicStore || await storage.getPublicStore();
  const settings = publicStore.settings || {};
  if (!storage.currentUser) {
    await renderShowroom(true);
    openAuthModal('login', u => navigateTo({ role: u.role === 'admin' ? 'admin' : 'account' }));
    return;
  }
  if (storage.currentUser.role === 'admin') {
    navigateTo({ role: 'admin' });
    return;
  }

  let data;
  try {
    data = await storage.getCustomerPortalData();
  } catch (err) {
    showToast(err.message || 'Vui lòng đăng nhập lại', 'error');
    storage.clearSession();
    navigateTo({ view: 'store' });
    return;
  }

  const u = data.user;
  const liveTemplates = getLiveTemplates();
  const hasFb = Boolean(u.facebookId);
  const hasGoogle = Boolean(u.googleId);
  document.title = `Tài Khoản — ${settings.brandName || 'DaiLo Wedding'}`;
  appRoot.innerHTML = `
    <header class="top-nav">
      <div class="brand-mark" data-go-store>
        <div class="brand-monogram">DL</div>
        <div>
          <div class="brand-script-name">${escapeHtml(settings.brandName || 'DaiLo Wedding')}</div>
          <div class="brand-sub-status"><span>Tài Khoản Khách Hàng • ${escapeHtml(u.email || u.phone || u.name)}</span></div>
        </div>
      </div>
      <div class="nav-actions">
        <button type="button" class="btn btn-outline btn-sm" data-go-store>Xem Kho Mẫu</button>
        <button type="button" class="btn btn-primary btn-sm" data-acc-book>Đặt Lịch Tư Vấn</button>
        <button type="button" class="btn btn-ghost btn-sm" data-acc-logout>Đăng xuất</button>
      </div>
    </header>

    <main class="admin-wrap">
      <div class="panel-card" style="margin-bottom:20px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <div>
          <h2 style="margin:0 0 4px;font-family:'Philosopher',serif;font-size:24px;">Xin chào, ${escapeHtml(u.name)}</h2>
          <div style="font-size:13px;color:var(--ui-muted);display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
            <span>${escapeHtml(u.email || '')} ${u.phone ? '• SĐT: ' + escapeHtml(u.phone) : ''} • Kênh: ${(u.provider || 'gmail').toUpperCase()}</span>
            ${u.phoneVerified ? `<span class="badge badge-paid">SĐT đã xác thực OTP</span>` : ''}
            ${u.emailVerified ? `<span class="badge badge-paid">Gmail đã xác thực</span>` : ''}
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <a href="#chon-mau-tu-sua" class="btn btn-primary btn-sm">+ Chọn Mẫu Mới Tự Sửa &amp; Thanh Toán</a>
          <button type="button" class="btn btn-gold btn-sm" data-acc-qr>Thanh Toán Nhanh Qua VietQR</button>
        </div>
      </div>

      <div class="panel-card" style="margin-bottom:20px;">
        <div style="margin-bottom:12px;">
          <h3 style="margin:0 0 4px;font-size:16px;">Liên Kết Tài Khoản Facebook &amp; Google</h3>
          <small style="color:var(--ui-muted);">Liên kết Facebook hoặc Google với tài khoản hiện tại để đăng nhập 1 chạm mà vẫn giữ nguyên toàn bộ thiệp cưới và đơn hàng của bạn.</small>
        </div>
        <div class="social-link-grid">
          <div class="social-link-card ${hasFb ? 'is-linked' : ''}">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;">
              <div class="social-link-ico is-fb">${FACEBOOK_ICON_SVG}</div>
              <div style="min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <strong style="font-size:13.5px;">Facebook</strong>
                  <span class="badge ${hasFb ? 'badge-paid' : 'badge-trial'}">${hasFb ? 'Đã liên kết' : 'Chưa liên kết'}</span>
                </div>
                <div style="font-size:12px;color:var(--ui-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${hasFb ? escapeHtml(u.facebookName || u.facebookEmail || `ID: ${u.facebookId}`) : 'Kết nối để đăng nhập nhanh bằng tài khoản Facebook'}
                </div>
              </div>
            </div>
            <div style="flex-shrink:0;">
              ${hasFb
                ? `<button type="button" class="btn btn-outline btn-xs" data-unlink-social="facebook">Hủy liên kết</button>`
                : `<button type="button" class="btn btn-primary btn-xs" data-link-social="facebook">Liên kết Facebook</button>`}
            </div>
          </div>

          <div class="social-link-card ${hasGoogle ? 'is-linked' : ''}">
            <div style="display:flex;align-items:center;gap:10px;min-width:0;">
              <div class="social-link-ico is-google">${GOOGLE_ICON_SVG}</div>
              <div style="min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;">
                  <strong style="font-size:13.5px;">Google (Gmail)</strong>
                  <span class="badge ${hasGoogle ? 'badge-paid' : 'badge-trial'}">${hasGoogle ? 'Đã liên kết' : 'Chưa liên kết'}</span>
                </div>
                <div style="font-size:12px;color:var(--ui-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                  ${hasGoogle ? escapeHtml(u.googleEmail || u.googleName || u.email || 'Đã kết nối Google') : 'Kết nối để đăng nhập nhanh bằng tài khoản Google'}
                </div>
              </div>
            </div>
            <div style="flex-shrink:0;">
              ${hasGoogle
                ? `<button type="button" class="btn btn-outline btn-xs" data-unlink-social="google">Hủy liên kết</button>`
                : `<button type="button" class="btn btn-primary btn-xs" data-link-social="google">Liên kết Google</button>`}
            </div>
          </div>
        </div>
      </div>

      <div class="panel-card" style="margin-bottom:20px;">
        <h3 style="margin:0 0 6px;font-size:16px;">Thiệp Cưới Của Tôi (${data.invitations.length})</h3>
        <p style="font-size:12.5px;color:var(--ui-muted);margin:0 0 14px;">Bấm <strong>Sửa Ảnh &amp; Từng Phần</strong> để tự thay ảnh cưới, sửa chữ từng mục trên thiệp và bấm <strong>Thanh Toán Ngay</strong> để mở khóa link chia sẻ chính thức.</p>
        ${data.invitations.length === 0 ? `<p style="font-size:13px;color:var(--ui-muted);margin:0;">Bạn chưa tạo mẫu thiệp nào. Hãy chọn ngay 1 mẫu yêu thích bên dưới để tự tải ảnh, sửa nội dung và thanh toán trực tiếp!</p>` : `
          <div class="orders-table-wrap">
            <table class="data-table">
              <thead><tr><th>Thiệp &amp; Mẫu Đã Chọn</th><th>Gói Dịch Vụ</th><th>Trạng Thái</th><th>Thao Tác</th></tr></thead>
              <tbody>
                ${data.invitations.map(inv => {
                  const isPaid = inv.order?.status === 'paid';
                  const isSubmitted = !isPaid && Boolean(inv.order?.paymentSubmittedAt);
                  const ts = getTrialState(inv);
                  return `
                  <tr>
                    <td>
                      <strong>${escapeHtml(inv.title)}</strong>
                      <div style="font-size:12px;color:var(--ui-muted);">Mẫu: ${escapeHtml(inv.templateName || inv.templateId || 'Đã chọn')} • ${(inv.content?.gallery || []).length}${ts.active ? `/${ts.limits.maxPhotos}` : ''} ảnh Album</div>
                    </td>
                    <td>${escapeHtml(inv.order?.packageName || 'Gói Tiêu Chuẩn')} — <strong>${inv.order?.price ? formatVnd(inv.order?.price) : 'Miễn phí thử'}</strong></td>
                    <td>
                      <span class="badge ${isPaid ? 'badge-paid' : isSubmitted ? 'badge-deposit' : 'badge-trial'}">
                        ${isPaid ? 'Đã kích hoạt VIP' : isSubmitted ? 'Đang chờ duyệt CK' : ts.active ? `Dùng thử ${ts.days} ngày • ${ts.remainingText}` : 'Bản nháp — Chưa thanh toán'}
                      </span>
                    </td>
                    <td>
                      <div style="display:flex;gap:6px;flex-wrap:wrap;">
                        <a class="btn btn-primary btn-xs" href="${escapeHtml(buildAbsoluteUrl({ role: 'client', id: inv.id, token: inv.clientToken }))}">${ts.expired ? 'Xem &amp; Nâng Cấp' : 'Sửa Ảnh &amp; Từng Phần'}</a>
                        <a class="btn ${isPaid ? 'btn-outline' : 'btn-gold'} btn-xs" href="${escapeHtml(buildAbsoluteUrl({ role: 'checkout', id: inv.id, token: inv.clientToken }))}">${isPaid ? 'Nhận Sản Phẩm &amp; QR' : (ts.active ? 'Chuyển Tiền Mở Khóa' : 'Sang Trang Chuyển Tiền')}</a>
                        ${isPaid ? `<a class="btn btn-outline btn-xs" href="${escapeHtml(buildAbsoluteUrl({ role: 'guest', id: inv.id }))}" target="_blank">Xem Thiệp</a>` : ''}
                      </div>
                    </td>
                  </tr>
                `; }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <div class="panel-card" id="chon-mau-tu-sua" style="margin-bottom:20px;">
        <div style="margin-bottom:14px;">
          <h3 style="margin:0 0 4px;font-size:16px;">Chọn Mẫu Thiệp Để Tự Sửa Ảnh, Nội Dung &amp; Thanh Toán Luôn</h3>
          <small style="color:var(--ui-muted);">Chọn bất kỳ mẫu nào bên dưới — hệ thống mở ngay trình sửa ảnh cưới, ảnh nền mờ bìa, sửa nội dung từng mục và quét QR thanh toán trực tiếp</small>
        </div>
        <div class="poster-grid">
          ${liveTemplates.map((t, idx) => {
            const isTrial = Boolean(t.isTrialTemplate);
            return `
            <article class="poster-card">
              ${t.tag ? `<span class="poster-tag ${isTrial ? 'is-trial' : ''}">${escapeHtml(t.tag)}</span>` : ''}
              <div class="poster-canvas">
                ${renderPosterCardVisual(t, false, idx)}
              </div>
              <div class="poster-scrim">
                <h4>${escapeHtml(t.name)}</h4>
                <div class="poster-meta-line"><span>${escapeHtml(t.category)}</span><span>Hợp ${(t.elements || []).join(', ')}</span></div>
                <div class="poster-btn-row">
                  <button type="button" class="poster-btn-view" data-acc-preview="${escapeHtml(t.id)}">Xem thử</button>
                  <button type="button" class="poster-btn-order" data-acc-customize="${escapeHtml(t.id)}">${isTrial ? `Dùng Thử ${t.trialDays || 1} Ngày` : 'Chọn &amp; Sửa Ngay'}</button>
                </div>
              </div>
            </article>
          `; }).join('')}
        </div>
      </div>

      <div class="grid-2">
        <div class="panel-card">
          <h3 style="margin:0 0 12px;font-size:15.5px;">Lịch Sử Đặt Mua QR (${data.orders.length})</h3>
          ${data.orders.length === 0 ? `<p style="font-size:12.5px;color:var(--ui-muted);margin:0;">Chưa có lịch sử thanh toán QR.</p>` : data.orders.map(o => `
            <div style="padding:10px;border:1px solid var(--ui-border);border-radius:10px;margin-bottom:8px;font-size:12.5px;">
              <div style="display:flex;justify-content:space-between;"><strong>${escapeHtml(o.templateName)}</strong><strong style="color:var(--ui-success);">${formatVnd(o.amount)}</strong></div>
              <div style="color:var(--ui-muted);margin-top:3px;">${escapeHtml(o.packageName)} • Mã CK: <code>${escapeHtml(o.transferCode)}</code> • <span class="badge ${o.status === 'paid' || o.status === 'done' ? 'badge-paid' : 'badge-trial'}">${o.status === 'paid' || o.status === 'done' ? 'Đã xác nhận' : 'Chờ đối soát'}</span></div>
            </div>
          `).join('')}
        </div>

        <div class="panel-card">
          <h3 style="margin:0 0 12px;font-size:15.5px;">Lịch Hẹn Tư Vấn Của Tôi (${data.bookings.length})</h3>
          ${data.bookings.length === 0 ? `<p style="font-size:12.5px;color:var(--ui-muted);margin:0;">Bạn chưa đặt lịch tư vấn nào.</p>` : data.bookings.map(b => `
            <div style="padding:10px;border:1px solid var(--ui-border);border-radius:10px;margin-bottom:8px;font-size:12.5px;">
              <div style="display:flex;justify-content:space-between;"><strong>${escapeHtml(b.date)} — ${escapeHtml(b.timeSlot)}</strong><span class="badge badge-gold">${escapeHtml(b.status)}</span></div>
              <div style="color:var(--ui-muted);margin-top:3px;">${escapeHtml(b.service)} (${escapeHtml(b.channel)})</div>
            </div>
          `).join('')}
        </div>
      </div>
    </main>
  `;

  appRoot.querySelectorAll('[data-go-store]').forEach(b => b.addEventListener('click', () => navigateTo({ view: 'store' })));
  appRoot.querySelector('[data-acc-book]')?.addEventListener('click', () => openBookingModal(settings));
  appRoot.querySelector('[data-acc-qr]')?.addEventListener('click', () => openPaymentQrModal({ pkgIdx: 1, settings }));
  appRoot.querySelector('[data-acc-logout]')?.addEventListener('click', async () => { await storage.authLogout(); showToast('Đã đăng xuất', 'info'); navigateTo({ view: 'store' }); });
  appRoot.querySelector('[data-link-social="facebook"]')?.addEventListener('click', () => {
    runFacebookSocialFlow({ mode: 'link', onSuccess: () => renderCustomerAccountView() });
  });
  appRoot.querySelector('[data-link-social="google"]')?.addEventListener('click', () => {
    runGoogleSocialFlow({ mode: 'link', onSuccess: () => renderCustomerAccountView() });
  });
  appRoot.querySelectorAll('[data-unlink-social]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const prov = btn.dataset.unlinkSocial;
      const label = prov === 'facebook' ? 'Facebook' : 'Google';
      if (!confirm(`Xác nhận hủy liên kết tài khoản ${label}?`)) return;
      try {
        await storage.unlinkSocial(prov);
        showToast(`Đã hủy liên kết tài khoản ${label}`, 'info');
        renderCustomerAccountView();
      } catch (err) {
        showToast(err.message || `Không thể hủy liên kết ${label}`, 'error');
      }
    });
  });
  appRoot.querySelectorAll('[data-acc-customize]').forEach(b => b.addEventListener('click', () => startCustomerCustomizeTemplate(b.dataset.accCustomize)));
  appRoot.querySelectorAll('[data-acc-preview]').forEach(btn => {
    btn.addEventListener('click', () => {
      const tplId = btn.dataset.accPreview;
      const tplObj = liveTemplates.find(x => x.id === tplId);
      const demoInv = createInvitationFromTemplate(tplId);
      if (tplObj) demoInv.design = JSON.parse(JSON.stringify(tplObj.design));
      openTemplatePreviewModal(demoInv, tplObj?.name || 'Mẫu Thiệp', tplId, false, settings);
    });
  });
  renderChatWidget(settings);
}

/* ============================================================================
   TRANG QUẢN LÝ TOÀN DIỆN (CHỈ DÀNH CHO TÀI KHOẢN QUẢN LÝ lochoipes@gmail.com)
   ============================================================================ */
async function renderAdminRoute(initialTab = 'history') {
  cleanupActive();
  hideChatWidget();
  if (!storage.currentUser || storage.currentUser.role !== 'admin') {
    await renderShowroom(true);
    openAuthModal('login', u => {
      if (u.role === 'admin') navigateTo({ role: 'admin' });
      else showToast('Tài khoản này là tài khoản Khách Hàng, không có quyền Quản Lý', 'error');
    });
    return;
  }

  try {
    adminDb = await storage.getAdminDb();
  } catch (err) {
    storage.clearSession();
    showToast(err.message || 'Phiên quản trị hết hạn, vui lòng đăng nhập lại', 'error');
    await renderShowroom(true);
    openAuthModal('login');
    return;
  }

  const center = new AdminManagementCenter(appRoot, {
    db: adminDb,
    user: storage.currentUser,
    initialTab,
    renderPosterCardVisual,
    openShareLinksModal,
    openModal,
    closeModal,
    showToast,
    onOpenInvitationEditor: invId => openAdminStudioEditor(invId),
    onOpenTemplateEditor: tplId => openAdminTemplateVisualEditor(tplId),
    onNavigateStore: () => navigateTo({ view: 'store' }),
    onLogout: async () => { await storage.authLogout(); showToast('Đã đăng xuất quản trị', 'info'); navigateTo({ view: 'store' }); },
  });
  activeInstance = center;
  center.mount();
}

function openAdminStudioEditor(invId) {
  cleanupActive();
  hideChatWidget();
  const inv = (adminDb.invitations || []).find(i => i.id === invId);
  if (!inv) { renderAdminRoute('history'); return; }

  const editor = new StudioEditor(appRoot, {
    mode: 'admin',
    invitation: inv,
    customTemplates: adminDb.templates || TEMPLATES,
    settings: adminDb.settings || {},
    onToast: showToast,
    onBack: () => renderAdminRoute('history'),
    onOpenShareModal: (currentInv, m) => openShareLinksModal(currentInv, m),
    onSave: async updated => {
      const idx = adminDb.invitations.findIndex(i => i.id === updated.id);
      if (idx !== -1) adminDb.invitations[idx] = updated;
      else adminDb.invitations.unshift(updated);
      await storage.saveAdminDb(adminDb);
    },
    onSaveAsTemplate: async newTpl => {
      adminDb.templates = adminDb.templates || [];
      adminDb.templates.unshift(newTpl);
      await storage.saveAdminDb(adminDb);
      showToast(`Đã lưu "${newTpl.name}" vào Kho Mẫu Showroom`, 'success');
    },
  });
  activeInstance = editor;
  editor.mount();
}

/**
 * Mở Trình Thiết Kế 3 Cột để SỬA TRỰC QUAN bất kỳ Mẫu Thiệp nào trong Kho Mẫu!
 */
function openAdminTemplateVisualEditor(tplId) {
  cleanupActive();
  hideChatWidget();
  const tpl = (adminDb.templates || []).find(t => t.id === tplId);
  if (!tpl) { renderAdminRoute('templates'); return; }

  const tempInv = createInvitationFromTemplate(tpl.id, { title: tpl.name });
  tempInv.design = JSON.parse(JSON.stringify(tpl.design));

  const editor = new StudioEditor(appRoot, {
    mode: 'admin',
    isTemplateEditor: true,
    invitation: tempInv,
    customTemplates: adminDb.templates || TEMPLATES,
    settings: adminDb.settings || {},
    onToast: showToast,
    onBack: () => renderAdminRoute('templates'),
    onSave: async updated => {
      const idx = adminDb.templates.findIndex(t => t.id === tpl.id);
      if (idx !== -1) {
        adminDb.templates[idx].name = updated.title || adminDb.templates[idx].name;
        adminDb.templates[idx].design = JSON.parse(JSON.stringify(updated.design));
      }
      await storage.saveAdminDb(adminDb);
    },
  });
  activeInstance = editor;
  editor.mount();
}

/* ============================================================================
   CỔNG 2 (CLIENT LINK) & CỔNG 3 (GUEST PUBLIC INVITATION)
   ============================================================================ */
async function renderClientPortal(invId, token, initialTab = '') {
  cleanupActive();
  hideChatWidget();
  try {
    const res = await storage.getInvitation(invId, 'client', token);
    const editor = new StudioEditor(appRoot, {
      mode: 'client',
      initialTab: initialTab || 'content',
      invitation: res.invitation,
      customTemplates: res.templates || getLiveTemplates(),
      settings: res.settings || {},
      clientToken: token || res.invitation?.clientToken || '',
      currentUser: storage.currentUser,
      onToast: showToast,
      onBack: () => {
        if (storage.currentUser?.role === 'admin') navigateTo({ role: 'admin' });
        else if (storage.currentUser) navigateTo({ role: 'account' });
        else navigateTo({ view: 'store' });
      },
      onOpenShareModal: currentInv => openShareLinksModal(currentInv, 'client'),
      onSave: async updated => {
        await storage.clientUpdateInvitation(invId, token || res.invitation?.clientToken || '', {
          title: updated.title,
          content: updated.content,
          sections: updated.sections,
          guestForm: updated.guestForm,
          guests: updated.guests,
          wishes: updated.wishes,
          music: updated.music,
          templateId: updated.templateId,
          coverDesign: {
            coverBackdrop: updated.design?.coverBackdrop,
            coverBlur: updated.design?.coverBlur,
            coverOverlay: updated.design?.coverOverlay,
          },
        });
      },
      onGoCheckoutPage: (_inv, pkgIdx) => {
        const params = { role: 'checkout', id: invId, token: token || res.invitation?.clientToken || '' };
        if (Number.isFinite(Number(pkgIdx))) params.pkg = Number(pkgIdx);
        navigateTo(params);
      },
    });
    activeInstance = editor;
    editor.mount();
  } catch (err) {
    appRoot.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;"><div class="panel-card" style="max-width:440px;text-align:center;"><h2>Không Thể Mở Trang Chỉnh Sửa Khách Hàng</h2><p style="color:var(--ui-muted);">${escapeHtml(err.message || '')}</p><button type="button" class="btn btn-primary" data-go-home>Về Trang Chủ</button></div></div>`;
    appRoot.querySelector('[data-go-home]')?.addEventListener('click', () => navigateTo({ view: 'store' }));
  }
}

/* ============================================================================
   TRANG THANH TOÁN VIETQR TRỰC TIẾP -> TỰ ĐỘNG CHUYỂN TRANG BÀN GIAO THIỆP
   (?role=checkout&id=...&token=... HOẶC ?role=checkout&tpl=...&pkg=...)
   ============================================================================ */
async function renderCheckoutPage(invId = '', token = '', { tplId = '', pkgIdx = null, payCode = '' } = {}) {
  cleanupActive();
  hideChatWidget();

  let inv = null;
  let settings = {};
  let allTemplates = getLiveTemplates();
  let activePayment = null;
  let effectiveToken = token || '';
  let pollTimer = null;
  let countdownTimer = null;
  let visibilityHandler = null;
  let focusHandler = null;
  let checkingStatus = false;
  let redirected = false;

  const stopTimers = () => {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
    if (visibilityHandler) { document.removeEventListener('visibilitychange', visibilityHandler); visibilityHandler = null; }
    if (focusHandler) { window.removeEventListener('focus', focusHandler); focusHandler = null; }
  };
  activeInstance = { destroy: stopTimers };

  try {
    const storeData = await storage.getPublicStore();
    publicStore = storeData;
    settings = storeData.settings || {};
    if (Array.isArray(storeData.templates) && storeData.templates.length) {
      allTemplates = storeData.templates;
    }
  } catch (_) {}

  if (payCode) {
    try {
      const st = await storage.getPaymentStatus(payCode);
      if (st?.payment) {
        activePayment = st.payment;
        invId = st.invitationId || invId;
        if (st.clientToken) effectiveToken = st.clientToken;
        if (st.status === 'paid' && invId) {
          stopTimers();
          navigateTo({ role: 'handover', id: invId, token: effectiveToken || activePayment.clientToken || '' });
          return;
        }
      }
    } catch (_) {}
  }

  if (invId) {
    try {
      const res = await storage.getInvitation(invId, 'client', effectiveToken);
      inv = res.invitation;
      settings = { ...settings, ...(res.settings || {}) };
      effectiveToken = effectiveToken || inv.clientToken || '';
      if (inv.order?.status === 'paid') {
        stopTimers();
        navigateTo({ role: 'handover', id: inv.id, token: effectiveToken });
        return;
      }
    } catch (err) {
      if (!tplId) {
        appRoot.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;"><div class="panel-card" style="max-width:440px;text-align:center;"><h2>Không Thể Mở Trang Thanh Toán</h2><p style="color:var(--ui-muted);">${escapeHtml(err.message || '')}</p><button type="button" class="btn btn-primary" data-go-home>Về Trang Chủ</button></div></div>`;
        appRoot.querySelector('[data-go-home]')?.addEventListener('click', () => navigateTo({ view: 'store' }));
        return;
      }
    }
  }

  const pkgs = settings.packages || [];
  const bankNo = String(settings.paymentAccountNo || '0354248177').replace(/\s+/g, '');
  const bankName = settings.paymentBankName || 'MB Bank — Ngân hàng Quân Đội';
  const hotline = settings.hotline || '0354 248 177';
  const zaloUrl = settings.zaloUrl || 'https://zalo.me/0354248177';

  let selectedTplId = inv?.templateId || tplId || allTemplates[0]?.id || 'nhung-do-co-dien';
  const explicitPkg = pkgIdx !== null && pkgIdx !== undefined && pkgIdx !== '' && Number.isFinite(Number(pkgIdx)) ? Number(pkgIdx) : -1;
  const matchedPkg = inv ? pkgs.findIndex(p => p.name === inv.order?.packageName) : -1;
  let selectedPkgIdx = explicitPkg >= 0
    ? Math.min(Math.max(0, explicitPkg), Math.max(0, pkgs.length - 1))
    : (matchedPkg >= 0 ? matchedPkg : Math.min(1, Math.max(0, pkgs.length - 1)));
  let custName = activePayment?.name || inv?.order?.customerName || storage.currentUser?.name || '';
  let custPhone = sanitizePhoneDigits(activePayment?.phone || inv?.order?.customerPhone || storage.currentUser?.phone || '');
  let custNote = activePayment?.note || '';

  const formatCountdown = (expiresAtIso) => {
    const remainSec = Math.max(0, Math.floor((Date.parse(expiresAtIso || '') - Date.now()) / 1000));
    const mm = String(Math.floor(remainSec / 60)).padStart(2, '0');
    const ss = String(remainSec % 60).padStart(2, '0');
    return { remainSec, text: `${mm}:${ss}` };
  };

  const triggerHandoverRedirect = (targetInvId, targetToken) => {
    if (redirected) return;
    redirected = true;
    stopTimers();
    const banner = appRoot.querySelector('#qr-live-status-banner');
    if (banner) {
      banner.style.background = '#e8f7ee';
      banner.style.borderColor = '#4caf50';
      banner.style.color = '#1b5e20';
      banner.innerHTML = '<strong>Đã nhận thanh toán từ MB Bank!</strong> Đang tự động chuyển sang Trang Bàn Giao Thiệp...';
    }
    showToast('Đã nhận thanh toán thành công! Đang chuyển sang Trang Bàn Giao Thiệp...', 'success');
    setTimeout(() => {
      navigateTo({ role: 'handover', id: targetInvId, token: targetToken || '' });
    }, 900);
  };

  const startQrPolling = () => {
    stopTimers();
    if (!activePayment?.code) return;

    const updateTimerText = () => {
      const el = appRoot.querySelector('#qr-countdown-text');
      if (!el || !activePayment?.expiresAt) return;
      const cd = formatCountdown(activePayment.expiresAt);
      el.textContent = cd.remainSec > 0 ? cd.text : 'Hết hạn';
    };
    updateTimerText();
    countdownTimer = setInterval(updateTimerText, 1000);

    const checkNow = async () => {
      if (!activePayment?.code || redirected || checkingStatus) return;
      checkingStatus = true;
      try {
        const st = await storage.getPaymentStatus(activePayment.code);
        if (st.status === 'paid') {
          triggerHandoverRedirect(st.invitationId || activePayment.invitationId, st.clientToken || activePayment.clientToken || effectiveToken);
        } else if (st.payment?.underpaidAmount) {
          const b = appRoot.querySelector('#qr-live-status-banner');
          if (b) {
            b.style.background = '#fff8e1';
            b.style.borderColor = '#f59e0b';
            b.style.color = '#92400e';
            b.innerHTML = `Đã ghi nhận chuyển khoản ${formatVnd(st.payment.underpaidAmount)} (chưa đủ ${formatVnd(activePayment.amount)}). Vui lòng chuyển đủ phần còn thiếu hoặc liên hệ Zalo ${escapeHtml(hotline)}.`;
          }
        } else if (st.status === 'expired') {
          const b = appRoot.querySelector('#qr-live-status-banner');
          if (b) {
            b.style.background = '#fff5f5';
            b.style.borderColor = '#e5a3a3';
            b.style.color = '#8a1c28';
            b.innerHTML = '<strong>Mã QR đã hết hiệu lực 15 phút.</strong> Nếu bạn chưa chuyển khoản, hãy bấm "Tạo Mã QR Mới" bên dưới. Nếu bạn vừa chuyển tiền, hệ thống vẫn đang tiếp tục kiểm tra tự động.';
          }
        }
      } catch (_) {
      } finally {
        checkingStatus = false;
      }
    };

    checkNow();
    pollTimer = setInterval(checkNow, 2500);
    visibilityHandler = () => {
      if (document.visibilityState === 'visible') checkNow();
    };
    focusHandler = () => { checkNow(); };
    document.addEventListener('visibilitychange', visibilityHandler);
    window.addEventListener('focus', focusHandler);
  };

  const draw = () => {
    const curPkg = pkgs[selectedPkgIdx] || pkgs[0] || { id: 'pkg_standard', name: 'Gói Tiêu Chuẩn', price: 189000, photoLimit: '20 ảnh HD', duration: 'Đầy đủ lời chúc & QR' };
    const selectedTpl = allTemplates.find(t => t.id === selectedTplId) || allTemplates[0];
    const editUrl = inv ? buildAbsoluteUrl({ role: 'client', id: inv.id, token: effectiveToken }) : '';
    const isQrStep = Boolean(activePayment && activePayment.code);

    document.title = isQrStep
      ? `Quét Mã QR Thanh Toán ${activePayment.code} — ${settings.brandName || 'DaiLo Wedding'}`
      : `Thanh Toán Trực Tiếp — ${settings.brandName || 'DaiLo Wedding'}`;

    appRoot.innerHTML = `
      <header class="top-nav">
        <div class="brand-mark" data-co-home>
          <div class="brand-monogram">DL</div>
          <div>
            <div class="brand-script-name">${escapeHtml(settings.brandName || 'DaiLo Wedding')}</div>
            <div class="brand-sub-status"><span>${isQrStep ? 'Quét Mã QR VietQR — Tự Động Chuyển Trang Bàn Giao' : 'Thanh Toán Tự Động Không Cần Chờ Duyệt'}</span></div>
          </div>
        </div>
        <div class="nav-actions">
          ${editUrl
            ? `<a class="btn btn-outline btn-sm" href="${escapeHtml(editUrl)}">${icon('arrowLeft', 13)} Quay Lại Sửa Mẫu</a>`
            : `<button type="button" class="btn btn-outline btn-sm" data-co-home>${icon('arrowLeft', 13)} Kho Mẫu</button>`}
          ${storage.currentUser ? `<button type="button" class="btn btn-ghost btn-sm" data-co-account>Tài Khoản</button>` : ''}
        </div>
      </header>

      <main class="admin-wrap" style="max-width:${isQrStep ? '780px' : '980px'};">
        <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;flex-wrap:wrap;font-size:12px;">
          <span class="badge ${isQrStep ? 'badge-paid' : 'badge-brand'}" style="padding:6px 12px;">1. Chọn Gói &amp; Thông Tin</span>
          <span style="color:var(--ui-muted);">→</span>
          <span class="badge ${isQrStep ? 'badge-brand' : 'badge-trial'}" style="padding:6px 12px;">2. Quét Mã QR MB Bank</span>
          <span style="color:var(--ui-muted);">→</span>
          <span class="badge badge-trial" style="padding:6px 12px;">3. Tự Động Bàn Giao Thiệp</span>
        </div>

        ${isQrStep ? (() => {
          const qrSettings = {
            paymentBankCode: activePayment.bankCode || settings.paymentBankCode || 'MB',
            paymentAccountNo: activePayment.accountNo || bankNo,
            paymentAccountName: activePayment.accountName || settings.paymentAccountName || '',
          };
          const payQrUrl = buildOwnerVietQrUrl(qrSettings, activePayment.amount, activePayment.code);
          const cd = formatCountdown(activePayment.expiresAt);
          return `
            <div class="panel-card" style="padding:24px;border-color:rgba(143,29,50,0.22);">
              <div style="text-align:center;margin-bottom:18px;">
                <span class="badge badge-brand" style="padding:5px 12px;margin-bottom:8px;">CHUYỂN KHOẢN VIETQR — TỰ ĐỘNG BÀN GIAO THIỆP</span>
                <h1 style="font-family:'Philosopher',serif;font-size:clamp(22px,3.6vw,30px);margin:4px 0 6px;">Quét Mã QR Để Thanh Toán</h1>
                <p style="margin:0;font-size:13px;color:var(--ui-muted);">Mở ứng dụng Ngân hàng bất kỳ để quét mã bên dưới. Khi chuyển khoản thành công, trang sẽ <strong>tự động chuyển thẳng sang Trang Bàn Giao Thiệp</strong> (không cần bấm nút xác nhận).</p>
              </div>

              <div id="qr-live-status-banner" style="display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;padding:12px 14px;border-radius:12px;background:#f4faf6;border:1px solid #c2e5ce;color:#1b5e20;font-size:12.5px;margin-bottom:18px;">
                <div style="display:flex;align-items:center;gap:8px;">
                  <span class="chat-pulse-dot"></span>
                  <span><strong>Đang tự động chờ MB Bank báo nhận tiền...</strong> (tự động cập nhật liên tục)</span>
                </div>
                <span style="font-weight:700;font-variant-numeric:tabular-nums;">Hiệu lực: <span id="qr-countdown-text">${escapeHtml(cd.text)}</span></span>
              </div>

              <div class="qr-modal-grid" style="align-items:center;gap:20px;">
                <div class="qr-card-frame" style="padding:18px;text-align:center;">
                  <div style="font-size:11px;letter-spacing:1.6px;text-transform:uppercase;color:var(--ui-brand);font-weight:700;margin-bottom:10px;">VIETQR 24/7 — ${escapeHtml(activePayment.bankCode || 'MB')} BANK</div>
                  <img id="live-pay-qr-img" src="${escapeHtml(payQrUrl)}" alt="VietQR ${escapeHtml(activePayment.accountNo)}" style="width:250px;max-width:100%;border-radius:12px;border:1px solid var(--ui-border);padding:8px;background:#fff;display:block;margin:0 auto 12px;" />
                  <a class="btn btn-outline btn-xs" href="${escapeHtml(payQrUrl)}" target="_blank" download="vietqr-${escapeHtml(activePayment.code)}.png">Tải Ảnh Mã QR Để Quét Trong App Ngân Hàng</a>
                </div>

                <div style="display:flex;flex-direction:column;gap:10px;">
                  <div style="padding:14px;border-radius:12px;background:var(--ui-surface-soft);border:1px solid var(--ui-border);font-size:13px;line-height:1.85;">
                    <div style="display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed var(--ui-border);padding-bottom:6px;margin-bottom:6px;">
                      <span style="color:var(--ui-muted);">Ngân hàng</span>
                      <strong>${escapeHtml(activePayment.bankName || bankName)}</strong>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px dashed var(--ui-border);padding-bottom:6px;margin-bottom:6px;">
                      <span style="color:var(--ui-muted);">Số tài khoản</span>
                      <span style="display:flex;align-items:center;gap:6px;">
                        <strong style="font-size:16px;color:var(--ui-brand);">${escapeHtml(activePayment.accountNo || bankNo)}</strong>
                        <button type="button" class="btn btn-outline btn-xs" data-copy-val="${escapeHtml(activePayment.accountNo || bankNo)}">Chép</button>
                      </span>
                    </div>
                    ${activePayment.accountName ? `
                      <div style="display:flex;justify-content:space-between;gap:8px;border-bottom:1px dashed var(--ui-border);padding-bottom:6px;margin-bottom:6px;">
                        <span style="color:var(--ui-muted);">Chủ tài khoản</span>
                        <strong>${escapeHtml(activePayment.accountName)}</strong>
                      </div>
                    ` : ''}
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;border-bottom:1px dashed var(--ui-border);padding-bottom:6px;margin-bottom:6px;">
                      <span style="color:var(--ui-muted);">Số tiền chính xác</span>
                      <span style="display:flex;align-items:center;gap:6px;">
                        <strong style="font-size:18px;color:var(--ui-success);">${formatVnd(activePayment.amount)}</strong>
                        <button type="button" class="btn btn-outline btn-xs" data-copy-val="${escapeHtml(String(activePayment.amount))}">Chép</button>
                      </span>
                    </div>
                    <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                      <span style="color:var(--ui-muted);">Nội dung CK (bắt buộc)</span>
                      <span style="display:flex;align-items:center;gap:6px;">
                        <strong style="font-size:15px;letter-spacing:0.6px;color:var(--ui-text);background:#fff3cd;padding:2px 8px;border-radius:6px;">${escapeHtml(activePayment.code)}</strong>
                        <button type="button" class="btn btn-primary btn-xs" data-copy-val="${escapeHtml(activePayment.code)}">Chép</button>
                      </span>
                    </div>
                  </div>

                  <div style="font-size:12px;color:var(--ui-muted);padding:10px 12px;border-radius:10px;background:#fff;border:1px solid var(--ui-border);line-height:1.55;">
                    <div><strong>Đơn hàng:</strong> ${escapeHtml(activePayment.templateName || inv?.title || '')} — <strong>${escapeHtml(activePayment.packageName)}</strong></div>
                    <div><strong>Khách hàng:</strong> ${escapeHtml(activePayment.name)} • SĐT: <strong>${escapeHtml(activePayment.phone)}</strong></div>
                  </div>

                  <div style="display:flex;flex-direction:column;gap:8px;margin-top:2px;">
                    <div style="font-size:12px;color:#1b5e20;background:#eef8f1;border:1px solid #c2e5ce;border-radius:10px;padding:11px 13px;line-height:1.55;">
                      <strong>Tự động nhận tiền &amp; chuyển trang bàn giao:</strong> Chỉ cần chuyển đúng số tiền và nội dung <code>${escapeHtml(activePayment.code)}</code>. Giữ nguyên trang này (hoặc quay lại sau khi chuyển trên app ngân hàng), hệ thống sẽ tự động mở khóa thiệp sau 3–5 giây mà không cần bấm xác nhận.
                    </div>

                    <div style="display:flex;gap:8px;">
                      <button type="button" class="btn btn-ghost btn-sm" id="btn-change-pkg-step" style="flex:1;">Đổi Gói / Tạo Mã QR Mới</button>
                      <a class="btn btn-outline btn-sm" style="flex:1;" href="${escapeHtml(zaloUrl)}" target="_blank" rel="noopener">Hỗ trợ Zalo ${escapeHtml(hotline)}</a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        })() : `
          <div class="qr-modal-grid" style="align-items:start;">
            <div style="display:flex;flex-direction:column;gap:14px;">
              ${inv ? `
                <div class="panel-card">
                  <div style="display:flex;gap:14px;align-items:center;">
                    ${inv.content?.heroPhoto
                      ? `<img src="${escapeHtml(storage.resolveMediaUrl(inv.content.heroPhoto))}" alt="Ảnh bìa" style="width:68px;height:88px;object-fit:cover;border-radius:10px;border:1px solid var(--ui-border);" />`
                      : `<div style="width:68px;height:88px;border-radius:10px;background:var(--ui-brand-soft);display:flex;align-items:center;justify-content:center;font-weight:700;color:var(--ui-brand);font-size:12px;">MẪU</div>`}
                    <div style="flex:1;">
                      <span class="badge badge-gold" style="margin-bottom:4px;">Mẫu bạn đã thiết kế</span>
                      <h2 style="margin:2px 0 4px;font-family:'Philosopher',serif;font-size:20px;">${escapeHtml(inv.title)}</h2>
                      <div style="font-size:12.5px;color:var(--ui-muted);">Giao diện: <strong>${escapeHtml(inv.templateName || inv.templateId)}</strong></div>
                    </div>
                  </div>
                </div>
              ` : `
                <div class="panel-card">
                  <h3 style="margin:0 0 10px;font-size:15.5px;">1. Chọn Mẫu Thiệp Cưới</h3>
                  <select class="select" id="co-tpl-select">
                    ${allTemplates.map(t => `<option value="${escapeHtml(t.id)}" ${t.id === selectedTplId ? 'selected' : ''}>${escapeHtml(t.name)} (${escapeHtml(t.category || 'Studio')})</option>`).join('')}
                  </select>
                </div>
              `}

              <div class="panel-card">
                <h3 style="margin:0 0 12px;font-size:15.5px;">${inv ? '1.' : '2.'} Chọn Gói Kích Hoạt Thiệp</h3>
                <div style="display:grid;gap:9px;">
                  ${pkgs.map((p, idx) => `
                    <div class="palette-option" data-co-pkg="${idx}" style="margin:0;${idx === selectedPkgIdx ? 'border-color:var(--ui-brand);background:var(--ui-brand-soft);' : ''}">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <strong style="font-size:13.5px;">${escapeHtml(p.name)}</strong>
                        <strong style="font-size:15px;color:var(--ui-brand);">${formatVnd(p.price)}</strong>
                      </div>
                      <div style="font-size:12px;color:var(--ui-muted);margin-top:3px;">${escapeHtml(p.photoLimit || '')} • ${escapeHtml(p.duration || '')}</div>
                      ${Array.isArray(p.tags) && p.tags.length ? `<div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;">${p.tags.map(tg => `<span style="font-size:10.5px;padding:2px 8px;border-radius:999px;background:#fff;border:1px solid var(--ui-border);color:var(--ui-text);">${escapeHtml(tg)}</span>`).join('')}</div>` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>

            <div class="panel-card" style="padding:22px;">
              <h3 style="margin:0 0 12px;font-size:16px;">Thông Tin Nhận &amp; Bàn Giao Thiệp</h3>
              <form id="co-create-qr-form" novalidate>
                <div class="form-group">
                  <label>Họ và tên của bạn *</label>
                  <input class="input" id="co-page-name" required value="${escapeHtml(custName)}" placeholder="VD: Minh Quân" autocomplete="name" />
                </div>
                <div class="form-group">
                  <label>Số điện thoại / Zalo (bắt buộc đủ 10 số) *</label>
                  <input class="input" id="co-page-phone" type="tel" inputmode="numeric" pattern="0(3[2-9]|5[25689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}" maxlength="10" data-numeric-phone required value="${escapeHtml(custPhone)}" placeholder="VD: 0912345678" autocomplete="tel" />
                  <small id="co-phone-hint" style="display:block;margin-top:4px;font-size:11.5px;color:var(--ui-muted);">Bắt buộc đủ 10 số Việt Nam (03x, 05x, 07x, 08x, 09x)</small>
                </div>
                <div class="form-group">
                  <label>Ghi chú thêm (tùy chọn)</label>
                  <input class="input" id="co-page-note" value="${escapeHtml(custNote)}" placeholder="VD: Ngày cưới 20/12..." />
                </div>

                <div style="padding:12px 14px;border-radius:10px;background:var(--ui-surface-soft);border:1px solid var(--ui-border);font-size:13px;margin-bottom:14px;line-height:1.7;">
                  <div style="display:flex;justify-content:space-between;"><span>Mẫu thiệp:</span><strong>${escapeHtml(inv?.title || selectedTpl?.name || '')}</strong></div>
                  <div style="display:flex;justify-content:space-between;"><span>Gói đã chọn:</span><strong>${escapeHtml(curPkg.name)}</strong></div>
                  <div style="display:flex;justify-content:space-between;"><span>Tổng thanh toán:</span><strong style="color:var(--ui-brand);font-size:16px;">${formatVnd(curPkg.price)}</strong></div>
                  <div style="font-size:11.5px;color:var(--ui-muted);margin-top:4px;">Bấm <strong>Thanh Toán Ngay</strong> để hiển thị mã QR <strong>${escapeHtml(bankName)} (${escapeHtml(bankNo)})</strong> — chuyển khoản xong hệ thống tự động mở trang bàn giao thiệp.</div>
                </div>

                <button type="submit" id="btn-create-qr-order" class="btn btn-primary" style="width:100%;padding:13px;font-size:14.5px;margin-bottom:10px;">Thanh Toán Ngay</button>
                <a class="btn btn-outline btn-sm" style="width:100%;" href="${escapeHtml(zaloUrl)}" target="_blank" rel="noopener">Cần tư vấn trước? Nhắn Zalo ${escapeHtml(hotline)}</a>
              </form>
            </div>
          </div>
        `}
      </main>
    `;

    appRoot.querySelectorAll('[data-co-home]').forEach(b => b.addEventListener('click', () => { stopTimers(); navigateTo({ view: 'store' }); }));
    appRoot.querySelector('[data-co-account]')?.addEventListener('click', () => { stopTimers(); navigateTo({ role: 'account' }); });
    appRoot.querySelectorAll('[data-copy-val]').forEach(btn => {
      btn.addEventListener('click', () => navigator.clipboard?.writeText(btn.dataset.copyVal).then(() => showToast(`Đã sao chép: ${btn.dataset.copyVal}`, 'success')));
    });

    if (isQrStep) {
      startQrPolling();
      appRoot.querySelector('#btn-change-pkg-step')?.addEventListener('click', () => {
        stopTimers();
        activePayment = null;
        draw();
      });
      return;
    }

    // Step 1 listeners
    bindNumericPhoneInputs(appRoot);
    appRoot.querySelector('#co-tpl-select')?.addEventListener('change', e => { selectedTplId = e.target.value; draw(); });
    appRoot.querySelectorAll('[data-co-pkg]').forEach(el => {
      el.addEventListener('click', () => { selectedPkgIdx = Number(el.dataset.coPkg); draw(); });
    });
    appRoot.querySelector('#co-page-name')?.addEventListener('input', e => { custName = e.target.value; });
    appRoot.querySelector('#co-page-note')?.addEventListener('input', e => { custNote = e.target.value; });

    const phoneInp = appRoot.querySelector('#co-page-phone');
    const phoneHint = appRoot.querySelector('#co-phone-hint');
    const updateCoPhoneHint = (showEmpty = false) => {
      if (!phoneInp || !phoneHint) return;
      const v = phoneInp.value.trim();
      if (!v && !showEmpty) {
        phoneInp.style.borderColor = '';
        phoneHint.style.color = 'var(--ui-muted)';
        phoneHint.textContent = 'Bắt buộc đủ 10 số Việt Nam (03x, 05x, 07x, 08x, 09x)';
        return;
      }
      const ck = validateVnPhone10(v);
      phoneInp.style.borderColor = ck.ok ? 'var(--ui-success)' : 'var(--ui-danger, #c62828)';
      phoneHint.style.color = ck.ok ? 'var(--ui-success)' : 'var(--ui-danger, #c62828)';
      phoneHint.textContent = ck.ok ? `Số điện thoại hợp lệ (10/10 số: ${ck.digits})` : ck.error;
    };
    phoneInp?.addEventListener('input', e => {
      custPhone = sanitizePhoneDigits(e.target.value);
      e.target.value = custPhone;
      updateCoPhoneHint(false);
    });
    if (custPhone) updateCoPhoneHint(false);

    appRoot.querySelector('#co-create-qr-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      if (!custName.trim()) {
        showToast('Vui lòng nhập Họ và tên để nhận thiệp', 'error');
        appRoot.querySelector('#co-page-name')?.focus();
        return;
      }
      const ck = validateVnPhone10(custPhone);
      if (!ck.ok) {
        updateCoPhoneHint(true);
        showToast(ck.error, 'error');
        phoneInp?.focus();
        return;
      }
      const btn = appRoot.querySelector('#btn-create-qr-order');
      if (btn) { btn.disabled = true; btn.textContent = 'Đang tạo mã QR thanh toán...'; }
      try {
        const tplObj = allTemplates.find(t => t.id === selectedTplId) || allTemplates[0];
        const draftInit = !inv && tplObj ? createInvitationFromTemplate(tplObj.id, { customerName: custName.trim(), customerPhone: ck.digits, packageName: curPkg.name, price: curPkg.price }) : null;
        if (draftInit && tplObj?.design) draftInit.design = JSON.parse(JSON.stringify(tplObj.design));
        const created = await storage.createPaymentOrder({
          invitationId: inv?.id || '',
          templateId: inv?.templateId || selectedTplId,
          templateName: inv?.templateName || tplObj?.name || '',
          title: inv?.title || `Thiệp Cưới — ${custName.trim()}`,
          design: draftInit?.design,
          sections: draftInit?.sections,
          content: draftInit?.content,
          music: draftInit?.music,
          guestForm: draftInit?.guestForm,
          packageId: curPkg.id || '',
          packageName: curPkg.name,
          amount: Number(curPkg.price || 189000),
          name: custName.trim(),
          phone: ck.digits,
          email: storage.currentUser?.email || inv?.order?.customerEmail || '',
          note: custNote.trim(),
        }, { clientToken: effectiveToken });

        activePayment = created.payment;
        invId = created.invitationId || invId;
        effectiveToken = created.clientToken || effectiveToken;

        const nextUrl = buildAbsoluteUrl({ role: 'checkout', id: invId, token: effectiveToken, pay: activePayment.code });
        window.history.replaceState({}, '', nextUrl);
        draw();
      } catch (err) {
        showToast(err.message || 'Không tạo được trang mã QR thanh toán', 'error');
        if (btn) { btn.disabled = false; btn.textContent = 'Thanh Toán Ngay'; }
      }
    });
  };

  draw();
}

/* ============================================================================
   TRANG BÀN GIAO THIỆP CHÍNH THỨC (?role=handover&id=...&token=...)
   ============================================================================ */
async function renderHandoverPage(invId, token) {
  cleanupActive();
  hideChatWidget();
  let res;
  try {
    res = await storage.getInvitation(invId, 'client', token);
  } catch (err) {
    appRoot.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;"><div class="panel-card" style="max-width:440px;text-align:center;"><h2>Không Tìm Thấy Thiệp Bàn Giao</h2><p style="color:var(--ui-muted);">${escapeHtml(err.message || '')}</p><button type="button" class="btn btn-primary" data-go-home>Về Trang Chủ</button></div></div>`;
    appRoot.querySelector('[data-go-home]')?.addEventListener('click', () => navigateTo({ view: 'store' }));
    return;
  }

  const inv = res.invitation;
  const settings = res.settings || {};
  const effectiveToken = token || inv.clientToken || '';
  const hotline = settings.hotline || '0354 248 177';
  const zaloUrl = settings.zaloUrl || 'https://zalo.me/0354248177';

  if (inv.order?.status !== 'paid') {
    navigateTo({ role: 'checkout', id: inv.id, token: effectiveToken });
    return;
  }

  const guestUrl = buildAbsoluteUrl({ role: 'guest', id: inv.id });
  const editUrl = buildAbsoluteUrl({ role: 'client', id: inv.id, token: effectiveToken });
  const guestsTabUrl = buildAbsoluteUrl({ role: 'client', id: inv.id, token: effectiveToken, tab: 'guests' });
  const inviteQrImg = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=8&data=${encodeURIComponent(guestUrl)}`;
  const paidTime = inv.order?.paidAt ? new Date(inv.order.paidAt).toLocaleString('vi-VN') : new Date().toLocaleString('vi-VN');

  document.title = `Bàn Giao Thiệp Cưới — ${inv.title || settings.brandName || 'DaiLo Wedding'}`;

  appRoot.innerHTML = `
    <header class="top-nav">
      <div class="brand-mark" data-ho-home>
        <div class="brand-monogram">DL</div>
        <div>
          <div class="brand-script-name">${escapeHtml(settings.brandName || 'DaiLo Wedding')}</div>
          <div class="brand-sub-status"><span class="status-dot online"></span><span>Trang Bàn Giao Thiệp Cưới Chính Thức</span></div>
        </div>
      </div>
      <div class="nav-actions">
        <a class="btn btn-outline btn-sm" href="${escapeHtml(editUrl)}">Tùy Chỉnh Nội Dung &amp; Ảnh</a>
        ${storage.currentUser ? `<button type="button" class="btn btn-ghost btn-sm" data-ho-account>Tài Khoản</button>` : ''}
      </div>
    </header>

    <main class="admin-wrap" style="max-width:980px;">
      <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:20px;flex-wrap:wrap;font-size:12px;">
        <span class="badge badge-paid" style="padding:6px 12px;">1. Chọn Gói &amp; Thông Tin</span>
        <span style="color:var(--ui-muted);">→</span>
        <span class="badge badge-paid" style="padding:6px 12px;">2. Đã Thanh Toán VietQR</span>
        <span style="color:var(--ui-muted);">→</span>
        <span class="badge badge-paid" style="padding:6px 12px;">3. Bàn Giao Thiệp Hoàn Tất</span>
      </div>

      <div class="panel-card" style="border-color:#b7e2c8;background:linear-gradient(180deg,#f1fbf5,#ffffff);margin-bottom:20px;text-align:center;padding:28px 22px;">
        <span class="badge badge-paid" style="padding:6px 14px;font-size:12px;margin-bottom:10px;">THANH TOÁN THÀNH CÔNG — ĐÃ TỰ ĐỘNG BÀN GIAO THIỆP</span>
        <h1 style="font-family:'Philosopher',serif;font-size:clamp(24px,3.8vw,34px);color:var(--ui-text);margin:6px 0 8px;">Thiệp Cưới Của Bạn Đã Sẵn Sàng!</h1>
        <p style="font-size:14px;color:var(--ui-muted);max-width:620px;margin:0 auto 20px;line-height:1.65;">
          Mẫu thiệp <strong>${escapeHtml(inv.title)}</strong> (${escapeHtml(inv.order?.packageName || '')}) đã được mở khóa tự động ngay sau khi thanh toán. Bạn có thể gửi link thiệp cho khách mời hoặc chỉnh sửa thêm ảnh &amp; lời mời ngay bên dưới.
        </p>
        <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
          <a class="btn btn-primary btn-pill" style="padding:11px 24px;" href="${escapeHtml(guestUrl)}" target="_blank" rel="noopener">Mở Xem Thiệp Cưới Hoàn Chỉnh</a>
          <button type="button" class="btn btn-gold btn-pill" style="padding:11px 22px;" data-copy-val="${escapeHtml(guestUrl)}">Sao Chép Link Gửi Khách Mời</button>
          <a class="btn btn-outline btn-pill" style="padding:11px 20px;" href="${escapeHtml(guestsTabUrl)}">Tạo Link Mang Tên Từng Khách</a>
        </div>
      </div>

      <div class="grid-2" style="gap:18px;">
        <div class="panel-card">
          <h3 style="margin:0 0 12px;font-size:16px;">Bộ Sản Phẩm Bàn Giao</h3>
          <div style="margin-bottom:14px;">
            <div style="font-size:12px;font-weight:700;color:var(--ui-brand);margin-bottom:5px;">1. Link Thiệp Chính Thức (Gửi Khách / Zalo / Facebook)</div>
            <div class="link-box">
              <code>${escapeHtml(guestUrl)}</code>
              <button type="button" class="btn btn-primary btn-xs" data-copy-val="${escapeHtml(guestUrl)}">Sao chép</button>
            </div>
          </div>
          <div style="margin-bottom:14px;">
            <div style="font-size:12px;font-weight:700;color:var(--ui-text);margin-bottom:5px;">2. Link Chỉnh Sửa Riêng Của Cô Dâu &amp; Chú Rể (Hãy lưu lại)</div>
            <div class="link-box">
              <code>${escapeHtml(editUrl)}</code>
              <button type="button" class="btn btn-outline btn-xs" data-copy-val="${escapeHtml(editUrl)}">Sao chép</button>
            </div>
          </div>
          <div style="padding:13px;border-radius:10px;background:var(--ui-surface-soft);border:1px solid var(--ui-border);font-size:12.5px;line-height:1.75;">
            <div><strong>Biên lai thanh toán tự động</strong></div>
            <div>Gói kích hoạt: <strong>${escapeHtml(inv.order?.packageName || '')}</strong> — <strong style="color:var(--ui-success);">${formatVnd(inv.order?.price || 0)}</strong></div>
            <div>Mã giao dịch: <code>${escapeHtml(inv.order?.transferCode || '')}</code></div>
            ${inv.order?.bankRef ? `<div>Mã tham chiếu ngân hàng: <code>${escapeHtml(inv.order.bankRef)}</code> (${escapeHtml(inv.order?.paymentGateway || 'MB Bank')})</div>` : ''}
            <div>Thời gian bàn giao: <strong>${escapeHtml(paidTime)}</strong></div>
            <div>Khách hàng: ${escapeHtml(inv.order?.customerName || '')} (${escapeHtml(inv.order?.customerPhone || '')})</div>
          </div>
          <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
            <a class="btn btn-primary btn-sm" href="${escapeHtml(editUrl)}">Chỉnh Sửa Nội Dung, Ảnh &amp; Nhạc</a>
            <a class="btn btn-outline btn-sm" href="${escapeHtml(zaloUrl)}" target="_blank" rel="noopener">Hỗ trợ Zalo ${escapeHtml(hotline)}</a>
          </div>
        </div>

        <div class="panel-card" style="text-align:center;">
          <h3 style="margin:0 0 6px;font-size:16px;">Mã QR Thiệp Cưới Của Bạn</h3>
          <p style="font-size:12.5px;color:var(--ui-muted);margin:0 0 14px;">Lưu mã QR này để in lên thiệp giấy hoặc gửi trực tiếp cho khách mời quét mở thiệp online ngay:</p>
          <img src="${escapeHtml(inviteQrImg)}" alt="Mã QR Thiệp Cưới" style="width:220px;height:220px;border-radius:12px;border:1px solid var(--ui-border);padding:8px;background:#fff;display:block;margin:0 auto 12px;" />
          <div style="font-family:'Philosopher',serif;font-size:18px;font-weight:700;color:var(--ui-brand);">${escapeHtml(inv.content?.groomName || '')} &amp; ${escapeHtml(inv.content?.brideName || '')}</div>
          <div style="font-size:12px;color:var(--ui-muted);margin-bottom:14px;">Ngày cưới: ${escapeHtml(inv.content?.weddingDate || '')}</div>
          <a class="btn btn-outline btn-sm" href="${escapeHtml(inviteQrImg)}" target="_blank" download="qr-thiep-cuoi.png">Tải / Lưu Ảnh Mã QR Thiệp</a>
        </div>
      </div>
    </main>
  `;

  appRoot.querySelector('[data-ho-home]')?.addEventListener('click', () => navigateTo({ view: 'store' }));
  appRoot.querySelector('[data-ho-account]')?.addEventListener('click', () => navigateTo({ role: 'account' }));
  appRoot.querySelectorAll('[data-copy-val]').forEach(btn => {
    btn.addEventListener('click', () => navigator.clipboard?.writeText(btn.dataset.copyVal).then(() => showToast('Đã sao chép vào bộ nhớ tạm', 'success')));
  });
}

async function renderGuestView(invId, guestName, blankMode) {
  cleanupActive();
  hideChatWidget();
  try {
    const res = await storage.getInvitation(invId, 'guest', '', { blank: blankMode });
    const inv = res.invitation;
    document.title = blankMode ? `Xem Mẫu — ${res.settings?.brandName || 'DaiLo Wedding'}` : `Thiệp Cưới ${inv.content?.groomName || ''} & ${inv.content?.brideName || ''}`;
    const renderer = new InvitationRenderer(appRoot, {
      inPreview: false, editable: false, blankMode, guestName, skipIntro: false,
      brandName: res.settings?.brandName || 'DaiLo Wedding', onToast: showToast,
      onGuestSubmit: async payload => await storage.guestSubmit(invId, payload),
    });
    activeInstance = renderer;
    renderer.render(inv);
  } catch (err) {
    const isPaymentLocked = Boolean(err?.paymentRequired);
    appRoot.innerHTML = `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;"><div class="panel-card" style="max-width:440px;text-align:center;"><h2>${isPaymentLocked ? 'Thiệp Cưới Chưa Được Kích Hoạt' : 'Không Tìm Thấy Thiệp Cưới'}</h2><p style="color:var(--ui-muted);">${escapeHtml(err.message || '')}</p><div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">${isPaymentLocked ? '<button type="button" class="btn btn-gold" data-go-account>Đăng Nhập &amp; Thanh Toán</button>' : ''}<button type="button" class="btn btn-primary" data-go-home>Xem Kho Mẫu</button></div></div></div>`;
    appRoot.querySelector('[data-go-home]')?.addEventListener('click', () => navigateTo({ view: 'store' }));
    appRoot.querySelector('[data-go-account]')?.addEventListener('click', () => navigateTo({ role: 'account' }));
  }
}

async function route() {
  const sp = new URLSearchParams(window.location.search);
  const role = sp.get('role') || '';
  const id = sp.get('id') || '';
  const token = sp.get('token') || '';
  const tab = sp.get('tab') || '';
  const guest = sp.get('guest') || '';
  const blank = sp.get('blank') === '1';

  if (role === 'admin') { await renderAdminRoute(); return; }
  if (role === 'account') { await renderCustomerAccountView(); return; }
  if (role === 'handover' && id) { await renderHandoverPage(id, token); return; }
  if (role === 'checkout') {
    await renderCheckoutPage(id, token, {
      tplId: sp.get('tpl') || '',
      pkgIdx: sp.has('pkg') ? Number(sp.get('pkg')) : null,
      payCode: sp.get('pay') || '',
    });
    return;
  }
  if (role === 'client' && id) { await renderClientPortal(id, token, tab); return; }
  if (role === 'guest' && id) { await renderGuestView(id, guest, blank); return; }
  await renderShowroom(sp.has('blank') ? blank : true);
}

window.addEventListener('popstate', route);

(async function boot() {
  initGlobalWebFx();
  storage.onCloudReady = async () => {
    try {
      publicStore = await storage.getPublicStore();
      document.querySelectorAll('.brand-sub-status .status-dot.local').forEach(dot => {
        dot.classList.remove('local');
        dot.classList.add('online');
      });
      if (chatOpen) {
        currentChatThread = await storage.getChatThread();
        renderChatWidget(publicStore?.settings || {});
      }
    } catch (_) {}
  };
  await storage.detectBackend();
  const sp = new URLSearchParams(window.location.search);
  const oauthToken = sp.get('oauth_token');
  const oauthProvider = sp.get('oauth_provider') || '';
  const oauthLinked = sp.get('oauth_linked') || '';
  const oauthError = sp.get('oauth_error');
  if (oauthToken) {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('oauth_token');
    cleanUrl.searchParams.delete('oauth_provider');
    window.history.replaceState({}, '', cleanUrl.toString());
    const user = await storage.completeOAuthToken(oauthToken);
    if (user) {
      showToast(`Đăng nhập ${oauthProvider === 'facebook' ? 'Facebook' : 'Google'} thành công! Chào mừng ${user.name}`, 'success');
    } else {
      showToast('Không thể hoàn tất phiên đăng nhập mạng xã hội. Vui lòng thử lại.', 'error');
    }
  } else if (oauthLinked) {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('oauth_linked');
    window.history.replaceState({}, '', cleanUrl.toString());
    await storage.verifySession();
    showToast(`Đã liên kết tài khoản ${oauthLinked === 'facebook' ? 'Facebook' : 'Google'} thành công!`, 'success');
  } else if (oauthError) {
    const cleanUrl = new URL(window.location.href);
    cleanUrl.searchParams.delete('oauth_error');
    window.history.replaceState({}, '', cleanUrl.toString());
    showToast(oauthError, 'error');
  }
  await route();
})();
