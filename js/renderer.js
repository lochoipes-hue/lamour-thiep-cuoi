/**
 * L'Amour Atelier — Trình Hiển Thị Thiệp Cưới Biên Tập Cao Cấp
 * Bìa ảnh nền mờ cuốn hút + Hoa văn chạm khắc ép kim + Phong bì nhung 3D + Coverflow 3D + Bao Lì Xì
 * Tối giản icon tuyệt đối — Không icon thừa sơ sài, ưu tiên nghệ thuật chữ & ảnh.
 */

import {
  FONT_OPTIONS,
  VIET_BANKS,
  COPY_SUGGESTIONS,
  getTrialState,
  getOrnamentCornerSvg,
  getOrnamentDividerSvg,
  getCrestBadgeSvg,
} from './data.js?v=14';
import {
  getBotanicalSpraySvg,
  getCoverFiligreeFrameSvg,
  getPalaceEtchingSvg,
  getWaxSealSvg,
  getFleuronDividerSvg,
  resolveBackdropUrl,
} from './artwork.js?v=14';
import { icon } from './icons.js?v=14';
import { musicEngine, ParticleCanvasController } from './audio-fx.js?v=14';

export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fontStack(fontId) {
  const f = FONT_OPTIONS.find(x => x.id === fontId);
  return f ? f.stack : `'${fontId}', serif`;
}

function buildBackgroundCss(d) {
  if (d.bgMode === 'solid') return d.bgColor || '#FFF7EB';
  const c1 = d.bgGradient1 || d.bgColor || '#FFF9F0';
  const c2 = d.bgGradient2 || '#FAF0E1';
  const c3 = d.bgGradient3 || c2;
  const ang = Number.isFinite(Number(d.bgAngle)) ? Number(d.bgAngle) : 160;
  return `linear-gradient(${ang}deg, ${c1} 0%, ${c2} 52%, ${c3} 100%)`;
}

function resolveViewData(invitation, { blankMode = false, guestName = '' } = {}) {
  const raw = invitation.content || {};
  if (!blankMode) {
    return {
      ...raw,
      displayGuestName: guestName || 'Quý Khách & Gia Đình',
      initials: `${(raw.groomName || 'M').trim().charAt(0).toUpperCase()} & ${(raw.brideName || 'N').trim().charAt(0).toUpperCase()}`,
    };
  }
  return {
    topBadge: raw.topBadge || 'TRÂN TRỌNG KÍNH MỜI',
    groomName: 'Tên Chú Rể',
    groomFullName: '[Họ và Tên Chú Rể]',
    groomYear: '199X',
    brideName: 'Tên Cô Dâu',
    brideFullName: '[Họ và Tên Cô Dâu]',
    brideYear: '199X',
    weddingDate: '2026-12-20',
    weddingTime: '17:00',
    lunarDate: '[Tức ngày ... tháng ... năm Âm Lịch]',
    quoteText: '[Lời ngỏ mời cưới trang trọng của hai gia đình và đôi uyên ương sẽ hiển thị tại khu vực này.]',
    groomFamilyTitle: 'NHÀ TRAI',
    groomFather: 'Ông [Họ Tên Cha]',
    groomMother: 'Bà [Họ Tên Mẹ]',
    groomAddress: '[Địa chỉ Tư gia Nhà Trai]',
    brideFamilyTitle: 'NHÀ GÁI',
    brideFather: 'Ông [Họ Tên Cha]',
    brideMother: 'Bà [Họ Tên Mẹ]',
    brideAddress: '[Địa chỉ Tư gia Nhà Gái]',
    heroPhoto: '',
    gallery: [],
    events: [
      {
        id: 'ev_b1',
        name: 'Lễ Vu Quy & Thành Hôn',
        time: '08:30 — [Thứ ..., Ngày .../.../2026]',
        venue: '[Địa Điểm Tổ Chức Lễ Gia Tiên]',
        address: '[Số nhà, Đường, Quận/Huyện, Thành phố]',
        mapUrl: '#',
      },
      {
        id: 'ev_b2',
        name: 'Tiệc Cưới Chung Vui',
        time: '17:00 — [Thứ ..., Ngày .../.../2026]',
        venue: '[Trung Tâm Hội Nghị Tiệc Cưới — Sảnh Tiệc]',
        address: '[Địa chỉ nhà hàng & Liên kết chỉ đường Google Maps]',
        mapUrl: '#',
      },
    ],
    story: [
      { id: 'st_b1', date: 'Mốc Thời Gian 01', title: 'Lần Đầu Gặp Gỡ', text: '[Câu chuyện kỷ niệm đầu tiên của đôi uyên ương.]' },
      { id: 'st_b2', date: 'Mốc Thời Gian 02', title: 'Chặng Đường Đồng Hành', text: '[Những khoảnh khắc ngọt ngào bên nhau.]' },
      { id: 'st_b3', date: 'Mốc Thời Gian 03', title: 'Ngày Về Chung Một Nhà', text: '[Lời hẹn ước trăm năm trong ngày trọng đại.]' },
    ],
    gift: {
      title: 'Hộp Mừng Cưới',
      subtitle: '[Lời cảm ơn và mã QR chuyển khoản VietQR của Cô Dâu & Chú Rể sẽ hiển thị tại đây.]',
      groomBank: { bankCode: 'VCB', accountNo: 'XXXX XXXX XX', accountName: '[TÊN CHỦ TK CHÚ RỂ]' },
      brideBank: { bankCode: 'TCB', accountNo: 'XXXX XXXX XX', accountName: '[TÊN CHỦ TK CÔ DÂU]' },
    },
    footerText: '[Lời cảm ơn chân thành gửi đến Quý khách mời ở cuối tấm thiệp.]',
    displayGuestName: '[Tên Khách Mời Cá Nhân Hóa]',
    initials: 'A & B',
  };
}

function parseDateParts(dateStr) {
  const dt = dateStr ? new Date(dateStr + 'T00:00:00') : new Date('2026-12-20T00:00:00');
  if (isNaN(dt.getTime())) return { day: 20, month: 12, year: 2026, dow: 'Chủ Nhật' };
  const dows = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  return { day: dt.getDate(), month: dt.getMonth() + 1, year: dt.getFullYear(), dow: dows[dt.getDay()] };
}

function formatDateViLong(dateStr) {
  const p = parseDateParts(dateStr);
  return `${p.day} tháng ${p.month}, ${p.year}`;
}

function formatWishTime(iso) {
  if (!iso) return '';
  const dt = new Date(iso);
  if (isNaN(dt.getTime())) return '';
  const pad = n => String(n).padStart(2, '0');
  return `${pad(dt.getHours())}:${pad(dt.getMinutes())} ${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}/${dt.getFullYear()}`;
}

function bankNameByCode(code) {
  return (VIET_BANKS.find(b => b.code === code) || { name: code || 'Ngân hàng' }).name;
}

/**
 * Khung ảnh mẫu nghệ thuật Passe-Partout (không dùng icon hộp ảnh sơ sài!)
 */
function renderBlankFrame(label, sublabel = 'Không gian ảnh cặp đôi') {
  return `
    <div class="inv-blank-frame">
      <div style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:15px;color:var(--inv-ornament);margin-bottom:6px;letter-spacing:1px;">Atelier Frame</div>
      <strong>${escapeHtml(label)}</strong>
      <small>${escapeHtml(sublabel)}</small>
    </div>
  `;
}

