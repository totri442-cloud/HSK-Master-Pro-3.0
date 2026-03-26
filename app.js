const STORAGE_KEY = 'hoanguhsk_v1';
const app = document.getElementById('app');

const seedData = {
  users: [
    { id: 'admin-1', name: 'Admin', username: 'admin', password: 'admin123', role: 'admin', vipLevels: ['HSK1','HSK2','HSK3','HSK4','HSK5','HSK6','HSK7','HSK8','HSK9','HSKK'], status: 'active', createdAt: new Date().toISOString() },
    { id: 'guest-1', name: 'Khách Demo', username: 'demo', password: '123456', role: 'guest', vipLevels: ['HSK1'], status: 'active', createdAt: new Date().toISOString() }
  ],
  currentUserId: null,
  history: [],
  study: {}
};

const levels = ['HSK1','HSK2','HSK3','HSK4','HSK5','HSK6','HSK7','HSK8','HSK9','HSKK'];

const levelData = {
  HSK1: {
    typing: [
      { hanzi: '你好', pinyin: 'nǐ hǎo', meaning: 'Xin chào' },
      { hanzi: '谢谢', pinyin: 'xiè xie', meaning: 'Cảm ơn' },
      { hanzi: '学习', pinyin: 'xué xí', meaning: 'Học tập' },
      { hanzi: '中国', pinyin: 'Zhōng guó', meaning: 'Trung Quốc' }
    ],
    dialogue: `A: 你好，你叫什么名字？\nB: 我叫安。你呢？\nA: 我叫明。你是学生吗？\nB: 是，我是学生。我学习汉语。\nA: 太好了，我们一起学习吧！`,
    reflex: [
      { vi: 'Xin chào', hanzi: '你好', pinyin: 'nǐ hǎo' },
      { vi: 'Cảm ơn', hanzi: '谢谢', pinyin: 'xiè xie' },
      { vi: 'Tôi học tiếng Trung', hanzi: '我学习汉语', pinyin: 'wǒ xuéxí Hànyǔ' }
    ],
    exam: [
      { question: 'Chọn nghĩa đúng của từ “学习”', options: ['Ăn cơm', 'Học tập', 'Đi chơi'], answer: 'Học tập' },
      { question: 'Pinyin đúng của “你好” là gì?', options: ['nǐ hǎo', 'ní hào', 'nǐ hà'], answer: 'nǐ hǎo' }
    ]
  },
  HSK2: {
    typing: [
      { hanzi: '喜欢', pinyin: 'xǐ huan', meaning: 'Thích' },
      { hanzi: '朋友', pinyin: 'péng you', meaning: 'Bạn bè' },
      { hanzi: '工作', pinyin: 'gōng zuò', meaning: 'Công việc' }
    ],
    dialogue: `A: 周末你想做什么？\nB: 我想和朋友去公园，然后一起吃饭。\nA: 你喜欢中国菜吗？\nB: 当然喜欢，尤其喜欢饺子和面条。`,
    reflex: [
      { vi: 'Tôi thích món ăn Trung Quốc', hanzi: '我喜欢中国菜', pinyin: 'wǒ xǐhuan Zhōngguó cài' },
      { vi: 'Đây là bạn của tôi', hanzi: '这是我的朋友', pinyin: 'zhè shì wǒ de péngyou' }
    ],
    exam: [
      { question: 'Từ “朋友” nghĩa là gì?', options: ['Gia đình', 'Bạn bè', 'Giáo viên'], answer: 'Bạn bè' }
    ]
  }
};

