/**
 * L'Amour Atelier — Trình Soạn Thiệp 3 Cột Tinh Gọn Cao Cấp
 * Loại bỏ toàn bộ icon thừa trên tiêu đề và nút văn bản, bổ sung trình chọn Ảnh Nền Mờ Bìa & Hoa Văn Ép Kim.
 */

import {
  TEMPLATES,
  FONT_OPTIONS,
  TEXTURE_OPTIONS,
  INTRO_MODES,
  READING_MODES,
  SCROLL_FX_MODES,
  PARTICLE_EFFECTS,
  MUSIC_TRACKS,
  ORNAMENT_STYLES,
  VIET_BANKS,
  SECTION_CATALOG,
  NGU_HANH_DATA,
  ZODIAC_PALETTES,
  COPY_SUGGESTIONS,
  buildTrialConfig,
  getTrialState,
  analyzeCoupleFengShui,
  generateHarmonyMix,
} from './data.js?v=14';
import { COVER_BACKDROPS, resolveBackdropUrl } from './artwork.js?v=14';
import { InvitationRenderer, escapeHtml } from './renderer.js?v=14';
import { musicEngine } from './audio-fx.js?v=14';
import { storage } from './storage.js?v=14';
import { icon } from './icons.js?v=14';

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function buildAbsoluteUrl(params) {
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
  });
  return url.toString();
}

export class StudioEditor {
  constructor(container, options) {
    this.container = container;
    this.mode = options.mode || 'admin';
    this.invitation = deepClone(options.invitation);
    this.customTemplates = options.customTemplates || [];
    this.settings = options.settings || {};
    this.clientToken = options.clientToken || '';
    this.onSave = options.onSave;
    this.onSaveAsTemplate = options.onSaveAsTemplate;
    this.onBack = options.onBack;
    this.onOpenShareModal = options.onOpenShareModal;
    this.onCheckoutOrder = options.onCheckoutOrder;
    this.onGoCheckoutPage = options.onGoCheckoutPage;
    this.currentUser = options.currentUser || null;
    this.onToast = options.onToast || (() => {});

    this.activeTab = options.initialTab || (this.mode === 'admin' ? 'design' : 'content');
    this.isTemplateEditor = Boolean(options.isTemplateEditor);
    this.deviceMode = 'mobile';
    this.mobileView = 'edit'; // 'edit' | 'preview' on phone screens <= 980px
    this.blankPreview = Boolean(options.isTemplateEditor);
    this.selectedElement = 'Hỏa';
    this.selectedZaloTplIdx = 0;
    this.selectedSectionFilter = 'all';
    const pkgs = this.settings.packages || [];
    const matchedPkg = pkgs.findIndex(p => p.name === this.invitation.order?.packageName);
    this.selectedPkgIdx = matchedPkg >= 0 ? matchedPkg : Math.min(1, Math.max(0, pkgs.length - 1));
    this.checkoutCustomerName = this.invitation.order?.customerName || this.currentUser?.name || '';
    this.checkoutCustomerPhone = this.invitation.order?.customerPhone || this.currentUser?.phone || '';
    this.checkoutNote = '';
    this.mixColorA = this.invitation.design?.primaryColor || '#511419';
    this.mixColorB = this.invitation.design?.secondaryColor || '#C59A57';
    this.history = [deepClone(this.invitation)];
    this.historyIdx = 0;
    this.renderer = null;
    this.saving = false;
    this.submittingCheckout = false;
  }

  pushHistory() {
    this.history = this.history.slice(0, this.historyIdx + 1);
    this.history.push(deepClone(this.invitation));
    if (this.history.length > 30) this.history.shift();
    this.historyIdx = this.history.length - 1;
    this.updateUndoRedoButtons();
  }

  undo() {
    if (this.historyIdx <= 0) return;
    this.historyIdx--;
    this.invitation = deepClone(this.history[this.historyIdx]);
    this.renderInspector();
    this.refreshPreview();
    this.updateUndoRedoButtons();
    this.onToast('Đã hoàn tác thao tác trước', 'info');
  }

  redo() {
    if (this.historyIdx >= this.history.length - 1) return;
    this.historyIdx++;
    this.invitation = deepClone(this.history[this.historyIdx]);
    this.renderInspector();
    this.refreshPreview();
    this.updateUndoRedoButtons();
  }

  updateUndoRedoButtons() {
    const u = this.container.querySelector('[data-action="undo"]');
    const r = this.container.querySelector('[data-action="redo"]');
    if (u) u.disabled = this.historyIdx <= 0;
    if (r) r.disabled = this.historyIdx >= this.history.length - 1;
  }

  mount() {
    const isAdmin = this.mode === 'admin';
    const isPaid = this.invitation.order?.status === 'paid';
    const trialState = !isAdmin ? getTrialState(this.invitation) : { active: false, expired: false, limits: null };
    const tabs = isAdmin
      ? [
          { id: 'templates', ico: 'layout', label: 'Kho Mẫu' },
          { id: 'layout', ico: 'layers', label: 'Bố Cục' },
          { id: 'design', ico: 'palette', label: 'Bìa & Màu' },
          { id: 'content', ico: 'pen', label: 'Nội Dung' },
          { id: 'fx', ico: 'sparkles', label: 'Nhạc & FX' },
          { id: 'guests', ico: 'users', label: 'Khách Mời' },
          { id: 'order', ico: 'briefcase', label: 'Đơn Hàng' },
        ]
      : [
          { id: 'content', ico: 'pen', label: 'Từng Phần' },
          { id: 'templates', ico: 'layout', label: 'Đổi Mẫu' },
          { id: 'client-form', ico: 'clipboard', label: 'Form Khách' },
          { id: 'guests', ico: 'mail', label: 'Gửi Khách' },
          { id: 'fx', ico: 'music', label: 'Nhạc Nền' },
          { id: 'checkout', ico: 'creditCard', label: isPaid ? 'Đã Mua' : (trialState.active ? 'Nâng Cấp' : 'Thanh Toán') },
        ];

    this.container.innerHTML = `
      <div class="studio-layout">
        ${!isAdmin ? `
          <div class="client-banner">
            <span>
              ${trialState.active
                ? `<strong>DÙNG THỬ ${trialState.days} NGÀY (${escapeHtml(trialState.remainingText)})</strong> — Giới hạn tối đa ${trialState.limits.maxPhotos} ảnh Album, khóa QR mừng cưới, nhạc MP3 &amp; link cá nhân hóa`
                : `<strong>TRANG CHỈNH SỬA KHÁCH HÀNG</strong> — Chỉnh sửa ảnh, chữ &amp; nội dung từng phần cho mẫu <strong>${escapeHtml(this.invitation.templateName || this.invitation.title)}</strong> ${isPaid ? '• <span style="color:#9ef2c3;">Đã kích hoạt VIP</span>' : '• <span style="color:#ffe4a8;">Bản nháp xem thử — Thanh toán ngay để gỡ watermark</span>'}`}
            </span>
            <span>${trialState.active ? `<button type="button" class="btn btn-gold btn-xs" data-action="go-checkout">Nâng Cấp Mở Khóa Ngay</button>` : 'Nhấn trực tiếp vào bất kỳ phần nào trên thiệp để sửa ngay'}</span>
          </div>
        ` : ''}
        <header class="studio-topbar">
          <div class="studio-topbar-left">
            ${isAdmin
              ? `<button type="button" class="btn btn-outline btn-sm" data-action="back">${icon('arrowLeft', 14)} Quản Lý</button>`
              : this.onBack
                ? `<button type="button" class="btn btn-outline btn-sm" data-action="back">${icon('arrowLeft', 14)} Tài Khoản</button>`
                : `<div class="brand-monogram" style="width:30px;height:30px;font-size:16px;">L</div>`}
            <input class="studio-title-input" type="text" data-bind-title value="${escapeHtml(this.invitation.title)}" placeholder="Tên thiệp cưới của bạn..." />
          </div>
          <div class="studio-topbar-center">
            <button type="button" class="btn btn-ghost btn-sm" data-action="undo" title="Hoàn tác">${icon('undo', 14)}</button>
            <button type="button" class="btn btn-ghost btn-sm" data-action="redo" title="Làm lại">${icon('redo', 14)}</button>
            <div style="width:1px;height:18px;background:var(--ui-border);"></div>
            <button type="button" class="btn btn-sm ${this.deviceMode === 'mobile' ? 'btn-primary' : 'btn-outline'}" data-device="mobile" title="Xem trên điện thoại">${icon('smartphone', 14)}</button>
            <button type="button" class="btn btn-sm ${this.deviceMode === 'desktop' ? 'btn-primary' : 'btn-outline'}" data-device="desktop" title="Xem trên máy tính">${icon('monitor', 14)}</button>
            ${isAdmin ? `
              <button type="button" class="btn btn-sm ${this.blankPreview ? 'btn-gold' : 'btn-outline'}" data-action="toggle-blank">
                ${this.blankPreview ? 'Đang xem Mẫu Trống' : 'Mẫu Trống'}
              </button>
            ` : ''}
            <button type="button" class="btn btn-outline btn-sm" data-action="replay-intro">Xem Mở Bìa</button>
          </div>
          <div class="studio-topbar-right">
            ${isAdmin && !this.isTemplateEditor ? `<button type="button" class="btn btn-outline btn-sm" data-action="save-template">Lưu Thành Mẫu</button>` : ''}
            ${!this.isTemplateEditor ? `<button type="button" class="btn btn-outline btn-sm" data-action="share-links">Lấy Link</button>` : ''}
            <button type="button" class="btn ${!isAdmin && !isPaid ? 'btn-outline' : 'btn-primary'} btn-sm" data-action="save-all">${this.isTemplateEditor ? 'Lưu Mẫu Thiệp' : 'Lưu Thiệp'}</button>
            ${!isAdmin ? `<button type="button" class="btn ${isPaid ? 'btn-outline' : 'btn-gold'} btn-sm" data-action="go-checkout">${isPaid ? 'Nhận Sản Phẩm &amp; QR' : 'Hoàn Tất &amp; Chuyển Tiền'}</button>` : ''}
          </div>
        </header>

        <div class="studio-mobile-tabs" role="tablist" aria-label="Chuyển chế độ trên điện thoại">
          <button type="button" class="studio-mobile-tab ${this.mobileView === 'edit' ? 'active' : ''}" data-mobile-switch="edit">Chỉnh Sửa Nội Dung</button>
          <button type="button" class="studio-mobile-tab ${this.mobileView === 'preview' ? 'active' : ''}" data-mobile-switch="preview">Xem Trước Thiệp</button>
        </div>

        <div class="studio-workspace" data-mobile-view="${this.mobileView}">
          <nav class="studio-rail">
            ${tabs.map(t => `
              <button type="button" class="rail-btn ${this.activeTab === t.id ? 'active' : ''}" data-tab="${t.id}">
                ${icon(t.ico, 18)}
                <span>${t.label}</span>
              </button>
            `).join('')}
          </nav>

          <aside class="studio-inspector" id="studio-inspector-pane"></aside>

          <main class="studio-canvas">
            <div class="preview-device-frame ${this.deviceMode === 'desktop' ? 'desktop-mode' : ''}" id="studio-preview-host"></div>
          </main>
        </div>
      </div>
    `;

    this.bindTopbarEvents();
    this.renderInspector();
    this.initPreview();
    this.updateUndoRedoButtons();
  }

