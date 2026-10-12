// ส่วนเก็บและอ่านข้อมูลคำสั่งซื้อ
// ตอนนี้เก็บในเบราว์เซอร์ (localStorage) ช่วงบ่ายจะเปลี่ยนไฟล์นี้ไปใช้ Supabase
// ทุกฟังก์ชันเป็น async เพื่อให้หน้าอื่นไม่ต้องแก้ตอนเปลี่ยนไปใช้ Supabase

const STORAGE_KEY = 'amata_orders_v1';

// ข้อมูลสมมติ (ชื่อร้านและชื่อหนังสือแต่งขึ้นทั้งหมด)
const SAMPLE_ORDERS = [
  { id: 'AM-0001', shop: 'ร้านหนังสือนกกระจิบ',   book: 'เมืองที่ไม่มีนาฬิกา', quantity: 20, unitPrice: 285, orderDate: '2026-08-14', status: 'paid' },
  { id: 'AM-0002', shop: 'ร้านหนังสือกระดาษสา',   book: 'สูตรลับครัวยาย',      quantity: 15, unitPrice: 350, orderDate: '2026-08-21', status: 'shipped' },
  { id: 'AM-0003', shop: 'ร้านหนังสือทางเกวียน',   book: 'บันทึกคนเลี้ยงผึ้ง',   quantity: 10, unitPrice: 260, orderDate: '2026-08-28', status: 'paid' },
  { id: 'AM-0004', shop: 'ร้านหนังสือมุมอุ่นใจ',   book: 'เงาจันทร์ริมน้ำ',      quantity: 30, unitPrice: 245, orderDate: '2026-09-02', status: 'shipped' },
  { id: 'AM-0005', shop: 'ร้านหนังสือนกกระจิบ',   book: 'นักเดินทางกระดาษ',     quantity: 12, unitPrice: 320, orderDate: '2026-09-07', status: 'pending' },
  { id: 'AM-0006', shop: 'ร้านหนังสือสวนชาดา',    book: 'ทะเลในขวดแก้ว',       quantity: 25, unitPrice: 199, orderDate: '2026-09-15', status: 'paid' },
  { id: 'AM-0007', shop: 'ร้านหนังสือกระดาษสา',   book: 'ภาษาของต้นไม้',       quantity: 8,  unitPrice: 390, orderDate: '2026-09-23', status: 'shipped' },
  { id: 'AM-0008', shop: 'ร้านหนังสือฟ้าครามใต้',  book: 'เส้นทางสายใบชา',      quantity: 18, unitPrice: 275, orderDate: '2026-09-30', status: 'shipped' },
  { id: 'AM-0009', shop: 'ร้านหนังสือทางเกวียน',   book: 'เมืองที่ไม่มีนาฬิกา', quantity: 40, unitPrice: 285, orderDate: '2026-10-06', status: 'pending' },
  { id: 'AM-0010', shop: 'ร้านหนังสือมุมอุ่นใจ',   book: 'สูตรลับครัวยาย',      quantity: 6,  unitPrice: 350, orderDate: '2026-10-10', status: 'pending' },
];

function readStore() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) { /* อ่านไม่ได้ ใช้ข้อมูลสมมติแทน */ }
  writeStore(SAMPLE_ORDERS);
  return SAMPLE_ORDERS.slice();
}

function writeStore(orders) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(orders)); } catch (e) { /* บันทึกไม่ได้ */ }
}

// รายชื่อร้านค้า (สมมติ)
const SHOPS = [
  'ร้านหนังสือกระดาษสา',
  'ร้านหนังสือทางเกวียน',
  'ร้านหนังสือนกกระจิบ',
  'ร้านหนังสือฟ้าครามใต้',
  'ร้านหนังสือมุมอุ่นใจ',
  'ร้านหนังสือสวนชาดา',
];

// รายชื่อหนังสือและราคาต่อเล่ม (สมมติ)
const BOOKS = [
  { title: 'ทะเลในขวดแก้ว',       price: 199 },
  { title: 'นักเดินทางกระดาษ',     price: 320 },
  { title: 'บันทึกคนเลี้ยงผึ้ง',   price: 260 },
  { title: 'ภาษาของต้นไม้',       price: 390 },
  { title: 'เมืองที่ไม่มีนาฬิกา', price: 285 },
  { title: 'เงาจันทร์ริมน้ำ',      price: 245 },
  { title: 'เส้นทางสายใบชา',      price: 275 },
  { title: 'สูตรลับครัวยาย',      price: 350 },
];

// ลำดับสถานะ: รอส่ง -> ส่งแล้ว -> ชำระแล้ว
const NEXT_STATUS = { pending: 'shipped', shipped: 'paid' };

async function getShops() { return SHOPS.slice(); }
async function getBooks() { return BOOKS.slice(); }

// อ่านคำสั่งซื้อทั้งหมด เรียงจากใหม่ไปเก่า
async function getOrders() {
  return readStore().slice().sort((a, b) => b.orderDate.localeCompare(a.orderDate) || b.id.localeCompare(a.id));
}

// เพิ่มคำสั่งซื้อใหม่ คืนค่าคำสั่งซื้อที่บันทึกแล้ว (พร้อมเลขที่)
async function addOrder({ shop, book, quantity, unitPrice, orderDate }) {
  const orders = readStore();
  const maxNo = orders.reduce((max, o) => Math.max(max, parseInt(o.id.slice(3), 10) || 0), 0);
  const order = {
    id: 'AM-' + String(maxNo + 1).padStart(4, '0'),
    shop, book, quantity, unitPrice, orderDate,
    status: 'pending',
  };
  orders.push(order);
  writeStore(orders);
  return order;
}

// เลื่อนสถานะไปขั้นถัดไป
async function advanceOrderStatus(id) {
  const orders = readStore();
  const order = orders.find(o => o.id === id);
  if (!order || !NEXT_STATUS[order.status]) return null;
  order.status = NEXT_STATUS[order.status];
  writeStore(orders);
  return order;
}