levels.forEach(level => {
  if (!levelData[level]) {
    levelData[level] = {
      typing: [
        { hanzi: '努力', pinyin: 'nǔ lì', meaning: 'Nỗ lực' },
        { hanzi: '经验', pinyin: 'jīng yàn', meaning: 'Kinh nghiệm' },
        { hanzi: '文化', pinyin: 'wén huà', meaning: 'Văn hoá' }
      ],
      dialogue: `A: 最近学习怎么样？\nB: 我每天都练习听力、口语和写作。\nA: 这样很好，坚持下去一定会进步。\nB: 谢谢，我希望今年通过考试。`,
      reflex: [
        { vi: 'Tôi đang cố gắng mỗi ngày', hanzi: '我每天都在努力', pinyin: 'wǒ měitiān dōu zài nǔlì' },
        { vi: 'Ngôn ngữ cần phản xạ nhanh', hanzi: '语言需要快速反应', pinyin: 'yǔyán xūyào kuàisù fǎnyìng' }
      ],
      exam: [
        { question: `Chọn nghĩa đúng của từ ở cấp ${level}`, options: ['Nỗ lực', 'Quên', 'Mệt'], answer: 'Nỗ lực' }
      ]
    };
  }
});

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return structuredClone(seedData);
  try { return JSON.parse(raw); } catch { return structuredClone(seedData); }
}
function saveState() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function uid(prefix='id') { return `${prefix}-${Math.random().toString(36).slice(2, 9)}`; }
function nowVN() { return new Date().toLocaleString('vi-VN'); }
function shuffle(arr) { return [...arr].sort(() => Math.random() - 0.5); }

let state = loadState();
let currentLevel = 'HSK1';
let currentModule = 'typing';
let flashIndex = 0;
let reflexIndex = 0;
let reflexTimer = null;
let reflexCountdown = 3;
let examSelections = {};

function getCurrentUser() { return state.users.find(u => u.id === state.currentUserId) || null; }
function getStudy(userId, level) {
  state.study[userId] ??= {};
  state.study[userId][level] ??= { typingInputs: {}, typingStatus: {}, flashSeen: 0, examScore: null };
  return state.study[userId][level];
}
function addHistory(type, detail) {
  const user = getCurrentUser();
  if (!user) return;
  state.history.unshift({ id: uid('h'), userId: user.id, userName: user.name, type, detail, time: nowVN() });
  saveState();
}
function hasAccess(user, level) {
  return user.role === 'admin' || (user.vipLevels || []).includes(level);
}
function logout() { state.currentUserId = null; saveState(); render(); }

function authView() {
  app.innerHTML = `
    <div class="auth-wrap">
      <div class="card auth-card">
        <div class="section-title">
          <div>
            <div class="tag">🌸 Giao diện Trung Hoa</div>
            <h2>Hoa Ngữ HSK</h2>
            <div class="muted">Học theo cấp độ HSK 1-9 và HSKK. Tối ưu web + iPhone, có cache cục bộ.</div>
          </div>
        </div>
        <div class="grid">
          <div class="panel">
            <h3>Đăng nhập</h3>
            <div class="small muted">Demo Admin: admin / admin123 · Demo khách: demo / 123456</div>
            <div class="form-grid" style="margin-top:14px">
              <div><label>Tài khoản</label><input id="login-username" placeholder="Nhập tài khoản" /></div>
              <div><label>Mật khẩu</label><input id="login-password" type="password" placeholder="Nhập mật khẩu" /></div>
            </div>
            <div style="margin-top:14px"><button onclick="login()">Đăng nhập</button></div>
          </div>
          <div class="panel">
            <h3>Đăng ký</h3>
            <div class="form-grid" style="margin-top:14px">
              <div><label>Họ tên</label><input id="reg-name" placeholder="Ví dụ: Trí Tô Quang" /></div>
              <div><label>Tài khoản</label><input id="reg-username" placeholder="Tên đăng nhập" /></div>
              <div><label>Mật khẩu</label><input id="reg-password" type="password" placeholder="Tối thiểu 6 ký tự" /></div>
            </div>
            <div style="margin-top:14px"><button class="gold" onclick="registerUser()">Tạo tài khoản khách</button></div>
          </div>
        </div>
        <div class="footer-note">Free HSK1. Từ HSK2 trở đi yêu cầu Admin cấp quyền VIP.</div>
      </div>
    </div>
  `;
}

function login() {
  const username = document.getElementById('login-username').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const user = state.users.find(u => u.username === username && u.password === password);
  if (!user) return alert('Sai tài khoản hoặc mật khẩu');
  if (user.status !== 'active') return alert('Tài khoản đang bị khoá');
  state.currentUserId = user.id;
  saveState();
  addHistory('Đăng nhập', `${user.name} đăng nhập hệ thống`);
  render();
}

