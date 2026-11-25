/**
 * L'Amour Atelier — Smart Vietnamese FAQ Chatbot Engine + Quick Chat Presets
 * Dùng cho chế độ fallback LocalStorage và hỗ trợ Admin tùy biến quy tắc trả lời tự động.
 */

export const DEFAULT_CHATBOT_CONFIG = {
  enabled: true,
  aiAgentEnabled: true,
  aiSystemPrompt: 'Bạn là Trợ lý AI tư vấn thiệp cưới của L\'Amour Atelier. Trả lời bằng tiếng Việt lịch sự, ngắn gọn (2–4 câu), rõ ràng, không dùng emoji, tập trung giúp khách chọn mẫu, phối màu hợp mệnh Ngũ Hành, chọn gói 99k/189k/299k/499k hoặc hướng dẫn bấm nút "Nhắn trực tiếp Quản Lý" khi khách muốn trao đổi trực tiếp.',
  greeting: 'Xin chào! Tôi là Trợ lý AI của L\'Amour Atelier. Bạn cần tư vấn bảng giá, chọn màu hợp mệnh theo năm sinh, dùng thử miễn phí hay đặt thiết kế riêng?',
  fallbackReply: 'Cảm ơn câu hỏi của bạn! Bạn có thể cho mình biết ngày cưới, năm sinh 2 bạn hoặc bấm nút "Nhắn trực tiếp Quản Lý" (nhập SĐT) để Quản Lý hỗ trợ trực tiếp ngay nhé. Hotline/Zalo: 0354 248 177.',
  customerQuickPrompts: [
    'Bảng giá?',
    'Màu hợp mệnh',
    'Thanh toán QR',
    'Bao lâu xong?',
    'Thiết kế riêng',
    'Tải mấy ảnh?',
  ],
  adminQuickReplies: [
    'Chào bạn! Bạn dự kiến tổ chức lễ cưới ngày nào để mình tư vấn gói và mẫu phù hợp nhất nhé?',
    'Để mình xem màu hợp mệnh Ngũ Hành cho hai bạn, bạn cho mình xin năm sinh của Chú Rể và Cô Dâu nhé!',
    'Mình đã nhận được thông tin chuyển khoản MB Bank 0354248177. Mình đang khởi tạo thiệp và gửi link chỉnh sửa cho bạn ngay ạ.',
    'Bạn có thể gửi ảnh cưới chất lượng gốc qua Zalo 0354 248 177 để mình tối ưu sắc nét và lên bản xem thử miễn phí nhé!',
    'Cảm ơn bạn đã đặt lịch tư vấn! Mình đã xác nhận lịch hẹn và sẽ gọi/nhắn đúng giờ đã chọn.',
  ],
  rules: [
    {
      id: 'rule_price',
      name: 'Hỏi bảng giá & các gói thiệp',
      enabled: true,
      keywords: ['gia', 'bao nhieu', 'tien', 'goi', 'bang gia', 'chi phi'],
      reply: 'Hiện Studio có 4 gói tinh gọn theo đúng tính năng sử dụng: Gói Cơ Bản 99.000đ (8 ảnh + Vị trí Google Maps + Nhạc nền, không gồm Lời chúc/QR/RSVP), Gói Tiêu Chuẩn 189.000đ (20 ảnh 3D + Vị trí Maps + Gửi Lời Chúc + Mã VietQR Mừng Cưới + Mở bìa 3D), Gói Cao Cấp 299.000đ (45 ảnh + đủ Maps/Lời chúc/QR + Form RSVP xuất Excel + Link tên từng khách + Nhạc MP3 & Phong Thủy), và Gói Thiết Kế Riêng 499.000đ (không giới hạn ảnh, thiết kế 1-1 & làm trọn gói A–Z).',
    },
    {
      id: 'rule_payment',
      name: 'Hỏi thanh toán & STK MB Bank',
      enabled: true,
      keywords: ['thanh toan', 'chuyen khoan', 'qr', 'ngan hang', 'mb', 'so tai khoan', 'stk', 'dat mua'],
      reply: 'Nếu bạn đã hài lòng với mẫu, chỉ cần bấm nút "Đặt & QR" trên mẫu thiệp để quét mã VietQR MB Bank (Ngân hàng Quân Đội) — STK: 0354248177. Mã QR đã tự điền sẵn số tiền theo gói và nội dung chuyển khoản rất tiện lợi!',
    },
    {
      id: 'rule_fengshui',
      name: 'Tư vấn màu hợp mệnh / phong thủy',
      enabled: true,
      keywords: ['menh', 'phong thuy', 'ngu hanh', 'cung', 'tuoi', 'hop mau', 'nam sinh'],
      reply: 'Studio hỗ trợ phối màu chuẩn Ngũ Hành (Kim - Mộc - Thủy - Hỏa - Thổ) & 12 Cung Hoàng Đạo. Bạn chỉ cần để lại năm sinh Chú Rể và Cô Dâu ngay tại đây, mình sẽ phân tích tương sinh/hóa giải và gửi 3 bảng phối màu sang trọng hợp cả hai mệnh nhé!',
    },
    {
      id: 'rule_time_edit',
      name: 'Thời gian hoàn thiện & tự chỉnh sửa',
      enabled: true,
      keywords: ['bao lau', 'nhanh', 'tu sua', 'chinh sua', 'thoi gian', 'gui khach', 'ten khach'],
      reply: 'Chỉ sau 10–15 phút chốt mẫu, bạn sẽ nhận ngay Link Cổng Khách Hàng riêng để tự sửa chữ, đổi ảnh cưới, tự tạo câu hỏi yêu cầu khách mời nhập và xuất link mang tên riêng từng vị khách gửi qua Zalo cực nhanh!',
    },
    {
      id: 'rule_photos_fx',
      name: 'Số lượng ảnh, nhạc nền & hiệu ứng 3D',
      enabled: true,
      keywords: ['anh', 'nhac', 'hieu ung', 'hoa roi', '3d', 'lat trang', 'mp3'],
      reply: 'Số ảnh và tính năng đi theo từng gói rất gọn: Gói Cơ Bản 99k (8 ảnh + bản đồ vị trí Maps), Gói Tiêu Chuẩn 189k (20 ảnh 3D + Gửi lời chúc + Mã VietQR mừng cưới), Gói Cao Cấp 299k (45 ảnh + RSVP + Link tên riêng từng khách + Nhạc MP3 riêng), Gói Thiết Kế Riêng 499k (không giới hạn ảnh & làm trọn gói A–Z).',
    },
    {
      id: 'rule_booking',
      name: 'Đặt lịch & thiết kế riêng',
      enabled: true,
      keywords: ['dat lich', 'hen', 'thiet ke rieng', 'khong ung', 'chua ung', 'lien he', 'zalo', 'sdt', 'goi'],
      reply: 'Bạn có thể bấm nút "Đặt Lịch Tư Vấn" trên trang hoặc gọi/nhắn Zalo trực tiếp số 0354 248 177. Mình sẽ lắng nghe phong cách bạn thích và lên mẫu thiết kế riêng cho tới khi bạn hoàn toàn ưng ý!',
    },
  ],
};