  bindTopbarEvents() {
    const root = this.container;
    root.querySelector('[data-action="back"]')?.addEventListener('click', () => {
      musicEngine.stop();
      this.destroy();
      this.onBack?.();
    });
    root.querySelector('[data-bind-title]')?.addEventListener('input', e => { this.invitation.title = e.target.value; });
    root.querySelector('[data-action="undo"]')?.addEventListener('click', () => this.undo());
    root.querySelector('[data-action="redo"]')?.addEventListener('click', () => this.redo());

    root.querySelectorAll('[data-device]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.deviceMode = btn.dataset.device;
        root.querySelectorAll('[data-device]').forEach(b => {
          b.classList.toggle('btn-primary', b.dataset.device === this.deviceMode);
          b.classList.toggle('btn-outline', b.dataset.device !== this.deviceMode);
        });
        const frame = root.querySelector('#studio-preview-host');
        frame?.classList.toggle('desktop-mode', this.deviceMode === 'desktop');
        setTimeout(() => this.renderer?.particleCtrl?.resize(), 280);
      });
    });

    root.querySelector('[data-action="toggle-blank"]')?.addEventListener('click', e => {
      this.blankPreview = !this.blankPreview;
      e.currentTarget.classList.toggle('btn-gold', this.blankPreview);
      e.currentTarget.classList.toggle('btn-outline', !this.blankPreview);
      e.currentTarget.textContent = this.blankPreview ? 'Đang xem Mẫu Trống' : 'Mẫu Trống';
      this.refreshPreview();
      this.onToast(this.blankPreview ? 'Đã bật Chế độ Mẫu Trống (Không ảnh cặp đôi, không tên thật)' : 'Đã tắt Chế độ Mẫu Trống', 'info');
    });

    root.querySelector('[data-action="replay-intro"]')?.addEventListener('click', () => this.renderer?.replayIntro());

    root.querySelector('[data-action="save-template"]')?.addEventListener('click', () => {
      const name = prompt('Đặt tên cho Mẫu Thiệp Mới này (để trưng bày trên Showroom cho khách chọn):', `Mẫu ${this.invitation.title}`);
      if (!name || !name.trim()) return;
      this.onSaveAsTemplate?.({
        id: 'tpl_custom_' + Date.now(),
        name: name.trim(),
        category: 'Tự thiết kế',
        tag: 'Mới',
        posterStyle: 'envelope',
        elements: ['Kim', 'Mộc', 'Thủy', 'Hỏa', 'Thổ'],
        desc: 'Mẫu độc quyền được thiết kế trong Studio.',
        design: deepClone(this.invitation.design),
      });
    });

    root.querySelector('[data-action="share-links"]')?.addEventListener('click', () => this.onOpenShareModal?.(this.invitation, this.mode));

    root.querySelectorAll('[data-action="go-checkout"]').forEach(btn => {
      btn.addEventListener('click', () => this.openCheckoutFlow());
    });

    root.querySelector('[data-action="save-all"]')?.addEventListener('click', async e => {
      if (this.saving) return;
      this.saving = true;
      const btn = e.currentTarget;
      btn.disabled = true;
      btn.textContent = 'Đang lưu...';
      try {
        await this.onSave?.(deepClone(this.invitation));
        this.onToast('Đã lưu thay đổi thành công', 'success');
      } catch (err) {
        this.onToast(err.message || 'Lỗi khi lưu dữ liệu', 'error');
      } finally {
        this.saving = false;
        btn.disabled = false;
        btn.textContent = this.isTemplateEditor ? 'Lưu Mẫu Thiệp' : 'Lưu Thiệp';
      }
    });

    root.querySelectorAll('[data-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.activeTab = btn.dataset.tab;
        root.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === this.activeTab));
        this.renderInspector();
        this.setMobileView('edit');
      });
    });

    root.querySelectorAll('[data-mobile-switch]').forEach(btn => {
      btn.addEventListener('click', () => this.setMobileView(btn.dataset.mobileSwitch));
    });
  }

  setMobileView(view) {
    this.mobileView = view === 'preview' ? 'preview' : 'edit';
    const ws = this.container.querySelector('.studio-workspace');
    if (ws) ws.dataset.mobileView = this.mobileView;
    this.container.querySelectorAll('[data-mobile-switch]').forEach(b => {
      b.classList.toggle('active', b.dataset.mobileSwitch === this.mobileView);
    });
    if (this.mobileView === 'preview') {
      setTimeout(() => this.renderer?.particleCtrl?.resize(), 180);
    }
  }

  async openCheckoutFlow() {
    if (this.onGoCheckoutPage) {
      try {
        if (!this.saving) {
          this.saving = true;
          await this.onSave?.(deepClone(this.invitation));
        }
      } catch (_) {
        // Still allow opening checkout page even if trial expired so user can upgrade & unlock
      } finally {
        this.saving = false;
      }
      musicEngine.stop();
      this.destroy();
      this.onGoCheckoutPage(deepClone(this.invitation));
      return;
    }
    this.activeTab = 'checkout';
    this.container.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === 'checkout'));
    this.renderInspector();
  }

  initPreview() {
    const host = this.container.querySelector('#studio-preview-host');
    if (!host) return;
    if (this.renderer) this.renderer.destroy();
    this.renderer = new InvitationRenderer(host, {
      inPreview: true,
      editable: true,
      blankMode: this.blankPreview,
      skipIntro: true,
      brandName: this.settings.brandName || "L'Amour Atelier",
      onToast: this.onToast,
      onSelectSection: sectionType => this.handlePreviewSectionClick(sectionType),
    });
    this.renderer.render(this.invitation);
  }

  refreshPreview() {
    if (!this.renderer) return;
    this.renderer.render(this.invitation, { blankMode: this.blankPreview });
  }

  handlePreviewSectionClick(sectionType) {
    this.activeTab = (sectionType === 'rsvp' || sectionType === 'guestbook') ? 'client-form' : 'content';
    if (this.activeTab === 'content') this.selectedSectionFilter = sectionType;
    this.container.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === this.activeTab));
    this.renderInspector();
    this.setMobileView('edit');
    const targetBox = this.container.querySelector(`[data-content-group="${sectionType}"]`);
    if (targetBox) {
      targetBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      targetBox.style.boxShadow = '0 0 0 2px var(--ui-brand)';
      setTimeout(() => { targetBox.style.boxShadow = ''; }, 1300);
    }
  }

  renderInspector() {
    const pane = this.container.querySelector('#studio-inspector-pane');
    if (!pane) return;
    switch (this.activeTab) {
      case 'templates': pane.innerHTML = this.tplTemplatesTab(); this.bindTemplatesTab(pane); break;
      case 'layout': pane.innerHTML = this.tplLayoutTab(); this.bindLayoutTab(pane); break;
      case 'design': pane.innerHTML = this.tplDesignTab(); this.bindDesignTab(pane); break;
      case 'content': pane.innerHTML = this.tplContentTab(); this.bindContentTab(pane); break;
      case 'fx': pane.innerHTML = this.tplFxTab(); this.bindFxTab(pane); break;
      case 'client-form': pane.innerHTML = this.tplClientFormTab(); this.bindClientFormTab(pane); break;
      case 'guests': pane.innerHTML = this.tplGuestsTab(); this.bindGuestsTab(pane); break;
      case 'order': pane.innerHTML = this.tplOrderTab(); this.bindOrderTab(pane); break;
      case 'checkout': pane.innerHTML = this.tplCheckoutTab(); this.bindCheckoutTab(pane); break;
    }
  }

  /* ================= TAB 1: KHO MẪU ================= */
  tplTemplatesTab() {
    const allTemplates = this.customTemplates.length ? this.customTemplates : TEMPLATES;
    return `
      <h4 class="inspector-title"><span>Kho Mẫu Giao Diện</span> <small style="color:var(--ui-muted);">${allTemplates.length} mẫu</small></h4>
      <p style="font-size:12px;color:var(--ui-muted);margin:0 0 12px;line-height:1.5;">Đổi mẫu tức thì mà không làm mất thông tin, ảnh cưới hay danh sách khách mời đã nhập.</p>
      ${allTemplates.map(t => `
        <div class="palette-option" data-apply-template="${escapeHtml(t.id)}" style="${this.invitation.templateId === t.id ? 'border-color:var(--ui-brand);background:var(--ui-brand-soft);' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
            <strong style="font-size:13px;">${escapeHtml(t.name)}</strong>
            <span class="badge badge-gold">${escapeHtml(t.tag || t.category)}</span>
          </div>
          <p style="margin:4px 0 0;font-size:11.5px;color:var(--ui-muted);line-height:1.45;">${escapeHtml(t.desc)}</p>
          <div class="palette-strip">
            <span style="background:${t.design.bgGradient1}"></span>
            <span style="background:${t.design.bgGradient2}"></span>
            <span style="background:${t.design.contrastBg || t.design.primaryColor}"></span>
            <span style="background:${t.design.secondaryColor}"></span>
            <span style="background:${t.design.ornamentColor}"></span>
          </div>
        </div>
      `).join('')}
    `;
  }

  bindTemplatesTab(pane) {
    const allTemplates = this.customTemplates.length ? this.customTemplates : TEMPLATES;
    pane.querySelectorAll('[data-apply-template]').forEach(el => {
      el.addEventListener('click', () => {
        const tpl = allTemplates.find(t => t.id === el.dataset.applyTemplate);
        if (!tpl) return;
        this.invitation.templateId = tpl.id;
        this.invitation.templateName = tpl.name;
        this.invitation.design = deepClone(tpl.design);
        if (tpl.design.musicTrack) this.invitation.music.trackId = tpl.design.musicTrack;
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
        this.onToast(`Đã áp dụng mẫu "${tpl.name}" (giữ nguyên toàn bộ ảnh & chữ của bạn)`, 'success');
      });
    });
  }

  /* ================= TAB 2: BỐ CỤC & HIỆU ỨNG TRANG ================= */
  tplLayoutTab() {
    const d = this.invitation.design;
    return `
      <h4 class="inspector-title"><span>Bố Cục &amp; Chuyển Cảnh</span></h4>

      <div class="inspector-box">
        <h5>Hiệu Ứng Mở Bìa, Kéo Xuống &amp; Lật Trang</h5>
        <div class="form-group">
          <label>Hiệu Ứng Mở Bìa (5 phong cách)</label>
          <select class="select" data-design="introMode">
            ${INTRO_MODES.map(m => `<option value="${m.id}" ${d.introMode === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Chế Độ Kéo Xuống / Lật Trang</label>
          <select class="select" data-design="readingMode">
            ${READING_MODES.map(m => `<option value="${m.id}" ${d.readingMode === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom:8px;">
          <label>Chuyển Động Xuất Hiện Khi Kéo Xuống</label>
          <select class="select" data-design="scrollFx">
            ${SCROLL_FX_MODES.map(m => `<option value="${m.id}" ${(d.scrollFx || 'cinematic-rise') === m.id ? 'selected' : ''}>${m.label}</option>`).join('')}
          </select>
        </div>
        <button type="button" class="btn btn-outline btn-sm" style="width:100%;" data-action="test-intro-inline">Xem thử hiệu ứng mở bìa</button>
      </div>

      <div class="inspector-box">
        <h5>Khối Đang Hiển Thị (${this.invitation.sections.length})</h5>
        ${this.invitation.sections.map((sec, idx) => `
          <div class="section-row">
            <div style="display:flex;align-items:center;gap:8px;min-width:0;">
              <input type="checkbox" data-sec-toggle="${idx}" ${sec.enabled ? 'checked' : ''} />
              <span style="font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(sec.title)}</span>
            </div>
            <div class="section-row-actions">
              <button type="button" class="btn btn-outline btn-xs" data-sec-move="${idx}:-1" ${idx === 0 ? 'disabled' : ''}>${icon('arrowUp', 12)}</button>
              <button type="button" class="btn btn-outline btn-xs" data-sec-move="${idx}:1" ${idx === this.invitation.sections.length - 1 ? 'disabled' : ''}>${icon('arrowDown', 12)}</button>
              <button type="button" class="btn btn-danger btn-xs" data-sec-del="${idx}" title="Xóa khối">${icon('x', 12)}</button>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="inspector-box">
        <h5>Thêm Khối Mới</h5>
        <div style="display:grid;grid-template-columns:1fr;gap:6px;">
          ${SECTION_CATALOG.map(cat => `
            <button type="button" class="btn btn-outline btn-sm" style="justify-content:flex-start;" data-sec-add="${cat.type}">
              + ${cat.label}
            </button>
          `).join('')}
        </div>
      </div>
    `;
  }

  bindLayoutTab(pane) {
    pane.querySelectorAll('[data-design]').forEach(el => {
      el.addEventListener('change', () => { this.invitation.design[el.dataset.design] = el.value; this.pushHistory(); this.refreshPreview(); });
    });
    pane.querySelector('[data-action="test-intro-inline"]')?.addEventListener('click', () => this.renderer?.replayIntro());
    pane.querySelectorAll('[data-sec-toggle]').forEach(cb => {
      cb.addEventListener('change', () => { this.invitation.sections[Number(cb.dataset.secToggle)].enabled = cb.checked; this.pushHistory(); this.refreshPreview(); });
    });
    pane.querySelectorAll('[data-sec-move]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [idxStr, dirStr] = btn.dataset.secMove.split(':');
        const idx = Number(idxStr), target = idx + Number(dirStr);
        if (target < 0 || target >= this.invitation.sections.length) return;
        const arr = this.invitation.sections;
        [arr[idx], arr[target]] = [arr[target], arr[idx]];
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
      });
    });
    pane.querySelectorAll('[data-sec-del]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (this.invitation.sections.length <= 1) { this.onToast('Cần giữ tối thiểu 1 khối', 'error'); return; }
        this.invitation.sections.splice(Number(btn.dataset.secDel), 1);
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
      });
    });
    pane.querySelectorAll('[data-sec-add]').forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = SECTION_CATALOG.find(c => c.type === btn.dataset.secAdd);
        if (!cat) return;
        this.invitation.sections.push({ id: 'sec_' + cat.type + '_' + Date.now().toString(36), type: cat.type, enabled: true, title: cat.label });
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
        this.onToast(`Đã thêm khối "${cat.label}"`, 'success');
      });
    });
  }

  /* ================= TAB 3: ẢNH NỀN MỜ BÌA, HOA VĂN, MÀU SẮC & PHONG THỦY ================= */
  tplDesignTab() {
    const d = this.invitation.design;
    const c = this.invitation.content;
    const fsReport = analyzeCoupleFengShui(c.groomYear, c.brideYear);
    const activeElement = this.selectedElement || fsReport?.primaryElement || 'Hỏa';
    const nhData = NGU_HANH_DATA[activeElement];

    return `
      <h4 class="inspector-title"><span>Ảnh Nền Bìa, Màu &amp; Mệnh</span></h4>

      <!-- 0. ẢNH NỀN MỜ BÌA THIỆP & HOA VĂN ÉP KIM -->
      <div class="inspector-box">
        <h5>Ảnh Nền Mờ Bìa Thiệp &amp; Hoa Văn</h5>
        <p style="font-size:11.5px;color:var(--ui-muted);margin:0 0 9px;line-height:1.45;">Chọn ảnh nền mờ nghệ thuật phía sau bìa mở &amp; đầu thiệp, hoặc tải ảnh riêng của khách:</p>
        <div class="backdrop-grid">
          <button type="button" class="backdrop-tile ${d.coverBackdrop === 'none' ? 'active' : ''}" data-pick-backdrop="none">
            <div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:10px;color:#666;background:#f3f1ed;">Không ảnh</div>
          </button>
          ${COVER_BACKDROPS.map(b => `
            <button type="button" class="backdrop-tile ${d.coverBackdrop === b.id ? 'active' : ''}" data-pick-backdrop="${b.id}" title="${escapeHtml(b.name)}">
              <img src="${b.url}" alt="${escapeHtml(b.name)}" loading="lazy" />
              <span>${escapeHtml(b.name)}</span>
            </button>
          `).join('')}
        </div>
        <label class="upload-drop" style="width:100%;padding:8px;margin-bottom:10px;">
          Tải ảnh nền mờ riêng từ máy
          <input type="file" accept="image/*" style="display:none;" data-upload-backdrop />
        </label>
        <div class="grid-2" style="margin-bottom:8px;">
          <div class="form-group" style="margin:0;">
            <label>Độ mờ ảnh nền: <b>${d.coverBlur ?? 5}px</b></label>
            <input type="range" min="0" max="18" data-design-range="coverBlur" value="${d.coverBlur ?? 5}" style="width:100%;" />
          </div>
          <div class="form-group" style="margin:0;">
            <label>Lớp phủ màu: <b>${Math.round((d.coverOverlay ?? 0.54) * 100)}%</b></label>
            <input type="range" min="20" max="85" data-cover-overlay value="${Math.round((d.coverOverlay ?? 0.54) * 100)}" style="width:100%;" />
          </div>
        </div>
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;">
          <input type="checkbox" data-design-bool="coverPattern" ${d.coverPattern !== false ? 'checked' : ''} />
          <span>Phủ khung hoa văn ép kim nghệ thuật lên bìa thiệp</span>
        </label>
      </div>

      <!-- 1. TƯ VẤN NGŨ HÀNH -->
      <div class="inspector-box" style="background:#fdfbf7;">
        <h5>Tư Vấn Màu Hợp Tuổi — Ngũ Hành</h5>
        <div class="grid-2" style="margin-bottom:8px;">
          <div class="form-group" style="margin:0;">
            <label>Năm sinh Chú Rể</label>
            <input class="input" type="number" min="1960" max="2015" data-fs-year="groomYear" value="${escapeHtml(c.groomYear || '')}" placeholder="VD: 1996" />
          </div>
          <div class="form-group" style="margin:0;">
            <label>Năm sinh Cô Dâu</label>
            <input class="input" type="number" min="1960" max="2015" data-fs-year="brideYear" value="${escapeHtml(c.brideYear || '')}" placeholder="VD: 1998" />
          </div>
        </div>
        ${fsReport ? `
          <div style="font-size:11.5px;line-height:1.5;padding:9px 10px;border-radius:8px;background:#f8f1e2;border:1px solid #e7d4ae;color:#543a0c;margin-bottom:10px;">
            <strong>Phân tích cặp đôi:</strong> ${escapeHtml(fsReport.summary)}
          </div>
        ` : ''}
        <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px;">
          ${Object.keys(NGU_HANH_DATA).map(el => `
            <button type="button" class="pill ${activeElement === el ? 'active' : ''}" style="padding:4px 10px;font-size:11.5px;" data-select-element="${el}">
              <span class="status-dot" style="background:${NGU_HANH_DATA[el].swatch};"></span> ${el}
            </button>
          `).join('')}
        </div>
        <div style="font-size:11.5px;color:var(--ui-muted);margin-bottom:9px;line-height:1.5;">
          <div><strong>Tương sinh:</strong> ${nhData.tuongSinh}</div>
          <div><strong>Nên tránh:</strong> ${nhData.avoid}</div>
        </div>
        ${nhData.palettes.map((p, idx) => `
          <div class="palette-option" data-apply-nh="${activeElement}:${idx}">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong style="font-size:12.5px;">${p.name}</strong>
              <span class="badge badge-brand">Áp dụng</span>
            </div>
            <div style="font-size:11px;color:var(--ui-muted);margin-top:2px;">${p.desc}</div>
            <div class="palette-strip">
              <span style="background:${p.colors.bgGradient1}"></span>
              <span style="background:${p.colors.bgGradient2}"></span>
              <span style="background:${p.colors.contrastBg}"></span>
              <span style="background:${p.colors.primaryColor}"></span>
              <span style="background:${p.colors.secondaryColor}"></span>
            </div>
          </div>
        `).join('')}
      </div>

      <!-- 2. 12 CUNG HOÀNG ĐẠO -->
      <div class="inspector-box">
        <h5>Phối Màu 12 Cung Hoàng Đạo</h5>
        <select class="select" data-apply-zodiac>
          <option value="">-- Chọn cung hoàng đạo --</option>
          ${ZODIAC_PALETTES.map(z => `<option value="${z.id}">${z.name} — ${z.paletteName}</option>`).join('')}
        </select>
      </div>

      <!-- 3. MIX MÀU TỰ DO -->
      <div class="inspector-box">
        <h5>Mix Màu Không Gian Tự Do</h5>
        <div class="color-grid" style="margin-bottom:8px;">
          <label class="color-chip-input"><input type="color" data-mix-a value="${this.mixColorA}" /> <span>Màu chủ đạo</span></label>
          <label class="color-chip-input"><input type="color" data-mix-b value="${this.mixColorB}" /> <span>Màu điểm nhấn</span></label>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;">
          <button type="button" class="btn btn-outline btn-xs" data-run-mix="editorial-contrast">Biên Tập Đậm</button>
          <button type="button" class="btn btn-outline btn-xs" data-run-mix="pastel-silk">Pastel Lụa</button>
          <button type="button" class="btn btn-outline btn-xs" data-run-mix="luxury-dark">Dạ Tiệc Đêm</button>
        </div>
      </div>

      <!-- 4. CHỈNH CHI TIẾT TỪNG MÀU -->
      <div class="inspector-box">
        <h5>Chỉnh Từng Màu (Từ Chữ Đến Không Gian)</h5>
        <div class="form-group">
          <label>Kiểu Nền Không Gian</label>
          <select class="select" data-design="bgMode">
            <option value="solid" ${d.bgMode === 'solid' ? 'selected' : ''}>Giấy đơn sắc tinh tế</option>
            <option value="gradient" ${d.bgMode !== 'solid' ? 'selected' : ''}>Mix chuyển sắc 3 màu</option>
          </select>
        </div>
        ${d.bgMode !== 'solid' ? `
          <div class="color-grid" style="margin-bottom:8px;">
            <label class="color-chip-input"><input type="color" data-design-color="bgGradient1" value="${d.bgGradient1 || '#FFF9F0'}" /> <span>Nền màu 1</span></label>
            <label class="color-chip-input"><input type="color" data-design-color="bgGradient2" value="${d.bgGradient2 || '#FAF0E1'}" /> <span>Nền màu 2</span></label>
            <label class="color-chip-input"><input type="color" data-design-color="bgGradient3" value="${d.bgGradient3 || '#F2E4CE'}" /> <span>Nền màu 3</span></label>
            <div class="color-chip-input" style="flex-direction:column;align-items:stretch;gap:2px;">
              <span>Góc mix: <b>${d.bgAngle ?? 160}°</b></span>
              <input type="range" min="0" max="360" data-design-range="bgAngle" value="${d.bgAngle ?? 160}" />
            </div>
          </div>
        ` : `
          <div class="form-group"><label class="color-chip-input"><input type="color" data-design-color="bgColor" value="${d.bgColor || '#FFF7EB'}" /> <span>Màu nền giấy</span></label></div>
        `}
        <div class="color-grid">
          <label class="color-chip-input"><input type="color" data-design-color="surfaceColor" value="${d.surfaceColor || '#FDF7F0'}" /> <span>Nền thẻ sáng</span></label>
          <label class="color-chip-input"><input type="color" data-design-color="contrastBg" value="${d.contrastBg || '#511419'}" /> <span>Khối đậm chính</span></label>
          <label class="color-chip-input"><input type="color" data-design-color="contrastText" value="${d.contrastText || '#FDF7F0'}" /> <span>Chữ khối đậm</span></label>
          <label class="color-chip-input"><input type="color" data-design-color="textColor" value="${d.textColor || '#3B181B'}" /> <span>Màu chữ chính</span></label>
          <label class="color-chip-input"><input type="color" data-design-color="mutedColor" value="${d.mutedColor || '#7E575A'}" /> <span>Màu chữ phụ</span></label>
          <label class="color-chip-input"><input type="color" data-design-color="primaryColor" value="${d.primaryColor || '#511419'}" /> <span>Màu tiêu đề</span></label>
          <label class="color-chip-input"><input type="color" data-design-color="secondaryColor" value="${d.secondaryColor || '#C59A57'}" /> <span>Màu ánh kim</span></label>
          <label class="color-chip-input"><input type="color" data-design-color="ornamentColor" value="${d.ornamentColor || '#8B5A3C'}" /> <span>Màu hoa văn</span></label>
          <label class="color-chip-input"><input type="color" data-design-color="buttonColor" value="${d.buttonColor || '#511419'}" /> <span>Màu nút bấm</span></label>
          <label class="color-chip-input"><input type="color" data-design-color="buttonTextColor" value="${d.buttonTextColor || '#FFF8F0'}" /> <span>Màu chữ nút</span></label>
        </div>
      </div>

      <!-- 5. HOA VĂN, CHẤT LIỆU & PHÔNG CHỮ -->
      <div class="inspector-box">
        <h5>Hoa Văn Viền, Chất Liệu &amp; Kiểu Chữ</h5>
        <div class="form-group">
          <label>Phong Cách Viền &amp; Hoa Văn</label>
          <select class="select" data-design="ornamentStyle">
            ${ORNAMENT_STYLES.map(o => `<option value="${o.id}" ${d.ornamentStyle === o.id ? 'selected' : ''}>${o.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Chất Liệu Bề Mặt Giấy</label>
          <select class="select" data-design="texture">
            ${TEXTURE_OPTIONS.map(t => `<option value="${t.id}" ${d.texture === t.id ? 'selected' : ''}>${t.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Font Tiêu Đề &amp; Tên Cặp Đôi</label>
          <select class="select" data-design="headingFont">
            ${FONT_OPTIONS.map(f => `<option value="${f.id}" ${d.headingFont === f.id ? 'selected' : ''}>${f.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Font Thư Pháp</label>
          <select class="select" data-design="scriptFont">
            ${FONT_OPTIONS.map(f => `<option value="${f.id}" ${d.scriptFont === f.id ? 'selected' : ''}>${f.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Font Nội Dung</label>
          <select class="select" data-design="bodyFont">
            ${FONT_OPTIONS.map(f => `<option value="${f.id}" ${d.bodyFont === f.id ? 'selected' : ''}>${f.label}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin:0;">
          <label>Bo Góc Khối Thiệp: <b>${d.borderRadius ?? 10}px</b></label>
          <input type="range" min="0" max="28" data-design-range="borderRadius" value="${d.borderRadius ?? 10}" style="width:100%;" />
        </div>
      </div>
    `;
  }

  bindDesignTab(pane) {
    pane.querySelectorAll('[data-pick-backdrop]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.invitation.design.coverBackdrop = btn.dataset.pickBackdrop;
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
      });
    });

    pane.querySelector('[data-upload-backdrop]')?.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        this.onToast('Đang tải ảnh nền bìa...', 'info');
        const url = await storage.uploadMedia(file, { invId: this.invitation.id, clientToken: this.clientToken });
        this.invitation.design.coverBackdrop = url;
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
        this.onToast('Đã áp dụng ảnh nền mờ cho bìa thiệp', 'success');
      } catch (err) { this.onToast(err.message || 'Lỗi tải ảnh nền', 'error'); }
    });

    pane.querySelector('[data-cover-overlay]')?.addEventListener('input', e => {
      this.invitation.design.coverOverlay = Number(e.target.value) / 100;
      this.refreshPreview();
    });
    pane.querySelector('[data-cover-overlay]')?.addEventListener('change', () => { this.pushHistory(); this.renderInspector(); });

    pane.querySelector('[data-design-bool="coverPattern"]')?.addEventListener('change', e => {
      this.invitation.design.coverPattern = e.target.checked;
      this.pushHistory();
      this.refreshPreview();
    });

    pane.querySelectorAll('[data-fs-year]').forEach(inp => {
      inp.addEventListener('change', () => {
        this.invitation.content[inp.dataset.fsYear] = inp.value;
        const rep = analyzeCoupleFengShui(this.invitation.content.groomYear, this.invitation.content.brideYear);
        if (rep?.primaryElement) this.selectedElement = rep.primaryElement;
        this.renderInspector();
      });
    });
    pane.querySelectorAll('[data-select-element]').forEach(btn => {
      btn.addEventListener('click', () => { this.selectedElement = btn.dataset.selectElement; this.renderInspector(); });
    });
    pane.querySelectorAll('[data-apply-nh]').forEach(el => {
      el.addEventListener('click', () => {
        const [elem, idxStr] = el.dataset.applyNh.split(':');
        const pal = NGU_HANH_DATA[elem]?.palettes[Number(idxStr)];
        if (!pal) return;
        this.invitation.design = { ...this.invitation.design, bgMode: 'gradient', ...pal.colors };
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
        this.onToast(`Đã áp dụng bảng màu Ngũ Hành "${pal.name}"`, 'success');
      });
    });
    pane.querySelector('[data-apply-zodiac]')?.addEventListener('change', e => {
      const z = ZODIAC_PALETTES.find(x => x.id === e.target.value);
      if (!z) return;
      this.invitation.design = { ...this.invitation.design, bgMode: 'gradient', ...z.colors };
      this.pushHistory();
      this.renderInspector();
      this.refreshPreview();
      this.onToast(`Đã áp dụng bảng màu ${z.name}`, 'success');
    });
    pane.querySelector('[data-mix-a]')?.addEventListener('input', e => { this.mixColorA = e.target.value; });
    pane.querySelector('[data-mix-b]')?.addEventListener('input', e => { this.mixColorB = e.target.value; });
    pane.querySelectorAll('[data-run-mix]').forEach(btn => {
      btn.addEventListener('click', () => {
        const mixed = generateHarmonyMix(this.mixColorA, this.mixColorB, btn.dataset.runMix);
        this.invitation.design = { ...this.invitation.design, ...mixed };
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
        this.onToast('Đã phối bảng màu mới từ 2 màu chọn', 'success');
      });
    });
    pane.querySelectorAll('[data-design]').forEach(el => {
      el.addEventListener('change', () => {
        this.invitation.design[el.dataset.design] = el.value;
        this.pushHistory();
        if (el.dataset.design === 'bgMode') this.renderInspector();
        this.refreshPreview();
      });
    });
    pane.querySelectorAll('[data-design-color]').forEach(el => {
      el.addEventListener('input', () => { this.invitation.design[el.dataset.designColor] = el.value; this.refreshPreview(); });
      el.addEventListener('change', () => this.pushHistory());
    });
    pane.querySelectorAll('[data-design-range]').forEach(el => {
      el.addEventListener('input', () => { this.invitation.design[el.dataset.designRange] = Number(el.value); this.refreshPreview(); });
      el.addEventListener('change', () => { this.pushHistory(); this.renderInspector(); });
    });
  }

  /* ================= TAB 4: SỬA ẢNH & NỘI DUNG TỪNG PHẦN ================= */
  tplContentTab() {
    const c = this.invitation.content || {};
    const d = this.invitation.design || {};
    const g = c.gift || { groomBank: {}, brideBank: {} };
    const sections = this.invitation.sections || [];
    const curFilter = this.selectedSectionFilter || 'all';
    const isVisible = key => curFilter === 'all' || curFilter === key;
    const isSecEnabled = type => {
      const s = sections.find(x => x.type === type);
      return s ? s.enabled !== false : true;
    };
    const secTabs = [
      { id: 'all', label: 'Tất cả' },
      { id: 'hero', label: 'Bìa & Cặp đôi' },
      { id: 'quote', label: 'Lời ngỏ & Hai họ' },
      { id: 'gallery', label: `Album (${(c.gallery || []).length})` },
      { id: 'countdown', label: 'Đếm ngược' },
      { id: 'events', label: 'Lịch trình' },
      { id: 'story', label: 'Chuyện tình' },
      { id: 'gift', label: 'Mừng cưới' },
      { id: 'footer', label: 'Cảm ơn' },
    ];
    const currentBackdropUrl = resolveBackdropUrl(d.coverBackdrop || 'burgundy-roses');
    const trialState = this.mode === 'client' ? getTrialState(this.invitation) : { active: false, limits: null };
    const maxPhotos = trialState.active ? trialState.limits.maxPhotos : 999;
    const galleryLen = (c.gallery || []).length;
    const secToggleLocked = trialState.active && !trialState.limits.allowSectionToggle;
    const giftLocked = trialState.active && !trialState.limits.allowGiftQr;

    return `
      <h4 class="inspector-title">
        <span>Sửa Ảnh &amp; Từng Phần Thiệp</span>
        ${this.mode === 'client' && this.invitation.order?.status !== 'paid'
          ? `<button type="button" class="btn btn-gold btn-xs" data-jump-checkout>${trialState.active ? 'Nâng Cấp VIP' : 'Thanh Toán'}</button>` : ''}
      </h4>

      ${trialState.active ? `
        <div class="inspector-box" style="background:#fdf6e7;border-color:#e5cfa0;padding:10px 12px;">
          <div style="font-size:12px;font-weight:700;color:#7b4f10;margin-bottom:4px;">Bản Dùng Thử ${trialState.days} Ngày • ${escapeHtml(trialState.remainingText)}</div>
          <div style="font-size:11.5px;color:#6e5630;line-height:1.5;">
            Giới hạn: tối đa <strong>${maxPhotos} ảnh Album</strong>, khóa Bao Lì Xì VietQR, khóa đổi nhạc MP3, khóa câu hỏi RSVP riêng &amp; link cá nhân hóa.
          </div>
        </div>
      ` : ''}

      <div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:12px;">
        ${secTabs.map(t => `
          <button type="button" class="pill ${curFilter === t.id ? 'active' : ''}" style="padding:5px 10px;font-size:11.5px;" data-sec-filter="${t.id}">
            ${t.label}
          </button>
        `).join('')}
      </div>

      ${this.mode === 'client' && sections.length ? `
        <div class="inspector-box" style="padding:10px 12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:7px;">
            <span style="font-size:11.5px;font-weight:700;color:var(--ui-brand);text-transform:uppercase;letter-spacing:0.6px;">Bật / Tắt Các Phần Hiển Thị</span>
            ${secToggleLocked ? `<button type="button" class="btn btn-outline btn-xs" data-jump-checkout>Mở khóa</button>` : ''}
          </div>
          <div style="display:flex;flex-wrap:wrap;gap:6px 12px;${secToggleLocked ? 'opacity:0.6;' : ''}">
            ${sections.map((s, idx) => `
              <label style="display:inline-flex;align-items:center;gap:5px;font-size:12px;cursor:${secToggleLocked ? 'not-allowed' : 'pointer'};">
                <input type="checkbox" data-client-sec-toggle="${idx}" ${s.enabled ? 'checked' : ''} ${(s.type === 'hero' || secToggleLocked) ? 'disabled' : ''} />
                <span>${escapeHtml(s.title)}</span>
              </label>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${isVisible('hero') ? `
        <div class="inspector-box" data-content-group="hero">
          <h5>1. Phần Bìa, Ảnh Cưới &amp; Ngày Trọng Đại</h5>
          <div class="form-group"><label>Dòng tiêu đề mở đầu</label><input class="input" data-c="topBadge" value="${escapeHtml(c.topBadge || '')}" placeholder="TRÂN TRỌNG KÍNH MỜI" /></div>
          <div class="grid-2">
            <div class="form-group"><label>Tên Chú Rể</label><input class="input" data-c="groomName" value="${escapeHtml(c.groomName || '')}" /></div>
            <div class="form-group"><label>Tên Cô Dâu</label><input class="input" data-c="brideName" value="${escapeHtml(c.brideName || '')}" /></div>
          </div>
          <div class="grid-2">
            <div class="form-group"><label>Ngày cưới (Dương lịch)</label><input class="input" type="date" data-c="weddingDate" value="${escapeHtml(c.weddingDate || '')}" /></div>
            <div class="form-group"><label>Giờ khai tiệc</label><input class="input" type="time" data-c="weddingTime" value="${escapeHtml(c.weddingTime || '17:00')}" /></div>
          </div>
          <div class="form-group"><label>Ngày Âm Lịch</label><input class="input" data-c="lunarDate" value="${escapeHtml(c.lunarDate || '')}" placeholder="VD: Tức ngày 12 tháng 11 năm Bính Ngọ" /></div>
          <div class="form-group"><label>Dòng lời mời phía trên tên khách</label><input class="input" data-c="inviteLine" value="${escapeHtml(c.inviteLine || 'Trân trọng kính mời')}" /></div>

          <div class="form-group">
            <label>Ảnh Bìa Chính (Trong Phong Bì Nhung)</label>
            ${c.heroPhoto ? `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:7px;background:#fff;border:1px solid var(--ui-border);border-radius:10px;">
                <img src="${escapeHtml(c.heroPhoto)}" alt="Ảnh bìa" style="width:48px;height:64px;object-fit:cover;border-radius:6px;" />
                <div style="flex:1;font-size:11.5px;color:var(--ui-muted);">Ảnh bìa cưới hiện tại của bạn</div>
                <button type="button" class="btn btn-danger btn-xs" data-clear-hero>Xóa ảnh</button>
              </div>
            ` : ''}
            <label class="upload-drop" style="width:100%;padding:9px;">
              Tải ảnh bìa từ máy của bạn (tự động nén nét &amp; nhẹ)
              <input type="file" accept="image/*" style="display:none;" data-upload-hero />
            </label>
          </div>

          <div class="form-group" style="margin:0;padding-top:10px;border-top:1px dashed var(--ui-border);">
            <label>Ảnh Nền Mờ Nghệ Thuật Cho Bìa Thiệp</label>
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:8px;">
              ${COVER_BACKDROPS.slice(0, 8).map(b => `
                <button type="button" data-client-backdrop="${escapeHtml(b.id)}" title="${escapeHtml(b.name)}"
                  style="border:${d.coverBackdrop === b.id ? '2px solid var(--ui-brand)' : '1px solid var(--ui-border)'};border-radius:8px;overflow:hidden;padding:0;height:42px;cursor:pointer;background:#eee;">
                  <img src="${escapeHtml(b.url)}" alt="${escapeHtml(b.name)}" style="width:100%;height:100%;object-fit:cover;display:block;" />
                </button>
              `).join('')}
            </div>
            <label class="upload-drop" style="width:100%;padding:8px;margin-bottom:8px;">
              Hoặc tải ảnh cưới của riêng bạn làm ảnh nền mờ bìa
              <input type="file" accept="image/*" style="display:none;" data-client-upload-backdrop />
            </label>
            <div class="grid-2" style="gap:8px;">
              <div>
                <label style="font-size:11px;">Độ mờ ảnh nền: <b>${d.coverBlur ?? 5}px</b></label>
                <input type="range" min="0" max="16" data-client-cover-blur value="${d.coverBlur ?? 5}" style="width:100%;" />
              </div>
              <div>
                <label style="font-size:11px;">Độ đậm lớp phủ: <b>${Math.round((d.coverOverlay ?? 0.54) * 100)}%</b></label>
                <input type="range" min="20" max="85" data-client-cover-overlay value="${Math.round((d.coverOverlay ?? 0.54) * 100)}" style="width:100%;" />
              </div>
            </div>
            ${currentBackdropUrl ? `<div style="font-size:11px;color:var(--ui-muted);margin-top:4px;">Bấm nút "Xem Mở Bìa" trên thanh công cụ để xem ngay hiệu ứng nền mờ.</div>` : ''}
          </div>
        </div>
      ` : ''}

      ${isVisible('quote') ? `
        <div class="inspector-box" data-content-group="quote">
          <h5>2. Phần Lời Ngỏ &amp; Gia Đình Hai Họ ${!isSecEnabled('quote') ? '<small style="color:var(--ui-muted);">(đang tắt)</small>' : ''}</h5>
          <div class="form-group"><label>Dòng báo tin lễ thành hôn</label><input class="input" data-c="quoteHeading" value="${escapeHtml(c.quoteHeading || 'TRÂN TRỌNG BÁO TIN LỄ THÀNH HÔN CỦA CON CHÚNG TÔI')}" /></div>
          <div class="form-group">
            <label>Lời ngỏ mời cưới</label>
            <textarea class="textarea" rows="3" data-c="quoteText">${escapeHtml(c.quoteText || '')}</textarea>
            <div style="display:flex;gap:5px;flex-wrap:wrap;margin-top:6px;">
              ${COPY_SUGGESTIONS.invitations.map((s, idx) => `<button type="button" class="btn btn-outline btn-xs" data-fill-quote="${idx}">${s.label}</button>`).join('')}
            </div>
          </div>
          <div class="grid-2">
            <div>
              <div class="form-group"><label>Tiêu đề Nhà Trai</label><input class="input" data-c="groomFamilyTitle" value="${escapeHtml(c.groomFamilyTitle || 'NHÀ TRAI')}" /></div>
              <div class="form-group"><label>Cha Chú Rể</label><input class="input" data-c="groomFather" value="${escapeHtml(c.groomFather || '')}" /></div>
              <div class="form-group"><label>Mẹ Chú Rể</label><input class="input" data-c="groomMother" value="${escapeHtml(c.groomMother || '')}" /></div>
              <div class="form-group" style="margin:0;"><label>Địa chỉ Nhà Trai</label><input class="input" data-c="groomAddress" value="${escapeHtml(c.groomAddress || '')}" /></div>
            </div>
            <div>
              <div class="form-group"><label>Tiêu đề Nhà Gái</label><input class="input" data-c="brideFamilyTitle" value="${escapeHtml(c.brideFamilyTitle || 'NHÀ GÁI')}" /></div>
              <div class="form-group"><label>Cha Cô Dâu</label><input class="input" data-c="brideFather" value="${escapeHtml(c.brideFather || '')}" /></div>
              <div class="form-group"><label>Mẹ Cô Dâu</label><input class="input" data-c="brideMother" value="${escapeHtml(c.brideMother || '')}" /></div>
              <div class="form-group" style="margin:0;"><label>Địa chỉ Nhà Gái</label><input class="input" data-c="brideAddress" value="${escapeHtml(c.brideAddress || '')}" /></div>
            </div>
          </div>
        </div>
      ` : ''}

      ${isVisible('gallery') ? `
        <div class="inspector-box" data-content-group="gallery">
          <h5>3. Phần Album Ảnh Cưới 3D (${galleryLen}${trialState.active ? ` / ${maxPhotos} ảnh bản dùng thử` : ' ảnh'})</h5>
          <div class="grid-2">
            <div class="form-group"><label>Nhãn nhỏ phía trên</label><input class="input" data-c="galleryEyebrow" value="${escapeHtml(c.galleryEyebrow || 'KHOẢNH KHẮC ĐÁNG NHỚ')}" /></div>
            <div class="form-group"><label>Tiêu đề mục Album</label><input class="input" data-c="galleryHeading" value="${escapeHtml(c.galleryHeading || 'ALBUM ẢNH')}" /></div>
          </div>
          ${trialState.active && galleryLen >= maxPhotos ? `
            <div style="padding:10px 12px;border-radius:10px;background:#fdf6e7;border:1px dashed #d6b16d;font-size:12px;color:#7b4f10;margin-bottom:8px;">
              <strong>Đã đạt giới hạn ${maxPhotos}/${maxPhotos} ảnh</strong> của bản dùng thử ${trialState.days} ngày. Xóa bớt ảnh hoặc nâng cấp gói chính thức để tải 30–60+ ảnh HD.
              <div style="margin-top:8px;"><button type="button" class="btn btn-gold btn-xs" data-jump-checkout>Nâng Cấp Tải Thêm Ảnh</button></div>
            </div>
          ` : `
            <label class="upload-drop" style="width:100%;">
              Chọn 1 hoặc nhiều ảnh cưới tải lên Album${trialState.active ? ` (còn trống ${maxPhotos - galleryLen} ảnh)` : ''}
              <input type="file" accept="image/*" multiple style="display:none;" data-upload-gallery />
            </label>
          `}
          <div class="thumb-strip">
            ${(c.gallery || []).map((src, idx) => `
              <div class="thumb-item" style="position:relative;">
                <img src="${escapeHtml(src)}" alt="Album ${idx + 1}" />
                <button type="button" class="thumb-del" data-del-photo="${idx}" title="Xóa ảnh">${icon('x', 12)}</button>
                <div style="position:absolute;left:3px;right:3px;bottom:3px;display:flex;gap:2px;justify-content:space-between;">
                  <button type="button" class="btn btn-xs" style="padding:1px 4px;font-size:9.5px;background:rgba(20,16,18,0.78);color:#fff;border:none;" data-move-photo="${idx}:-1" ${idx === 0 ? 'disabled' : ''} title="Dịch trái">${icon('chevronLeft', 10)}</button>
                  <button type="button" class="btn btn-xs" style="padding:1px 4px;font-size:9px;background:rgba(123,28,38,0.88);color:#fff;border:none;" data-set-hero-photo="${idx}" title="Đặt làm ảnh bìa">Bìa</button>
                  <button type="button" class="btn btn-xs" style="padding:1px 4px;font-size:9.5px;background:rgba(20,16,18,0.78);color:#fff;border:none;" data-move-photo="${idx}:1" ${idx === (c.gallery || []).length - 1 ? 'disabled' : ''} title="Dịch phải">${icon('chevronRight', 10)}</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}

      ${isVisible('countdown') ? `
        <div class="inspector-box" data-content-group="countdown">
          <h5>4. Phần Đếm Ngược &amp; Lịch Ngày Cưới</h5>
          <div class="form-group"><label>Tiêu đề mục</label><input class="input" data-c="countdownHeading" value="${escapeHtml(c.countdownHeading || 'THÔNG TIN TIỆC CƯỚI')}" /></div>
          <div class="form-group"><label>Dòng mô tả giờ tiệc</label><input class="input" data-c="countdownSub" value="${escapeHtml(c.countdownSub || 'Tiệc cưới sẽ diễn ra vào lúc')}" /></div>
          <div class="form-group" style="margin:0;"><label>Dòng chữ phía trên đồng hồ đếm ngược</label><input class="input" data-c="countdownLabel" value="${escapeHtml(c.countdownLabel || 'Cùng đếm ngược')}" /></div>
        </div>
      ` : ''}

      ${isVisible('events') ? `
        <div class="inspector-box" data-content-group="events">
          <h5>5. Phần Lịch Trình &amp; Bản Đồ (${(c.events || []).length} sự kiện)</h5>
          <div class="grid-2">
            <div class="form-group"><label>Nhãn nhỏ trên</label><input class="input" data-c="eventsEyebrow" value="${escapeHtml(c.eventsEyebrow || 'THỜI GIAN & ĐỊA ĐIỂM')}" /></div>
            <div class="form-group"><label>Tiêu đề mục</label><input class="input" data-c="eventsHeading" value="${escapeHtml(c.eventsHeading || 'TIỆC CƯỚI ĐƯỢC TỔ CHỨC TẠI')}" /></div>
          </div>
          ${(c.events || []).map((ev, i) => `
            <div style="background:#fff;border:1px solid var(--ui-border);border-radius:10px;padding:10px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <strong style="font-size:12px;">Sự kiện #${i + 1}</strong>
                <button type="button" class="btn btn-danger btn-xs" data-del-event="${i}">Xóa</button>
              </div>
              <div class="form-group"><input class="input" data-ev="${i}:name" value="${escapeHtml(ev.name)}" placeholder="Tên nghi lễ (VD: Lễ Thành Hôn)" /></div>
              <div class="form-group"><input class="input" data-ev="${i}:time" value="${escapeHtml(ev.time)}" placeholder="Thời gian" /></div>
              <div class="form-group"><input class="input" data-ev="${i}:venue" value="${escapeHtml(ev.venue)}" placeholder="Tên sảnh / nhà hàng" /></div>
              <div class="form-group"><input class="input" data-ev="${i}:address" value="${escapeHtml(ev.address)}" placeholder="Địa chỉ chi tiết" /></div>
              <div class="form-group" style="margin:0;"><input class="input" data-ev="${i}:mapUrl" value="${escapeHtml(ev.mapUrl || '')}" placeholder="Liên kết Google Maps" /></div>
            </div>
          `).join('')}
          <button type="button" class="btn btn-outline btn-sm" style="width:100%;" data-add-event>+ Thêm địa điểm / nghi lễ</button>
        </div>
      ` : ''}

      ${isVisible('story') ? `
        <div class="inspector-box" data-content-group="story">
          <h5>6. Phần Chuyện Tình Yêu (${(c.story || []).length} mốc)</h5>
          <div class="grid-2">
            <div class="form-group"><label>Nhãn nhỏ trên</label><input class="input" data-c="storyEyebrow" value="${escapeHtml(c.storyEyebrow || 'OUR LOVE STORY')}" /></div>
            <div class="form-group"><label>Tiêu đề mục</label><input class="input" data-c="storyHeading" value="${escapeHtml(c.storyHeading || 'CHUYỆN TÌNH YÊU')}" /></div>
          </div>
          ${(c.story || []).map((st, i) => `
            <div style="background:#fff;border:1px solid var(--ui-border);border-radius:10px;padding:10px;margin-bottom:8px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <strong style="font-size:12px;">Mốc #${i + 1}</strong>
                <button type="button" class="btn btn-danger btn-xs" data-del-story="${i}">Xóa</button>
              </div>
              <div class="grid-2" style="margin-bottom:6px;">
                <input class="input" data-st="${i}:date" value="${escapeHtml(st.date)}" placeholder="Thời gian" />
                <input class="input" data-st="${i}:title" value="${escapeHtml(st.title)}" placeholder="Tiêu đề" />
              </div>
              <textarea class="textarea" rows="2" data-st="${i}:text">${escapeHtml(st.text)}</textarea>
            </div>
          `).join('')}
          <button type="button" class="btn btn-outline btn-sm" style="width:100%;" data-add-story>+ Thêm mốc kỷ niệm</button>
        </div>
      ` : ''}

      ${isVisible('gift') ? `
        <div class="inspector-box" data-content-group="gift">
          <h5>7. Phần Hộp Mừng Cưới &amp; Bao Lì Xì VietQR</h5>
          ${giftLocked ? `
            <div style="padding:12px;border-radius:10px;background:#fdf6e7;border:1px dashed #d6b16d;font-size:12px;color:#7b4f10;line-height:1.55;">
              <strong>Tính năng bị khóa trên bản dùng thử ${trialState.days} ngày</strong><br/>
              Gắn số tài khoản ngân hàng &amp; mã VietQR Bao Lì Xì mừng cưới Cô Dâu / Chú Rể sẽ tự động mở khóa ngay khi nâng cấp gói chính thức.
              <div style="margin-top:9px;"><button type="button" class="btn btn-gold btn-xs" data-jump-checkout>Nâng Cấp Mở Khóa QR Mừng Cưới</button></div>
            </div>
          ` : `
          <div class="grid-2">
            <div class="form-group"><label>Tiêu đề mục</label><input class="input" data-gift="title" value="${escapeHtml(g.title || 'HỘP MỪNG CƯỚI')}" /></div>
            <div class="form-group"><label>Chữ trên bao lì xì</label><input class="input" data-gift="envelopeCaption" value="${escapeHtml(g.envelopeCaption || 'Chạm mở bao lì xì')}" /></div>
          </div>
          <div class="form-group"><label>Lời dẫn mừng cưới</label><textarea class="textarea" rows="2" data-gift="subtitle">${escapeHtml(g.subtitle || '')}</textarea></div>
          <strong style="font-size:12px;display:block;margin:8px 0 6px;">Tài khoản Chú Rể</strong>
          <div class="form-group">
            <select class="select" data-bank="groomBank:bankCode">
              ${VIET_BANKS.map(b => `<option value="${b.code}" ${g.groomBank?.bankCode === b.code ? 'selected' : ''}>${b.name} (${b.code})</option>`).join('')}
            </select>
          </div>
          <div class="grid-2">
            <div class="form-group"><input class="input" data-bank="groomBank:accountNo" value="${escapeHtml(g.groomBank?.accountNo || '')}" placeholder="Số tài khoản" /></div>
            <div class="form-group"><input class="input" data-bank="groomBank:accountName" value="${escapeHtml(g.groomBank?.accountName || '')}" placeholder="Tên chủ TK" /></div>
          </div>
          <strong style="font-size:12px;display:block;margin:8px 0 6px;">Tài khoản Cô Dâu</strong>
          <div class="form-group">
            <select class="select" data-bank="brideBank:bankCode">
              ${VIET_BANKS.map(b => `<option value="${b.code}" ${g.brideBank?.bankCode === b.code ? 'selected' : ''}>${b.name} (${b.code})</option>`).join('')}
            </select>
          </div>
          <div class="grid-2">
            <div class="form-group"><input class="input" data-bank="brideBank:accountNo" value="${escapeHtml(g.brideBank?.accountNo || '')}" placeholder="Số tài khoản" /></div>
            <div class="form-group"><input class="input" data-bank="brideBank:accountName" value="${escapeHtml(g.brideBank?.accountName || '')}" placeholder="Tên chủ TK" /></div>
          </div>
          `}
        </div>
      ` : ''}

      ${isVisible('footer') ? `
        <div class="inspector-box" data-content-group="footer">
          <h5>8. Phần Lời Cảm Ơn Cuối Thiệp</h5>
          <div class="form-group"><label>Tiêu đề kết thiệp</label><input class="input" data-c="footerHeading" value="${escapeHtml(c.footerHeading || 'Thank You')}" /></div>
          <div class="form-group" style="margin:0;"><label>Lời cảm ơn gửi khách mời</label><textarea class="textarea" rows="3" data-c="footerText">${escapeHtml(c.footerText || '')}</textarea></div>
        </div>
      ` : ''}
    `;
  }

  bindContentTab(pane) {
    pane.querySelectorAll('[data-jump-checkout]').forEach(btn => {
      btn.addEventListener('click', () => this.openCheckoutFlow());
    });
    pane.querySelectorAll('[data-sec-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.selectedSectionFilter = btn.dataset.secFilter;
        this.renderInspector();
      });
    });
    pane.querySelectorAll('[data-client-sec-toggle]').forEach(cb => {
      cb.addEventListener('change', () => {
        const idx = Number(cb.dataset.clientSecToggle);
        if (this.invitation.sections?.[idx]) {
          this.invitation.sections[idx].enabled = cb.checked;
          this.pushHistory();
          this.refreshPreview();
        }
      });
    });
    pane.querySelectorAll('[data-c]').forEach(el => {
      el.addEventListener('input', () => { this.invitation.content[el.dataset.c] = el.value; this.refreshPreview(); });
      el.addEventListener('change', () => this.pushHistory());
    });
    pane.querySelectorAll('[data-fill-quote]').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = COPY_SUGGESTIONS.invitations[Number(btn.dataset.fillQuote)];
        if (!s) return;
        this.invitation.content.quoteText = s.text;
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
      });
    });
    pane.querySelector('[data-upload-hero]')?.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        this.onToast('Đang nén và tải ảnh bìa...', 'info');
        const url = await storage.uploadMedia(file, { invId: this.invitation.id, clientToken: this.clientToken });
        this.invitation.content.heroPhoto = url;
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
        this.onToast('Đã cập nhật ảnh bìa cưới', 'success');
      } catch (err) { this.onToast(err.message || 'Lỗi tải ảnh', 'error'); }
    });
    pane.querySelector('[data-clear-hero]')?.addEventListener('click', () => {
      this.invitation.content.heroPhoto = '';
      this.pushHistory();
      this.renderInspector();
      this.refreshPreview();
    });
    pane.querySelectorAll('[data-client-backdrop]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.invitation.design = this.invitation.design || {};
        this.invitation.design.coverBackdrop = btn.dataset.clientBackdrop;
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
        this.onToast('Đã đổi ảnh nền mờ bìa thiệp', 'success');
      });
    });
    pane.querySelector('[data-client-upload-backdrop]')?.addEventListener('change', async e => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
        this.onToast('Đang tải ảnh nền bìa...', 'info');
        const url = await storage.uploadMedia(file, { invId: this.invitation.id, clientToken: this.clientToken });
        this.invitation.design = this.invitation.design || {};
        this.invitation.design.coverBackdrop = url;
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
        this.onToast('Đã cập nhật ảnh nền mờ bìa của bạn', 'success');
      } catch (err) { this.onToast(err.message || 'Lỗi tải ảnh nền', 'error'); }
    });
    pane.querySelector('[data-client-cover-blur]')?.addEventListener('input', e => {
      this.invitation.design = this.invitation.design || {};
      this.invitation.design.coverBlur = Number(e.target.value);
      this.refreshPreview();
    });
    pane.querySelector('[data-client-cover-blur]')?.addEventListener('change', () => { this.pushHistory(); this.renderInspector(); });
    pane.querySelector('[data-client-cover-overlay]')?.addEventListener('input', e => {
      this.invitation.design = this.invitation.design || {};
      this.invitation.design.coverOverlay = Number(e.target.value) / 100;
      this.refreshPreview();
    });
    pane.querySelector('[data-client-cover-overlay]')?.addEventListener('change', () => { this.pushHistory(); this.renderInspector(); });
    pane.querySelector('[data-upload-gallery]')?.addEventListener('change', async e => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      this.invitation.content.gallery = this.invitation.content.gallery || [];
      const trialState = this.mode === 'client' ? getTrialState(this.invitation) : { active: false, limits: null };
      let allowedFiles = files;
      if (trialState.active) {
        const remain = Math.max(0, trialState.limits.maxPhotos - this.invitation.content.gallery.length);
        if (remain <= 0) {
          this.onToast(`Bản dùng thử ${trialState.days} ngày chỉ cho phép tối đa ${trialState.limits.maxPhotos} ảnh Album. Nâng cấp để tải thêm!`, 'error');
          return;
        }
        if (files.length > remain) {
          allowedFiles = files.slice(0, remain);
          this.onToast(`Bản dùng thử chỉ nhận thêm ${remain} ảnh (tối đa ${trialState.limits.maxPhotos} ảnh)`, 'info');
        }
      }
      this.onToast(`Đang tải ${allowedFiles.length} ảnh vào Album...`, 'info');
      for (const f of allowedFiles) {
        try {
          const url = await storage.uploadMedia(f, { invId: this.invitation.id, clientToken: this.clientToken });
          this.invitation.content.gallery.push(url);
        } catch (err) { this.onToast(err.message || 'Lỗi tải ảnh', 'error'); }
      }
      this.pushHistory();
      this.renderInspector();
      this.refreshPreview();
      this.onToast('Đã cập nhật Album ảnh', 'success');
    });
    pane.querySelectorAll('[data-del-photo]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.invitation.content.gallery.splice(Number(btn.dataset.delPhoto), 1);
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
      });
    });
    pane.querySelectorAll('[data-move-photo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const [iStr, dirStr] = btn.dataset.movePhoto.split(':');
        const i = Number(iStr); const t = i + Number(dirStr);
        const arr = this.invitation.content.gallery || [];
        if (t < 0 || t >= arr.length) return;
        [arr[i], arr[t]] = [arr[t], arr[i]];
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
      });
    });
    pane.querySelectorAll('[data-set-hero-photo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const src = (this.invitation.content.gallery || [])[Number(btn.dataset.setHeroPhoto)];
        if (!src) return;
        this.invitation.content.heroPhoto = src;
        this.pushHistory();
        this.renderInspector();
        this.refreshPreview();
        this.onToast('Đã chọn ảnh này làm Ảnh Bìa chính', 'success');
      });
    });
    pane.querySelectorAll('[data-ev]').forEach(el => {
      el.addEventListener('input', () => { const [idx, field] = el.dataset.ev.split(':'); this.invitation.content.events[Number(idx)][field] = el.value; this.refreshPreview(); });
    });
    pane.querySelector('[data-add-event]')?.addEventListener('click', () => {
      this.invitation.content.events = this.invitation.content.events || [];
      this.invitation.content.events.push({ id: 'ev_' + Date.now(), name: 'Tiệc Báo Hỷ', time: '18:00 — 20/12/2026', venue: 'Nhà hàng tiệc cưới', address: 'TP. Hồ Chí Minh', mapUrl: 'https://maps.google.com' });
      this.pushHistory();
      this.renderInspector();
      this.refreshPreview();
    });
    pane.querySelectorAll('[data-del-event]').forEach(btn => {
      btn.addEventListener('click', () => { this.invitation.content.events.splice(Number(btn.dataset.delEvent), 1); this.pushHistory(); this.renderInspector(); this.refreshPreview(); });
    });
    pane.querySelectorAll('[data-st]').forEach(el => {
      el.addEventListener('input', () => { const [idx, field] = el.dataset.st.split(':'); this.invitation.content.story[Number(idx)][field] = el.value; this.refreshPreview(); });
    });
    pane.querySelector('[data-add-story]')?.addEventListener('click', () => {
      this.invitation.content.story = this.invitation.content.story || [];
      this.invitation.content.story.push({ id: 'st_' + Date.now(), date: 'Tháng 12 / 2026', title: 'Kỷ Niệm Đáng Nhớ', text: 'Khoảnh khắc tuyệt vời bên nhau...' });
      this.pushHistory();
      this.renderInspector();
      this.refreshPreview();
    });
    pane.querySelectorAll('[data-del-story]').forEach(btn => {
      btn.addEventListener('click', () => { this.invitation.content.story.splice(Number(btn.dataset.delStory), 1); this.pushHistory(); this.renderInspector(); this.refreshPreview(); });
    });
    pane.querySelectorAll('[data-gift]').forEach(el => {
      el.addEventListener('input', e => {
        this.invitation.content.gift = this.invitation.content.gift || { groomBank: {}, brideBank: {} };
        this.invitation.content.gift[el.dataset.gift] = e.target.value;
        this.refreshPreview();
      });
    });
    pane.querySelectorAll('[data-bank]').forEach(el => {
      const h = () => {
        const [who, field] = el.dataset.bank.split(':');
        this.invitation.content.gift = this.invitation.content.gift || { groomBank: {}, brideBank: {} };
        this.invitation.content.gift[who] = this.invitation.content.gift[who] || {};
        this.invitation.content.gift[who][field] = el.value;
        this.refreshPreview();
      };
      el.addEventListener('input', h);
      el.addEventListener('change', h);
    });
  }

  /* ================= TAB 5: NHẠC NỀN & HIỆU ỨNG RƠI ================= */
  tplFxTab() {
    const d = this.invitation.design;
    const m = this.invitation.music || { trackId: 'canon-d', autoplay: true, volume: 0.65 };
    const isAdmin = this.mode === 'admin';
    const trialState = !isAdmin ? getTrialState(this.invitation) : { active: false, limits: null };
    const musicLocked = trialState.active && !trialState.limits?.allowMusicChange;
    return `
      <h4 class="inspector-title"><span>Nhạc Nền &amp; Hiệu Ứng Rơi</span></h4>

      <div class="inspector-box">
        <h5>Nhạc Nền Tự Phát Khi Mở Thiệp</h5>
        ${musicLocked ? `
          <div style="padding:12px;border-radius:10px;background:#fdf6e7;border:1px dashed #d6b16d;font-size:12px;color:#7b4f10;line-height:1.55;margin-bottom:10px;">
            <strong>Đổi nhạc &amp; tải MP3 riêng bị khóa trên bản dùng thử ${trialState.days} ngày</strong><br/>
            Thiệp đang phát bản nhạc mặc định của mẫu. Nâng cấp gói chính thức để chọn kho nhạc cưới &amp; tải file MP3 yêu thích của riêng hai bạn.
            <div style="margin-top:9px;"><button type="button" class="btn btn-gold btn-xs" data-fx-upgrade>Nâng Cấp Mở Khóa Nhạc Nền</button></div>
          </div>
          <div style="display:flex;gap:8px;">
            <button type="button" class="btn btn-primary btn-sm" style="flex:1;" data-action="preview-music">Nghe Nhạc Mặc Định</button>
            <button type="button" class="btn btn-outline btn-sm" data-action="stop-music">Dừng</button>
          </div>
        ` : `
        <div class="form-group">
          <label>Chọn Giai Điệu Cưới</label>
          <select class="select" data-music="trackId">
            ${MUSIC_TRACKS.map(tr => `<option value="${tr.id}" ${m.trackId === tr.id ? 'selected' : ''}>${tr.label}</option>`).join('')}
          </select>
        </div>
        ${m.trackId === 'custom' ? `
          <div class="form-group">
            <label>Link file nhạc (.mp3) hoặc tải lên</label>
            <input class="input" data-music="customUrl" value="${escapeHtml(m.customUrl || '')}" placeholder="https://.../nhac-cuoi.mp3" style="margin-bottom:6px;" />
            <label class="upload-drop" style="width:100%;padding:8px;">
              Tải file MP3 từ máy (tối đa 12MB)
              <input type="file" accept="audio/*" style="display:none;" data-upload-audio />
            </label>
          </div>
        ` : ''}
        <div class="form-group">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            <input type="checkbox" data-music-check="autoplay" ${m.autoplay !== false ? 'checked' : ''} />
            <span>Tự động phát nhạc ngay khi khách chạm mở bìa</span>
          </label>
        </div>
        <div style="display:flex;gap:8px;">
          <button type="button" class="btn btn-primary btn-sm" style="flex:1;" data-action="preview-music">Nghe Thử Nhạc</button>
          <button type="button" class="btn btn-outline btn-sm" data-action="stop-music">Dừng</button>
        </div>
        `}
      </div>

      ${isAdmin ? `
        <div class="inspector-box">
          <h5>Hiệu Ứng Hoa Rơi 3D &amp; Tương Tác</h5>
          <div class="form-group">
            <label>Loại Hiệu Ứng Rơi (Đa Lớp Chiều Sâu)</label>
            <select class="select" data-fx="particleEffect">
              ${PARTICLE_EFFECTS.map(p => `<option value="${p.id}" ${d.particleEffect === p.id ? 'selected' : ''}>${p.label}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Mật Độ Hạt Rơi</label>
            <select class="select" data-fx="particleDensity">
              <option value="low" ${d.particleDensity === 'low' ? 'selected' : ''}>Nhẹ nhàng tinh tế</option>
              <option value="medium" ${(d.particleDensity || 'medium') === 'medium' ? 'selected' : ''}>Cân đối lãng mạn</option>
              <option value="high" ${d.particleDensity === 'high' ? 'selected' : ''}>Rực rỡ lễ hội</option>
            </select>
          </div>
          <label style="display:flex;align-items:center;gap:8px;font-size:12.5px;margin-bottom:10px;cursor:pointer;">
            <input type="checkbox" data-fx-bool="interactiveTrail" ${d.interactiveTrail !== false ? 'checked' : ''} />
            <span>Bật vệt cánh hoa &amp; ánh kim khi khách lướt tay</span>
          </label>
          <button type="button" class="btn btn-outline btn-sm" style="width:100%;" data-test-burst>Thử bung hoa lễ hội</button>
        </div>
      ` : ''}
    `;
  }

  bindFxTab(pane) {
    pane.querySelector('[data-fx-upgrade]')?.addEventListener('click', () => this.openCheckoutFlow());
    pane.querySelectorAll('[data-music]').forEach(el => {
      el.addEventListener('change', () => { this.invitation.music[el.dataset.music] = el.value; this.pushHistory(); if (el.dataset.music === 'trackId') this.renderInspector(); });
    });
    pane.querySelector('[data-music-check="autoplay"]')?.addEventListener('change', e => { this.invitation.music.autoplay = e.target.checked; this.pushHistory(); });
    pane.querySelector('[data-upload-audio]')?.addEventListener('change', async e => {
      const f = e.target.files?.[0];
      if (!f) return;
      try {
        this.onToast('Đang tải file nhạc MP3...', 'info');
        const url = await storage.uploadMedia(f, { invId: this.invitation.id, clientToken: this.clientToken });
        this.invitation.music.customUrl = url;
        this.invitation.music.customName = f.name;
        this.pushHistory();
        this.renderInspector();
        this.onToast(`Đã tải nhạc "${f.name}"`, 'success');
      } catch (err) { this.onToast(err.message || 'Lỗi tải nhạc', 'error'); }
    });
    pane.querySelector('[data-action="preview-music"]')?.addEventListener('click', () => { musicEngine.start(this.invitation.music); this.onToast('Đang phát thử nhạc nền cưới', 'info'); });
    pane.querySelector('[data-action="stop-music"]')?.addEventListener('click', () => musicEngine.stop());
    pane.querySelectorAll('[data-fx]').forEach(el => { el.addEventListener('change', () => { this.invitation.design[el.dataset.fx] = el.value; this.pushHistory(); this.refreshPreview(); }); });
    pane.querySelector('[data-fx-bool="interactiveTrail"]')?.addEventListener('change', e => { this.invitation.design.interactiveTrail = e.target.checked; this.pushHistory(); this.refreshPreview(); });
    pane.querySelector('[data-test-burst]')?.addEventListener('click', () => this.renderer?.particleCtrl?.triggerBurst(null, null, 45));
  }

  /* ================= TAB FORM KHÁCH MỜI ================= */
  tplClientFormTab() {
    const gf = this.invitation.guestForm || { customFields: [] };
    const fields = gf.customFields || [];
    const wishes = this.invitation.wishes || [];
    const trialState = this.mode === 'client' ? getTrialState(this.invitation) : { active: false, limits: null };
    const customFieldsLocked = trialState.active && !trialState.limits?.allowCustomRsvpFields;
    return `
      <h4 class="inspector-title">
        <span>Form Yêu Cầu Khách Nhập</span>
        ${this.mode === 'admin' ? `<button type="button" class="btn btn-outline btn-xs" data-back-guests>${icon('arrowLeft', 12)} Khách mời</button>` : ''}
      </h4>

      <div class="inspector-box">
        <h5>Mục Hiển Thị Trên Trang Khách Mời</h5>
        <div class="form-group"><label>Tiêu đề khung xác nhận</label><input class="input" data-gf="heading" value="${escapeHtml(gf.heading || '')}" /></div>
        <div class="form-group"><label>Mô tả ngắn</label><input class="input" data-gf="subtitle" value="${escapeHtml(gf.subtitle || '')}" /></div>
        <label style="display:flex;gap:8px;font-size:12.5px;margin:6px 0;"><input type="checkbox" data-gf-bool="askAttendance" ${gf.askAttendance !== false ? 'checked' : ''} /> Hỏi khách xác nhận tham dự</label>
        <label style="display:flex;gap:8px;font-size:12.5px;margin:6px 0;"><input type="checkbox" data-gf-bool="askGuestsCount" ${gf.askGuestsCount !== false ? 'checked' : ''} /> Hỏi số lượng người đi cùng</label>
        <label style="display:flex;gap:8px;font-size:12.5px;margin:6px 0;"><input type="checkbox" data-gf-bool="askSide" ${gf.askSide !== false ? 'checked' : ''} /> Hỏi khách bên Nhà Trai / Nhà Gái</label>
        <label style="display:flex;gap:8px;font-size:12.5px;margin:6px 0;"><input type="checkbox" data-gf-bool="askWish" ${gf.askWish !== false ? 'checked' : ''} /> Ô gửi lời chúc trong mục RSVP</label>
      </div>

      <div class="inspector-box">
        <h5>Câu Hỏi Riêng Khách Hàng Yêu Cầu (${fields.length})</h5>
        ${customFieldsLocked ? `
          <div style="padding:11px;border-radius:10px;background:#fdf6e7;border:1px dashed #d6b16d;font-size:12px;color:#7b4f10;line-height:1.5;">
            <strong>Tùy biến câu hỏi RSVP bị khóa trên bản dùng thử ${trialState.days} ngày</strong><br/>
            Nâng cấp lên gói chính thức để thêm không giới hạn câu hỏi riêng (thực đơn chay/mặn, xe đưa đón, lời nhắn riêng...).
            <div style="margin-top:8px;"><button type="button" class="btn btn-gold btn-xs" data-cf-upgrade>Nâng Cấp Mở Khóa</button></div>
          </div>
        ` : `
        ${fields.map((f, idx) => `
          <div style="background:#fff;border:1px solid var(--ui-border);border-radius:10px;padding:9px;margin-bottom:8px;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
              <strong style="font-size:12px;">Câu hỏi #${idx + 1}</strong>
              <button type="button" class="btn btn-danger btn-xs" data-del-cf="${idx}">Xóa</button>
            </div>
            <div class="form-group"><input class="input" data-cf="${idx}:label" value="${escapeHtml(f.label)}" placeholder="Nội dung câu hỏi..." /></div>
            <div class="grid-2" style="margin-bottom:6px;">
              <select class="select" data-cf="${idx}:type">
                <option value="text" ${f.type === 'text' ? 'selected' : ''}>Ô nhập chữ ngắn</option>
                <option value="textarea" ${f.type === 'textarea' ? 'selected' : ''}>Ô đoạn văn</option>
                <option value="select" ${f.type === 'select' ? 'selected' : ''}>Danh sách chọn</option>
              </select>
              <label style="display:flex;align-items:center;gap:6px;font-size:12px;"><input type="checkbox" data-cf-req="${idx}" ${f.required ? 'checked' : ''} /> Bắt buộc</label>
            </div>
            ${f.type === 'select' ? `<input class="input" data-cf-opts="${idx}" value="${escapeHtml((f.options || []).join(', '))}" placeholder="Lựa chọn cách nhau bằng dấu phẩy" />` : ''}
          </div>
        `).join('')}
        <button type="button" class="btn btn-primary btn-sm" style="width:100%;" data-add-cf>+ Thêm câu hỏi mới</button>
        `}
      </div>

      <div class="inspector-box" data-content-group="guestbook">
        <h5>Sổ Lưu Bút &amp; Duyệt Lời Chúc (${wishes.length})</h5>
        <div class="form-group">
          <label>Tiêu đề mục Sổ Lưu Bút</label>
          <input class="input" data-gb-heading value="${escapeHtml(this.invitation.content?.guestbookHeading || 'SỔ LƯU BÚT')}" />
        </div>
        ${wishes.length === 0 ? `<p style="font-size:12px;color:var(--ui-muted);margin:0;">Chưa có lời chúc nào.</p>` : wishes.map((w, i) => `
          <div style="background:#fff;border:1px solid var(--ui-border);border-radius:9px;padding:8px;margin-bottom:6px;font-size:12px;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
              <strong>${escapeHtml(w.name)}</strong>
              <div style="display:flex;gap:4px;">
                <button type="button" class="btn btn-outline btn-xs" data-toggle-wish="${i}">${w.hidden ? 'Hiện' : 'Ẩn'}</button>
                <button type="button" class="btn btn-danger btn-xs" data-del-wish="${i}">Xóa</button>
              </div>
            </div>
            <p style="margin:4px 0 0;color:var(--ui-muted);">${escapeHtml(w.message)}</p>
          </div>
        `).join('')}
      </div>
    `;
  }

  bindClientFormTab(pane) {
    pane.querySelector('[data-cf-upgrade]')?.addEventListener('click', () => this.openCheckoutFlow());
    pane.querySelector('[data-back-guests]')?.addEventListener('click', () => { this.activeTab = 'guests'; this.renderInspector(); });
    pane.querySelectorAll('[data-gf]').forEach(el => { el.addEventListener('input', () => { this.invitation.guestForm[el.dataset.gf] = el.value; this.refreshPreview(); }); });
    pane.querySelectorAll('[data-gf-bool]').forEach(cb => { cb.addEventListener('change', () => { this.invitation.guestForm[cb.dataset.gfBool] = cb.checked; this.pushHistory(); this.refreshPreview(); }); });
    pane.querySelectorAll('[data-cf]').forEach(el => {
      const h = () => {
        const [idx, field] = el.dataset.cf.split(':');
        this.invitation.guestForm.customFields[Number(idx)][field] = el.value;
        if (field === 'type') this.renderInspector();
        this.refreshPreview();
      };
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', h);
    });
    pane.querySelectorAll('[data-cf-req]').forEach(cb => { cb.addEventListener('change', () => { this.invitation.guestForm.customFields[Number(cb.dataset.cfReq)].required = cb.checked; this.refreshPreview(); }); });
    pane.querySelectorAll('[data-cf-opts]').forEach(inp => { inp.addEventListener('input', () => { this.invitation.guestForm.customFields[Number(inp.dataset.cfOpts)].options = inp.value.split(',').map(s => s.trim()).filter(Boolean); this.refreshPreview(); }); });
    pane.querySelector('[data-add-cf]')?.addEventListener('click', () => {
      this.invitation.guestForm.customFields = this.invitation.guestForm.customFields || [];
      this.invitation.guestForm.customFields.push({ id: 'cf_' + Date.now(), label: 'Bạn có cần xe đưa đón không?', type: 'select', options: ['Tự di chuyển', 'Đăng ký xe đưa đón'], required: false });
      this.pushHistory();
      this.renderInspector();
      this.refreshPreview();
    });
    pane.querySelectorAll('[data-del-cf]').forEach(btn => { btn.addEventListener('click', () => { this.invitation.guestForm.customFields.splice(Number(btn.dataset.delCf), 1); this.pushHistory(); this.renderInspector(); this.refreshPreview(); }); });
    pane.querySelector('[data-gb-heading]')?.addEventListener('input', e => { this.invitation.content.guestbookHeading = e.target.value; this.refreshPreview(); });
    pane.querySelectorAll('[data-toggle-wish]').forEach(btn => { btn.addEventListener('click', () => { const w = this.invitation.wishes[Number(btn.dataset.toggleWish)]; w.hidden = !w.hidden; this.renderInspector(); this.refreshPreview(); }); });
    pane.querySelectorAll('[data-del-wish]').forEach(btn => { btn.addEventListener('click', () => { this.invitation.wishes.splice(Number(btn.dataset.delWish), 1); this.renderInspector(); this.refreshPreview(); }); });
  }

  /* ================= TAB 6: KHÁCH MỜI & THỐNG KÊ RSVP ================= */
  tplGuestsTab() {
    const guests = this.invitation.guests || [];
    const rsvps = this.invitation.rsvps || [];
    const totalAttending = rsvps.filter(r => r.attendance === 'yes').reduce((acc, r) => acc + (Number(r.guestsCount) || 1), 0);
    const trialState = this.mode === 'client' ? getTrialState(this.invitation) : { active: false, limits: null };
    const guestLocked = trialState.active && !trialState.limits?.allowGuestPersonalLinks;

    return `
      <h4 class="inspector-title"><span>Khách Mời &amp; Xác Nhận RSVP</span></h4>

      ${this.mode === 'admin' ? `
        <div style="margin-bottom:10px;">
          <button type="button" class="btn btn-outline btn-sm" style="width:100%;" data-open-form-builder>Cấu hình câu hỏi yêu cầu khách nhập</button>
        </div>
      ` : ''}

      ${guestLocked ? `
        <div class="inspector-box" style="background:#fdf6e7;border-color:#e5cfa0;">
          <div style="font-size:12.5px;font-weight:700;color:#7b4f10;margin-bottom:5px;">Giới Hạn Bản Dùng Thử ${trialState.days} Ngày</div>
          <p style="font-size:12px;color:#6e5630;margin:0 0 10px;line-height:1.55;">
            Tạo link mang tên riêng từng khách mời, mẫu tin mời Zalo hàng loạt và xuất file Excel RSVP là tính năng của gói chính thức (tối đa ${trialState.limits.maxGuests} khách nháp ở bản thử).
          </p>
          <button type="button" class="btn btn-gold btn-sm" style="width:100%;" data-guest-upgrade>Nâng Cấp Mở Khóa Tạo Link Khách Không Giới Hạn</button>
        </div>
      ` : `
      <div class="inspector-box">
        <h5>Tạo Link Cá Nhân Hóa Tên Khách Mời</h5>
        <div class="form-group">
          <label>Nhập danh sách tên khách (mỗi dòng 1 khách)</label>
          <textarea class="textarea" rows="3" id="bulk-guest-input" placeholder="Anh Minh Tuấn & Gia Đình&#10;Chị Ngọc Lan&#10;Bạn Quốc Huy"></textarea>
        </div>
        <button type="button" class="btn btn-primary btn-sm" style="width:100%;" data-add-guests>+ Thêm Vào Danh Sách</button>
      </div>

      <div class="inspector-box">
        <h5>Mẫu Tin Nhắn Mời Cưới Zalo</h5>
        <select class="select" data-zalo-tpl>
          ${COPY_SUGGESTIONS.zaloTemplates.map((t, i) => `<option value="${i}" ${this.selectedZaloTplIdx === i ? 'selected' : ''}>${t.label}</option>`).join('')}
        </select>
      </div>

      <div class="inspector-box">
        <h5>Danh Sách Khách Mời (${guests.length})</h5>
        ${guests.length === 0 ? `<p style="font-size:12px;color:var(--ui-muted);margin:0;">Chưa có khách mời nào.</p>` : guests.map((gs, idx) => `
          <div style="background:#fff;border:1px solid var(--ui-border);border-radius:10px;padding:9px;margin-bottom:7px;">
            <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
              <strong style="font-size:12.5px;">${escapeHtml(gs.name)}</strong>
              <button type="button" class="btn btn-danger btn-xs" data-del-guest="${idx}">${icon('x', 12)}</button>
            </div>
            <div style="display:flex;gap:5px;margin-top:7px;flex-wrap:wrap;">
              <button type="button" class="btn btn-outline btn-xs" data-copy-guest-link="${idx}">Copy Link</button>
              <button type="button" class="btn btn-primary btn-xs" data-copy-zalo="${idx}">Copy Tin Zalo</button>
              <button type="button" class="btn btn-ghost btn-xs" data-open-guest="${idx}">Mở</button>
            </div>
          </div>
        `).join('')}
      </div>
      `}

      <div class="inspector-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <h5 style="margin:0;">Khách Đã Xác Nhận (${rsvps.length})</h5>
          ${!guestLocked ? `<button type="button" class="btn btn-outline btn-xs" data-export-csv>${icon('download', 12)} Excel</button>` : `<span class="badge badge-trial">Khóa Excel</span>`}
        </div>
        <div style="font-size:12px;margin-bottom:8px;padding:7px 10px;border-radius:8px;background:#e8f5ee;color:#11623d;">
          Tổng số khách chắc chắn tham dự: <strong>${totalAttending} người</strong>
        </div>
        ${rsvps.length === 0 ? `<p style="font-size:12px;color:var(--ui-muted);margin:0;">Chưa có phản hồi RSVP.</p>` : rsvps.map(r => `
          <div style="background:#fff;border:1px solid var(--ui-border);border-radius:9px;padding:8px;margin-bottom:6px;font-size:11.5px;">
            <div style="display:flex;justify-content:space-between;">
              <strong>${escapeHtml(r.name)}</strong>
              <span class="badge ${r.attendance === 'yes' ? 'badge-paid' : r.attendance === 'maybe' ? 'badge-deposit' : 'badge-trial'}">
                ${r.attendance === 'yes' ? `Tham dự (${r.guestsCount})` : r.attendance === 'maybe' ? 'Chưa chắc' : 'Không dự'}
              </span>
            </div>
            ${Object.entries(r.customAnswers || {}).map(([k, v]) => `<div style="color:var(--ui-muted);margin-top:3px;">${escapeHtml(k)}: <b>${escapeHtml(v)}</b></div>`).join('')}
          </div>
        `).join('')}
      </div>
    `;
  }

  bindGuestsTab(pane) {
    pane.querySelector('[data-guest-upgrade]')?.addEventListener('click', () => this.openCheckoutFlow());
    pane.querySelector('[data-open-form-builder]')?.addEventListener('click', () => { this.activeTab = 'client-form'; this.renderInspector(); });
    pane.querySelector('[data-zalo-tpl]')?.addEventListener('change', e => { this.selectedZaloTplIdx = Number(e.target.value); });
    pane.querySelector('[data-add-guests]')?.addEventListener('click', () => {
      const ta = pane.querySelector('#bulk-guest-input');
      const lines = (ta?.value || '').split('\n').map(s => s.trim()).filter(Boolean);
      if (!lines.length) { this.onToast('Vui lòng nhập ít nhất 1 tên khách mời', 'error'); return; }
      this.invitation.guests = this.invitation.guests || [];
      lines.forEach(name => this.invitation.guests.unshift({ id: 'gs_' + Math.random().toString(36).slice(2, 8), name, side: '', group: '' }));
      this.pushHistory();
      this.renderInspector();
      this.onToast(`Đã thêm ${lines.length} khách mời`, 'success');
    });
    const getGuestUrl = name => buildAbsoluteUrl({ role: 'guest', id: this.invitation.id, guest: name });
    pane.querySelectorAll('[data-copy-guest-link]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gs = this.invitation.guests[Number(btn.dataset.copyGuestLink)];
        navigator.clipboard?.writeText(getGuestUrl(gs.name)).then(() => this.onToast(`Đã sao chép link cho "${gs.name}"`, 'success'));
      });
    });
    pane.querySelectorAll('[data-copy-zalo]').forEach(btn => {
      btn.addEventListener('click', () => {
        const gs = this.invitation.guests[Number(btn.dataset.copyZalo)];
        const tpl = COPY_SUGGESTIONS.zaloTemplates[this.selectedZaloTplIdx] || COPY_SUGGESTIONS.zaloTemplates[0];
        const msg = tpl.body
          .replaceAll('{guest}', gs.name)
          .replaceAll('{groom}', this.invitation.content.groomName || 'Chú Rể')
          .replaceAll('{bride}', this.invitation.content.brideName || 'Cô Dâu')
          .replaceAll('{link}', getGuestUrl(gs.name));
        navigator.clipboard?.writeText(msg).then(() => this.onToast(`Đã sao chép tin nhắn mời cho "${gs.name}"`, 'success'));
      });
    });
    pane.querySelectorAll('[data-open-guest]').forEach(btn => {
      btn.addEventListener('click', () => { window.open(getGuestUrl(this.invitation.guests[Number(btn.dataset.openGuest)].name), '_blank'); });
    });
    pane.querySelectorAll('[data-del-guest]').forEach(btn => {
      btn.addEventListener('click', () => { this.invitation.guests.splice(Number(btn.dataset.delGuest), 1); this.pushHistory(); this.renderInspector(); });
    });
    pane.querySelector('[data-export-csv]')?.addEventListener('click', () => {
      const rsvps = this.invitation.rsvps || [];
      if (!rsvps.length) { this.onToast('Chưa có dữ liệu RSVP để xuất', 'info'); return; }
      const customKeys = Array.from(new Set(rsvps.flatMap(r => Object.keys(r.customAnswers || {}))));
      const headers = ['Họ Tên', 'Tham Dự', 'Số Người', 'Bên Gia Đình', ...customKeys, 'Thời Gian'];
      const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const rows = rsvps.map(r => [r.name, r.attendance === 'yes' ? 'Có tham dự' : r.attendance === 'maybe' ? 'Chưa chắc' : 'Không dự', r.guestsCount, r.side, ...customKeys.map(k => r.customAnswers?.[k] || ''), r.createdAt].map(esc).join(','));
      const blob = new Blob(['\uFEFF' + [headers.map(esc).join(','), ...rows].join('\n')], { type: 'text/csv;charset=utf-8;' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `danh-sach-rsvp-${this.invitation.id}.csv`;
      a.click();
      this.onToast('Đã tải file CSV danh sách khách xác nhận', 'success');
    });
  }

  /* ================= TAB 7: ĐƠN HÀNG & QUYỀN ================= */
  tplOrderTab() {
    const o = this.invitation.order || {};
    const p = this.invitation.permissions || {};
    return `
      <h4 class="inspector-title"><span>Đơn Hàng &amp; Phân Quyền</span></h4>
      <div class="inspector-box">
        <h5>Gói Dịch Vụ &amp; Thanh Toán</h5>
        <div class="form-group"><label>Khách hàng đặt thiệp</label><input class="input" data-ord="customerName" value="${escapeHtml(o.customerName || '')}" /></div>
        <div class="form-group"><label>SĐT / Zalo khách</label><input class="input" data-ord="customerPhone" value="${escapeHtml(o.customerPhone || '')}" /></div>
        <div class="grid-2">
          <div class="form-group"><label>Tên gói</label><input class="input" data-ord="packageName" value="${escapeHtml(o.packageName || '')}" /></div>
          <div class="form-group"><label>Giá bán (VNĐ)</label><input class="input" type="number" data-ord-num="price" value="${Number(o.price || 0)}" /></div>
        </div>
        <div class="form-group">
          <label>Trạng thái thanh toán</label>
          <select class="select" data-ord="status">
            <option value="trial" ${o.status === 'trial' ? 'selected' : ''}>Dùng thử (Chưa thanh toán)</option>
            <option value="deposit" ${o.status === 'deposit' ? 'selected' : ''}>Đã đặt cọc</option>
            <option value="paid" ${o.status === 'paid' ? 'selected' : ''}>Đã thanh toán đủ</option>
          </select>
        </div>
        <label style="display:flex;gap:8px;font-size:12.5px;margin-top:8px;">
          <input type="checkbox" data-ord-bool="showWatermark" ${o.showWatermark ? 'checked' : ''} />
          <span>Hiện dải băng "Bản Xem Thử" trước khi thanh toán</span>
        </label>
      </div>

      <div class="inspector-box">
        <h5>Thời Hạn &amp; Giới Hạn Dùng Thử (1–3 Ngày)</h5>
        <div class="form-group">
          <label>Chế độ dùng thử của thiệp này</label>
          <select class="select" data-trial-days>
            <option value="0" ${!this.invitation.trial?.enabled ? 'selected' : ''}>Không giới hạn dùng thử (Bản đầy đủ)</option>
            <option value="1" ${this.invitation.trial?.enabled && Number(this.invitation.trial?.days) === 1 ? 'selected' : ''}>Dùng thử 1 ngày (Tối đa 3 ảnh, khóa QR &amp; MP3)</option>
            <option value="2" ${this.invitation.trial?.enabled && Number(this.invitation.trial?.days) === 2 ? 'selected' : ''}>Dùng thử 2 ngày (Tối đa 5 ảnh, khóa QR &amp; MP3)</option>
            <option value="3" ${this.invitation.trial?.enabled && Number(this.invitation.trial?.days) === 3 ? 'selected' : ''}>Dùng thử 3 ngày (Tối đa 6 ảnh, khóa QR &amp; MP3)</option>
          </select>
        </div>
        ${this.invitation.trial?.enabled ? `<div style="font-size:11.5px;color:var(--ui-muted);">Trạng thái: <strong>${escapeHtml(getTrialState(this.invitation).remainingText)}</strong></div>` : ''}
      </div>

      <div class="inspector-box">
        <h5>Quyền Truy Cập Cổng Khách Hàng</h5>
        <p style="font-size:11.5px;color:var(--ui-muted);margin:0 0 8px;">Mã truy cập riêng: <code>${escapeHtml(this.invitation.clientToken)}</code></p>
        <label style="display:flex;gap:8px;font-size:12.5px;margin:7px 0;">
          <input type="checkbox" data-perm="allowMusicChange" ${p.allowMusicChange ? 'checked' : ''} />
          <span>Cho phép khách hàng tự đổi nhạc nền</span>
        </label>
        <label style="display:flex;gap:8px;font-size:12.5px;margin:7px 0;">
          <input type="checkbox" data-perm="locked" ${p.locked ? 'checked' : ''} />
          <span>Khóa chỉnh sửa từ phía khách hàng</span>
        </label>
      </div>
    `;
  }

  bindOrderTab(pane) {
    pane.querySelectorAll('[data-ord]').forEach(el => {
      el.addEventListener('change', () => {
        this.invitation.order[el.dataset.ord] = el.value;
        if (el.dataset.ord === 'status' && el.value === 'paid') {
          this.invitation.order.showWatermark = false;
          this.invitation.trial = null;
          this.invitation.permissions = { ...(this.invitation.permissions || {}), allowMusicChange: true };
          this.renderInspector();
          this.refreshPreview();
        }
      });
    });
    pane.querySelector('[data-trial-days]')?.addEventListener('change', e => {
      const days = Number(e.target.value) || 0;
      if (days <= 0) {
        this.invitation.trial = null;
        this.invitation.permissions = { ...(this.invitation.permissions || {}), allowMusicChange: true };
      } else {
        this.invitation.trial = buildTrialConfig(days);
        this.invitation.order.status = 'trial';
        this.invitation.order.showWatermark = true;
        this.invitation.permissions = { ...(this.invitation.permissions || {}), allowMusicChange: false };
      }
      this.renderInspector();
      this.refreshPreview();
    });
    pane.querySelectorAll('[data-ord-num]').forEach(el => { el.addEventListener('change', () => { this.invitation.order[el.dataset.ordNum] = Number(el.value) || 0; }); });
    pane.querySelectorAll('[data-ord-bool]').forEach(cb => { cb.addEventListener('change', () => { this.invitation.order[cb.dataset.ordBool] = cb.checked; this.refreshPreview(); }); });
    pane.querySelectorAll('[data-perm]').forEach(cb => { cb.addEventListener('change', () => { this.invitation.permissions[cb.dataset.perm] = cb.checked; }); });
  }

  /* ================= TAB 8: THANH TOÁN TRỰC TIẾP MẪU ĐÃ CHỌN (KHÁCH HÀNG) ================= */
  tplCheckoutTab() {
    const inv = this.invitation;
    const s = this.settings || {};
    const pkgs = s.packages || [];
    const curPkg = pkgs[this.selectedPkgIdx] || pkgs[0] || { name: 'Gói Tiêu Chuẩn 3D', price: 229000, photoLimit: '30 ảnh HD', duration: '18 tháng' };
    const isPaid = inv.order?.status === 'paid';
    const photoCount = (inv.content?.gallery?.length || 0) + (inv.content?.heroPhoto ? 1 : 0);
    const bankCode = s.paymentBankCode || 'MB';
    const bankNo = (s.paymentAccountNo || '0354248177').replace(/\s+/g, '');
    const bankName = s.paymentBankName || 'MB Bank — Ngân hàng Quân Đội';
    const hotline = s.hotline || '0354 248 177';
    const zaloUrl = s.zaloUrl || 'https://zalo.me/0354248177';
    const shortId = (inv.id || 'THIEP').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
    const cleanPhone = (this.checkoutCustomerPhone || inv.order?.customerPhone || 'SDT').replace(/\D/g, '').slice(-10) || 'SDT';
    const memo = `THIEP ${shortId} ${cleanPhone}`;
    const qs = new URLSearchParams({ amount: String(curPkg.price || 0), addInfo: memo });
    if (s.paymentAccountName) qs.set('accountName', s.paymentAccountName);
    const qrUrl = `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(bankNo)}-compact2.png?${qs.toString()}`;

    if (isPaid) {
      return `
        <h4 class="inspector-title"><span>Trạng Thái Thanh Toán</span></h4>
        <div class="inspector-box" style="background:#eef8f2;border-color:#b7e2c8;">
          <div style="font-size:13px;font-weight:700;color:#11623d;margin-bottom:6px;">Thiệp Cưới Đã Được Kích Hoạt VIP</div>
          <p style="font-size:12px;color:#275a3e;margin:0 0 10px;line-height:1.55;">
            Mẫu thiệp <strong>${escapeHtml(inv.title)}</strong> đã thanh toán đủ (${escapeHtml(inv.order?.packageName || '')}) và đã tắt hoàn toàn dải băng Bản Xem Thử. Bạn có thể tiếp tục sửa nội dung, ảnh cưới và gửi link cho khách mời bất cứ lúc nào.
          </p>
          <button type="button" class="btn btn-primary btn-sm" style="width:100%;" data-co-open-links>Mở Đường Link Gửi Khách Mời</button>
        </div>
      `;
    }

    const trialState = getTrialState(inv);
    return `
      <h4 class="inspector-title"><span>${trialState.active ? 'Nâng Cấp Gói Chính Thức' : 'Thanh Toán Mẫu Đã Chọn'}</span></h4>

      ${trialState.active ? `
        <div class="inspector-box" style="background:#fdf6e7;border-color:#e5cfa0;">
          <div style="font-size:12.5px;font-weight:700;color:#7b4f10;margin-bottom:5px;">Đang Dùng Thử ${trialState.days} Ngày • ${escapeHtml(trialState.remainingText)}</div>
          <ul style="margin:0;padding-left:16px;font-size:11.5px;color:#5c4420;line-height:1.6;">
            <li>Gỡ giới hạn ${trialState.days} ngày &amp; xóa hoàn toàn dải Bản Dùng Thử</li>
            <li>Mở khóa tải 12–60+ ảnh Album 3D (hiện giới hạn ${trialState.limits.maxPhotos} ảnh)</li>
            <li>Mở khóa Bao Lì Xì VietQR mừng cưới, Nhạc MP3 riêng, Câu hỏi RSVP &amp; Link từng khách mời</li>
            <li>Giữ nguyên 100% ảnh và nội dung bạn vừa chỉnh sửa!</li>
          </ul>
        </div>
      ` : ''}

      <div class="inspector-box" style="background:var(--ui-brand-soft);border-color:rgba(123,28,38,0.2);">
        <div style="display:flex;gap:10px;align-items:center;">
          ${inv.content?.heroPhoto
            ? `<img src="${escapeHtml(inv.content.heroPhoto)}" alt="" style="width:48px;height:62px;object-fit:cover;border-radius:8px;border:1px solid #fff;" />`
            : `<div style="width:48px;height:62px;border-radius:8px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--ui-brand);font-weight:700;">MẪU</div>`}
          <div style="flex:1;min-width:0;">
            <div style="font-size:13px;font-weight:700;color:var(--ui-brand);">${escapeHtml(inv.content?.groomName || 'Chú Rể')} &amp; ${escapeHtml(inv.content?.brideName || 'Cô Dâu')}</div>
            <div style="font-size:11.5px;color:var(--ui-text);">Mẫu: <strong>${escapeHtml(inv.templateName || inv.templateId || 'Đã chọn')}</strong></div>
            <div style="font-size:11px;color:var(--ui-muted);margin-top:2px;">Đang có ${photoCount} ảnh đã tải • Tự động lưu mọi nội dung bạn vừa sửa</div>
          </div>
        </div>
        ${inv.order?.paymentSubmittedAt ? `
          <div style="margin-top:9px;padding:7px 9px;border-radius:8px;background:#fff;font-size:11.5px;color:#8a5a12;border:1px solid #e6d2a2;">
            Bạn đã gửi xác nhận chuyển khoản (Mã: <strong>${escapeHtml(inv.order.transferCode || '')}</strong>). Studio đang đối soát MB Bank và mở khóa VIP ngay trong ít phút!
          </div>
        ` : ''}
      </div>

      <div class="inspector-box">
        <h5>1. Chọn Gói Dịch Vụ Cho Thiệp Này</h5>
        ${pkgs.map((p, idx) => {
          const active = idx === this.selectedPkgIdx;
          return `
            <div class="palette-option" data-co-pkg="${idx}" style="${active ? 'border-color:var(--ui-brand);background:var(--ui-brand-soft);' : ''}">
              <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;">
                <strong style="font-size:12.5px;">${escapeHtml(p.name)}</strong>
                <strong style="font-size:13px;color:var(--ui-brand);">${Number(p.price || 0).toLocaleString('vi-VN')}đ</strong>
              </div>
              <div style="font-size:11px;color:var(--ui-muted);margin-top:3px;">${escapeHtml(p.photoLimit || '')} • ${escapeHtml(p.duration || '')}</div>
            </div>
          `;
        }).join('')}
        ${photoCount > 8 && this.selectedPkgIdx === 0 ? `
          <div style="font-size:11.5px;color:#8a5a12;background:#fdf6e7;padding:7px 9px;border-radius:8px;margin-top:4px;">
            Gợi ý: Thiệp bạn đang dùng ${photoCount} ảnh — nên chọn từ <strong>Gói Tiêu Chuẩn (20 ảnh + Gửi lời chúc + Mã QR)</strong> trở lên.
          </div>
        ` : ''}
      </div>

      <div class="inspector-box" style="text-align:center;">
        <h5 style="text-align:left;">2. Quét Mã VietQR MB Bank Thanh Toán</h5>
        <img id="co-qr-img" src="${escapeHtml(qrUrl)}" alt="VietQR MB Bank" style="width:200px;max-width:100%;border-radius:10px;border:1px solid var(--ui-border);background:#fff;padding:5px;margin:4px auto 10px;display:block;" />
        <div style="font-size:12.5px;line-height:1.6;margin-bottom:8px;">
          <div><strong>${escapeHtml(bankName)}</strong></div>
          <div>STK: <strong style="color:var(--ui-brand);font-size:14px;">${escapeHtml(bankNo)}</strong></div>
          ${s.paymentAccountName ? `<div>Chủ TK: <strong>${escapeHtml(s.paymentAccountName)}</strong></div>` : ''}
          <div>Số tiền: <strong style="color:var(--ui-success);font-size:14px;">${Number(curPkg.price || 0).toLocaleString('vi-VN')}đ</strong></div>
          <div style="font-size:11.5px;color:var(--ui-muted);">Nội dung CK: <strong id="co-qr-memo" style="color:var(--ui-text);">${escapeHtml(memo)}</strong></div>
        </div>
        <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;">
          <button type="button" class="btn btn-outline btn-xs" data-co-copy="${escapeHtml(bankNo)}">Sao chép STK</button>
          <button type="button" class="btn btn-outline btn-xs" data-co-copy="${escapeHtml(memo)}">Sao chép Nội dung CK</button>
        </div>
      </div>

      <form class="inspector-box" id="studio-checkout-form">
        <h5>3. Xác Nhận Thanh Toán &amp; Lưu Thiệp</h5>
        <div class="form-group"><label>Họ tên của bạn *</label><input class="input" name="name" required value="${escapeHtml(this.checkoutCustomerName)}" placeholder="VD: Minh Quân" /></div>
        <div class="form-group"><label>SĐT / Zalo nhận kích hoạt (chỉ nhập số) *</label><input class="input" type="tel" inputmode="numeric" pattern="[0-9]{9,11}" maxlength="11" name="phone" required value="${escapeHtml((this.checkoutCustomerPhone || '').replace(/\D/g, ''))}" placeholder="09xxxxxxxx" /></div>
        <div class="form-group"><label>Ghi chú cho Studio (tùy chọn)</label><textarea class="textarea" rows="2" name="note" placeholder="VD: Đã chuyển khoản MB Bank, nhờ shop kích hoạt giúp...">${escapeHtml(this.checkoutNote)}</textarea></div>
        <button type="submit" class="btn btn-primary" style="width:100%;padding:11px;margin-bottom:8px;" id="btn-co-submit">Tôi Đã Chuyển Tiền — Nhận Sản Phẩm Ngay</button>
        <button type="button" class="btn btn-gold btn-sm" style="width:100%;margin-bottom:8px;" data-co-open-full>Mở Trang Chuyển Tiền Toàn Màn Hình</button>
        <a class="btn btn-outline btn-sm" style="width:100%;" href="${escapeHtml(zaloUrl)}" target="_blank" rel="noopener">Hỗ trợ qua Zalo (${escapeHtml(hotline)})</a>
      </form>
    `;
  }

  bindCheckoutTab(pane) {
    pane.querySelector('[data-co-open-links]')?.addEventListener('click', () => this.onOpenShareModal?.(this.invitation, this.mode));
    pane.querySelector('[data-co-open-full]')?.addEventListener('click', () => this.openCheckoutFlow());
    pane.querySelectorAll('[data-co-pkg]').forEach(el => {
      el.addEventListener('click', () => {
        this.selectedPkgIdx = Number(el.dataset.coPkg);
        this.renderInspector();
      });
    });
    pane.querySelectorAll('[data-co-copy]').forEach(btn => {
      btn.addEventListener('click', () => {
        navigator.clipboard?.writeText(btn.dataset.coCopy).then(() => this.onToast('Đã sao chép thông tin chuyển khoản', 'success'));
      });
    });
    const form = pane.querySelector('#studio-checkout-form');
    if (form) {
      form.querySelector('input[name="name"]')?.addEventListener('input', e => { this.checkoutCustomerName = e.target.value; });
      form.querySelector('input[name="phone"]')?.addEventListener('input', e => {
        e.target.value = e.target.value.replace(/\D/g, '').slice(0, 11);
        this.checkoutCustomerPhone = e.target.value;
        const shortId = (this.invitation.id || 'THIEP').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
        const cleanPhone = (this.checkoutCustomerPhone || 'SDT').replace(/\D/g, '').slice(-10) || 'SDT';
        const memo = `THIEP ${shortId} ${cleanPhone}`;
        const memoEl = pane.querySelector('#co-qr-memo');
        if (memoEl) memoEl.textContent = memo;
        const pkgs = this.settings.packages || [];
        const curPkg = pkgs[this.selectedPkgIdx] || pkgs[0] || { price: 229000 };
        const bankCode = this.settings.paymentBankCode || 'MB';
        const bankNo = (this.settings.paymentAccountNo || '0354248177').replace(/\s+/g, '');
        const qs = new URLSearchParams({ amount: String(curPkg.price || 0), addInfo: memo });
        if (this.settings.paymentAccountName) qs.set('accountName', this.settings.paymentAccountName);
        const img = pane.querySelector('#co-qr-img');
        if (img) img.src = `https://img.vietqr.io/image/${encodeURIComponent(bankCode)}-${encodeURIComponent(bankNo)}-compact2.png?${qs.toString()}`;
      });
      form.querySelector('textarea[name="note"]')?.addEventListener('input', e => { this.checkoutNote = e.target.value; });

      form.addEventListener('submit', async e => {
        e.preventDefault();
        if (this.submittingCheckout) return;
        this.submittingCheckout = true;
        const btn = pane.querySelector('#btn-co-submit');
        if (btn) { btn.disabled = true; btn.textContent = 'Đang lưu & gửi thanh toán...'; }
        try {
          // 1. Auto-save ALL customer's photo & section edits first!
          await this.onSave?.(deepClone(this.invitation));

          // 2. Submit QR payment order linked directly to this exact invitation!
          const pkgs = this.settings.packages || [];
          const curPkg = pkgs[this.selectedPkgIdx] || pkgs[0] || { name: 'Gói Tiêu Chuẩn 3D', price: 229000 };
          const shortId = (this.invitation.id || 'THIEP').replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, 10);
          const cleanPhone = (this.checkoutCustomerPhone || 'SDT').replace(/\D/g, '').slice(-10) || 'SDT';
          const transferCode = `THIEP ${shortId} ${cleanPhone}`;

          await this.onCheckoutOrder?.({
            kind: 'qr_order',
            invitationId: this.invitation.id,
            packageId: curPkg.id || '',
            name: this.checkoutCustomerName.trim(),
            phone: this.checkoutCustomerPhone.trim(),
            email: this.currentUser?.email || this.invitation.order?.customerEmail || '',
            templateId: this.invitation.templateId || '',
            templateName: this.invitation.templateName || this.invitation.title,
            packageName: curPkg.name,
            amount: Number(curPkg.price || 0),
            transferCode,
            message: this.checkoutNote.trim() || `Thanh toán trực tiếp thiệp "${this.invitation.title}" (${curPkg.name})`,
          });

          this.invitation.order = this.invitation.order || {};
          this.invitation.order.packageName = curPkg.name;
          this.invitation.order.price = Number(curPkg.price || 0);
          this.invitation.order.transferCode = transferCode;
          this.invitation.order.paymentSubmittedAt = new Date().toISOString();
          this.onToast('Đã lưu toàn bộ ảnh/nội dung & gửi xác nhận thanh toán! Studio sẽ mở khóa VIP ngay.', 'success');
          this.renderInspector();
        } catch (err) {
          this.onToast(err.message || 'Lỗi gửi xác nhận thanh toán', 'error');
        } finally {
          this.submittingCheckout = false;
          if (btn) { btn.disabled = false; btn.textContent = 'Lưu Thiệp & Xác Nhận Thanh Toán'; }
        }
      });
    }
  }

  destroy() {
    if (this.renderer) { this.renderer.destroy(); this.renderer = null; }
  }
}