function registerUser() {
  const name = document.getElementById('reg-name').value.trim();
  const username = document.getElementById('reg-username').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  if (!name || !username || password.length < 6) return alert('Vui lòng nhập đủ thông tin, mật khẩu tối thiểu 6 ký tự');
  if (state.users.some(u => u.username === username)) return alert('Tài khoản đã tồn tại');
  state.users.push({ id: uid('user'), name, username, password, role: 'guest', vipLevels: ['HSK1'], status: 'active', createdAt: new Date().toISOString() });
  saveState();
  alert('Đăng ký thành công. Bạn có thể đăng nhập ngay.');
}

function shell(content) {
  const user = getCurrentUser();
  return `
    <div class="container">
      <div class="header">
        <div class="brand">
          <div class="logo">汉</div>
          <div>
            <h1>Hoa Ngữ HSK</h1>
            <p>${user.role === 'admin' ? 'Quản trị toàn hệ thống' : 'Học tiếng Trung theo lộ trình HSK'} · Xin chào ${user.name}</p>
          </div>
        </div>
        <div class="top-actions">
          <span class="tag">${user.role === 'admin' ? 'Admin' : 'Khách'} · ${user.status}</span>
          ${user.role !== 'admin' ? `<button class="secondary" onclick="showHistory()">Lịch sử hoạt động</button>` : ''}
          ${user.role === 'admin' ? `<button class="gold" onclick="renderAdmin()">Control Admin</button>` : ''}
          <button onclick="logout()">Đăng xuất</button>
        </div>
      </div>
      ${content}
    </div>
  `;
}

function dashboardView() {
  const user = getCurrentUser();
  const levelCards = levels.map(level => {
    const open = hasAccess(user, level);
    return `
      <div class="level-card ${open ? '' : 'locked'}">
        <div class="tag">${open ? 'Mở' : 'VIP'}</div>
        <h3 style="margin:12px 0 6px">${level}</h3>
        <div class="muted">Luyện gõ · Flashcard · Phản xạ · Hội thoại · Bài tập</div>
        <div style="margin-top:14px">
          <button ${open ? '' : 'class="secondary"'} onclick="openLevel('${level}')">${open ? 'Vào học' : 'Mở cấp độ'}</button>
        </div>
      </div>
    `;
  }).join('');

  app.innerHTML = shell(`
    <div class="grid">
      <div class="card" style="grid-column: 1 / -1;">
        <div class="section-title">
          <div>
            <h2>Chọn cấp độ HSK</h2>
            <div class="muted">HSK1 miễn phí. Từ HSK2 trở đi cần Admin cấp quyền sử dụng.</div>
          </div>
        </div>
        <div class="level-grid">${levelCards}</div>
      </div>
    </div>
  `);
}

function openLevel(level) {
  const user = getCurrentUser();
  if (!hasAccess(user, level)) return openVipPopup(level);
  currentLevel = level;
  currentModule = 'typing';
  flashIndex = 0;
  reflexIndex = 0;
  examSelections = {};
  addHistory('Mở cấp độ', `Bắt đầu học ${level}`);
  renderStudy();
}

