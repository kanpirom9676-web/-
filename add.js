// หน้าเพิ่มคำสั่งซื้อ: เติมตัวเลือก คิดยอดอัตโนมัติ ตรวจข้อมูล และบันทึก

const form = document.getElementById('order-form');
const shopEl = document.getElementById('shop');
const bookEl = document.getElementById('book');
const qtyEl = document.getElementById('quantity');
const dateEl = document.getElementById('orderDate');
const totalEl = document.getElementById('total');
const priceHintEl = document.getElementById('price-hint');
const alertEl = document.getElementById('form-alert');

let books = [];

function todayIso() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function selectedBook() {
  return books.find(b => b.title === bookEl.value);
}

function updateTotal() {
  const book = selectedBook();
  const qty = Number(qtyEl.value);
  priceHintEl.textContent = book ? `ราคาต่อเล่ม ${formatMoney(book.price)}` : '';
  totalEl.textContent = formatMoney(book && Number.isInteger(qty) && qty > 0 ? book.price * qty : 0);
}

function setError(name, message) {
  const field = form.querySelector(`[data-field="${name}"]`);
  field.classList.add('has-error');
  const msg = document.createElement('div');
  msg.className = 'field-error';
  msg.textContent = message;
  field.appendChild(msg);
}

function clearErrors() {
  form.querySelectorAll('.has-error').forEach(f => f.classList.remove('has-error'));
  form.querySelectorAll('.field-error').forEach(m => m.remove());
  alertEl.hidden = true;
}

function validate() {
  const errors = [];
  if (!shopEl.value) errors.push(['shop', 'กรุณาเลือกร้าน']);
  if (!bookEl.value) errors.push(['book', 'กรุณาเลือกหนังสือ']);
  const qty = Number(qtyEl.value);
  if (qtyEl.value.trim() === '') errors.push(['quantity', 'กรุณาใส่จำนวน']);
  else if (!Number.isInteger(qty) || qty < 1) errors.push(['quantity', 'จำนวนต้องเป็นจำนวนเต็มตั้งแต่ 1 เล่มขึ้นไป']);
  if (!dateEl.value) errors.push(['orderDate', 'กรุณาเลือกวันที่สั่ง']);
  return errors;
}

async function init() {
  const shops = await getShops();
  books = await getBooks();
  shops.forEach(s => shopEl.add(new Option(s, s)));
  books.forEach(b => bookEl.add(new Option(b.title, b.title)));
  dateEl.value = todayIso();
  updateDateHint();
  updateTotal();
}

function updateDateHint() {
  document.getElementById('date-hint').textContent = dateEl.value ? formatThaiDate(dateEl.value) : '';
}

// แก้ช่องไหนแล้ว ให้ข้อความเตือนของช่องนั้นหายไป
function clearFieldError(e) {
  const field = e.target.closest('.field');
  field.classList.remove('has-error');
  field.querySelectorAll('.field-error').forEach(m => m.remove());
  if (!form.querySelector('.has-error')) alertEl.hidden = true;
}

bookEl.addEventListener('change', updateTotal);
qtyEl.addEventListener('input', updateTotal);
dateEl.addEventListener('change', updateDateHint);
[shopEl, bookEl, qtyEl, dateEl].forEach(el => {
  el.addEventListener('input', clearFieldError);
  el.addEventListener('change', clearFieldError);
});

form.addEventListener('submit', async e => {
  e.preventDefault();
  clearErrors();
  const errors = validate();
  if (errors.length) {
    errors.forEach(([name, message]) => setError(name, message));
    alertEl.textContent = 'กรอกข้อมูลไม่ครบ กรุณาตรวจสอบช่องที่มีกรอบสีแดง';
    alertEl.hidden = false;
    form.querySelector('.has-error select, .has-error input').focus();
    return;
  }
  const book = selectedBook();
  const order = await addOrder({
    shop: shopEl.value,
    book: book.title,
    quantity: Number(qtyEl.value),
    unitPrice: book.price,
    orderDate: dateEl.value,
  });
  location.href = 'index.html?new=' + encodeURIComponent(order.id);
});

init();
