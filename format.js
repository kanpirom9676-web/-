// ตัวช่วยจัดรูปแบบตัวเลข วันที่ และสถานะ ใช้ร่วมกันทุกหน้า

const STATUS = {
  pending: { label: 'รอส่ง',    className: 'badge-pending' },
  shipped: { label: 'ส่งแล้ว',   className: 'badge-shipped' },
  paid:    { label: 'ชำระแล้ว', className: 'badge-paid' },
};

const THAI_MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
                     'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];

// 12345 -> ฿12,345.00
function formatMoney(n) {
  return '฿' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// '2026-08-14' -> 14 ส.ค. 2569
function formatThaiDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d} ${THAI_MONTHS[m - 1]} ${y + 543}`;
}

// จำนวนวันนับจากวันที่สั่งถึงวันนี้
function daysSince(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  const now = new Date();
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((today - Date.UTC(y, m - 1, d)) / 86400000);
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