function stripVi(str) {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');
}

const YEAR_ELEMENT_MAP = [
  ['Kim', 'Kim', 'Hỏa', 'Hỏa', 'Mộc', 'Mộc', 'Thổ', 'Thổ', 'Kim', 'Kim'],
  ['Hỏa', 'Hỏa', 'Thủy', 'Thủy', 'Thổ', 'Thổ', 'Kim', 'Kim', 'Mộc', 'Mộc'],
  ['Thủy', 'Thủy', 'Mộc', 'Mộc', 'Kim', 'Kim', 'Hỏa', 'Hỏa', 'Thủy', 'Thủy'],
];

const ELEMENT_COLOR_TIPS = {
  Kim: 'Trắng ngọc trai, Vàng champagne, Ánh kim — hợp mẫu Lụa Trắng Tối Giản hoặc Hoàng Gia Ánh Kim',
  Mộc: 'Xanh lục bảo, Xanh olive, Vàng kem — hợp mẫu Song Hỷ Lục Bảo hoặc Olive Tự Nhiên',
  Thủy: 'Xanh navy, Bạc ánh trăng, Trắng kem — hợp mẫu Dạ Tiệc Ánh Sao hoặc Lụa Trắng',
  Hỏa: 'Đỏ nhung rượu vang, Hồng đào, Vàng đồng — hợp mẫu Nhung Đỏ Cổ Điển hoặc Hồng Phấn Sakura',
  Thổ: 'Vàng đồng hoàng gia, Nâu ấm, Kem cổ điển, Đỏ trầm — hợp mẫu Cổ Điển Ép Kim hoặc Nhung Đỏ',
};