function renderStudy() {
  const user = getCurrentUser();
  const data = levelData[currentLevel];
  const study = getStudy(user.id, currentLevel);
  const modules = [
    ['typing', 'Luyện Gõ Hán tự'],
    ['flashcard', 'Flashcard'],
    ['reflex', 'Phản Xạ'],
    ['dialogue', 'Hội Thoại'],
    ['exam', 'Bài Tập HSK']
  ];

  const nav = modules.map(([key, label]) => `<button class="${currentModule === key ? '' : 'secondary'}" onclick="switchModule('${key}')">${label}</button>`).join(' ');
  let content = '';

  if (currentModule === 'typing') {
    const rows = data.typing.map((item, idx) => {
      const val = study.typingInputs[idx] || '';
      const status = study.typingStatus[idx] || 'pending';
      const statusText = status === 'ok' ? 'Đúng rồi' : status === 'wrong' ? 'Học lại đi' : 'Đoán xem';
      const statusClass = status === 'ok' ? 'status-ok' : status === 'wrong' ? 'status-warn' : 'status-pending';
      return `
        <tr>
          <td>${idx + 1}</td>
          <td class="kaiti">${item.hanzi}</td>
          <td>${item.pinyin}</td>
          <td>${item.meaning}</td>
          <td><input value="${escapeHtml(val)}" oninput="updateTyping(${idx}, this.value)" placeholder="Nhập Hán tự hoặc nghĩa" /></td>
          <td class="${statusClass}">${statusText}</td>
        </tr>`;
    }).join('');
    content = `
      <div class="card">
        <div class="section-title"><div><h3>Luyện Gõ Hán tự · ${currentLevel}</h3><div class="muted">Bảng thẳng hàng, đẹp, hỗ trợ ôn tập theo từng từ.</div></div></div>
        <div class="table-wrap">
          <table>
            <thead>
              <tr><th>STT</th><th>Hán Tự</th><th>Pinyin</th><th>Nghĩa tiếng Việt</th><th>Ôn Tập</th><th>Kết Quả</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;
  }

  if (currentModule === 'flashcard') {
    const cards = shuffle(data.typing);
    const card = cards[flashIndex % cards.length];
    content = `
      <div class="card flashcard">
        <div>
          <div class="tag">Random Flashcard · ${currentLevel}</div>
          <div class="kaiti">${card.hanzi}</div>
          <h3>${card.pinyin}</h3>
          <div class="muted">${card.meaning}</div>
          <div style="margin-top:18px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap;">
            <button onclick="nextFlashcard()">Flashcard tiếp theo</button>
            <button class="secondary" onclick="autoFlashcard()">Tự động chuyển</button>
          </div>
        </div>
      </div>`;
  }

  if (currentModule === 'reflex') {
    const ref = data.reflex[reflexIndex % data.reflex.length];
    content = `
      <div class="card">
        <div class="section-title"><div><h3>Phản xạ nhanh · ${currentLevel}</h3><div class="muted">Hiện tiếng Việt trước 3 giây, sau đó hiện Hán tự và pinyin.</div></div></div>
        <div class="timer"><div class="timer-bar" style="width:${(reflexCountdown/3)*100}%"></div></div>
        <div class="flashcard" style="margin-top:14px; min-height:240px;">
          <div>
            <div class="tag">Bộ thẻ ${reflexIndex + 1}/${data.reflex.length}</div>
            <h2>${ref.vi}</h2>
            ${reflexCountdown === 0 ? `<div class="kaiti">${ref.hanzi}</div><div>${ref.pinyin}</div>` : `<div class="notice" style="margin-top:14px">Đáp án sẽ hiện sau ${reflexCountdown} giây</div>`}
          </div>
        </div>
        <div style="margin-top:14px; display:flex; gap:10px; flex-wrap:wrap;">
          <button onclick="startReflex()">Bắt đầu</button>
          <button class="secondary" onclick="nextReflex()">Chuyển câu</button>
        </div>
      </div>`;
  }

  if (currentModule === 'dialogue') {
    content = `
      <div class="card">
        <div class="section-title"><div><h3>Hội thoại ngẫu nhiên · ${currentLevel}</h3><div class="muted">Nội dung dài, logic, bám cấp độ học.</div></div></div>
        <div class="dialogue-box">${data.dialogue}</div>
      </div>`;
  }

  if (currentModule === 'exam') {
    const questions = data.exam.map((q, idx) => `
      <div class="exam-q">
        <strong>Câu ${idx + 1}:</strong> ${q.question}
        <div style="display:grid; gap:8px; margin-top:10px;">
          ${q.options.map(opt => `<label style="font-weight:400"><input type="radio" name="q${idx}" ${examSelections[idx]===opt?'checked':''} onchange="selectExam(${idx}, '${escapeAttr(opt)}')" /> ${opt}</label>`).join('')}
        </div>
      </div>
    `).join('');
    content = `
      <div class="card">
        <div class="section-title"><div><h3>Làm bài theo kiểu thi HSK · ${currentLevel}</h3><div class="muted">Chấm điểm cơ bản ngay trên trình duyệt.</div></div></div>
        ${questions}
        <button onclick="submitExam()">Nộp bài</button>
        ${study.examScore !== null ? `<div class="notice" style="margin-top:14px">Điểm gần nhất: ${study.examScore}/${data.exam.length}</div>` : ''}
      </div>`;
  }

  app.innerHTML = shell(`
    <div class="grid">
      <div class="card" style="grid-column: 1 / -1;">
        <div class="section-title">
          <div>
            <div class="tag">${currentLevel}</div>
            <h2>Lộ trình học</h2>
          </div>
          <div><button class="secondary" onclick="render()">← Về danh sách cấp độ</button></div>
        </div>
        <div style="display:flex; gap:10px; flex-wrap:wrap;">${nav}</div>
      </div>
      <div style="grid-column: 1 / -1;">${content}</div>
    </div>
  `);
}

function switchModule(module) {
  currentModule = module;
  renderStudy();
}
function updateTyping(idx, value) {
  const user = getCurrentUser();
  const study = getStudy(user.id, currentLevel);
  const target = levelData[currentLevel].typing[idx];
  const normalized = value.trim().toLowerCase();
  study.typingInputs[idx] = value;
  if (!normalized) study.typingStatus[idx] = 'pending';
  else if (normalized === target.hanzi.toLowerCase() || normalized === target.meaning.toLowerCase()) study.typingStatus[idx] = 'ok';
  else study.typingStatus[idx] = 'wrong';
  saveState();
  renderStudy();
}
function nextFlashcard() {
  flashIndex += 1;
  addHistory('Flashcard', `Xem flashcard ${currentLevel}`);
  renderStudy();
}
function autoFlashcard() {
  let count = 0;
  const timer = setInterval(() => {
    flashIndex += 1; renderStudy(); count += 1;
    if (count >= 5) clearInterval(timer);
  }, 1800);
}
function startReflex() {
  clearInterval(reflexTimer);
  reflexCountdown = 3;
  renderStudy();
  reflexTimer = setInterval(() => {
    reflexCountdown -= 1;
    if (reflexCountdown <= 0) {
      reflexCountdown = 0;
      clearInterval(reflexTimer);
      addHistory('Phản xạ', `Hoàn thành 1 thẻ phản xạ ở ${currentLevel}`);
    }
    renderStudy();
  }, 1000);
}
function nextReflex() {
  clearInterval(reflexTimer);
  reflexCountdown = 3;
  reflexIndex += 1;
  renderStudy();
}
function selectExam(idx, value) {
  examSelections[idx] = value;
}
function submitExam() {
  const user = getCurrentUser();
  const data = levelData[currentLevel];
  const study = getStudy(user.id, currentLevel);
  let score = 0;
  data.exam.forEach((q, idx) => { if (examSelections[idx] === q.answer) score += 1; });
  study.examScore = score;
  saveState();
  addHistory('Bài tập', `Nộp bài ${currentLevel}: ${score}/${data.exam.length}`);
  alert(`Bạn được ${score}/${data.exam.length} điểm`);
  renderStudy();
}
function showHistory() {
  const user = getCurrentUser();
  const items = state.history.filter(h => h.userId === user.id).map(h => `
    <div class="history-item"><strong>${h.type}</strong><div>${h.detail}</div><div class="small muted">${h.time}</div></div>
  `).join('') || '<div class="notice">Chưa có lịch sử hoạt động.</div>';
  app.innerHTML = shell(`
    <div class="card">
      <div class="section-title"><div><h2>Lịch sử hoạt động</h2><div class="muted">Người dùng không có chức năng xoá lịch sử.</div></div><button class="secondary" onclick="render()">Quay lại</button></div>
      <div class="history-list">${items}</div>
    </div>
  `);
}
function openVipPopup(level) {
  const popup = document.createElement('div');
  popup.className = 'popup';
  popup.innerHTML = `
    <div class="popup-card">
      <h3>🔒 Mở ${level}</h3>
      <div class="notice">Liên hệ Admin để mua và cấp quyền sử dụng cấp độ này.</div>
      <div style="margin-top:14px; display:flex; gap:10px; justify-content:flex-end;">
        <button class="secondary" onclick="this.closest('.popup').remove()">Đã hiểu</button>
      </div>
    </div>`;
  document.body.appendChild(popup);
}

function renderAdmin() {
  const users = state.users.filter(u => u.role === 'guest').map(u => `
    <tr>
      <td>${u.name}</td><td>${u.username}</td><td>${u.status}</td><td>${(u.vipLevels||[]).join(', ')}</td>
      <td>${new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
      <td>
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <button class="secondary" onclick="toggleUserStatus('${u.id}')">${u.status === 'active' ? 'Khoá' : 'Mở'}</button>
          <button class="gold" onclick="grantVipPrompt('${u.id}')">Nâng VIP</button>
        </div>
      </td>
    </tr>
  `).join('');
  app.innerHTML = shell(`
    <div class="grid">
      <div class="card" style="grid-column:1/-1">
        <div class="section-title"><div><h2>Control Admin</h2><div class="muted">Tạo tài khoản, quản lý trạng thái và nâng VIP cho user khách.</div></div><button class="secondary" onclick="render()">Trang chính</button></div>
        <div class="grid">
          <div class="panel">
            <h3>Tạo tài khoản khách</h3>
            <div class="form-grid" style="margin-top:12px">
              <div><label>Họ tên</label><input id="admin-name" /></div>
              <div><label>Tài khoản</label><input id="admin-username" /></div>
              <div><label>Mật khẩu</label><input id="admin-password" type="password" /></div>
            </div>
            <div style="margin-top:14px"><button onclick="createUserByAdmin()">Tạo tài khoản</button></div>
          </div>
          <div class="panel">
            <h3>Gợi ý triển khai thật</h3>
            <div class="muted">Khi up GitHub để chạy thực tế, nên bổ sung backend, mã hoá mật khẩu, phân quyền server, DB và thanh toán.</div>
          </div>
        </div>
      </div>
      <div class="card" style="grid-column:1/-1">
        <div class="section-title"><div><h3>Bảng hệ thống quản lý User Khách</h3></div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Họ tên</th><th>Tài khoản</th><th>Trạng thái</th><th>Quyền học</th><th>Ngày tạo</th><th>Hành động</th></tr></thead>
            <tbody>${users || '<tr><td colspan="6">Chưa có user khách.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    </div>
  `);
}

function createUserByAdmin() {
  const name = document.getElementById('admin-name').value.trim();
  const username = document.getElementById('admin-username').value.trim();
  const password = document.getElementById('admin-password').value.trim();
  if (!name || !username || password.length < 6) return alert('Thông tin chưa hợp lệ');
  if (state.users.some(u => u.username === username)) return alert('Tài khoản đã tồn tại');
  state.users.push({ id: uid('user'), name, username, password, role: 'guest', vipLevels: ['HSK1'], status: 'active', createdAt: new Date().toISOString() });
  saveState();
  alert('Đã tạo tài khoản khách');
  renderAdmin();
}
function toggleUserStatus(id) {
  const user = state.users.find(u => u.id === id);
  user.status = user.status === 'active' ? 'locked' : 'active';
  saveState();
  renderAdmin();
}
function grantVipPrompt(id) {
  const level = prompt('Nhập cấp muốn cấp quyền, ví dụ: HSK2 hoặc HSKK');
  if (!level || !levels.includes(level)) return alert('Cấp độ không hợp lệ');
  const user = state.users.find(u => u.id === id);
  user.vipLevels = Array.from(new Set([...(user.vipLevels||[]), level]));
  saveState();
  alert(`Đã cấp quyền ${level} cho ${user.name}`);
  renderAdmin();
}
function escapeHtml(str='') { return str.replace(/[&<>"]/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s])); }
function escapeAttr(str='') { return String(str).replace(/'/g, '\\&#39;'); }
function render() {
  const user = getCurrentUser();
  if (!user) return authView();
  if (user.role === 'admin') return renderAdmin();
  return dashboardView();
}

window.login = login;
window.registerUser = registerUser;
window.logout = logout;
window.render = render;
window.renderAdmin = renderAdmin;
window.openLevel = openLevel;
window.switchModule = switchModule;
window.updateTyping = updateTyping;
window.nextFlashcard = nextFlashcard;
window.autoFlashcard = autoFlashcard;
window.startReflex = startReflex;
window.nextReflex = nextReflex;
window.selectExam = selectExam;
window.submitExam = submitExam;
window.showHistory = showHistory;
window.toggleUserStatus = toggleUserStatus;
window.grantVipPrompt = grantVipPrompt;
window.createUserByAdmin = createUserByAdmin;

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

render();
