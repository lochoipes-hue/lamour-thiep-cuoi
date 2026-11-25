/**
 * L'Amour Atelier — Trang Quản Lý Toàn Diện (Admin Management Center)
 * Gồm đầy đủ 7 phân hệ đồng bộ thẩm mỹ với trang chính:
 *  1. Lịch Sử Đã Mua & Quản Lý Thiệp Khách Hàng (kèm xuất Excel doanh thu)
 *  2. Quản Lý Đặt Lịch Tư Vấn (Booking Scheduler)
 *  3. Sửa, Xóa, Thêm Mẫu Thiệp (Full CRUD + Mở Trình Thiết Kế Trực Quan)
 *  4. Khung Chat Trực Tiếp 2 Chiều (2-Pane Live Inbox + Trả Lời Nhanh)
 *  5. Quản Lý Chat Bot Tự Động & Câu Chat Nhanh
 *  6. Quản Lý Tài Khoản Khách Hàng (Gmail / SĐT / Facebook)
 *  7. Cấu Hình Thương Hiệu, MB Bank VietQR & 4 Gói Dịch Vụ
 */

import {
  TEMPLATES,
  VIET_BANKS,
  createInvitationFromTemplate,
} from './data.js?v=14';
import { COVER_BACKDROPS } from './artwork.js?v=14';
import { DEFAULT_CHATBOT_CONFIG } from './chatbot.js?v=14';
import { storage, sanitizeVnPhone10, validateVnPhone10 } from './storage.js?v=14';
import { escapeHtml } from './renderer.js?v=14';
import { buildAbsoluteUrl } from './studio.js?v=14';
import { icon } from './icons.js?v=14';

function formatVnd(n) {
  return Number(n || 0).toLocaleString('vi-VN') + 'đ';
}

function formatDateTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const p = n => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())} ${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

export class AdminManagementCenter {
  constructor(root, ctx) {
    this.root = root;
    this.db = ctx.db;
    this.user = ctx.user;
    this.renderPosterCardVisual = ctx.renderPosterCardVisual;
    this.openShareLinksModal = ctx.openShareLinksModal;
    this.openModal = ctx.openModal;
    this.closeModal = ctx.closeModal;
    this.showToast = ctx.showToast;
    this.onOpenInvitationEditor = ctx.onOpenInvitationEditor;
    this.onOpenTemplateEditor = ctx.onOpenTemplateEditor;
    this.onNavigateStore = ctx.onNavigateStore;
    this.onLogout = ctx.onLogout;

    this.activeTab = ctx.initialTab || 'history';
    this.selectedThreadId = (this.db.chatThreads || [])[0]?.id || '';
    this.orderFilter = 'all';
    this.orderSearch = '';
    this.bookingFilter = 'all';
    this.pollTimer = null;
    this.unsubSync = null;
    this.lastThreadsSignature = JSON.stringify(this.db.chatThreads || []);
  }

  ensureCollections() {
    if (!Array.isArray(this.db.templates) || !this.db.templates.length) {
      this.db.templates = JSON.parse(JSON.stringify(TEMPLATES));
    }
    if (!Array.isArray(this.db.bookings)) this.db.bookings = [];
    if (!Array.isArray(this.db.chatThreads)) this.db.chatThreads = [];
    if (!Array.isArray(this.db.consultations)) this.db.consultations = [];
    if (!this.db.chatbotConfig) this.db.chatbotConfig = JSON.parse(JSON.stringify(DEFAULT_CHATBOT_CONFIG));
  }

  getOrderedThreads() {
    const list = [...(this.db.chatThreads || [])];
    list.sort((a, b) => {
      const waitDiff = (b.waitingForAdmin ? 1 : 0) - (a.waitingForAdmin ? 1 : 0);
      if (waitDiff !== 0) return waitDiff;
      const unreadDiff = (Number(b.unreadByAdmin || 0) > 0 ? 1 : 0) - (Number(a.unreadByAdmin || 0) > 0 ? 1 : 0);
      if (unreadDiff !== 0) return unreadDiff;
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
    });
    return list;
  }

  async persist(msg = '') {
    await storage.saveAdminDb(this.db);
    this.lastThreadsSignature = JSON.stringify(this.db.chatThreads || []);
    if (msg) this.showToast(msg, 'success');
  }

  mount() {
    this.ensureCollections();
    this.lastThreadsSignature = JSON.stringify(this.db.chatThreads || []);
    this.lastBookingsSignature = JSON.stringify(this.db.bookings || []);
    this.stopPolling();
    this.renderShell();
    this.startPolling();
  }

  updateLiveChatBadges() {
    const threads = this.db.chatThreads || [];
    const bookings = this.db.bookings || [];
    const unreadChats = threads.reduce((s, t) => s + Number(t.unreadByAdmin || 0), 0);
    const waitingCount = threads.filter(t => t.waitingForAdmin).length;
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;

    const badgeEl = this.root.querySelector('[data-side-chat-badge]');
    if (badgeEl) {
      badgeEl.textContent = unreadChats > 0 ? String(unreadChats) : '';
      badgeEl.style.display = unreadChats > 0 ? 'inline-block' : 'none';
    }
    const statEl = this.root.querySelector('[data-stat-chat]');
    if (statEl) {
      statEl.textContent = waitingCount > 0
        ? `${waitingCount} chờ trực tiếp / ${threads.length} khách`
        : `${unreadChats} chưa đọc / ${threads.length} khách`;
    }
    const bkBadgeEl = this.root.querySelector('[data-side-booking-badge]');
    if (bkBadgeEl) {
      bkBadgeEl.textContent = pendingBookings > 0 ? String(pendingBookings) : '';
      bkBadgeEl.style.display = pendingBookings > 0 ? 'inline-block' : 'none';
    }
    const bkStatEl = this.root.querySelector('[data-stat-booking]');
    if (bkStatEl) {
      bkStatEl.textContent = `${pendingBookings} chờ / ${bookings.length} tổng`;
    }
  }

  async syncLiveChat(notifyOnNew = true) {
    try {
      const fresh = await storage.getAdminDb();
      const nextThreads = fresh.chatThreads || [];
      const nextBookings = fresh.bookings || [];
      const nextThreadsSig = JSON.stringify(nextThreads);
      const nextBookingsSig = JSON.stringify(nextBookings);

      const threadsChanged = nextThreadsSig !== this.lastThreadsSignature;
      const bookingsChanged = nextBookingsSig !== this.lastBookingsSignature;
      if (!threadsChanged && !bookingsChanged) return;

      if (bookingsChanged) {
        const prevBookingIds = new Set((this.db.bookings || []).map(b => b.id));
        const newlyAdded = nextBookings.filter(b => !prevBookingIds.has(b.id));
        this.db.bookings = nextBookings;
        if (Array.isArray(fresh.consultations)) this.db.consultations = fresh.consultations;
        this.lastBookingsSignature = nextBookingsSig;
        if (notifyOnNew && newlyAdded.length > 0) {
          this.showToast(`Yêu cầu tư vấn mới từ ${newlyAdded[0].name || 'Khách'} (${newlyAdded[0].phone || ''})!`, 'info');
        }
        if (this.activeTab === 'bookings') {
          this.renderBookingsModule();
        }
      }

      if (threadsChanged) {
        const prevUnread = (this.db.chatThreads || []).reduce((s, t) => s + Number(t.unreadByAdmin || 0), 0);
        const nextUnread = nextThreads.reduce((s, t) => s + Number(t.unreadByAdmin || 0), 0);
        const nextWaiting = nextThreads.filter(t => t.waitingForAdmin);

        this.db.chatThreads = nextThreads;
        this.lastThreadsSignature = nextThreadsSig;

        if (notifyOnNew && nextUnread > prevUnread) {
          if (nextWaiting.length > 0) {
            this.showToast(`Khách ${nextWaiting[0].customerName || ''} (${nextWaiting[0].customerPhone || ''}) đang CHỜ nhắn trực tiếp!`, 'info');
          } else {
            this.showToast('Có tin nhắn mới từ khách hàng trong Khung Chat Trực Tiếp', 'info');
          }
        }

        if (this.activeTab === 'livechat') {
          const inp = this.root.querySelector('#admin-reply-input');
          const draft = inp ? inp.value : '';
          const wasFocused = inp && document.activeElement === inp;
          if (!draft && nextWaiting.length > 0 && !nextThreads.find(t => t.id === this.selectedThreadId)?.waitingForAdmin) {
            this.selectedThreadId = nextWaiting[0].id;
          }
          this.renderLiveChatContent();
          if (draft || wasFocused) {
            const nextInp = this.root.querySelector('#admin-reply-input');
            if (nextInp) {
              nextInp.value = draft;
              if (wasFocused) {
                nextInp.focus();
                nextInp.setSelectionRange(draft.length, draft.length);
              }
            }
          }
        }
      }

      this.updateLiveChatBadges();
    } catch (_) {}
  }

  startPolling() {
    this.stopPolling();
    this.unsubSync = storage.subscribeSync(() => this.syncLiveChat(true));
    this.pollTimer = setInterval(() => this.syncLiveChat(true), 2500);
  }

  stopPolling() {
    if (this.pollTimer) { clearInterval(this.pollTimer); this.pollTimer = null; }
    if (this.unsubSync) { this.unsubSync(); this.unsubSync = null; }
  }

  destroy() {
    this.stopPolling();
  }

  renderShell() {
    this.ensureCollections();
    const invs = this.db.invitations || [];
    const bookings = this.db.bookings || [];
    const threads = this.db.chatThreads || [];
    const consults = this.db.consultations || [];

    const unreadChats = threads.reduce((s, t) => s + Number(t.unreadByAdmin || 0), 0);
    const pendingBookings = bookings.filter(b => b.status === 'pending').length;
    const newQrOrders = consults.filter(c => c.kind === 'qr_order' && c.status === 'new').length;

    const paidInvRev = invs.filter(i => i.order?.status === 'paid').reduce((s, i) => s + Number(i.order?.price || 0), 0);
    const paidQrRev = consults.filter(c => c.kind === 'qr_order' && c.status === 'paid').reduce((s, c) => s + Number(c.amount || 0), 0);
    const totalRevenue = Math.max(paidInvRev, paidQrRev);

    this.root.innerHTML = `
      <header class="top-nav">
        <div class="brand-mark" data-go-store>
          <div class="brand-monogram">L</div>
          <div>
            <div class="brand-script-name">${escapeHtml(this.db.settings?.brandName || "L'Amour Atelier")}</div>
            <div class="brand-sub-status">
              <span class="status-dot ${storage.isCloudOnline() ? 'online' : 'local'}"></span>
              <span>Trung Tâm Quản Lý • ${escapeHtml(this.user?.email || 'lochoipes@gmail.com')}</span>
            </div>
          </div>
        </div>
        <div class="nav-actions">
          <button type="button" class="btn btn-outline btn-sm" data-go-store>Xem Trang Bán Hàng</button>
          <button type="button" class="btn btn-primary btn-sm" data-quick-new-order>+ Tạo Thiệp Mới</button>
          <button type="button" class="btn btn-ghost btn-sm" data-admin-logout>Đăng xuất</button>
        </div>
      </header>

      <div class="admin-shell">
        <aside class="admin-sidebar">
          <div class="admin-side-group">Kinh Doanh &amp; Khách Hàng</div>
          <button type="button" class="admin-side-btn ${this.activeTab === 'history' ? 'active' : ''}" data-side-tab="history">
            <span>Lịch Sử Mua &amp; Đơn Thiệp</span>
            ${newQrOrders > 0 ? `<span class="admin-side-count">${newQrOrders}</span>` : ''}
          </button>
          <button type="button" class="admin-side-btn ${this.activeTab === 'bookings' ? 'active' : ''}" data-side-tab="bookings">
            <span>Quản Lý Đặt Lịch</span>
            <span class="admin-side-count" data-side-booking-badge style="${pendingBookings > 0 ? '' : 'display:none;'}">${pendingBookings}</span>
          </button>
          <button type="button" class="admin-side-btn ${this.activeTab === 'users' ? 'active' : ''}" data-side-tab="users">
            <span>Tài Khoản Khách Hàng</span>
            <small style="opacity:0.65;">${(this.db.users || []).length}</small>
          </button>

          <div class="admin-side-group">Thiết Kế &amp; Kho Mẫu</div>
          <button type="button" class="admin-side-btn ${this.activeTab === 'templates' ? 'active' : ''}" data-side-tab="templates">
            <span>Sửa / Xóa / Thêm Mẫu</span>
            <small style="opacity:0.65;">${(this.db.templates || []).length}</small>
          </button>

          <div class="admin-side-group">Chăm Sóc Trực Tiếp</div>
          <button type="button" class="admin-side-btn ${this.activeTab === 'livechat' ? 'active' : ''}" data-side-tab="livechat">
            <span>Khung Chat Trực Tiếp</span>
            <span class="admin-side-count" data-side-chat-badge style="${unreadChats > 0 ? '' : 'display:none;'}">${unreadChats}</span>
          </button>
          <button type="button" class="admin-side-btn ${this.activeTab === 'chatbot' ? 'active' : ''}" data-side-tab="chatbot">
            <span>Chat Bot &amp; Câu Nhanh</span>
          </button>

          <div class="admin-side-group">Hệ Thống</div>
          <button type="button" class="admin-side-btn ${this.activeTab === 'settings' ? 'active' : ''}" data-side-tab="settings">
            <span>Ngân Hàng, Giá &amp; Cài Đặt</span>
          </button>
        </aside>

        <main class="admin-main-col">
          <div class="stats-row">
            <div class="stat-card">
              <div class="stat-card-head"><span>Doanh thu đã xác nhận</span></div>
              <strong style="color:var(--ui-success);">${formatVnd(totalRevenue)}</strong>
            </div>
            <div class="stat-card">
              <div class="stat-card-head"><span>Thiệp đang hoạt động</span></div>
              <strong>${invs.length} thiệp</strong>
            </div>
            <div class="stat-card">
              <div class="stat-card-head"><span>Lịch hẹn tư vấn</span></div>
              <strong style="color:var(--ui-warning);" data-stat-booking>${pendingBookings} chờ / ${bookings.length} tổng</strong>
            </div>
            <div class="stat-card">
              <div class="stat-card-head"><span>Hội thoại Live Chat</span></div>
              <strong style="color:var(--ui-brand);" data-stat-chat>${threads.some(t => t.waitingForAdmin) ? `${threads.filter(t => t.waitingForAdmin).length} chờ trực tiếp / ${threads.length} khách` : `${unreadChats} chưa đọc / ${threads.length} khách`}</strong>
            </div>
          </div>

          <div id="admin-module-root"></div>
        </main>
      </div>
    `;

    this.root.querySelectorAll('[data-go-store]').forEach(b => b.addEventListener('click', () => { this.destroy(); this.onNavigateStore(); }));
    this.root.querySelector('[data-admin-logout]')?.addEventListener('click', () => { this.destroy(); this.onLogout(); });
    this.root.querySelector('[data-quick-new-order]')?.addEventListener('click', () => this.openNewInvitationModal());
    this.root.querySelectorAll('[data-side-tab]').forEach(btn => {
      btn.addEventListener('click', async () => {
        this.activeTab = btn.dataset.sideTab;
        if (this.activeTab === 'livechat') {
          try {
            const fresh = await storage.getAdminDb();
            this.db.chatThreads = fresh.chatThreads || [];
            this.lastThreadsSignature = JSON.stringify(this.db.chatThreads);
            const ordered = this.getOrderedThreads();
            if (ordered[0] && (ordered[0].waitingForAdmin || ordered[0].unreadByAdmin > 0)) {
              this.selectedThreadId = ordered[0].id;
            }
          } catch (_) {}
        }
        this.mount();
      });
    });

    this.renderActiveModule();
  }

  renderActiveModule() {
    switch (this.activeTab) {
      case 'history': this.renderHistoryAndOrders(); break;
      case 'bookings': this.renderBookingsModule(); break;
      case 'templates': this.renderTemplatesModule(); break;
      case 'livechat': this.renderLiveChatContent(); break;
      case 'chatbot': this.renderChatbotModule(); break;
      case 'users': this.renderUsersModule(); break;
      case 'settings': this.renderSettingsModule(); break;
    }
  }

  /* ==========================================================================
     1. LỊCH SỬ ĐÃ MUA & QUẢN LÝ ĐƠN THIỆP
     ========================================================================== */
  renderHistoryAndOrders() {
    const host = this.root.querySelector('#admin-module-root');
    const qrOrders = (this.db.consultations || []).filter(c => c.kind === 'qr_order');
    const invs = (this.db.invitations || []).filter(inv => {
      if (this.orderFilter !== 'all' && (inv.order?.status || 'trial') !== this.orderFilter) return false;
      if (this.orderSearch) {
        const q = this.orderSearch.toLowerCase();
        const hay = `${inv.title} ${inv.order?.customerName} ${inv.order?.customerPhone} ${inv.content?.groomName} ${inv.content?.brideName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    host.innerHTML = `
      <!-- Bảng 1: Lịch sử giao dịch đặt mua qua VietQR MB Bank -->
      <div class="panel-card" style="margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
          <div>
            <h3 style="margin:0;font-size:16px;">Lịch Sử Khách Đặt Mua Qua VietQR MB Bank (${qrOrders.length})</h3>
            <small style="color:var(--ui-muted);">Đối soát mã nội dung chuyển khoản về STK 0354248177 và bấm tạo thiệp ngay cho khách</small>
          </div>
          <button type="button" class="btn btn-outline btn-sm" id="btn-export-revenue">${icon('download', 13)} Xuất Excel Doanh Thu</button>
        </div>

        ${qrOrders.length === 0 ? `<p style="font-size:13px;color:var(--ui-muted);margin:0;">Chưa có giao dịch đặt QR nào.</p>` : `
          <div class="orders-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Thời Gian</th>
                  <th>Khách Hàng &amp; SĐT</th>
                  <th>Mẫu &amp; Gói Đã Chọn</th>
                  <th>Số Tiền / Mã CK</th>
                  <th>Trạng Thái</th>
                  <th>Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                ${qrOrders.map(ord => {
                  const linkedInv = ord.invitationId ? (this.db.invitations || []).find(x => x.id === ord.invitationId) : null;
                  return `
                  <tr>
                    <td style="font-size:12px;color:var(--ui-muted);white-space:nowrap;">${formatDateTime(ord.createdAt)}</td>
                    <td>
                      <strong>${escapeHtml(ord.name)}</strong>
                      <div style="font-size:12px;color:var(--ui-brand);">${escapeHtml(ord.phone)}</div>
                    </td>
                    <td>
                      <strong>${escapeHtml(ord.templateName || 'Mẫu tùy chọn')}</strong>
                      <div style="font-size:12px;color:var(--ui-muted);">${escapeHtml(ord.packageName || '')}</div>
                      ${ord.autoDelivered ? `<span class="badge badge-paid" style="margin-top:3px;">Đã tự bàn giao SP</span>` : linkedInv ? `<span class="badge badge-gold" style="margin-top:3px;">Khách đã tự sửa ảnh &amp; nội dung</span>` : ''}
                    </td>
                    <td>
                      <strong style="color:var(--ui-success);">${formatVnd(ord.amount)}</strong>
                      <div style="font-size:11px;color:var(--ui-muted);"><code>${escapeHtml(ord.transferCode || '')}</code></div>
                    </td>
                    <td>
                      <select class="select" style="padding:5px 8px;font-size:12px;" data-qr-status="${escapeHtml(ord.id)}">
                        <option value="new" ${ord.status === 'new' ? 'selected' : ''}>Chờ kiểm tra CK</option>
                        <option value="paid" ${ord.status === 'paid' ? 'selected' : ''}>Đã thanh toán</option>
                        <option value="done" ${ord.status === 'done' ? 'selected' : ''}>Đã bàn giao thiệp</option>
                      </select>
                    </td>
                    <td>
                      <div style="display:flex;gap:5px;flex-wrap:wrap;">
                        ${linkedInv ? `
                          ${linkedInv.order?.status !== 'paid'
                            ? `<button type="button" class="btn btn-primary btn-xs" data-approve-linked="${escapeHtml(ord.id)}">Duyệt &amp; Mở VIP</button>`
                            : `<span class="badge badge-paid">Đã mở VIP</span>`}
                          <button type="button" class="btn btn-outline btn-xs" data-edit-inv="${escapeHtml(linkedInv.id)}">Xem Thiệp</button>
                        ` : `
                          <button type="button" class="btn btn-primary btn-xs" data-convert-order="${escapeHtml(ord.id)}">Tạo thiệp ngay</button>
                        `}
                        <button type="button" class="btn btn-danger btn-xs" data-del-qr="${escapeHtml(ord.id)}">${icon('trash', 12)}</button>
                      </div>
                    </td>
                  </tr>
                `; }).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>

      <!-- Bảng 2: Toàn bộ thiệp cưới đang chạy & bàn giao -->
      <div class="panel-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
          <h3 style="margin:0;font-size:16px;">Danh Sách Thiệp Cưới Khách Hàng (${invs.length})</h3>
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center;">
            <input class="input" style="width:210px;padding:7px 10px;" id="inv-search-input" placeholder="Tìm tên cặp đôi, SĐT..." value="${escapeHtml(this.orderSearch)}" />
            <select class="select" style="width:160px;padding:7px 10px;" id="inv-filter-select">
              <option value="all" ${this.orderFilter === 'all' ? 'selected' : ''}>Tất cả trạng thái</option>
              <option value="paid" ${this.orderFilter === 'paid' ? 'selected' : ''}>Đã thanh toán</option>
              <option value="deposit" ${this.orderFilter === 'deposit' ? 'selected' : ''}>Đã đặt cọc</option>
              <option value="trial" ${this.orderFilter === 'trial' ? 'selected' : ''}>Dùng thử</option>
            </select>
            <button type="button" class="btn btn-primary btn-sm" id="btn-add-inv">+ Tạo Thiệp</button>
          </div>
        </div>

        <div class="orders-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Thiệp Cưới</th>
                <th>Khách Hàng &amp; Gói</th>
                <th>Thanh Toán</th>
                <th>Khách Mời / RSVP</th>
                <th>Quản Lý</th>
              </tr>
            </thead>
            <tbody>
              ${invs.map(inv => `
                <tr>
                  <td>
                    <strong>${escapeHtml(inv.title)}</strong>
                    <div style="font-size:12px;color:var(--ui-muted);">${escapeHtml(inv.content?.groomName)} &amp; ${escapeHtml(inv.content?.brideName)} • Ngày cưới: ${escapeHtml(inv.content?.weddingDate)}</div>
                  </td>
                  <td>
                    <div><strong>${escapeHtml(inv.order?.customerName || '—')}</strong> (${escapeHtml(inv.order?.customerPhone || '')})</div>
                    <div style="font-size:12px;color:var(--ui-brand);">${escapeHtml(inv.order?.packageName || '')} — <strong>${formatVnd(inv.order?.price)}</strong></div>
                  </td>
                  <td>
                    <span class="badge ${inv.order?.status === 'paid' ? 'badge-paid' : inv.order?.status === 'deposit' ? 'badge-deposit' : 'badge-trial'}">
                      ${inv.order?.status === 'paid' ? 'Đã thanh toán' : inv.order?.status === 'deposit' ? 'Đặt cọc' : 'Dùng thử'}
                    </span>
                    ${inv.order?.status !== 'paid'
                      ? `<div style="margin-top:5px;"><button type="button" class="btn btn-outline btn-xs" data-mark-paid="${escapeHtml(inv.id)}">Kích hoạt VIP</button></div>`
                      : `<div style="margin-top:5px;"><button type="button" class="btn btn-ghost btn-xs" style="color:var(--ui-muted);font-size:11px;" data-revoke-vip="${escapeHtml(inv.id)}">Thu hồi VIP</button></div>`}
                  </td>
                  <td style="font-size:12px;color:var(--ui-muted);">
                    <div>${(inv.guests || []).length} khách mời</div>
                    <div>${(inv.rsvps || []).length} RSVP • ${(inv.wishes || []).length} lời chúc</div>
                  </td>
                  <td>
                    <div style="display:flex;gap:5px;flex-wrap:wrap;">
                      <button type="button" class="btn btn-primary btn-xs" data-edit-inv="${escapeHtml(inv.id)}">Thiết Kế</button>
                      <button type="button" class="btn btn-gold btn-xs" data-links-inv="${escapeHtml(inv.id)}">3 Link</button>
                      <button type="button" class="btn btn-outline btn-xs" data-dup-inv="${escapeHtml(inv.id)}">Nhân bản</button>
                      <button type="button" class="btn btn-danger btn-xs" data-del-inv="${escapeHtml(inv.id)}">${icon('trash', 12)}</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    host.querySelector('#inv-search-input')?.addEventListener('input', e => { this.orderSearch = e.target.value; this.renderHistoryAndOrders(); });
    host.querySelector('#inv-filter-select')?.addEventListener('change', e => { this.orderFilter = e.target.value; this.renderHistoryAndOrders(); });
    host.querySelector('#btn-add-inv')?.addEventListener('click', () => this.openNewInvitationModal());

    host.querySelectorAll('[data-qr-status]').forEach(sel => {
      sel.addEventListener('change', async () => {
        const ord = (this.db.consultations || []).find(c => c.id === sel.dataset.qrStatus);
        if (ord) {
          ord.status = sel.value;
          if ((ord.status === 'paid' || ord.status === 'done') && ord.invitationId) {
            const linked = (this.db.invitations || []).find(i => i.id === ord.invitationId);
            if (linked) {
              linked.order = linked.order || {};
              linked.order.status = 'paid';
              linked.order.showWatermark = false;
              linked.trial = null;
              linked.permissions = { ...(linked.permissions || {}), allowMusicChange: true };
              if (ord.packageName) linked.order.packageName = ord.packageName;
              if (ord.amount) linked.order.price = Number(ord.amount);
            }
          }
          await this.persist('Đã cập nhật trạng thái đơn QR');
          this.renderShell();
        }
      });
    });

    host.querySelectorAll('[data-approve-linked]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const ord = (this.db.consultations || []).find(c => c.id === btn.dataset.approveLinked);
        if (!ord) return;
        ord.status = 'paid';
        const linked = (this.db.invitations || []).find(i => i.id === ord.invitationId);
        if (linked) {
          linked.order = linked.order || {};
          linked.order.status = 'paid';
          linked.order.showWatermark = false;
          linked.trial = null;
          linked.permissions = { ...(linked.permissions || {}), allowMusicChange: true };
          if (ord.packageName) linked.order.packageName = ord.packageName;
          if (ord.amount) linked.order.price = Number(ord.amount);
        }
        await this.persist('Đã xác nhận thanh toán & mở khóa toàn bộ tính năng VIP!');
        this.renderShell();
      });
    });

    host.querySelectorAll('[data-convert-order]').forEach(btn => {
      btn.addEventListener('click', () => {
        const ord = (this.db.consultations || []).find(c => c.id === btn.dataset.convertOrder);
        if (ord) this.openNewInvitationModal({
          defaultTplId: ord.templateId || (this.db.templates[0]?.id || 'nhung-do-co-dien'),
          customerName: ord.name,
          customerPhone: ord.phone,
          customerEmail: ord.email || '',
          userId: ord.userId || '',
          price: ord.amount,
          packageName: ord.packageName,
          status: ord.status === 'paid' ? 'paid' : 'trial',
        });
      });
    });

    host.querySelectorAll('[data-del-qr]').forEach(btn => {
      btn.addEventListener('click', async () => {
        this.db.consultations = (this.db.consultations || []).filter(c => c.id !== btn.dataset.delQr);
        await this.persist('Đã xóa giao dịch');
        this.renderShell();
      });
    });

    host.querySelectorAll('[data-mark-paid]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const inv = this.db.invitations.find(i => i.id === btn.dataset.markPaid);
        if (!inv) return;
        inv.order.status = 'paid';
        inv.order.showWatermark = false;
        inv.trial = null;
        inv.permissions = { ...(inv.permissions || {}), allowMusicChange: true };
        await this.persist('Đã xác nhận thanh toán & gỡ giới hạn bản dùng thử');
        this.renderShell();
      });
    });

    host.querySelectorAll('[data-revoke-vip]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Thu hồi trạng thái VIP và bật lại dải băng Bản Xem Thử cho thiệp này?')) return;
        const inv = this.db.invitations.find(i => i.id === btn.dataset.revokeVip);
        if (!inv) return;
        inv.order.status = 'trial';
        inv.order.showWatermark = true;
        await this.persist('Đã thu hồi VIP và bật lại bản thử');
        this.renderShell();
      });
    });

    host.querySelectorAll('[data-edit-inv]').forEach(btn => btn.addEventListener('click', () => this.onOpenInvitationEditor(btn.dataset.editInv)));
    host.querySelectorAll('[data-links-inv]').forEach(btn => btn.addEventListener('click', () => {
      const inv = this.db.invitations.find(i => i.id === btn.dataset.linksInv);
      if (inv) this.openShareLinksModal(inv, 'admin');
    }));
    host.querySelectorAll('[data-dup-inv]').forEach(btn => btn.addEventListener('click', async () => {
      const src = this.db.invitations.find(i => i.id === btn.dataset.dupInv);
      if (!src) return;
      const copy = JSON.parse(JSON.stringify(src));
      copy.id = 'thiep-' + Math.random().toString(36).slice(2, 8);
      copy.clientToken = 'kh_' + Math.random().toString(36).slice(2, 10);
      copy.title = src.title + ' (Bản sao)';
      copy.rsvps = []; copy.wishes = [];
      this.db.invitations.unshift(copy);
      await this.persist('Đã nhân bản thiệp cưới');
      this.renderShell();
    }));
    host.querySelectorAll('[data-del-inv]').forEach(btn => btn.addEventListener('click', async () => {
      if (!confirm('Xác nhận xóa thiệp này?')) return;
      this.db.invitations = this.db.invitations.filter(i => i.id !== btn.dataset.delInv);
      await this.persist('Đã xóa thiệp');
      this.renderShell();
    }));

    host.querySelector('#btn-export-revenue')?.addEventListener('click', () => {
      const headers = ['Mã', 'Khách Hàng', 'SĐT', 'Thiệp / Mẫu', 'Gói', 'Giá Tiền', 'Trạng Thái', 'Ngày Tạo'];
      const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = (this.db.invitations || []).map(i => [i.id, i.order?.customerName, i.order?.customerPhone, i.title, i.order?.packageName, i.order?.price, i.order?.status, i.createdAt].map(esc).join(','));
      const blob = new Blob(['\uFEFF' + [headers.map(esc).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `lich-su-doanh-thu-thiep-cuoi.csv`;
      a.click();
      this.showToast('Đã xuất báo cáo doanh thu CSV', 'success');
    });
  }

  /* ==========================================================================
     2. QUẢN LÝ ĐẶT LỊCH TƯ VẤN (BOOKING MANAGER)
     ========================================================================== */
  renderBookingsModule() {
    const host = this.root.querySelector('#admin-module-root');
    const list = (this.db.bookings || []).filter(b => this.bookingFilter === 'all' || b.status === this.bookingFilter);

    host.innerHTML = `
      <div class="panel-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:10px;">
          <div>
            <h3 style="margin:0;font-size:16px;">Quản Lý Lịch Hẹn Tư Vấn &amp; Thiết Kế (${list.length})</h3>
            <small style="color:var(--ui-muted);">Theo dõi khách đặt lịch hẹn gọi Zalo / tư vấn phối màu / thiết kế riêng</small>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <select class="select" style="width:165px;padding:7px 10px;" id="bk-filter">
              <option value="all" ${this.bookingFilter === 'all' ? 'selected' : ''}>Tất cả lịch hẹn</option>
              <option value="pending" ${this.bookingFilter === 'pending' ? 'selected' : ''}>Chờ xác nhận</option>
              <option value="confirmed" ${this.bookingFilter === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
              <option value="completed" ${this.bookingFilter === 'completed' ? 'selected' : ''}>Đã hoàn thành</option>
              <option value="cancelled" ${this.bookingFilter === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
            </select>
            <button type="button" class="btn btn-primary btn-sm" id="btn-add-booking">+ Thêm Lịch Hẹn</button>
          </div>
        </div>

        ${list.length === 0 ? `<p style="font-size:13px;color:var(--ui-muted);">Chưa có lịch hẹn nào trong mục này.</p>` : `
          <div class="orders-table-wrap">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Ngày &amp; Giờ Hẹn</th>
                  <th>Khách Hàng &amp; SĐT</th>
                  <th>Kênh &amp; Nhu Cầu Tư Vấn</th>
                  <th>Trạng Thái</th>
                  <th>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                ${list.map(bk => `
                  <tr>
                    <td style="white-space:nowrap;">
                      <strong style="color:var(--ui-brand);">${escapeHtml(bk.date)}</strong>
                      <div style="font-size:12px;color:var(--ui-muted);">Giờ: ${escapeHtml(bk.timeSlot)}</div>
                    </td>
                    <td>
                      <strong>${escapeHtml(bk.name)}</strong>
                      <div style="font-size:12px;color:var(--ui-brand);">${escapeHtml(bk.phone)}</div>
                      ${bk.email ? `<div style="font-size:11px;color:var(--ui-muted);">${escapeHtml(bk.email)}</div>` : ''}
                    </td>
                    <td style="max-width:300px;">
                      <span class="badge badge-gold">${escapeHtml(bk.channel || 'Zalo')}</span>
                      <div style="font-size:12.5px;font-weight:600;margin-top:4px;">${escapeHtml(bk.service)}</div>
                      ${bk.note ? `<div style="font-size:11.5px;color:var(--ui-muted);margin-top:2px;">${escapeHtml(bk.note)}</div>` : ''}
                    </td>
                    <td>
                      <select class="select" style="padding:5px 8px;font-size:12px;" data-bk-status="${escapeHtml(bk.id)}">
                        <option value="pending" ${bk.status === 'pending' ? 'selected' : ''}>Chờ xác nhận</option>
                        <option value="confirmed" ${bk.status === 'confirmed' ? 'selected' : ''}>Đã xác nhận</option>
                        <option value="completed" ${bk.status === 'completed' ? 'selected' : ''}>Đã hoàn thành</option>
                        <option value="cancelled" ${bk.status === 'cancelled' ? 'selected' : ''}>Đã hủy</option>
                      </select>
                    </td>
                    <td>
                      <div style="display:flex;gap:5px;flex-wrap:wrap;">
                        <a class="btn btn-outline btn-xs" href="https://zalo.me/${escapeHtml((bk.phone || '').replace(/\D/g, ''))}" target="_blank">Nhắn Zalo</a>
                        <button type="button" class="btn btn-danger btn-xs" data-del-bk="${escapeHtml(bk.id)}">${icon('trash', 12)}</button>
                      </div>
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;

    host.querySelector('#bk-filter')?.addEventListener('change', e => { this.bookingFilter = e.target.value; this.renderBookingsModule(); });
    host.querySelector('#btn-add-booking')?.addEventListener('click', () => this.openAdminAddBookingModal());
    host.querySelectorAll('[data-bk-status]').forEach(sel => {
      sel.addEventListener('change', async () => {
        const bk = this.db.bookings.find(b => b.id === sel.dataset.bkStatus);
        if (bk) { bk.status = sel.value; await this.persist('Đã cập nhật trạng thái lịch hẹn'); this.renderShell(); }
      });
    });
    host.querySelectorAll('[data-del-bk]').forEach(btn => {
      btn.addEventListener('click', async () => {
        this.db.bookings = this.db.bookings.filter(b => b.id !== btn.dataset.delBk);
        await this.persist('Đã xóa lịch hẹn');
        this.renderShell();
      });
    });
  }

  openAdminAddBookingModal() {
    const today = new Date().toISOString().slice(0, 10);
    this.openModal(`
      <div class="modal-head">
        <h3>Thêm Lịch Hẹn Tư Vấn Mới</h3>
        <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 16)}</button>
      </div>
      <form id="admin-bk-form" novalidate>
        <div class="grid-2">
          <div class="form-group"><label>Tên khách hàng *</label><input class="input" name="name" required /></div>
          <div class="form-group"><label>SĐT / Zalo (đủ 10 số) *</label><input class="input" id="admin-bk-phone" type="tel" inputmode="numeric" maxlength="10" name="phone" required placeholder="VD: 0912345678" /></div>
        </div>
        <div class="grid-3">
          <div class="form-group"><label>Ngày hẹn *</label><input class="input" type="date" name="date" required value="${today}" /></div>
          <div class="form-group"><label>Khung giờ</label>
            <select class="select" name="timeSlot">
              <option value="09:00">09:00 Sáng</option><option value="10:30">10:30 Sáng</option>
              <option value="14:00">14:00 Chiều</option><option value="16:00">16:00 Chiều</option>
              <option value="19:30">19:30 Tối</option><option value="21:00">21:00 Tối</option>
            </select>
          </div>
          <div class="form-group"><label>Kênh liên hệ</label>
            <select class="select" name="channel">
              <option value="Zalo Call">Zalo Call</option><option value="Nhắn tin Zalo">Nhắn tin Zalo</option><option value="Gọi điện thoại">Gọi điện thoại</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label>Nhu cầu tư vấn</label><input class="input" name="service" value="Tư vấn chọn mẫu & phối màu hợp mệnh" /></div>
        <div class="form-group"><label>Ghi chú</label><textarea class="textarea" rows="2" name="note"></textarea></div>
        <button type="submit" class="btn btn-primary" style="width:100%;">Lưu Lịch Hẹn</button>
      </form>
    `);

    const admPhone = document.querySelector('#admin-bk-phone');
    admPhone?.addEventListener('input', () => { admPhone.value = sanitizeVnPhone10(admPhone.value); });

    document.querySelector('#admin-bk-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const name = fd.get('name').toString().trim();
      const phoneCheck = validateVnPhone10(fd.get('phone').toString().trim());
      if (!name) { this.showToast('Vui lòng nhập tên khách hàng', 'error'); return; }
      if (!phoneCheck.ok) { this.showToast(phoneCheck.error, 'error'); admPhone?.focus(); return; }
      this.db.bookings.unshift({
        id: 'bk_' + Date.now(),
        userId: '',
        name,
        phone: phoneCheck.digits,
        email: '',
        date: fd.get('date').toString(),
        timeSlot: fd.get('timeSlot').toString(),
        channel: fd.get('channel').toString(),
        service: fd.get('service').toString().trim(),
        note: fd.get('note').toString().trim(),
        status: 'confirmed',
        createdAt: new Date().toISOString(),
      });
      await this.persist('Đã thêm lịch hẹn mới');
      this.closeModal();
      this.renderShell();
    });
  }

  /* ==========================================================================
     3. SỬA, XÓA, THÊM MẪU THIỆP (FULL CRUD + VISUAL TEMPLATE STUDIO)
     ========================================================================== */
  renderTemplatesModule() {
    const host = this.root.querySelector('#admin-module-root');
    const templates = this.db.templates || [];
    const storeBlankUrl = buildAbsoluteUrl({ view: 'store', blank: '1' });

    host.innerHTML = `
      <div class="panel-card" style="margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:10px;">
          <div>
            <h3 style="margin:0;font-size:16px;">Quản Lý Kho Mẫu Thiệp Hiển Thị Trên Web (${templates.length} mẫu)</h3>
            <small style="color:var(--ui-muted);">Toàn quyền thêm mẫu mới, sửa thiết kế trực quan (màu, ảnh nền mờ, hoa văn, hiệu ứng), nhân bản hoặc xóa bất kỳ mẫu nào</small>
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            <button type="button" class="btn btn-outline btn-sm" id="btn-restore-tpls">Khôi phục mẫu gốc</button>
            <button type="button" class="btn btn-primary btn-sm" id="btn-create-tpl">+ Thêm Mẫu Thiệp Mới</button>
          </div>
        </div>
        <div class="link-box">
          <code>${escapeHtml(storeBlankUrl)}</code>
          <button type="button" class="btn btn-outline btn-xs" id="btn-copy-blank-store">Copy Link Mẫu Trống</button>
          <a class="btn btn-primary btn-xs" href="${escapeHtml(storeBlankUrl)}" target="_blank">Mở Showroom</a>
        </div>
      </div>

      <div class="poster-grid">
        ${templates.map((t, idx) => `
          <div class="poster-card">
            ${t.tag ? `<span class="poster-tag">${escapeHtml(t.tag)}</span>` : ''}
            <div class="poster-canvas">
              ${this.renderPosterCardVisual(t, true, idx)}
            </div>
            <div class="poster-scrim">
              <h4>${escapeHtml(t.name)}</h4>
              <div class="poster-meta-line"><span>${escapeHtml(t.category)}</span><span>Hợp ${(t.elements || []).join(', ')}</span></div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:5px;">
                <button type="button" class="poster-btn-view" data-visual-edit-tpl="${escapeHtml(t.id)}">Sửa Thiết Kế</button>
                <button type="button" class="poster-btn-order" data-meta-edit-tpl="${escapeHtml(t.id)}">Sửa Tên / Tag</button>
              </div>
              <div style="display:flex;gap:5px;">
                <button type="button" class="btn btn-outline btn-xs" style="flex:1;background:rgba(255,255,255,0.12);color:#fff;border-color:rgba(255,255,255,0.22);" data-dup-tpl="${escapeHtml(t.id)}">Nhân bản</button>
                <button type="button" class="btn btn-danger btn-xs" data-del-tpl="${escapeHtml(t.id)}" title="Xóa mẫu">${icon('trash', 12)}</button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;

    host.querySelector('#btn-copy-blank-store')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(storeBlankUrl).then(() => this.showToast('Đã copy link Showroom Mẫu Trống', 'success'));
    });
    host.querySelector('#btn-create-tpl')?.addEventListener('click', () => this.openTemplateMetaModal(null));
    host.querySelector('#btn-restore-tpls')?.addEventListener('click', async () => {
      if (!confirm('Bổ sung lại các mẫu gốc còn thiếu vào kho mẫu?')) return;
      const existingIds = new Set(this.db.templates.map(t => t.id));
      TEMPLATES.forEach(t => { if (!existingIds.has(t.id)) this.db.templates.push(JSON.parse(JSON.stringify(t))); });
      await this.persist('Đã khôi phục các mẫu gốc');
      this.renderShell();
    });

    host.querySelectorAll('[data-visual-edit-tpl]').forEach(btn => {
      btn.addEventListener('click', () => this.onOpenTemplateEditor(btn.dataset.visualEditTpl));
    });
    host.querySelectorAll('[data-meta-edit-tpl]').forEach(btn => {
      btn.addEventListener('click', () => {
        const t = this.db.templates.find(x => x.id === btn.dataset.metaEditTpl);
        if (t) this.openTemplateMetaModal(t);
      });
    });
    host.querySelectorAll('[data-dup-tpl]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const src = this.db.templates.find(x => x.id === btn.dataset.dupTpl);
        if (!src) return;
        const copy = JSON.parse(JSON.stringify(src));
        copy.id = 'tpl_' + Date.now().toString(36);
        copy.name = src.name + ' (Bản sao)';
        copy.tag = 'Mới';
        this.db.templates.unshift(copy);
        await this.persist('Đã nhân bản mẫu thiệp');
        this.renderShell();
      });
    });
    host.querySelectorAll('[data-del-tpl]').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (this.db.templates.length <= 1) { this.showToast('Cần giữ tối thiểu 1 mẫu trên Showroom', 'error'); return; }
        if (!confirm('Xác nhận xóa mẫu thiệp này khỏi Showroom?')) return;
        this.db.templates = this.db.templates.filter(x => x.id !== btn.dataset.delTpl);
        await this.persist('Đã xóa mẫu thiệp');
        this.renderShell();
      });
    });
  }

  openTemplateMetaModal(existingTpl) {
    const isEdit = Boolean(existingTpl);
    const t = existingTpl || {
      name: '',
      category: 'Sang trọng',
      tag: 'Mới',
      posterStyle: 'envelope',
      elements: ['Hỏa', 'Thổ'],
      desc: 'Thiết kế biên tập tinh tế với ảnh nền mờ & hoa văn ép kim.',
      design: JSON.parse(JSON.stringify(TEMPLATES[0].design)),
    };

    this.openModal(`
      <div class="modal-head">
        <h3>${isEdit ? 'Sửa Thông Tin Mẫu Thiệp' : 'Thêm Mẫu Thiệp Mới'}</h3>
        <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 16)}</button>
      </div>
      <form id="tpl-meta-form">
        <div class="grid-2">
          <div class="form-group"><label>Tên mẫu thiệp *</label><input class="input" name="name" required value="${escapeHtml(t.name)}" placeholder="VD: Hoa Hồng Hoàng Cung" /></div>
          <div class="form-group"><label>Danh mục</label>
            <select class="select" name="category">
              ${['Dùng thử', 'Cổ điển', 'Truyền thống', 'Hoàng gia', 'Thiên nhiên', 'Lãng mạn', 'Hiện đại', 'Vintage', 'Tối giản', 'Sang trọng'].map(c => `<option value="${c}" ${t.category === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Chế độ dùng thử (1–3 ngày có giới hạn chức năng)</label>
          <select class="select" name="trialDays">
            <option value="0" ${!t.isTrialTemplate ? 'selected' : ''}>Mẫu chính thức (Đầy đủ tính năng)</option>
            <option value="1" ${t.isTrialTemplate && Number(t.trialDays) === 1 ? 'selected' : ''}>Mẫu Dùng Thử 1 Ngày (Tối đa 3 ảnh, khóa QR mừng cưới &amp; MP3)</option>
            <option value="2" ${t.isTrialTemplate && Number(t.trialDays) === 2 ? 'selected' : ''}>Mẫu Dùng Thử 2 Ngày (Tối đa 5 ảnh, khóa QR mừng cưới &amp; MP3)</option>
            <option value="3" ${t.isTrialTemplate && Number(t.trialDays) === 3 ? 'selected' : ''}>Mẫu Dùng Thử 3 Ngày (Tối đa 6 ảnh, khóa QR mừng cưới &amp; MP3)</option>
          </select>
        </div>
        <div class="grid-3">
          <div class="form-group"><label>Nhãn nổi bật</label><input class="input" name="tag" value="${escapeHtml(t.tag || '')}" placeholder="Hot / Mới / VIP" /></div>
          <div class="form-group"><label>Kiểu bố cục Poster</label>
            <select class="select" name="posterStyle">
              <option value="envelope" ${t.posterStyle === 'envelope' ? 'selected' : ''}>Phong bì & Dấu sáp</option>
              <option value="arch" ${t.posterStyle === 'arch' ? 'selected' : ''}>Cổng vòm hoàng gia</option>
              <option value="polaroid" ${t.posterStyle === 'polaroid' ? 'selected' : ''}>Polaroid cổ điển</option>
              <option value="crest" ${t.posterStyle === 'crest' ? 'selected' : ''}>Huy hiệu Song Hỷ</option>
            </select>
          </div>
          <div class="form-group"><label>Ảnh nền mờ bìa</label>
            <select class="select" name="coverBackdrop">
              ${COVER_BACKDROPS.map(b => `<option value="${b.id}" ${(t.design?.coverBackdrop || 'burgundy-roses') === b.id ? 'selected' : ''}>${b.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Hợp mệnh Ngũ Hành (chọn nhiều)</label>
          <div style="display:flex;gap:12px;flex-wrap:wrap;font-size:12.5px;">
            ${['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'].map(el => `<label style="display:flex;align-items:center;gap:5px;"><input type="checkbox" name="el_${el}" ${(t.elements || []).includes(el) ? 'checked' : ''} /> ${el}</label>`).join('')}
          </div>
        </div>
        <div class="form-group"><label>Mô tả ngắn</label><textarea class="textarea" rows="2" name="desc">${escapeHtml(t.desc || '')}</textarea></div>
        <div style="display:flex;gap:8px;">
          <button type="submit" class="btn btn-primary" style="flex:1;">${isEdit ? 'Lưu Cập Nhật' : 'Tạo & Mở Trình Thiết Kế Màu'}</button>
        </div>
      </form>
    `);

    document.querySelector('#tpl-meta-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const elements = ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'].filter(el => fd.get(`el_${el}`));
      const trialDays = Number(fd.get('trialDays') || 0);
      const isTrial = trialDays > 0;
      const updated = {
        ...t,
        id: isEdit ? t.id : ('tpl_' + Date.now().toString(36)),
        name: fd.get('name').toString().trim(),
        category: isTrial ? 'Dùng thử' : fd.get('category').toString(),
        tag: fd.get('tag').toString().trim() || (isTrial ? `Dùng thử ${trialDays} ngày` : ''),
        isTrialTemplate: isTrial,
        trialDays: isTrial ? trialDays : 0,
        posterStyle: fd.get('posterStyle').toString(),
        elements: elements.length ? elements : ['Hỏa', 'Thổ'],
        desc: fd.get('desc').toString().trim(),
        design: { ...t.design, coverBackdrop: fd.get('coverBackdrop').toString() },
      };

      if (isEdit) {
        const idx = this.db.templates.findIndex(x => x.id === t.id);
        if (idx !== -1) this.db.templates[idx] = updated;
        await this.persist('Đã cập nhật thông tin mẫu');
        this.closeModal();
        this.renderShell();
      } else {
        this.db.templates.unshift(updated);
        await this.persist('Đã tạo mẫu mới! Đang mở trình thiết kế màu & hiệu ứng...');
        this.closeModal();
        this.onOpenTemplateEditor(updated.id);
      }
    });
  }

  /* ==========================================================================
     4. QUẢN LÝ TRẢ LỜI KHUNG CHAT TRỰC TIẾP (2-PANE LIVE INBOX)
     ========================================================================== */
  renderLiveChatContent() {
    const host = this.root.querySelector('#admin-module-root');
    if (!host) return;
    const threads = this.getOrderedThreads();
    if (!threads.some(t => t.id === this.selectedThreadId)) {
      this.selectedThreadId = threads[0]?.id || '';
    }
    const activeThread = threads.find(t => t.id === this.selectedThreadId) || null;
    const quickReplies = this.db.chatbotConfig?.adminQuickReplies || DEFAULT_CHATBOT_CONFIG.adminQuickReplies;
    const isCloud = storage.isCloudOnline();
    const syncBannerText = storage.backendMode === 'netlify'
      ? 'Đang kết nối Netlify Cloud Backend — Tin nhắn khách hàng từ mọi điện thoại & máy tính tự động hiển thị trực tiếp tại đây.'
      : storage.backendMode === 'php'
        ? 'Đang kết nối máy chủ PHP — Tin nhắn khách hàng từ mọi điện thoại & máy tính tự động hiển thị trực tiếp tại đây.'
        : 'Chế độ Web Tĩnh (Local) — Tự động đồng bộ giữa các tab cùng trình duyệt. Hãy deploy kèm Netlify Functions (/api) hoặc PHP Hosting để nhận chat từ điện thoại khách ở xa.';

    host.innerHTML = `
      <div class="livechat-sync-bar ${isCloud ? 'is-php' : 'is-local'}">
        <span class="status-dot ${isCloud ? 'online' : 'local'}"></span>
        <span>${syncBannerText}</span>
      </div>

      <div class="livechat-shell">
        <div class="livechat-list">
          <div style="padding:13px 14px;border-bottom:1px solid var(--ui-border);display:flex;justify-content:space-between;align-items:center;background:#fff;position:sticky;top:0;z-index:2;">
            <strong style="font-size:13.5px;">Hội Thoại Khách Hàng (${threads.length})</strong>
            <button type="button" class="btn btn-outline btn-xs" id="btn-refresh-chat">Làm mới</button>
          </div>
          ${threads.length === 0 ? `<p style="padding:18px;font-size:12.5px;color:var(--ui-muted);">Chưa có khách nào nhắn tin trong khung chat.</p>` : threads.map(th => {
            const lastMsg = th.messages?.[th.messages.length - 1];
            return `
              <div class="livechat-item ${th.id === this.selectedThreadId ? 'active' : ''} ${th.waitingForAdmin ? 'is-waiting' : ''}" data-pick-thread="${escapeHtml(th.id)}">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                  <strong style="font-size:13px;">${escapeHtml(th.customerName || 'Khách tham quan')}</strong>
                  <div style="display:flex;align-items:center;gap:4px;">
                    ${th.waitingForAdmin ? `<span class="badge-waiting-urgent">CHỜ QUẢN LÝ</span>` : ''}
                    ${th.unreadByAdmin > 0 ? `<span class="admin-side-count">${th.unreadByAdmin}</span>` : `<small style="font-size:10px;color:var(--ui-muted);">${formatDateTime(th.updatedAt).split(' ')[0]}</small>`}
                  </div>
                </div>
                <div style="font-size:11.5px;color:var(--ui-brand);margin:2px 0;font-weight:${th.waitingForAdmin ? '700' : '500'};">${escapeHtml(th.customerPhone || th.customerEmail || 'Chưa để lại SĐT')}</div>
                <div style="font-size:12px;color:var(--ui-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(lastMsg?.text || '')}</div>
              </div>
            `;
          }).join('')}
        </div>

        <div class="livechat-pane">
          ${!activeThread ? `<div style="padding:40px;text-align:center;color:var(--ui-muted);font-size:13.5px;">Chọn một hội thoại bên trái để trả lời trực tiếp cho khách hàng.</div>` : `
            <div class="livechat-pane-head">
              <div>
                <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;">
                  <strong style="font-size:14.5px;">${escapeHtml(activeThread.customerName)}</strong>
                  ${activeThread.waitingForAdmin ? `<span class="badge-waiting-urgent">KHÁCH ĐANG CHỜ TRỰC TIẾP</span>` : ''}
                </div>
                <div style="font-size:12px;color:var(--ui-muted);">${escapeHtml(activeThread.customerPhone || 'Chưa có SĐT')} ${activeThread.customerEmail ? '• ' + escapeHtml(activeThread.customerEmail) : ''}</div>
              </div>
              <div style="display:flex;gap:7px;align-items:center;flex-wrap:wrap;">
                <label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:pointer;padding:5px 10px;border:1px solid var(--ui-border);border-radius:999px;">
                  <input type="checkbox" id="toggle-thread-bot" ${activeThread.botActive !== false ? 'checked' : ''} />
                  <span>Chat Bot tự động</span>
                </label>
                ${activeThread.customerPhone ? `<a class="btn btn-outline btn-xs" href="tel:${escapeHtml(activeThread.customerPhone.replace(/\D/g, ''))}">Gọi điện</a>` : ''}
                ${activeThread.customerPhone ? `<a class="btn btn-outline btn-xs" href="https://zalo.me/${escapeHtml(activeThread.customerPhone.replace(/\D/g, ''))}" target="_blank" rel="noopener">Mở Zalo khách</a>` : ''}
                <button type="button" class="btn btn-danger btn-xs" id="btn-del-thread">Xóa chat</button>
              </div>
            </div>

            ${activeThread.waitingForAdmin ? `
              <div class="livechat-waiting-alert">
                <span><strong>Khách hàng yêu cầu nhắn trực tiếp với Quản Lý</strong> — SĐT xác nhận: <strong>${escapeHtml(activeThread.customerPhone || '')}</strong>. Gửi phản hồi bên dưới để kết nối ngay với khách!</span>
              </div>
            ` : ''}

            <div class="livechat-messages" id="admin-chat-scroll">
              ${(activeThread.messages || []).map(m => {
                const cls = m.sender === 'customer' ? 'studio' : m.sender === 'bot' ? 'bot' : 'admin';
                const who = m.sender === 'customer' ? activeThread.customerName : m.sender === 'bot' ? 'Chat Bot Tự Động' : 'Bạn (Quản Lý)';
                return `
                  <div class="chat-bubble ${cls}">
                    <div>${escapeHtml(m.text)}</div>
                    <span class="chat-bubble-meta">${escapeHtml(who)} • ${formatDateTime(m.createdAt)}</span>
                  </div>
                `;
              }).join('')}
            </div>

            <form class="livechat-composer" id="admin-reply-form">
              <div class="quick-reply-bar">
                ${quickReplies.map(qr => `<button type="button" class="quick-reply-chip" data-fill-reply="${escapeHtml(qr)}">${escapeHtml(qr.slice(0, 48))}${qr.length > 48 ? '...' : ''}</button>`).join('')}
              </div>
              <div style="display:flex;gap:8px;">
                <input class="input" id="admin-reply-input" placeholder="Nhập câu trả lời trực tiếp tới khách hàng..." required />
                <button type="submit" class="btn btn-primary btn-sm">Gửi Trả Lời</button>
              </div>
            </form>
          `}
        </div>
      </div>
    `;

    const msgBox = host.querySelector('#admin-chat-scroll');
    if (msgBox) msgBox.scrollTop = msgBox.scrollHeight;

    host.querySelector('#btn-refresh-chat')?.addEventListener('click', async () => {
      try {
        const fresh = await storage.getAdminDb();
        this.db.chatThreads = fresh.chatThreads || [];
        this.lastThreadsSignature = JSON.stringify(this.db.chatThreads);
        this.updateLiveChatBadges();
        this.renderLiveChatContent();
        this.showToast('Đã cập nhật tin nhắn mới nhất', 'info');
      } catch (_) {}
    });

    host.querySelectorAll('[data-pick-thread]').forEach(el => {
      el.addEventListener('click', async () => {
        this.selectedThreadId = el.dataset.pickThread;
        const th = this.db.chatThreads.find(t => t.id === this.selectedThreadId);
        if (th && th.unreadByAdmin > 0) {
          th.unreadByAdmin = 0;
          await this.persist();
        }
        this.updateLiveChatBadges();
        this.renderLiveChatContent();
      });
    });

    host.querySelector('#toggle-thread-bot')?.addEventListener('change', async e => {
      if (!activeThread) return;
      activeThread.botActive = e.target.checked;
      if (activeThread.botActive) activeThread.waitingForAdmin = false;
      await this.persist(activeThread.botActive ? 'Đã bật Chat Bot tự động cho khách này' : 'Đã tắt Bot — Quản Lý trả lời trực tiếp');
      this.renderLiveChatContent();
    });

    host.querySelector('#btn-del-thread')?.addEventListener('click', async () => {
      if (!activeThread || !confirm('Xóa lịch sử hội thoại này?')) return;
      this.db.chatThreads = this.db.chatThreads.filter(t => t.id !== activeThread.id);
      this.selectedThreadId = this.getOrderedThreads()[0]?.id || '';
      await this.persist('Đã xóa hội thoại');
      this.renderShell();
    });

    host.querySelectorAll('[data-fill-reply]').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = host.querySelector('#admin-reply-input');
        if (inp) { inp.value = btn.dataset.fillReply; inp.focus(); }
      });
    });

    host.querySelector('#admin-reply-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      if (!activeThread) return;
      const inp = host.querySelector('#admin-reply-input');
      const text = inp.value.trim();
      if (!text) return;
      try {
        const updated = await storage.adminReplyChat(activeThread.id, text);
        const idx = this.db.chatThreads.findIndex(t => t.id === activeThread.id);
        if (idx !== -1) this.db.chatThreads.splice(idx, 1);
        this.db.chatThreads.unshift(updated);
        this.lastThreadsSignature = JSON.stringify(this.db.chatThreads);
        this.updateLiveChatBadges();
        this.renderLiveChatContent();
      } catch (err) {
        this.showToast(err.message || 'Lỗi gửi phản hồi', 'error');
      }
    });
  }

  /* ==========================================================================
     5. QUẢN LÝ CHAT BOT TỰ ĐỘNG & CÂU CHAT NHANH
     ========================================================================== */
  renderChatbotModule() {
    const host = this.root.querySelector('#admin-module-root');
    const cfg = this.db.chatbotConfig || JSON.parse(JSON.stringify(DEFAULT_CHATBOT_CONFIG));
    this.db.chatbotConfig = cfg;

    host.innerHTML = `
      <div class="panel-card" style="margin-bottom:20px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
          <div>
            <h3 style="margin:0;font-size:16px;">Cấu Hình AI Agent &amp; Chat Bot Tư Vấn Khách Hàng</h3>
            <small style="color:var(--ui-muted);">Tự động tư vấn bảng giá, phân tích mệnh Ngũ Hành theo năm sinh, gợi ý mẫu thiệp (suy nghĩ 3–5 giây rồi trả lời)</small>
          </div>
          <label style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;cursor:pointer;">
            <input type="checkbox" id="bot-master-enable" ${cfg.enabled !== false ? 'checked' : ''} />
            <span>Bật Chat Bot tự động</span>
          </label>
        </div>

        <div style="border:1px solid #d5e6db;background:#f3faf5;border-radius:12px;padding:13px 14px;margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;">
            <div>
              <strong style="font-size:13.5px;color:#115935;">Trợ Lý AI Agent (Google Gemini qua Netlify AI Gateway)</strong>
              <div style="font-size:11.5px;color:#33644a;margin-top:2px;">
                ${storage.aiAgentReady
                  ? 'Trạng thái: Đã sẵn sàng AI Gateway — Tự động hiểu câu hỏi tự do, nhớ ngữ cảnh hội thoại và tính Ngũ Hành chuẩn xác.'
                  : 'Trạng thái: Tự động kích hoạt ngay khi deploy lên Netlify (Netlify AI Gateway miễn phí cấu hình key) hoặc gắn GEMINI_API_KEY; khi offline dùng bộ AI Ngũ Hành + Kịch bản thông minh.'}
              </div>
            </div>
            <label style="display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;cursor:pointer;">
              <input type="checkbox" id="bot-ai-enable" ${cfg.aiAgentEnabled !== false ? 'checked' : ''} />
              <span>Bật AI Agent</span>
            </label>
          </div>
          <div class="form-group" style="margin:0;">
            <label>Hướng dẫn phong cách trả lời cho AI Agent</label>
            <textarea class="textarea" rows="2" id="bot-ai-prompt">${escapeHtml(cfg.aiSystemPrompt || DEFAULT_CHATBOT_CONFIG.aiSystemPrompt)}</textarea>
          </div>
        </div>

        <div class="form-group">
          <label>Lời chào mở đầu khi khách mở khung chat</label>
          <textarea class="textarea" rows="2" id="bot-greeting">${escapeHtml(cfg.greeting || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Câu trả lời mặc định (khi không khớp từ khóa nào)</label>
          <textarea class="textarea" rows="2" id="bot-fallback">${escapeHtml(cfg.fallbackReply || '')}</textarea>
        </div>

        <h4 style="margin:18px 0 10px;font-size:14px;">Các Quy Tắc Kịch Bản Tự Động (${(cfg.rules || []).length})</h4>
        ${(cfg.rules || []).map((r, i) => `
          <div style="border:1px solid var(--ui-border);border-radius:12px;padding:12px;margin-bottom:10px;background:var(--ui-surface-soft);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;gap:8px;">
              <label style="display:flex;align-items:center;gap:8px;font-weight:600;font-size:13px;">
                <input type="checkbox" data-rule-en="${i}" ${r.enabled !== false ? 'checked' : ''} />
                <input class="input" style="width:260px;padding:5px 8px;" data-rule-name="${i}" value="${escapeHtml(r.name)}" />
              </label>
              <button type="button" class="btn btn-danger btn-xs" data-del-rule="${i}">Xóa kịch bản</button>
            </div>
            <div class="form-group"><label>Từ khóa nhận diện (cách nhau bằng dấu phẩy, không phân biệt dấu)</label><input class="input" data-rule-kw="${i}" value="${escapeHtml((r.keywords || []).join(', '))}" /></div>
            <div class="form-group" style="margin:0;"><label>Nội dung Bot tự trả lời</label><textarea class="textarea" rows="2" data-rule-reply="${i}">${escapeHtml(r.reply || '')}</textarea></div>
          </div>
        `).join('')}

        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-sm" id="btn-add-bot-rule">+ Thêm kịch bản tự động mới</button>
          <button type="button" class="btn btn-primary btn-sm" id="btn-save-chatbot">Lưu Cấu Hình Chat Bot</button>
        </div>
      </div>

      <div class="grid-2">
        <div class="panel-card">
          <h3 style="margin:0 0 8px;font-size:15px;">Câu Chat Nhanh Cho Khách Hàng Bấm</h3>
          <p style="font-size:12px;color:var(--ui-muted);margin:0 0 12px;">Hiển thị dưới dạng nút gợi ý trong ô chat ngoài Showroom để khách bấm 1 chạm là nhận câu trả lời ngay:</p>
          ${(cfg.customerQuickPrompts || []).map((q, i) => `
            <div style="display:flex;gap:6px;margin-bottom:7px;">
              <input class="input" data-cust-qp="${i}" value="${escapeHtml(q)}" />
              <button type="button" class="btn btn-danger btn-xs" data-del-cqp="${i}">${icon('x', 12)}</button>
            </div>
          `).join('')}
          <div style="display:flex;gap:6px;margin-top:10px;">
            <button type="button" class="btn btn-outline btn-sm" id="btn-add-cqp">+ Thêm câu gợi ý khách</button>
            <button type="button" class="btn btn-primary btn-sm" id="btn-save-qp1">Lưu</button>
          </div>
        </div>

        <div class="panel-card">
          <h3 style="margin:0 0 8px;font-size:15px;">Câu Trả Lời Nhanh Của Quản Trị Viên</h3>
          <p style="font-size:12px;color:var(--ui-muted);margin:0 0 12px;">Hiển thị trong khung Chat Trực Tiếp của bạn để bấm 1 chạm trả lời khách cực nhanh:</p>
          ${(cfg.adminQuickReplies || []).map((q, i) => `
            <div style="display:flex;gap:6px;margin-bottom:7px;">
              <input class="input" data-adm-qr="${i}" value="${escapeHtml(q)}" />
              <button type="button" class="btn btn-danger btn-xs" data-del-aqr="${i}">${icon('x', 12)}</button>
            </div>
          `).join('')}
          <div style="display:flex;gap:6px;margin-top:10px;">
            <button type="button" class="btn btn-outline btn-sm" id="btn-add-aqr">+ Thêm mẫu trả lời nhanh</button>
            <button type="button" class="btn btn-primary btn-sm" id="btn-save-qp2">Lưu</button>
          </div>
        </div>
      </div>
    `;

    const collectIntoCfg = () => {
      cfg.enabled = host.querySelector('#bot-master-enable')?.checked ?? true;
      cfg.aiAgentEnabled = host.querySelector('#bot-ai-enable')?.checked ?? true;
      cfg.aiSystemPrompt = host.querySelector('#bot-ai-prompt')?.value.trim() || DEFAULT_CHATBOT_CONFIG.aiSystemPrompt;
      cfg.greeting = host.querySelector('#bot-greeting')?.value.trim() || '';
      cfg.fallbackReply = host.querySelector('#bot-fallback')?.value.trim() || '';
      host.querySelectorAll('[data-rule-en]').forEach(el => { cfg.rules[Number(el.dataset.ruleEn)].enabled = el.checked; });
      host.querySelectorAll('[data-rule-name]').forEach(el => { cfg.rules[Number(el.dataset.ruleName)].name = el.value; });
      host.querySelectorAll('[data-rule-kw]').forEach(el => { cfg.rules[Number(el.dataset.ruleKw)].keywords = el.value.split(',').map(s => s.trim()).filter(Boolean); });
      host.querySelectorAll('[data-rule-reply]').forEach(el => { cfg.rules[Number(el.dataset.ruleReply)].reply = el.value; });
      host.querySelectorAll('[data-cust-qp]').forEach(el => { cfg.customerQuickPrompts[Number(el.dataset.custQp)] = el.value; });
      host.querySelectorAll('[data-adm-qr]').forEach(el => { cfg.adminQuickReplies[Number(el.dataset.admQr)] = el.value; });
    };

    const collectAndSave = async (toastMsg = 'Đã lưu cấu hình Chat Bot & Câu chat nhanh') => {
      collectIntoCfg();
      await this.persist(toastMsg);
    };

    host.querySelector('#btn-save-chatbot')?.addEventListener('click', () => collectAndSave());
    host.querySelector('#btn-save-qp1')?.addEventListener('click', () => collectAndSave('Đã lưu câu chat nhanh cho khách'));
    host.querySelector('#btn-save-qp2')?.addEventListener('click', () => collectAndSave('Đã lưu mẫu trả lời nhanh'));

    host.querySelector('#btn-add-bot-rule')?.addEventListener('click', async () => {
      collectIntoCfg();
      cfg.rules.push({ id: 'rule_' + Date.now(), name: 'Chủ đề mới', enabled: true, keywords: ['tu khoa'], reply: 'Câu trả lời tự động...' });
      await this.persist();
      this.renderChatbotModule();
    });
    host.querySelectorAll('[data-del-rule]').forEach(b => b.addEventListener('click', async () => { collectIntoCfg(); cfg.rules.splice(Number(b.dataset.delRule), 1); await this.persist(); this.renderChatbotModule(); }));
    host.querySelector('#btn-add-cqp')?.addEventListener('click', async () => { collectIntoCfg(); cfg.customerQuickPrompts.push('Câu hỏi nhanh mới...'); await this.persist(); this.renderChatbotModule(); });
    host.querySelectorAll('[data-del-cqp]').forEach(b => b.addEventListener('click', async () => { collectIntoCfg(); cfg.customerQuickPrompts.splice(Number(b.dataset.delCqp), 1); await this.persist(); this.renderChatbotModule(); }));
    host.querySelector('#btn-add-aqr')?.addEventListener('click', async () => { collectIntoCfg(); cfg.adminQuickReplies.push('Câu trả lời nhanh mới...'); await this.persist(); this.renderChatbotModule(); });
    host.querySelectorAll('[data-del-aqr]').forEach(b => b.addEventListener('click', async () => { collectIntoCfg(); cfg.adminQuickReplies.splice(Number(b.dataset.delAqr), 1); await this.persist(); this.renderChatbotModule(); }));
  }

  /* ==========================================================================
     6. QUẢN LÝ TÀI KHOẢN KHÁCH HÀNG
     ========================================================================== */
  renderUsersModule() {
    const host = this.root.querySelector('#admin-module-root');
    const users = this.db.users || [];
    host.innerHTML = `
      <div class="panel-card">
        <h3 style="margin:0 0 14px;font-size:16px;">Danh Sách Tài Khoản Hệ Thống (${users.length})</h3>
        <div class="orders-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Họ Tên</th>
                <th>Gmail / Email</th>
                <th>Số Điện Thoại</th>
                <th>Kênh Đăng Ký</th>
                <th>Phân Quyền</th>
                <th>Ngày Tạo</th>
              </tr>
            </thead>
            <tbody>
              ${users.map(u => `
                <tr>
                  <td><strong>${escapeHtml(u.name || '—')}</strong></td>
                  <td>${escapeHtml(u.email || '—')}</td>
                  <td>${escapeHtml(u.phone || '—')}</td>
                  <td><span class="badge badge-trial">${escapeHtml((u.provider || 'gmail').toUpperCase())}</span></td>
                  <td><span class="badge ${u.role === 'admin' ? 'badge-brand' : 'badge-paid'}">${u.role === 'admin' ? 'Quản Trị Viên' : 'Khách Hàng'}</span></td>
                  <td style="font-size:12px;color:var(--ui-muted);">${formatDateTime(u.createdAt)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  /* ==========================================================================
     7. CÀI ĐẶT THƯƠNG HIỆU, MB BANK & 4 GÓI DỊCH VỤ
     ========================================================================== */
  renderSettingsModule() {
    const host = this.root.querySelector('#admin-module-root');
    const s = this.db.settings || {};
    host.innerHTML = `
      <div class="panel-card">
        <h3 style="margin:0 0 16px;font-size:16px;">Cài Đặt Thương Hiệu, Ngân Hàng MB Bank &amp; Bảng Giá</h3>
        <form id="admin-settings-form">
          <div class="grid-2">
            <div class="form-group"><label>Tên Thương Hiệu / Studio</label><input class="input" name="brandName" value="${escapeHtml(s.brandName || '')}" /></div>
            <div class="form-group"><label>Hotline / SĐT liên hệ</label><input class="input" name="hotline" value="${escapeHtml(s.hotline || '0354 248 177')}" /></div>
          </div>
          <div class="form-group"><label>Thông điệp hiển thị tại Showroom</label><input class="input" name="tagline" value="${escapeHtml(s.tagline || '')}" /></div>
          <div class="form-group"><label>Link Zalo tư vấn</label><input class="input" name="zaloUrl" value="${escapeHtml(s.zaloUrl || 'https://zalo.me/0354248177')}" /></div>

          <h4 style="margin:18px 0 10px;font-size:14px;">Tài Khoản Ngân Hàng Nhận Thanh Toán VietQR</h4>
          <div class="grid-3">
            <div class="form-group">
              <label>Ngân hàng</label>
              <select class="select" name="paymentBankCode">
                ${VIET_BANKS.map(b => `<option value="${b.code}" ${(s.paymentBankCode || 'MB') === b.code ? 'selected' : ''}>${b.name} (${b.code})</option>`).join('')}
              </select>
            </div>
            <div class="form-group"><label>Số tài khoản</label><input class="input" name="paymentAccountNo" value="${escapeHtml(s.paymentAccountNo || '0354248177')}" /></div>
            <div class="form-group"><label>Tên chủ TK (IN HOA KHÔNG DẤU)</label><input class="input" name="paymentAccountName" value="${escapeHtml(s.paymentAccountName || '')}" placeholder="VD: NGUYEN VAN A" /></div>
          </div>

          <div style="border:1px solid #d5e6da;background:#f7fcf8;border-radius:12px;padding:14px;margin:10px 0 18px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
              <h4 style="margin:0;font-size:14px;color:var(--ui-text);">Tự Động Xác Nhận Tiền Vào &amp; Bàn Giao Thiệp (Webhook Ngân Hàng)</h4>
              <span class="badge ${(s.paymentWebhookSecret || storage.paymentWebhookActive) ? 'badge-paid' : 'badge-trial'}">
                ${(s.paymentWebhookSecret || storage.paymentWebhookActive) ? 'Đang bật xác minh ngân hàng tự động' : 'Chưa gắn Webhook (chế độ chuyển khoản trực tiếp)'}
              </span>
            </div>
            <p style="font-size:12px;color:var(--ui-muted);margin:0 0 10px;line-height:1.55;">
              Để khách quét mã QR chuyển khoản vào <strong>MB Bank ${escapeHtml(s.paymentAccountNo || '0354248177')}</strong> và hệ thống <strong>tự động nhận thông báo đã vào tiền → tự chuyển sang trang bàn giao thiệp sau 3 giây (không cần Quản lý duyệt)</strong>, hãy liên kết tài khoản MB Bank với <strong>SePay.vn</strong> (miễn phí) hoặc <strong>Casso.vn</strong> / <strong>PayOS</strong> rồi dán Webhook URL &amp; API Key bên dưới:
            </p>
            <div style="margin-bottom:10px;">
              <div style="font-size:11.5px;font-weight:700;color:var(--ui-brand);margin-bottom:4px;">Webhook URL (dán vào SePay → Tích hợp Webhook → URL nhận thông báo):</div>
              <div class="link-box">
                <code id="webhook-url-code">${escapeHtml(storage.paymentWebhookUrl || 'https://frabjous-stardust-68eadc.netlify.app/api?action=payment_webhook')}</code>
                <button type="button" class="btn btn-outline btn-xs" id="btn-copy-webhook-url">Sao chép URL</button>
              </div>
            </div>
            <div class="form-group" style="margin:0;">
              <label>Webhook API Key / Secret (SePay Apikey hoặc Casso Secure-Token — bảo mật, không hiển thị ra khách)</label>
              <input class="input" type="password" name="paymentWebhookSecret" value="${escapeHtml(s.paymentWebhookSecret || '')}" placeholder="Dán API Key tạo trên SePay/Casso (để trống nếu chưa gắn)..." autocomplete="new-password" />
            </div>
          </div>

          <h4 style="margin:18px 0 12px;font-size:14px;">Bảng Giá 4 Gói Dịch Vụ</h4>
          <div class="grid-2">
            ${(s.packages || []).map((p, i) => `
              <div style="border:1px solid var(--ui-border);border-radius:12px;padding:12px;background:var(--ui-surface-soft);">
                <div class="grid-2">
                  <div class="form-group"><label>Tên gói #${i + 1}</label><input class="input" data-pkg="${i}:name" value="${escapeHtml(p.name)}" /></div>
                  <div class="form-group"><label>Giá bán (VNĐ)</label><input class="input" type="number" data-pkg-num="${i}:price" value="${Number(p.price)}" /></div>
                </div>
                <div class="grid-3">
                  <div class="form-group" style="margin:0;"><label>Số ảnh</label><input class="input" data-pkg="${i}:photoLimit" value="${escapeHtml(p.photoLimit || '')}" /></div>
                  <div class="form-group" style="margin:0;"><label>Điểm nổi bật</label><input class="input" data-pkg="${i}:duration" value="${escapeHtml(p.duration || '')}" /></div>
                  <div class="form-group" style="margin:0;"><label>Nhãn</label><input class="input" data-pkg="${i}:badge" value="${escapeHtml(p.badge || '')}" /></div>
                </div>
              </div>
            `).join('')}
          </div>

          <h4 style="margin:22px 0 8px;font-size:14px;">Kết Nối Đăng Nhập Nhanh Facebook &amp; Google (OAuth 2.0)</h4>
          <p style="font-size:12px;color:var(--ui-muted);margin:0 0 10px;line-height:1.5;">
            Dán <strong>Facebook App ID</strong> (từ developers.facebook.com) và cấu hình thêm <code>FACEBOOK_APP_SECRET</code>, <code>GOOGLE_CLIENT_SECRET</code>, <code>RESEND_API_KEY</code> (gửi OTP Gmail thật) trong mục <strong>Netlify → Environment Variables</strong>.
          </p>
          <div class="grid-2">
            <div class="form-group"><label>Facebook App ID (liên kết thẳng đăng nhập Facebook)</label><input class="input" name="facebookAppId" value="${escapeHtml(s.facebookAppId || '')}" placeholder="VD: 123456789012345" /></div>
            <div class="form-group"><label>Google Client ID (đăng nhập trực tiếp Gmail)</label><input class="input" name="googleClientId" value="${escapeHtml(s.googleClientId || '')}" placeholder="VD: 12345-xxx.apps.googleusercontent.com" /></div>
          </div>
          <div style="font-size:11.5px;color:var(--ui-muted);background:var(--ui-surface-soft);border:1px solid var(--ui-border);border-radius:10px;padding:10px 12px;">
            <div><strong>Facebook Callback URL:</strong> <code>${escapeHtml(`${window.location.origin}/api?action=oauth_facebook_callback`)}</code></div>
            <div style="margin-top:4px;"><strong>Google Callback URL:</strong> <code>${escapeHtml(`${window.location.origin}/api?action=oauth_google_callback`)}</code></div>
          </div>

          <button type="submit" class="btn btn-primary" style="margin-top:20px;">Lưu Toàn Bộ Cài Đặt</button>
        </form>
      </div>
    `;

    host.querySelector('#btn-copy-webhook-url')?.addEventListener('click', () => {
      const url = host.querySelector('#webhook-url-code')?.textContent?.trim() || '';
      if (url) navigator.clipboard?.writeText(url).then(() => this.showToast('Đã sao chép Webhook URL nhận thông báo ngân hàng!', 'success'));
    });

    host.querySelector('#admin-settings-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      this.db.settings.brandName = fd.get('brandName').toString().trim();
      this.db.settings.hotline = fd.get('hotline').toString().trim();
      this.db.settings.phoneRaw = this.db.settings.hotline.replace(/\D/g, '');
      this.db.settings.tagline = fd.get('tagline').toString().trim();
      this.db.settings.zaloUrl = fd.get('zaloUrl').toString().trim();
      const bankCode = fd.get('paymentBankCode').toString();
      this.db.settings.paymentBankCode = bankCode;
      this.db.settings.paymentBankName = (VIET_BANKS.find(b => b.code === bankCode)?.name) || bankCode;
      this.db.settings.paymentAccountNo = fd.get('paymentAccountNo').toString().trim();
      this.db.settings.paymentAccountName = fd.get('paymentAccountName').toString().trim().toUpperCase();
      this.db.settings.paymentWebhookSecret = (fd.get('paymentWebhookSecret') || '').toString().trim();
      this.db.settings.facebookAppId = (fd.get('facebookAppId') || '').toString().trim();
      this.db.settings.googleClientId = (fd.get('googleClientId') || '').toString().trim();
      host.querySelectorAll('[data-pkg]').forEach(el => { const [i, f] = el.dataset.pkg.split(':'); this.db.settings.packages[Number(i)][f] = el.value; });
      host.querySelectorAll('[data-pkg-num]').forEach(el => { const [i, f] = el.dataset.pkgNum.split(':'); this.db.settings.packages[Number(i)][f] = Number(el.value) || 0; });
      await this.persist('Đã lưu cài đặt hệ thống');
      this.renderShell();
    });
  }

  /* ==========================================================================
     MODAL TẠO THIỆP MỚI CHO KHÁCH
     ========================================================================== */
  openNewInvitationModal(prefill = {}) {
    const templates = this.db.templates || TEMPLATES;
    const pkgs = this.db.settings?.packages || [];
    this.openModal(`
      <div class="modal-head">
        <h3>Tạo Đơn Thiệp Cưới Mới</h3>
        <button type="button" class="btn btn-ghost btn-sm" data-close-modal>${icon('x', 16)}</button>
      </div>
      <form id="admin-new-inv-form">
        <div class="grid-2">
          <div class="form-group"><label>Tên Chú Rể *</label><input class="input" name="groomName" required placeholder="VD: Quốc Bảo" /></div>
          <div class="form-group"><label>Tên Cô Dâu *</label><input class="input" name="brideName" required placeholder="VD: Kim Liên" /></div>
        </div>
        <div class="grid-2">
          <div class="form-group"><label>Tên Khách Đặt</label><input class="input" name="customerName" value="${escapeHtml(prefill.customerName || '')}" /></div>
          <div class="form-group"><label>SĐT / Zalo Khách</label><input class="input" name="customerPhone" value="${escapeHtml(prefill.customerPhone || '')}" /></div>
        </div>
        <div class="form-group"><label>Gmail Khách (để tự hiện trong Tài Khoản của khách)</label><input class="input" name="customerEmail" value="${escapeHtml(prefill.customerEmail || '')}" placeholder="khachhang@gmail.com" /></div>
        <div class="grid-2">
          <div class="form-group">
            <label>Mẫu thiệp</label>
            <select class="select" name="templateId">
              ${templates.map(t => `<option value="${escapeHtml(t.id)}" ${t.id === (prefill.defaultTplId || templates[0]?.id) ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Gói dịch vụ</label>
            <select class="select" name="pkgIdx">
              ${pkgs.map((p, idx) => `<option value="${idx}" ${p.name === prefill.packageName ? 'selected' : ''}>${escapeHtml(p.name)} — ${formatVnd(p.price)}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label>Trạng thái thanh toán</label>
          <select class="select" name="status">
            <option value="trial" ${(prefill.status || 'trial') === 'trial' ? 'selected' : ''}>Dùng thử (Hiện dải bản thử)</option>
            <option value="deposit" ${prefill.status === 'deposit' ? 'selected' : ''}>Đã đặt cọc</option>
            <option value="paid" ${prefill.status === 'paid' ? 'selected' : ''}>Đã thanh toán đủ (Mở khóa VIP)</option>
          </select>
        </div>
        <button type="submit" class="btn btn-primary" style="width:100%;padding:11px;">Tạo Thiệp &amp; Mở Trình Thiết Kế</button>
      </form>
    `);

    document.querySelector('#admin-new-inv-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const groom = fd.get('groomName').toString().trim();
      const bride = fd.get('brideName').toString().trim();
      const tplId = fd.get('templateId').toString();
      const pkg = pkgs[Number(fd.get('pkgIdx'))] || { name: 'Gói Tiêu Chuẩn 3D', price: 229000 };
      const status = fd.get('status').toString();

      const slug = (groom + '-' + bride)
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 5);

      const newInv = createInvitationFromTemplate(tplId, {
        id: slug,
        title: `${groom} & ${bride}`,
        customerName: fd.get('customerName').toString().trim() || groom,
        customerPhone: fd.get('customerPhone').toString().trim(),
        packageName: pkg.name,
        price: prefill.price || pkg.price,
        status,
        showWatermark: status === 'trial',
      });
      newInv.order.customerEmail = fd.get('customerEmail').toString().trim().toLowerCase();
      newInv.order.userId = prefill.userId || '';
      const tplObj = templates.find(t => t.id === tplId);
      if (tplObj) newInv.design = JSON.parse(JSON.stringify(tplObj.design));
      newInv.content.groomName = groom;
      newInv.content.brideName = bride;

      this.db.invitations.unshift(newInv);
      await this.persist(`Đã tạo thiệp cho ${groom} & ${bride}`);
      this.closeModal();
      this.onOpenInvitationEditor(newInv.id);
    });
  }
}