export function inferNguHanhFromText(text) {
  const years = (String(text || '').match(/\b(19[6-9]\d|20[0-1]\d)\b/g) || []).map(Number);
  if (!years.length) return null;
  const unique = [...new Set(years)].slice(0, 2);
  const details = unique.map(y => {
    const can = (y - 4) % 10;
    const chi = (y - 4) % 12;
    const canVal = Math.floor(can / 2) + 1;
    const chiGroup = Math.floor((chi % 6) / 2);
    const sum = (canVal + chiGroup) % 5 || 5;
    const elems = { 1: 'Kim', 2: 'Thủy', 3: 'Hỏa', 4: 'Thổ', 5: 'Mộc' };
    const elem = elems[sum] || YEAR_ELEMENT_MAP[0][Math.abs(can) % 10];
    return { year: y, element: elem, tip: ELEMENT_COLOR_TIPS[elem] };
  });
  return details;
}

export function runLocalChatbot(config, userText) {
  const cfg = config || DEFAULT_CHATBOT_CONFIG;
  if (cfg.enabled === false) return null;
  const norm = stripVi(userText);

  // Smart birth-year Ngũ Hành analysis directly in local/fallback Agent!
  const fs = inferNguHanhFromText(userText);
  if (fs && fs.length) {
    const lines = fs.map(x => `Năm sinh ${x.year} thuộc mệnh ${x.element} (hợp tông ${x.tip})`);
    return `${lines.join('. ')}. Bạn có thể lọc ngay theo nút "Mệnh ${fs[0].element}" trong Bộ Sưu Tập Mẫu hoặc bấm "Nhắn trực tiếp Quản Lý" để phối bảng màu riêng miễn phí nhé!`;
  }

  // Trial templates question
  if (norm.includes('dung thu') || norm.includes('mien phi') || norm.includes('test')) {
    return 'Studio hiện có sẵn 3 mẫu Dùng Thử Miễn Phí 1–3 ngày (Lụa Trắng 1 ngày / Hồng Đào 2 ngày / Xanh Olive 3 ngày) để bạn tự tải ảnh, sửa tên và xem thử trên điện thoại. Khi ưng ý bạn chỉ cần chuyển tiền VietQR để mở khóa 100% tính năng và nhận sản phẩm ngay!';
  }

  // Greetings
  if (/^(chao|xin chao|hi|hello|alo|shop oi|ad oi)\b/.test(norm) && norm.length <= 24) {
    return 'Chào bạn! Mình là Trợ lý AI của L\'Amour Atelier. Bạn đang tìm mẫu thiệp cưới theo phong cách nào, cần báo giá 4 gói (từ 99.000đ) hay muốn xem màu hợp mệnh theo năm sinh của hai bạn ạ?';
  }

  // Thank you
  if (norm.includes('cam on') || norm.includes('thank')) {
    return 'Rất vui được hỗ trợ bạn! Nếu cần tư vấn riêng chi tiết hơn hoặc chỉnh mẫu theo yêu cầu, bạn chỉ cần bấm nút "Nhắn trực tiếp Quản Lý" ngay bên dưới nhé.';
  }

  for (const rule of cfg.rules || []) {
    if (rule.enabled === false) continue;
    for (const kw of rule.keywords || []) {
      const nkw = stripVi(kw).trim();
      if (nkw && norm.includes(nkw)) return rule.reply;
    }
  }
  return cfg.fallbackReply || DEFAULT_CHATBOT_CONFIG.fallbackReply;
}
