// หน้ารายการคำสั่งซื้อ: วาดตาราง และเปลี่ยนสถานะ

const OVERDUE_DAYS = 30;

// ข้อความบนปุ่มเปลี่ยนสถานะ ตามสถานะปัจจุบัน
const NEXT_ACTION = {
  pending: 'เปลี่ยนเป็น ส่งแล้ว',
  shipped: 'เปลี่ยนเป็น ชำระแล้ว',
};

// เลขที่ของคำสั่งซื้อที่เพิ่งบันทึกจากหน้าเพิ่มคำสั่งซื้อ (ถ้ามี)
const newId = new URLSearchParams(location.search).get('new');

// ค่าค้นหาและตัวกรองที่เลือกอยู่
const searchEl = document.getElementById('search');
let statusFilter = 'all';

function matchesFilter(o) {
  const q = searchEl.value.trim().toLowerCase();
  const textOk = !q || o.shop.toLowerCase().includes(q) || o.book.toLowerCase().includes(q);
  const statusOk = statusFilter === 'all' || o.status === statusFilter;
  return textOk && statusOk;
}

// แสดงจำนวนรายการบนปุ่มกรองแต่ละปุ่ม
function updateFilterCounts(allOrders) {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    const key = btn.dataset.status;
    const n = key === 'all' ? allOrders.length : allOrders.filter(o => o.status === key).length;
    btn.querySelector('.filter-count').textContent = n;
    btn.classList.toggle('active', key === statusFilter);
    btn.setAttribute('aria-pressed', key === statusFilter);
  });
}

async function renderOrders() {
  const allOrders = await getOrders();
  const orders = allOrders.filter(matchesFilter);
  const tbody = document.getElementById('order-rows');
  updateFilterCounts(allOrders);

  if (allOrders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">ยังไม่มีคำสั่งซื้อ</td></tr>';
    return;
  }

  const overdueCount = allOrders.filter(o => o.status !== 'paid' && daysSince(o.orderDate) > OVERDUE_DAYS).length;
  const shown = orders.length === allOrders.length
    ? `ทั้งหมด ${allOrders.length} รายการ`
    : `แสดง ${orders.length} จาก ${allOrders.length} รายการ`;
  document.getElementById('order-count').textContent =
    shown + (overdueCount ? ` (ค้างชำระเกิน 30 วัน ${overdueCount} รายการ แสดงเป็นแถวสีแดง)` : '');

  if (orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">ไม่พบรายการที่ตรงกับการค้นหา</td></tr>';
    return;
  }

  tbody.innerHTML = orders.map(o => {
    const status = STATUS[o.status];
    const overdue = o.status !== 'paid' && daysSince(o.orderDate) > OVERDUE_DAYS;
    const rowClass = [overdue ? 'row-overdue' : '', o.id === newId ? 'row-new' : ''].join(' ').trim();
    const action = NEXT_ACTION[o.status]
      ? `<button type="button" class="btn-small" data-id="${escapeHtml(o.id)}">${NEXT_ACTION[o.status]}</button>`
      : '<span class="muted">เสร็จสิ้น</span>';
    return `
      <tr class="${rowClass}">
        <td class="nowrap">${escapeHtml(o.id)}</td>
        <td class="nowrap">${formatThaiDate(o.orderDate)}</td>
        <td>${escapeHtml(o.shop)}</td>
        <td>${escapeHtml(o.book)}</td>
        <td class="num">${o.quantity.toLocaleString('en-US')}</td>
        <td class="num nowrap">${formatMoney(o.quantity * o.unitPrice)}</td>
        <td class="nowrap">
          <span class="badge ${status.className}">${status.label}</span>
          ${overdue ? `<div class="overdue">ค้างชำระ ${daysSince(o.orderDate)} วัน</div>` : ''}
        </td>
        <td class="nowrap">${action}</td>
      </tr>`;
  }).join('');

  const notice = document.getElementById('notice');
  if (newId && orders.some(o => o.id === newId)) {
    notice.textContent = `บันทึกคำสั่งซื้อเลขที่ ${newId} เรียบร้อยแล้ว`;
    notice.hidden = false;
  }
}

// กดปุ่มเปลี่ยนสถานะ
document.getElementById('order-rows').addEventListener('click', async e => {
  const btn = e.target.closest('button[data-id]');
  if (!btn) return;
  const id = btn.dataset.id;
  if (!confirm(`ยืนยันการ${btn.textContent} สำหรับคำสั่งซื้อเลขที่ ${id}?`)) return;
  await advanceOrderStatus(id);
  renderOrders();
});

// พิมพ์ค้นหา
searchEl.addEventListener('input', renderOrders);

// กดปุ่มกรองสถานะ
document.getElementById('status-filters').addEventListener('click', e => {
  const btn = e.target.closest('.filter-btn');
  if (!btn) return;
  statusFilter = btn.dataset.status;
  renderOrders();
});

renderOrders();