function buildCalendarHtml(dateStr) {
  const p = parseDateParts(dateStr);
  const firstDay = new Date(p.year, p.month - 1, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const daysInMonth = new Date(p.year, p.month, 0).getDate();

  const dows = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
  let cells = dows.map(d => `<div class="inv-cal-dow">${d}</div>`).join('');
  for (let i = 0; i < startOffset; i++) cells += `<div></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    if (d === p.day) {
      cells += `<div class="inv-cal-day is-wedding" title="Ngày Trọng Đại">${icon('heartSolid', 28)}<span>${d}</span></div>`;
    } else {
      cells += `<div class="inv-cal-day">${d}</div>`;
    }
  }

  return `
    <div class="inv-calendar-inset">
      <div class="inv-cal-script-title">Tháng ${String(p.month).padStart(2, '0')} / ${p.year}</div>
      <div class="inv-cal-grid">${cells}</div>
    </div>
  `;
}

function buildQrImage(bank, blankMode, label) {
  if (blankMode || !bank || !bank.accountNo || bank.accountNo.includes('X')) {
    return `
      <div class="inv-blank-frame" style="min-height:100%;padding:10px;">
        <strong style="font-size:10px;">${escapeHtml(label)}</strong>
        <small style="font-size:9.5px;">VietQR tự động</small>
      </div>
    `;
  }
  const url = `https://img.vietqr.io/image/${encodeURIComponent(bank.bankCode)}-${encodeURIComponent(bank.accountNo)}-compact2.png?accountName=${encodeURIComponent(bank.accountName || '')}`;
  return `<img src="${url}" alt="VietQR ${escapeHtml(label)}" loading="lazy" onerror="this.parentElement.innerHTML='<div style=\\'font-size:11px;padding:12px;color:#555;\\'>Mã QR Ngân hàng<br><b>${escapeHtml(bank.bankCode)}</b><br>${escapeHtml(bank.accountNo)}</div>'" />`;
}

export class InvitationRenderer {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      inPreview: false,
      editable: false,
      blankMode: false,
      guestName: '',
      brandName: "L'Amour Atelier",
      skipIntro: false,
      onSelectSection: null,
      onGuestSubmit: null,
      onToast: null,
      ...options,
    };
    this.invitation = null;
    this.particleCtrl = null;
    this.countdownTimer = null;
    this.observer = null;
    this.scrollHandler = null;
    this.trailHandler = null;
    this.lastTrailTime = 0;
    this.currentPage = 0;
    this.coverflowIdx = 0;
    this.wishSuggestionIdx = 0;
    this.giftOpened = false;
    this.introOpened = Boolean(this.options.skipIntro);
    this.musicUnsub = null;
    this.touchStartX = null;
  }

  toast(msg, type = 'info') {
    if (this.options.onToast) this.options.onToast(msg, type);
  }

  render(invitation, overrideOpts = {}) {
    this.invitation = invitation;
    this.options = { ...this.options, ...overrideOpts };
    this.cleanupTimers();

    const d = invitation.design || {};
    const c = resolveViewData(invitation, {
      blankMode: this.options.blankMode,
      guestName: this.options.guestName,
    });
    const enabledSections = (invitation.sections || []).filter(s => s.enabled);
    const readingMode = d.readingMode || 'scroll-parallax';
    const scrollFx = d.scrollFx || 'cinematic-rise';
    const isPaged = readingMode === 'book-flip-3d' || readingMode === 'cinematic-slides';

    if (this.currentPage >= enabledSections.length) {
      this.currentPage = Math.max(0, enabledSections.length - 1);
    }

    const contrastBg = d.contrastBg || d.primaryColor || '#511419';
    const contrastText = d.contrastText || '#FDF7F0';
    const backdropUrl = resolveBackdropUrl(d.coverBackdrop || 'burgundy-roses');
    const coverBlur = Number.isFinite(Number(d.coverBlur)) ? Number(d.coverBlur) : 5;
    const coverOverlay = Number.isFinite(Number(d.coverOverlay)) ? Number(d.coverOverlay) : 0.54;

    const styleVars = [
      `--inv-bg: ${buildBackgroundCss(d)}`,
      `--inv-surface: ${d.surfaceColor || '#FDF7F0'}`,
      `--inv-contrast-bg: ${contrastBg}`,
      `--inv-contrast-text: ${contrastText}`,
      `--inv-text: ${d.textColor || '#3B181B'}`,
      `--inv-muted: ${d.mutedColor || '#7E575A'}`,
      `--inv-primary: ${d.primaryColor || '#511419'}`,
      `--inv-secondary: ${d.secondaryColor || '#C59A57'}`,
      `--inv-ornament: ${d.ornamentColor || '#8B5A3C'}`,
      `--inv-button: ${d.buttonColor || d.primaryColor || '#511419'}`,
      `--inv-button-text: ${d.buttonTextColor || '#FFF8F0'}`,
      `--inv-heading-font: ${fontStack(d.headingFont || 'Viaoda Libre')}`,
      `--inv-script-font: ${fontStack(d.scriptFont || 'Pattaya')}`,
      `--inv-body-font: ${fontStack(d.bodyFont || 'Lora')}`,
      `--inv-radius: ${d.borderRadius ?? 10}px`,
      `--inv-cover-blur: ${coverBlur}px`,
      `--inv-cover-overlay: ${coverOverlay}`,
    ].join(';');

    const stageClasses = [
      'inv-stage',
      this.options.inPreview ? 'in-preview' : '',
      this.options.editable ? 'editable-preview' : '',
      !this.introOpened ? 'has-intro-open' : '',
    ].filter(Boolean).join(' ');

    if (!this.options.inPreview) {
      document.body.classList.toggle('inv-intro-locked', !this.introOpened);
      if (!this.introOpened) window.scrollTo(0, 0);
    }

    const trialState = getTrialState(invitation);
    if (!this.options.inPreview && !this.options.blankMode && trialState.active && trialState.expired) {
      this.container.innerHTML = `
        <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:linear-gradient(155deg,#faf6f0,#f0e5d5);font-family:'Be Vietnam Pro',sans-serif;">
          <div style="max-width:460px;width:100%;background:#fff;border:1px solid #e6dccb;border-radius:18px;padding:32px 26px;text-align:center;box-shadow:0 18px 46px rgba(56,22,26,0.12);">
            <div style="font-size:11px;letter-spacing:2.4px;text-transform:uppercase;color:#7b1c26;font-weight:700;margin-bottom:8px;">BẢN DÙNG THỬ ${trialState.days} NGÀY ĐÃ HẾT HẠN</div>
            <h2 style="font-family:'Philosopher',serif;font-size:26px;color:#2e1619;margin:0 0 10px;">${escapeHtml(c.groomName)} &amp; ${escapeHtml(c.brideName)}</h2>
            <p style="font-size:13.5px;color:#6c5759;line-height:1.65;margin:0 0 20px;">
              Thời gian dùng thử miễn phí ${trialState.days} ngày của tấm thiệp này đã kết thúc. Toàn bộ ảnh cưới và nội dung đã chỉnh sửa vẫn được lưu an toàn — Cô Dâu &amp; Chú Rể vui lòng nâng cấp gói chính thức để mở khóa lại ngay lập tức.
            </p>
            <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;">
              <a href="?role=account" style="display:inline-block;padding:10px 20px;border-radius:999px;background:#7b1c26;color:#fff;text-decoration:none;font-weight:600;font-size:13px;">Đăng Nhập &amp; Nâng Cấp Ngay</a>
              <a href="https://zalo.me/0354248177" target="_blank" rel="noopener" style="display:inline-block;padding:10px 18px;border-radius:999px;border:1px solid #d8c8b6;color:#3d2426;text-decoration:none;font-weight:600;font-size:13px;">Zalo Hỗ Trợ: 0354 248 177</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const blankBanner = this.options.blankMode
      ? `<div class="inv-blank-banner"><strong>CHẾ ĐỘ MẪU TRỐNG</strong> — Không ảnh cặp đôi, không tên riêng (chỉ xem giao diện &amp; hiệu ứng)</div>`
      : '';

    const trialRibbon = (!this.options.blankMode && (invitation.order?.showWatermark || trialState.active))
      ? `<div class="inv-trial-ribbon">${trialState.active ? `Bản Dùng Thử ${trialState.days} Ngày (${escapeHtml(trialState.remainingText)})` : 'Bản Xem Thử'} — Thiết kế bởi ${escapeHtml(this.options.brandName)}</div>`
      : '';

    const introHtml = !this.introOpened ? this.buildIntroHtml(d, c, backdropUrl) : '';
    const heroAuraHtml = backdropUrl
      ? `<div class="hero-photo-aura" style="background-image:url('${escapeHtml(backdropUrl)}');"></div>`
      : '';

    let sectionsHtml = '';
    if (isPaged) {
      const sec = enabledSections[this.currentPage] || enabledSections[0];
      const pageCls = readingMode === 'book-flip-3d' ? 'inv-book-page flip-in-next' : 'inv-slide-page';
      sectionsHtml = `
        <div class="${readingMode === 'book-flip-3d' ? 'inv-book-viewport' : ''}">
          ${sec ? this.renderSectionCard(sec, d, c, pageCls) : ''}
        </div>
        <div class="inv-pager-bar">
          <button type="button" class="inv-pager-btn" data-page-nav="prev" ${this.currentPage === 0 ? 'disabled' : ''}>${icon('chevronLeft', 14)} Trước</button>
          <div class="inv-pager-info">
            <div>Trang ${this.currentPage + 1} / ${enabledSections.length}</div>
            <small style="font-size:10px;opacity:0.75;display:block;font-weight:400;">${escapeHtml(sec?.title || '')}</small>
          </div>
          <button type="button" class="inv-pager-btn" data-page-nav="next" ${this.currentPage >= enabledSections.length - 1 ? 'disabled' : ''}>Sau ${icon('chevronRight', 14)}</button>
        </div>
      `;
    } else {
      sectionsHtml = enabledSections.map(sec => this.renderSectionCard(sec, d, c)).join('');
    }

    this.container.innerHTML = `
      <div class="${stageClasses}" data-texture="${escapeHtml(d.texture || 'parchment')}" data-reading="${escapeHtml(readingMode)}" data-scroll-fx="${escapeHtml(scrollFx)}" style="${styleVars}">
        <div class="inv-scroll-progress" data-scroll-bar></div>
        ${heroAuraHtml}
        <div class="inv-paper-grain"></div>
        <div class="inv-palace-layer" data-parallax-bg>${getPalaceEtchingSvg()}</div>
        <canvas class="inv-particle-canvas"></canvas>
        ${blankBanner}
        ${trialRibbon}
        ${introHtml}
        <div class="inv-shell">
          ${sectionsHtml}
        </div>
        <div class="inv-floating-controls">
          <button type="button" class="inv-music-disc ${musicEngine.playing ? 'is-playing' : ''}" data-action="toggle-music" aria-label="Bật hoặc tắt nhạc nền" title="Bật / Tắt nhạc nền">
            ${musicEngine.playing
              ? '<span class="eq-bars"><span></span><span></span><span></span><span></span></span>'
              : icon('musicOff', 18)}
          </button>
        </div>
      </div>
    `;

    this.bindEvents(d, c, enabledSections, isPaged);
    this.startParticles(d);
    this.startCountdown(c.weddingDate, c.weddingTime);
    this.setupScrollEffects(readingMode);
  }

  buildAmbientMotes() {
    const spots = [
      [14, 18, '#D9A64C', 0], [34, 12, '#E8C57B', 1.2], [78, 22, '#F0D89C', 2.4],
      [86, 68, '#D9A64C', 0.8], [20, 74, '#E8C57B', 1.9], [66, 84, '#F2DEC0', 3.1],
    ];
    return `<div class="intro-ambient-motes" style="z-index:2;">${spots.map(([l, t, col, del]) =>
      `<span class="intro-mote" style="left:${l}%;top:${t}%;color:${col};animation-delay:${del}s;">${icon('heartSolid', 9)}</span>`
    ).join('')}</div>`;
  }

  buildIntroHtml(d, c, backdropUrl) {
    const mode = d.introMode || 'chungdoi-floral';
    const waxSymbol = d.ornamentStyle === 'song-hy' ? 'song-hy' : 'heart';
    const motes = this.buildAmbientMotes();
    const bgPhotoLayer = backdropUrl
      ? `<div class="intro-bg-photo" style="background-image:url('${escapeHtml(backdropUrl)}');"></div><div class="intro-bg-tint"></div>`
      : `<div class="intro-bg-tint" style="opacity:0.95;"></div>`;
    const filigree = d.coverPattern !== false ? getCoverFiligreeFrameSvg(d.ornamentStyle) : '';

    if (mode === 'chungdoi-floral') {
      return `
        <div class="inv-intro-overlay" data-intro-trigger>
          ${bgPhotoLayer}
          ${motes}
          <div class="intro-floral-card">
            ${filigree}
            <div class="intro-spray-left" style="color:var(--inv-ornament);">${getBotanicalSpraySvg('left')}</div>
            <div class="intro-spray-right" style="color:var(--inv-ornament);">${getBotanicalSpraySvg('right')}</div>
            <div style="width:52px;height:52px;margin:0 auto 14px;">${getWaxSealSvg(waxSymbol)}</div>
            <h2 class="intro-editorial-names">
              ${escapeHtml(c.groomName)}
              <span class="intro-editorial-amp">&amp;</span>
              ${escapeHtml(c.brideName)}
            </h2>
            ${getFleuronDividerSvg()}
            <div class="intro-editorial-date">${formatDateViLong(c.weddingDate)}</div>
            <div class="intro-guest-line">
              Thân Mời
              <strong>${escapeHtml(c.displayGuestName)}</strong>
            </div>
            <button type="button" class="intro-pill-cta">Mở thiệp</button>
          </div>
        </div>
      `;
    }

    if (mode === 'gatefold-3d') {
      return `
        <div class="inv-intro-overlay" data-intro-trigger>
          ${bgPhotoLayer}
          ${motes}
          <div class="gatefold-stage">
            <div class="gatefold-inner">
              ${filigree}
              <div class="inv-eyebrow">${escapeHtml(c.topBadge)}</div>
              <h2 class="intro-editorial-names" style="margin-top:10px;">${escapeHtml(c.groomName)} &amp; ${escapeHtml(c.brideName)}</h2>
              <div class="intro-editorial-date">${formatDateViLong(c.weddingDate)}</div>
            </div>
            <div class="gatefold-wing left"></div>
            <div class="gatefold-wing right"></div>
            <div class="gatefold-seal-center">
              <div style="width:76px;height:76px;margin:0 auto 14px;">${getWaxSealSvg(waxSymbol)}</div>
              <div style="font-size:11px;letter-spacing:2.4px;text-transform:uppercase;opacity:0.86;">Trân trọng kính mời</div>
              <div style="font-family:var(--inv-heading-font);font-size:22px;margin:4px 0 16px;">${escapeHtml(c.displayGuestName)}</div>
              <button type="button" class="intro-pill-cta" style="background:#fdf7f0;color:var(--inv-contrast-bg);">Mở thiệp</button>
            </div>
          </div>
        </div>
      `;
    }

    if (mode === 'palace-doors') {
      return `
        <div class="inv-intro-overlay" data-intro-trigger>
          ${bgPhotoLayer}
          <div class="palace-doors-wrap" style="z-index:2;">
            <div class="palace-door left" style="opacity:0.92;"></div>
            <div class="palace-door right" style="opacity:0.92;"></div>
          </div>
          <div class="palace-center-card" style="overflow:hidden;">
            ${filigree}
            <div style="position:relative;z-index:3;">
              ${getCrestBadgeSvg(d.ornamentStyle, c.initials)}
              <div class="inv-eyebrow">${escapeHtml(c.topBadge)}</div>
              <h2 class="intro-editorial-names" style="font-size:30px;margin:8px 0;">${escapeHtml(c.groomName)} &amp; ${escapeHtml(c.brideName)}</h2>
              <div class="intro-guest-line" style="margin-bottom:16px;">Thân Mời<strong>${escapeHtml(c.displayGuestName)}</strong></div>
              <button type="button" class="intro-pill-cta">Mở thiệp</button>
            </div>
          </div>
        </div>
      `;
    }

    if (mode === 'silk-curtain') {
      return `
        <div class="inv-intro-overlay" data-intro-trigger>
          ${bgPhotoLayer}
          ${motes}
          <div class="silk-curtain-card" style="position:relative;overflow:hidden;">
            ${filigree}
            <div style="position:relative;z-index:3;">
              ${getCrestBadgeSvg(d.ornamentStyle, c.initials)}
              <div class="inv-eyebrow">${escapeHtml(c.topBadge)}</div>
              <h2 class="intro-editorial-names" style="margin-top:8px;">${escapeHtml(c.groomName)} <span class="intro-editorial-amp">&amp;</span> ${escapeHtml(c.brideName)}</h2>
              ${getFleuronDividerSvg()}
              <div class="intro-editorial-date">${formatDateViLong(c.weddingDate)}</div>
              <div class="intro-guest-line">Kính mời<strong>${escapeHtml(c.displayGuestName)}</strong></div>
              <button type="button" class="intro-pill-cta">Mở thiệp</button>
            </div>
          </div>
        </div>
      `;
    }

    // envelope-3d
    return `
      <div class="inv-intro-overlay" data-intro-trigger>
        ${bgPhotoLayer}
        ${motes}
        <div style="display:flex;flex-direction:column;align-items:center;position:relative;z-index:3;">
          <div class="envelope-3d-wrap">
            <div class="envelope-3d-body"></div>
            <div class="envelope-3d-letter" style="overflow:hidden;">
              ${filigree}
              <div style="position:relative;z-index:3;">
                <div class="inv-eyebrow" style="font-size:9.5px;">${escapeHtml(c.topBadge)}</div>
                <div class="intro-editorial-names" style="font-size:26px;margin:6px 0;">${escapeHtml(c.groomName)} &amp; ${escapeHtml(c.brideName)}</div>
                <div style="font-size:12px;color:var(--inv-muted);">${formatDateViLong(c.weddingDate)}</div>
              </div>
            </div>
            <div class="envelope-3d-flap"></div>
            <div class="envelope-wax-seal-btn">${getWaxSealSvg(waxSymbol)}</div>
          </div>
          <div style="margin-top:24px;text-align:center;color:#fdf7f0;">
            <div style="font-size:11.5px;letter-spacing:1.8px;text-transform:uppercase;opacity:0.86;">Trân trọng kính mời</div>
            <div style="font-family:var(--inv-heading-font);font-size:23px;margin:4px 0 14px;">${escapeHtml(c.displayGuestName)}</div>
            <button type="button" class="intro-pill-cta" style="background:#fdf7f0;color:var(--inv-contrast-bg);">Chạm dấu sáp mở thiệp</button>
          </div>
        </div>
      </div>
    `;
  }

  renderSectionCard(sec, d, c, extraClass = '') {
    const cornerSvg = getOrnamentCornerSvg(d.ornamentStyle);
    const dividerSvg = getOrnamentDividerSvg(d.ornamentStyle);
    const editBadge = this.options.editable ? `<span class="inv-edit-pill">Nhấn để sửa mục này</span>` : '';
    const waxSymbol = d.ornamentStyle === 'song-hy' ? 'song-hy' : 'heart';
    const dp = parseDateParts(c.weddingDate);

    let surfaceClass = 'surface-paper';
    let edgeFlorals = '';
    let showCorners = true;
    let inner = '';

    switch (sec.type) {
      case 'hero': {
        surfaceClass = 'surface-transparent';
        showCorners = false;
        const heroVisual = (!this.options.blankMode && c.heroPhoto)
          ? `<img src="${escapeHtml(c.heroPhoto)}" alt="Ảnh cưới" data-lightbox-src="${escapeHtml(c.heroPhoto)}" onerror="this.parentElement.innerHTML='${escapeHtml(renderBlankFrame('Ảnh Bìa Cưới 3:4', 'Ảnh bìa chính của cặp đôi'))}'" />`
          : renderBlankFrame('Ảnh Bìa Cưới 3:4', this.options.blankMode ? 'Chế độ Mẫu Trống — Không lộ ảnh thật' : 'Tải ảnh bìa trong mục Nội dung');

        inner = `
          <div class="hero-envelope-scene">
            <div class="hero-velvet-back">
              <div class="hero-velvet-topflap"></div>
              <div class="hero-envelope-bouquet" style="color:var(--inv-ornament);">${getBotanicalSpraySvg('left')}</div>
              <div class="hero-tilted-photo">${heroVisual}</div>
              <div class="hero-velvet-pocket-left"></div>
              <div class="hero-velvet-pocket-right"></div>
              <div class="hero-velvet-pocket-bottom"></div>
              <div class="hero-velvet-wax">${getWaxSealSvg(waxSymbol)}</div>
            </div>
          </div>

          <div class="inv-eyebrow" style="margin-top:26px;">${escapeHtml(c.topBadge)}</div>
          <h1 class="inv-display-couple">
            ${escapeHtml(c.groomName)}
            <span class="inv-display-amp">&amp;</span>
            ${escapeHtml(c.brideName)}
          </h1>
          ${getFleuronDividerSvg()}
          <div style="text-align:center;font-size:13.5px;letter-spacing:1.6px;color:var(--inv-muted);">
            ${escapeHtml(c.weddingTime || '17:00')} • ${dp.dow.toUpperCase()} • ${String(dp.day).padStart(2, '0')} . ${String(dp.month).padStart(2, '0')} . ${dp.year}
          </div>
          <div class="inv-guest-honor">
            <span>${escapeHtml(c.inviteLine || 'Trân trọng kính mời')}</span>
            <strong>${escapeHtml(c.displayGuestName)}</strong>
          </div>
        `;
        break;
      }

      case 'quote': {
        surfaceClass = 'surface-contrast';
        showCorners = false;
        edgeFlorals = `<div class="sec-floral-edge right-top" style="color:var(--inv-secondary);">${getBotanicalSpraySvg('right')}</div>`;
        inner = `
          <div class="inv-families-editorial">
            <div class="inv-family-col">
              <h4>${escapeHtml(c.groomFamilyTitle || 'NHÀ TRAI')}</h4>
              <p>${escapeHtml(c.groomFather)}</p>
              <p>${escapeHtml(c.groomMother)}</p>
              <small>${escapeHtml(c.groomAddress)}</small>
            </div>
            <div class="inv-family-vline"></div>
            <div class="inv-family-col">
              <h4>${escapeHtml(c.brideFamilyTitle || 'NHÀ GÁI')}</h4>
              <p>${escapeHtml(c.brideFather)}</p>
              <p>${escapeHtml(c.brideMother)}</p>
              <small>${escapeHtml(c.brideAddress)}</small>
            </div>
          </div>

          <div class="inv-eyebrow" style="opacity:0.86;">${escapeHtml(c.quoteHeading || 'TRÂN TRỌNG BÁO TIN LỄ THÀNH HÔN CỦA CON CHÚNG TÔI')}</div>
          <div class="inv-display-couple" style="margin:14px 0 12px;">
            ${escapeHtml(c.groomName)}
            <span class="inv-display-amp">&amp;</span>
            ${escapeHtml(c.brideName)}
          </div>
          <p class="inv-subtitle" style="white-space:pre-line;margin-bottom:14px;">${escapeHtml(c.quoteText)}</p>
          <div style="text-align:center;">
            <div class="inv-date-editorial">
              <div class="inv-date-bigday">${String(dp.day).padStart(2, '0')}</div>
              <div class="inv-date-divider"></div>
              <div class="inv-date-right">
                <span>${dp.dow} • ${escapeHtml(c.weddingTime || '17:00')}</span>
                <strong>Tháng ${dp.month} / ${dp.year}</strong>
              </div>
            </div>
            <div style="font-size:12px;letter-spacing:1.2px;text-transform:uppercase;opacity:0.78;margin-top:4px;">(${escapeHtml(c.lunarDate || '')})</div>
          </div>
        `;
        break;
      }

      case 'gallery': {
        surfaceClass = 'surface-transparent';
        showCorners = false;
        const photos = (!this.options.blankMode && Array.isArray(c.gallery) && c.gallery.length > 0)
          ? c.gallery
          : [null, null, null, null, null];
        if (this.coverflowIdx >= photos.length) this.coverflowIdx = 0;

        inner = `
          <div class="inv-eyebrow">${escapeHtml(c.galleryEyebrow || 'KHOẢNH KHẮC ĐÁNG NHỚ')}</div>
          <h3 class="inv-heading">${escapeHtml(c.galleryHeading || 'ALBUM ẢNH')}</h3>
          <div class="coverflow-stage" data-coverflow-stage>
            ${photos.map((src, idx) => {
              const delta = idx - this.coverflowIdx;
              const posClass = delta === 0 ? 'pos-0'
                : delta === -1 ? 'pos-left-1'
                : delta === 1 ? 'pos-right-1'
                : delta === -2 ? 'pos-left-2'
                : delta === 2 ? 'pos-right-2'
                : 'pos-hidden';
              return `
                <div class="coverflow-slide ${posClass}" data-cf-idx="${idx}">
                  ${src
                    ? `<img src="${escapeHtml(src)}" alt="Ảnh cưới ${idx + 1}" loading="lazy" data-lightbox-src="${escapeHtml(src)}" />`
                    : renderBlankFrame(`Ảnh Album 0${idx + 1}`, this.options.blankMode ? 'Khung trình diễn 3D' : 'Thêm ảnh trong mục Album')}
                </div>
              `;
            }).join('')}
          </div>
          <div class="coverflow-nav">
            <button type="button" class="coverflow-arrow" data-cf-dir="-1" aria-label="Ảnh trước">${icon('chevronLeft', 15)}</button>
            <span class="coverflow-counter" data-cf-counter>${this.coverflowIdx + 1} / ${photos.length}</span>
            <button type="button" class="coverflow-arrow" data-cf-dir="1" aria-label="Ảnh tiếp">${icon('chevronRight', 15)}</button>
          </div>
        `;
        break;
      }

      case 'countdown': {
        surfaceClass = 'surface-contrast';
        showCorners = false;
        edgeFlorals = `<div class="sec-floral-edge left-mid" style="color:var(--inv-secondary);">${getBotanicalSpraySvg('left')}</div>`;
        inner = `
          <div class="inv-eyebrow" style="letter-spacing:2.4px;font-size:13px;">${escapeHtml(c.countdownHeading || 'THÔNG TIN TIỆC CƯỚI')}</div>
          <p class="inv-subtitle" style="margin-top:8px;letter-spacing:1.2px;font-size:12px;text-transform:uppercase;">${escapeHtml(c.countdownSub || 'Tiệc cưới sẽ diễn ra vào lúc')}</p>
          <div style="text-align:center;">
            <div class="inv-date-editorial">
              <div class="inv-date-bigday">${String(dp.day).padStart(2, '0')}</div>
              <div class="inv-date-divider"></div>
              <div class="inv-date-right">
                <span>${escapeHtml(c.weddingTime || '17:00')} • ${dp.dow}</span>
                <strong>Tháng ${dp.month} / ${dp.year}</strong>
              </div>
            </div>
            <div style="font-size:11.5px;letter-spacing:1.2px;text-transform:uppercase;opacity:0.78;">(${escapeHtml(c.lunarDate || '')})</div>
          </div>

          <div class="inv-cd-inline" data-countdown-root>
            <div style="font-size:12px;opacity:0.78;margin-bottom:4px;">${escapeHtml(c.countdownLabel || 'Cùng đếm ngược')}</div>
            <strong data-cd="days">00</strong> ngày
            <strong data-cd="hours">00</strong> giờ
            <strong data-cd="mins">00</strong> phút
            <strong data-cd="secs">00</strong> giây
          </div>

          ${buildCalendarHtml(c.weddingDate)}
        `;
        break;
      }

      case 'events': {
        surfaceClass = 'surface-paper';
        inner = `
          <div class="inv-eyebrow">${escapeHtml(c.eventsEyebrow || 'THỜI GIAN & ĐỊA ĐIỂM')}</div>
          <h3 class="inv-heading">${escapeHtml(c.eventsHeading || 'TIỆC CƯỚI ĐƯỢC TỔ CHỨC TẠI')}</h3>
          ${dividerSvg}
          ${(c.events || []).map(ev => `
            <div class="inv-event-row">
              <h4>${escapeHtml(ev.name)}</h4>
              <div class="inv-event-meta"><span>${escapeHtml(ev.time)}</span></div>
              <div class="inv-event-venue">${escapeHtml(ev.venue)}</div>
              <div class="inv-event-addr">${escapeHtml(ev.address)}</div>
              ${ev.mapUrl && ev.mapUrl !== '#'
                ? `<a class="inv-btn outline" href="${escapeHtml(ev.mapUrl)}" target="_blank" rel="noopener">Chỉ đường Google Maps</a>`
                : `<button type="button" class="inv-btn outline" disabled>Liên kết Google Maps</button>`}
            </div>
          `).join('')}
        `;
        break;
      }

      case 'story': {
        surfaceClass = 'surface-paper';
        inner = `
          <div class="inv-eyebrow">${escapeHtml(c.storyEyebrow || 'OUR LOVE STORY')}</div>
          <h3 class="inv-heading">${escapeHtml(c.storyHeading || 'CHUYỆN TÌNH YÊU')}</h3>
          ${dividerSvg}
          <div class="inv-timeline">
            ${(c.story || []).map(st => `
              <div class="inv-timeline-item">
                <div class="inv-timeline-date">${escapeHtml(st.date)}</div>
                <h5>${escapeHtml(st.title)}</h5>
                <p>${escapeHtml(st.text)}</p>
              </div>
            `).join('')}
          </div>
        `;
        break;
      }

      case 'gift': {
        surfaceClass = 'surface-paper';
        const g = c.gift || {};
        const gb = g.groomBank || {};
        const bb = g.brideBank || {};
        const trialState = getTrialState(this.invitation);
        const giftLocked = !this.options.blankMode && trialState.active && !trialState.limits?.allowGiftQr;
        const openByDefault = this.options.blankMode || this.giftOpened;
        inner = `
          <div class="inv-eyebrow">${escapeHtml(g.eyebrow || 'WEDDING GIFT')}</div>
          <h3 class="inv-heading">${escapeHtml(g.title || 'HỘP MỪNG CƯỚI')}</h3>
          ${dividerSvg}
          <p class="inv-subtitle">${escapeHtml(g.subtitle || '')}</p>
          ${giftLocked ? `
            <div style="margin:14px auto 0;max-width:340px;padding:18px 16px;border-radius:14px;border:1px dashed var(--inv-ornament);background:rgba(255,255,255,0.58);text-align:center;">
              <div style="font-size:11px;letter-spacing:1.8px;text-transform:uppercase;color:var(--inv-primary);font-weight:700;margin-bottom:6px;">TÍNH NĂNG BẢN CHÍNH THỨC</div>
              <p style="font-size:12.5px;color:var(--inv-muted);margin:0;line-height:1.55;">
                Bao Lì Xì tương tác &amp; mã VietQR mừng cưới Chú Rể / Cô Dâu được mở khóa tự động khi nâng cấp từ bản dùng thử ${trialState.days} ngày.
              </p>
            </div>
          ` : `
          <div class="lixi-wrap ${openByDefault ? 'is-open' : ''}" data-lixi-wrap>
            <button type="button" class="lixi-envelope-btn" data-open-lixi>
              <span class="lixi-sunburst"></span>
              <span class="lixi-body">
                <span class="lixi-flap"></span>
                <span class="lixi-coin">囍</span>
                <span class="lixi-caption">${escapeHtml(g.envelopeCaption || 'Chạm mở bao lì xì')}</span>
              </span>
            </button>
            <div class="lixi-cards-reveal">
              <div class="inv-gift-grid">
                <div class="inv-bank-card">
                  <h5>${escapeHtml(g.groomLabel || 'Mừng Cưới Chú Rể')}</h5>
                  <div class="inv-qr-box">${buildQrImage(gb, this.options.blankMode, 'QR Chú Rể')}</div>
                  <div class="inv-bank-meta">
                    <strong>${escapeHtml(bankNameByCode(gb.bankCode))}</strong><br/>
                    STK: <strong>${escapeHtml(gb.accountNo || '')}</strong><br/>
                    ${escapeHtml(gb.accountName || '')}
                  </div>
                  <button type="button" class="inv-btn outline" style="padding:7px 14px;font-size:11.5px;" data-copy-text="${escapeHtml(gb.accountNo || '')}">Sao chép STK</button>
                </div>
                <div class="inv-bank-card">
                  <h5>${escapeHtml(g.brideLabel || 'Mừng Cưới Cô Dâu')}</h5>
                  <div class="inv-qr-box">${buildQrImage(bb, this.options.blankMode, 'QR Cô Dâu')}</div>
                  <div class="inv-bank-meta">
                    <strong>${escapeHtml(bankNameByCode(bb.bankCode))}</strong><br/>
                    STK: <strong>${escapeHtml(bb.accountNo || '')}</strong><br/>
                    ${escapeHtml(bb.accountName || '')}
                  </div>
                  <button type="button" class="inv-btn outline" style="padding:7px 14px;font-size:11.5px;" data-copy-text="${escapeHtml(bb.accountNo || '')}">Sao chép STK</button>
                </div>
              </div>
            </div>
          </div>
          `}
        `;
        break;
      }

      case 'rsvp': {
        surfaceClass = 'surface-contrast';
        showCorners = false;
        const gf = this.invitation.guestForm || {};
        const customFields = Array.isArray(gf.customFields) ? gf.customFields : [];
        const prefillName = this.options.blankMode ? '' : (this.options.guestName || '');
        inner = `
          <div class="inv-rsvp-glass" style="margin-top:0;">
            <h3 class="inv-heading" style="margin-top:0;font-size:24px;">${escapeHtml(gf.heading || 'Xác Nhận Tham Dự')}</h3>
            <p class="inv-subtitle" style="margin-bottom:18px;font-size:12.5px;">${escapeHtml(gf.subtitle || '')}</p>
            <form class="inv-form" data-guest-rsvp-form style="gap:13px;">
              <div>
                <label>Tên của bạn *</label>
                <input type="text" name="name" required placeholder="Nhập họ tên của bạn" value="${escapeHtml(prefillName)}" />
              </div>

              ${gf.askAttendance !== false ? `
                <div>
                  <label>Bạn sẽ đến chung vui chứ?</label>
                  <div class="inv-radio-card-list">
                    <label class="inv-radio-card">
                      <input type="radio" name="attendance" value="yes" checked />
                      <span>Tôi chắc chắn sẽ đến</span>
                    </label>
                    <label class="inv-radio-card">
                      <input type="radio" name="attendance" value="maybe" />
                      <span>Tôi đang sắp xếp lịch</span>
                    </label>
                    <label class="inv-radio-card">
                      <input type="radio" name="attendance" value="no" />
                      <span>Rất tiếc, tôi không thể tham dự</span>
                    </label>
                  </div>
                </div>
              ` : ''}

              <div style="display:grid;grid-template-columns:${gf.askGuestsCount !== false && gf.askSide !== false ? '1fr 1fr' : '1fr'};gap:10px;">
                ${gf.askGuestsCount !== false ? `
                  <div>
                    <label>Số người tham dự</label>
                    <select name="guestsCount">
                      <option value="1">1 người</option>
                      <option value="2">2 người</option>
                      <option value="3">3 người</option>
                      <option value="4">4 người</option>
                      <option value="5">5+ người</option>
                    </select>
                  </div>
                ` : ''}
                ${gf.askSide !== false ? `
                  <div>
                    <label>Khách mời bên</label>
                    <select name="side">
                      <option value="Nhà Trai">Nhà Trai</option>
                      <option value="Nhà Gái">Nhà Gái</option>
                      <option value="Bạn chung">Bạn chung</option>
                    </select>
                  </div>
                ` : ''}
              </div>

              ${customFields.map(cf => `
                <div>
                  <label>${escapeHtml(cf.label)} ${cf.required ? '*' : ''}</label>
                  ${cf.type === 'select' ? `
                    <select data-custom-field="${escapeHtml(cf.label)}" ${cf.required ? 'required' : ''}>
                      ${(cf.options || []).map(opt => `<option value="${escapeHtml(opt)}">${escapeHtml(opt)}</option>`).join('')}
                    </select>
                  ` : cf.type === 'textarea' ? `
                    <textarea rows="2" data-custom-field="${escapeHtml(cf.label)}" placeholder="Nhập thông tin..." ${cf.required ? 'required' : ''}></textarea>
                  ` : `
                    <input type="text" data-custom-field="${escapeHtml(cf.label)}" placeholder="Nhập thông tin..." ${cf.required ? 'required' : ''} />
                  `}
                </div>
              `).join('')}

              ${gf.askWish !== false ? `
                <div>
                  <label>Lời chúc gửi Cô Dâu &amp; Chú Rể</label>
                  <textarea name="wish" rows="2" placeholder="Viết lời chúc của bạn (tùy chọn)..."></textarea>
                </div>
              ` : ''}

              <button type="submit" class="inv-btn" style="width:100%;padding:12px;background:#fdf7f0;color:var(--inv-contrast-bg);">Gửi xác nhận</button>
            </form>
          </div>
        `;
        break;
      }

      case 'guestbook': {
        surfaceClass = 'surface-transparent';
        showCorners = false;
        const wishes = this.options.blankMode
          ? [
              { name: '[Tên Khách Mời 01]', relation: 'Bạn thân', message: '[Lời chúc phúc của khách mời sẽ tự động hiển thị tại đây ngay sau khi gửi.]', createdAt: new Date().toISOString() },
              { name: '[Tên Khách Mời 02]', relation: 'Đồng nghiệp', message: '[Chúc hai bạn trăm năm hạnh phúc và luôn an yên bên nhau.]', createdAt: new Date().toISOString() },
            ]
          : (this.invitation.wishes || []).filter(w => !w.hidden);

        inner = `
          <div class="inv-papernote-card">
            <div class="sec-floral-edge bottom-left" style="color:var(--inv-ornament);">${getBotanicalSpraySvg('left')}</div>
            <h3 class="inv-heading" style="margin-top:0;font-size:24px;">${escapeHtml(c.guestbookHeading || 'SỔ LƯU BÚT')}</h3>
            <form data-quick-wish-form style="display:flex;flex-direction:column;gap:10px;position:relative;z-index:5;">
              <input type="text" name="name" required placeholder="Nhập tên của bạn*" value="${escapeHtml(this.options.blankMode ? '' : (this.options.guestName || ''))}" />
              <textarea name="wish" rows="3" required placeholder="Nhập lời chúc phúc*"></textarea>
              <div class="inv-gb-actions">
                <button type="button" class="inv-wand-btn" data-cycle-wish title="Gợi ý lời chúc">${icon('wand', 15)}</button>
                <button type="submit" class="inv-btn" style="padding:10px 24px;">GỬI LỜI CHÚC</button>
              </div>
            </form>
          </div>

          <div class="inv-wish-list">
            ${wishes.length === 0 ? `<p class="inv-subtitle">Hãy là người đầu tiên gửi lời chúc phúc tới đôi uyên ương.</p>` : wishes.map(w => `
              <div class="inv-wish-card">
                <div class="inv-wish-card-head">
                  <strong>${escapeHtml(w.name)}${w.relation ? ` — ${escapeHtml(w.relation)}` : ''}</strong>
                  <span>${formatWishTime(w.createdAt)}</span>
                </div>
                <p>${escapeHtml(w.message)}</p>
              </div>
            `).join('')}
          </div>
        `;
        break;
      }

      case 'footer': {
        surfaceClass = 'surface-transparent';
        showCorners = false;
        inner = `
          <div style="padding:16px 0;text-align:center;">
            ${getFleuronDividerSvg()}
            <h3 class="inv-heading" style="font-size:28px;">${escapeHtml(c.footerHeading || 'Thank You')}</h3>
            <div class="inv-display-couple" style="font-size:32px;margin:8px 0;">${escapeHtml(c.groomName)} &amp; ${escapeHtml(c.brideName)}</div>
            <p class="inv-subtitle" style="margin-top:8px;">${escapeHtml(c.footerText)}</p>
            ${this.invitation.order?.showWatermark ? `<p style="font-family:'Be Vietnam Pro',sans-serif;font-size:11px;color:var(--inv-muted);margin-top:20px;opacity:0.72;">${escapeHtml(this.options.brandName)}</p>` : ''}
          </div>
        `;
        break;
      }
    }

    return `
      <section class="inv-section ${surfaceClass} ${extraClass}" data-section-type="${escapeHtml(sec.type)}" data-section-id="${escapeHtml(sec.id)}">
        ${showCorners ? `
          <div class="inv-corner tl">${cornerSvg}</div>
          <div class="inv-corner tr">${cornerSvg}</div>
          <div class="inv-corner bl">${cornerSvg}</div>
          <div class="inv-corner br">${cornerSvg}</div>
        ` : ''}
        ${edgeFlorals}
        ${editBadge}
        <div class="inv-section-body">${inner}</div>
      </section>
    `;
  }

  bindEvents(d, c, enabledSections, isPaged) {
    const stage = this.container.querySelector('.inv-stage');
    if (!stage) return;

    const introOverlay = stage.querySelector('[data-intro-trigger]');
    if (introOverlay) {
      introOverlay.addEventListener('click', e => {
        if (introOverlay.classList.contains('opening')) return;
        introOverlay.classList.add('opening');
        const rect = stage.getBoundingClientRect();
        this.particleCtrl?.triggerBurst(e.clientX - rect.left, e.clientY - rect.top, 42);
        if (this.invitation.music?.autoplay !== false) {
          musicEngine.start(this.invitation.music || { trackId: d.musicTrack || 'canon-d' });
        }
        setTimeout(() => {
          this.introOpened = true;
          stage.classList.remove('has-intro-open');
          if (!this.options.inPreview) document.body.classList.remove('inv-intro-locked');
          introOverlay.classList.add('is-opened');
          setTimeout(() => {
            introOverlay.remove();
            this.particleCtrl?.resize();
          }, 860);
        }, 720);
      });
    }

    const musicBtn = stage.querySelector('[data-action="toggle-music"]');
    const syncMusicIcon = playing => {
      if (!musicBtn) return;
      musicBtn.classList.toggle('is-playing', playing);
      musicBtn.innerHTML = playing
        ? '<span class="eq-bars"><span></span><span></span><span></span><span></span></span>'
        : icon('musicOff', 18);
    };
    if (musicBtn) {
      musicBtn.addEventListener('click', e => {
        e.stopPropagation();
        musicEngine.toggle(this.invitation.music || { trackId: d.musicTrack || 'canon-d' });
      });
    }
    this.musicUnsub = musicEngine.onChange(syncMusicIcon);

    // 3D Coverflow Album
    const cfStage = stage.querySelector('[data-coverflow-stage]');
    if (cfStage) {
      const slides = Array.from(cfStage.querySelectorAll('.coverflow-slide'));
      const counterEl = stage.querySelector('[data-cf-counter]');
      const updateCoverflow = nextIdx => {
        if (!slides.length) return;
        this.coverflowIdx = ((nextIdx % slides.length) + slides.length) % slides.length;
        slides.forEach((s, idx) => {
          s.classList.remove('pos-0', 'pos-left-1', 'pos-right-1', 'pos-left-2', 'pos-right-2', 'pos-hidden');
          const delta = idx - this.coverflowIdx;
          const cls = delta === 0 ? 'pos-0' : delta === -1 ? 'pos-left-1' : delta === 1 ? 'pos-right-1' : delta === -2 ? 'pos-left-2' : delta === 2 ? 'pos-right-2' : 'pos-hidden';
          s.classList.add(cls);
        });
        if (counterEl) counterEl.textContent = `${this.coverflowIdx + 1} / ${slides.length}`;
      };
      stage.querySelectorAll('[data-cf-dir]').forEach(btn => {
        btn.addEventListener('click', e => { e.stopPropagation(); updateCoverflow(this.coverflowIdx + Number(btn.dataset.cfDir)); });
      });
      slides.forEach(s => {
        s.addEventListener('click', e => {
          const idx = Number(s.dataset.cfIdx);
          if (idx !== this.coverflowIdx) { e.stopPropagation(); updateCoverflow(idx); }
        });
      });
      let cfTouchX = null;
      cfStage.addEventListener('touchstart', e => { cfTouchX = e.changedTouches[0]?.clientX ?? null; }, { passive: true });
      cfStage.addEventListener('touchend', e => {
        if (cfTouchX === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - cfTouchX;
        cfTouchX = null;
        if (Math.abs(dx) > 40) updateCoverflow(this.coverflowIdx + (dx < 0 ? 1 : -1));
      }, { passive: true });
    }

    if (isPaged) {
      const goPage = dir => {
        const nextIdx = this.currentPage + dir;
        if (nextIdx < 0 || nextIdx >= enabledSections.length) return;
        const pageEl = stage.querySelector('.inv-book-page');
        if (pageEl && dir > 0) {
          pageEl.classList.add('flip-out-next');
          setTimeout(() => { this.currentPage = nextIdx; this.render(this.invitation); }, 260);
        } else {
          this.currentPage = nextIdx;
          this.render(this.invitation);
          const newPage = this.container.querySelector('.inv-book-page');
          if (newPage && dir < 0) { newPage.classList.remove('flip-in-next'); newPage.classList.add('flip-in-prev'); }
        }
      };
      stage.querySelectorAll('[data-page-nav]').forEach(btn => btn.addEventListener('click', e => { e.stopPropagation(); goPage(btn.dataset.pageNav === 'next' ? 1 : -1); }));
      stage.addEventListener('touchstart', e => { this.touchStartX = e.changedTouches[0]?.clientX ?? null; }, { passive: true });
      stage.addEventListener('touchend', e => {
        if (this.touchStartX === null) return;
        const dx = (e.changedTouches[0]?.clientX ?? 0) - this.touchStartX;
        this.touchStartX = null;
        if (Math.abs(dx) > 58) goPage(dx < 0 ? 1 : -1);
      }, { passive: true });
    }

    stage.querySelector('[data-open-lixi]')?.addEventListener('click', e => {
      e.stopPropagation();
      const wrap = stage.querySelector('[data-lixi-wrap]');
      if (!wrap) return;
      this.giftOpened = true;
      const rect = stage.getBoundingClientRect();
      this.particleCtrl?.triggerBurst(e.clientX - rect.left, e.clientY - rect.top, 26);
      wrap.classList.add('is-open');
    });

    stage.querySelectorAll('[data-copy-text]').forEach(btn => {
      btn.addEventListener('click', e => {
        e.stopPropagation();
        const txt = btn.dataset.copyText;
        if (!txt || txt.includes('X')) { this.toast('Đang ở chế độ mẫu trống — không có STK thật', 'info'); return; }
        navigator.clipboard?.writeText(txt).then(() => this.toast(`Đã sao chép STK: ${txt}`, 'success')).catch(() => this.toast(`STK: ${txt}`, 'info'));
      });
    });

    stage.querySelectorAll('[data-lightbox-src]').forEach(img => {
      img.addEventListener('click', e => {
        if (this.options.editable) return;
        const slide = img.closest('.coverflow-slide');
        if (slide && !slide.classList.contains('pos-0')) return;
        e.stopPropagation();
        const box = document.createElement('div');
        box.className = 'inv-lightbox';
        box.innerHTML = `<button class="inv-lightbox-close" type="button" aria-label="Đóng">${icon('x', 18)}</button><img src="${escapeHtml(img.dataset.lightboxSrc)}" alt="Xem ảnh cưới" />`;
        box.addEventListener('click', () => box.remove());
        document.body.appendChild(box);
      });
    });

    stage.querySelector('[data-cycle-wish]')?.addEventListener('click', e => {
      e.stopPropagation();
      const form = e.currentTarget.closest('form');
      const ta = form?.querySelector('textarea[name="wish"]');
      if (ta) {
        ta.value = COPY_SUGGESTIONS.quickWishes[this.wishSuggestionIdx % COPY_SUGGESTIONS.quickWishes.length];
        this.wishSuggestionIdx++;
      }
    });

    const rsvpForm = stage.querySelector('[data-guest-rsvp-form]');
    if (rsvpForm) {
      rsvpForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (this.options.blankMode) { this.toast('Đang ở chế độ xem mẫu trống (không lưu phản hồi).', 'info'); return; }
        const fd = new FormData(rsvpForm);
        const customAnswers = {};
        rsvpForm.querySelectorAll('[data-custom-field]').forEach(el => { customAnswers[el.dataset.customField] = el.value; });
        const payload = {
          type: 'both',
          name: (fd.get('name') || '').toString().trim(),
          attendance: (fd.get('attendance') || 'yes').toString(),
          guestsCount: Number(fd.get('guestsCount') || 1),
          side: (fd.get('side') || '').toString(),
          customAnswers,
          wish: (fd.get('wish') || '').toString().trim(),
          relation: (fd.get('side') || 'Khách mời').toString(),
        };
        if (!payload.name) return;
        const submitBtn = rsvpForm.querySelector('button[type="submit"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Đang gửi...'; }
        try {
          if (this.options.onGuestSubmit) {
            const res = await this.options.onGuestSubmit(payload);
            if (res?.wish) this.invitation.wishes = [res.wish, ...(this.invitation.wishes || [])];
          }
          this.particleCtrl?.triggerBurst(null, null, 38);
          this.toast('Cảm ơn bạn! Xác nhận tham dự đã được gửi tới Cô Dâu & Chú Rể.', 'success');
          rsvpForm.reset();
          this.introOpened = true;
          this.render(this.invitation);
        } catch (err) {
          this.toast(err.message || 'Không gửi được, vui lòng thử lại', 'error');
          if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Gửi xác nhận'; }
        }
      });
    }

    const wishForm = stage.querySelector('[data-quick-wish-form]');
    if (wishForm) {
      wishForm.addEventListener('submit', async e => {
        e.preventDefault();
        if (this.options.blankMode) { this.toast('Đang ở chế độ xem mẫu trống.', 'info'); return; }
        const fd = new FormData(wishForm);
        const payload = {
          type: 'wish',
          name: (fd.get('name') || '').toString().trim(),
          relation: 'Khách mời',
          wish: (fd.get('wish') || '').toString().trim(),
        };
        if (!payload.name || !payload.wish) return;
        try {
          if (this.options.onGuestSubmit) {
            const res = await this.options.onGuestSubmit(payload);
            if (res?.wish) this.invitation.wishes = [res.wish, ...(this.invitation.wishes || [])];
          }
          this.particleCtrl?.triggerBurst(null, null, 34);
          this.toast('Lời chúc của bạn đã được ghi vào Sổ Lưu Bút.', 'success');
          wishForm.reset();
          this.introOpened = true;
          this.render(this.invitation);
        } catch (err) { this.toast(err.message || 'Lỗi gửi lời chúc', 'error'); }
      });
    }

    if (d.interactiveTrail !== false && !this.options.editable) {
      this.trailHandler = e => {
        const now = performance.now();
        if (now - this.lastTrailTime < 85) return;
        this.lastTrailTime = now;
        const rect = stage.getBoundingClientRect();
        this.particleCtrl?.spawnTrail(e.clientX - rect.left, e.clientY - rect.top);
      };
      stage.addEventListener('pointermove', this.trailHandler, { passive: true });
    }

    if (this.options.editable && this.options.onSelectSection) {
      stage.querySelectorAll('.inv-section').forEach(secEl => {
        secEl.addEventListener('click', e => {
          if (e.target.closest('button, a, input, select, textarea, .coverflow-slide')) return;
          this.options.onSelectSection(secEl.dataset.sectionType, secEl.dataset.sectionId);
        });
      });
    }
  }

  replayIntro() { this.introOpened = false; this.render(this.invitation); }

  startParticles(d) {
    const canvas = this.container.querySelector('.inv-particle-canvas');
    if (!canvas) return;
    if (this.particleCtrl) this.particleCtrl.destroy();
    this.particleCtrl = new ParticleCanvasController(canvas, d.particleEffect || 'burgundy-petals', d.particleDensity || 'medium');
  }

  startCountdown(dateStr, timeStr = '17:00') {
    const root = this.container.querySelector('[data-countdown-root]');
    if (!root) return;
    const target = new Date(`${dateStr || '2026-12-20'}T${timeStr || '17:00'}:00`).getTime();
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const set = (k, v) => { const el = root.querySelector(`[data-cd="${k}"]`); if (el) el.textContent = String(v).padStart(2, '0'); };
      set('days', Math.floor(diff / 86400000));
      set('hours', Math.floor((diff % 86400000) / 3600000));
      set('mins', Math.floor((diff % 3600000) / 60000));
      set('secs', Math.floor((diff % 60000) / 1000));
    };
    tick();
    this.countdownTimer = setInterval(tick, 1000);
  }

  setupScrollEffects(readingMode) {
    const stage = this.container.querySelector('.inv-stage');
    if (!stage) return;
    const scrollTarget = this.options.inPreview ? this.container : window;
    const bar = stage.querySelector('[data-scroll-bar]');
    const parallaxEl = stage.querySelector('[data-parallax-bg]');

    this.scrollHandler = () => {
      let scrollTop = 0, maxScroll = 1;
      if (this.options.inPreview) {
        scrollTop = this.container.scrollTop;
        maxScroll = Math.max(1, this.container.scrollHeight - this.container.clientHeight);
      } else {
        scrollTop = window.scrollY || document.documentElement.scrollTop;
        maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      }
      const pct = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));
      if (bar) bar.style.width = `${pct}%`;
      if (parallaxEl) parallaxEl.style.setProperty('--parallax-y', `${Math.round(scrollTop * -0.16)}px`);
    };
    scrollTarget.addEventListener('scroll', this.scrollHandler, { passive: true });
    this.scrollHandler();

    if (readingMode !== 'scroll-parallax' || !('IntersectionObserver' in window)) return;
    const sections = stage.querySelectorAll('.inv-section');
    sections.forEach((s, idx) => { if (idx > 0) s.classList.add('reveal-pending'); });
    this.observer = new IntersectionObserver(
      entries => {
        entries.forEach(ent => {
          if (ent.isIntersecting) {
            ent.target.classList.remove('reveal-pending');
            ent.target.classList.add('reveal-visible');
          }
        });
      },
      { root: this.options.inPreview ? this.container : null, threshold: 0.08 }
    );
    sections.forEach(s => this.observer.observe(s));
  }

  cleanupTimers() {
    if (this.countdownTimer) { clearInterval(this.countdownTimer); this.countdownTimer = null; }
    if (this.observer) { this.observer.disconnect(); this.observer = null; }
    if (this.scrollHandler) {
      const target = this.options.inPreview ? this.container : window;
      target.removeEventListener('scroll', this.scrollHandler);
      this.scrollHandler = null;
    }
    if (this.musicUnsub) { this.musicUnsub(); this.musicUnsub = null; }
  }

  destroy() {
    this.cleanupTimers();
    if (!this.options.inPreview) document.body.classList.remove('inv-intro-locked');
    if (this.particleCtrl) { this.particleCtrl.destroy(); this.particleCtrl = null; }
  }
}
