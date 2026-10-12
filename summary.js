// หน้าสรุปยอด: การ์ดตัวเลข และกราฟแท่งร้านยอดสูงสุด 5 อันดับ

const TOP_N = 5;

function orderTotal(o) { return o.quantity * o.unitPrice; }

async function renderSummary() {
  const orders = await getOrders();
  const unpaid = orders.filter(o => o.status !== 'paid');
  const sales = orders.reduce((sum, o) => sum + orderTotal(o), 0);
  const unpaidSum = unpaid.reduce((sum, o) => sum + orderTotal(o), 0);

  // การ์ดแถวบน
  document.getElementById('total-sales').textContent = formatMoney(sales);
  document.getElementById('total-sales-note').textContent = 'รวมทุกสถานะ';
  document.getElementById('total-unpaid').textContent = formatMoney(unpaidSum);
  document.getElementById('total-unpaid-note').textContent = `${unpaid.length} รายการที่ยังไม่ชำระ (รอส่ง + ส่งแล้ว)`;
  document.getElementById('total-orders').textContent = orders.length.toLocaleString('en-US');

  // การ์ดแยกตามสถานะ
  document.getElementById('status-cards').innerHTML = Object.entries(STATUS).map(([key, s]) => {
    const list = orders.filter(o => o.status === key);
    const amount = list.reduce((sum, o) => sum + orderTotal(o), 0);
    return `
      <div class="card stat">
        <div class="stat-label"><span class="badge ${s.className}">${s.label}</span></div>
        <div class="stat-value">${list.length} <span class="stat-unit">รายการ</span></div>
        <div class="stat-note">ยอดเงิน ${formatMoney(amount)}</div>
      </div>`;
  }).join('');

  // รวมยอดตามร้าน แล้วเลือก 5 อันดับแรก
  const byShop = {};
  orders.forEach(o => {
    const s = byShop[o.shop] || (byShop[o.shop] = { shop: o.shop, total: 0, unpaid: 0, count: 0 });
    s.total += orderTotal(o);
    s.count += 1;
    if (o.status !== 'paid') s.unpaid += orderTotal(o);
  });
  const top = Object.values(byShop).sort((a, b) => b.total - a.total).slice(0, TOP_N);
  const max = top.length ? top[0].total : 0;

  const chart = document.getElementById('top-shops');
  if (top.length === 0) {
    chart.innerHTML = '<p class="empty">ยังไม่มีคำสั่งซื้อ</p>';
    return;
  }
  chart.innerHTML = top.map((s, i) => `
    <div class="bar-row" tabindex="0"
         data-tip="${escapeHtml(s.shop)}|${formatMoney(s.total)}|${s.count}|${formatMoney(s.unpaid)}">
      <div class="bar-label">${i + 1}. ${escapeHtml(s.shop)}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.max(2, (s.total / max) * 100)}%"></div>
      </div>
      <div class="bar-value">${formatMoney(s.total)}</div>
    </div>`).join('');
}

// กล่องรายละเอียดเมื่อเอาเมาส์ชี้ที่แท่ง
const tooltip = document.getElementById('tooltip');

function showTip(row, x, y) {
  const [shop, total, count, unpaidAmt] = row.dataset.tip.split('|');
  tooltip.innerHTML = `
    <div class="tip-title">${shop}</div>
    <div>ยอดสั่งซื้อรวม <b>${total}</b></div>
    <div>จำนวนคำสั่งซื้อ <b>${count}</b> รายการ</div>
    <div>ค้างชำระ <b>${unpaidAmt}</b></div>`;
  tooltip.hidden = false;
  const pad = 14;
  const w = tooltip.offsetWidth, h = tooltip.offsetHeight;
  let left = x + pad, top = y + pad;
  if (left + w > window.innerWidth - 8) left = x - w - pad;
  if (top + h > window.innerHeight - 8) top = y - h - pad;
  tooltip.style.left = Math.max(8, left) + 'px';
  tooltip.style.top = Math.max(8, top) + 'px';
}

const chartEl = document.getElementById('top-shops');
chartEl.addEventListener('mousemove', e => {
  const row = e.target.closest('.bar-row');
  if (row) showTip(row, e.clientX, e.clientY); else tooltip.hidden = true;
});
chartEl.addEventListener('mouseleave', () => { tooltip.hidden = true; });
chartEl.addEventListener('focusin', e => {
  const row = e.target.closest('.bar-row');
  if (!row) return;
  const r = row.getBoundingClientRect();
  showTip(row, r.left + r.width / 2, r.bottom);
});
chartEl.addEventListener('focusout', () => { tooltip.hidden = true; });

renderSummary();
