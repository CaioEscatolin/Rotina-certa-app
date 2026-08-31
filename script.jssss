/* =========================================================
   ROTINA CERTA — script.js
   Dados da turma (crianças, rotinas, marcações) ficam no
   Firestore, compartilhados entre todos os dispositivos que
   entrarem com o mesmo código de turma.
   Preferências pessoais (tema, som, aba ativa) ficam só neste
   aparelho, em localStorage.
   ========================================================= */

import { firebaseConfig } from './firebase-config.js';
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getFirestore, doc, setDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp);

const LOCAL_KEY = 'rotinaCerta:local:v1';
const TURMA_KEY = 'rotinaCerta:turma';

const WEEKDAYS = [
  { key: 'dom', label: 'Domingo', short: 'Dom' },
  { key: 'seg', label: 'Segunda-feira', short: 'Seg' },
  { key: 'ter', label: 'Terça-feira', short: 'Ter' },
  { key: 'qua', label: 'Quarta-feira', short: 'Qua' },
  { key: 'qui', label: 'Quinta-feira', short: 'Qui' },
  { key: 'sex', label: 'Sexta-feira', short: 'Sex' },
  { key: 'sab', label: 'Sábado', short: 'Sáb' },
];

const CATEGORIES = [
  { key: 'higiene', label: 'Higiene', color: '#7FA8C9' },
  { key: 'alimentacao', label: 'Alimentação', color: '#E0A458' },
  { key: 'estudo', label: 'Estudo', color: '#9C8AC7' },
  { key: 'lazer', label: 'Lazer', color: '#7BB08A' },
  { key: 'transicao', label: 'Transição', color: '#C98A7B' },
  { key: 'outro', label: 'Outro', color: '#9AA5A6' },
];

const ICONS = [
  '⏰', '🛏️', '🪥', '🚿', '🧼', '👕', '🍞', '🥣', '🍎', '🥪', '🍽️', '🎒',
  '📚', '✏️', '🎨', '🔬', '🗣️', '🔢', '🧩', '⚽', '🎵', '🧘', '😴', '🚌',
  '🔔', '🚪', '🏠', '🧴', '💧', '🖍️', '📖', '🎯', '🖥️', '🐾', '🧸', '🌳'
];

const AVATAR_COLORS = ['#33565A', '#7FA66B', '#C98A7B', '#9C8AC7', '#E0A458', '#4C7377'];

/* ---------------- preferências locais (por aparelho) ---------------- */

function defaultLocalPrefs() {
  return {
    activeMode: 'crianca',
    activeChildViewer: null,
    activeChildTeacher: null,
    activeWeekdayTeacher: getTodayKey(),
    settings: { sound: true, theme: 'claro' }
  };
}

function loadLocalPrefs() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.settings) return parsed;
    }
  } catch (e) { /* ignore corrupted storage */ }
  return defaultLocalPrefs();
}

function saveLocalPrefs() {
  try { localStorage.setItem(LOCAL_KEY, JSON.stringify(localPrefs)); } catch (e) { /* storage unavailable */ }
}

let localPrefs = loadLocalPrefs();
let turmaCode = (localStorage.getItem(TURMA_KEY) || '').trim();
let sharedData = { children: [], checks: {} };
let unsubscribeTurma = null;
let editingIcon = null; // { childId, weekday, itemId }
let saveSharedTimer = null;

/* ---------------- dados padrão de uma turma nova ---------------- */

function defaultSharedData() {
  return {
    children: [],
    checks: {}
  };
}

/* ---------------- conexão com a turma (Firestore) ---------------- */

function ensureLocalSelection() {
  if (!sharedData.children.find(c => c.id === localPrefs.activeChildViewer)) {
    localPrefs.activeChildViewer = sharedData.children[0] ? sharedData.children[0].id : null;
  }
  if (!sharedData.children.find(c => c.id === localPrefs.activeChildTeacher)) {
    localPrefs.activeChildTeacher = sharedData.children[0] ? sharedData.children[0].id : null;
  }
  saveLocalPrefs();
}

function connectToTurma(code) {
  turmaCode = code.trim().toUpperCase();
  localStorage.setItem(TURMA_KEY, turmaCode);
  if (unsubscribeTurma) unsubscribeTurma();

  const ref = doc(db, 'turmas', turmaCode);
  unsubscribeTurma = onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      sharedData = snap.data();
    } else {
      sharedData = defaultSharedData();
      setDoc(ref, sharedData).catch(err => console.error(err));
    }
    ensureLocalSelection();

    // evita perder o foco/cursor do professor enquanto ele digita
    const active = document.activeElement;
    const typing = active && active.matches('.item-row input[type="text"], .item-row input[type="time"]');
    if (!typing) renderApp();
    updateTurmaBadge();
  }, (err) => {
    console.error(err);
    showToast('Não foi possível conectar. Verifique sua internet.');
  });

  document.getElementById('turma-gate').classList.add('hidden');
  document.getElementById('app').classList.remove('hidden');
}

function leaveTurma() {
  if (!confirm('Sair desta turma neste aparelho? Você pode entrar de novo quando quiser com o código.')) return;
  if (unsubscribeTurma) unsubscribeTurma();
  turmaCode = '';
  localStorage.removeItem(TURMA_KEY);
  document.getElementById('app').classList.add('hidden');
  document.getElementById('turma-gate').classList.remove('hidden');
  const input = document.getElementById('turma-code-input');
  if (input) input.value = '';
}

function saveShared() {
  if (!turmaCode) return;
  setDoc(doc(db, 'turmas', turmaCode), sharedData).catch(err => {
    console.error(err);
    showToast('Erro ao salvar. Verifique sua internet.');
  });
}

function saveSharedDebounced() {
  clearTimeout(saveSharedTimer);
  saveSharedTimer = setTimeout(saveShared, 500);
}

function updateTurmaBadge() {
  const badge = document.getElementById('turma-badge');
  if (badge) badge.textContent = turmaCode ? `Turma: ${turmaCode}` : '';
}

/* ---------------- helpers ---------------- */

function uid(prefix) { return prefix + '_' + Math.random().toString(36).slice(2, 9); }

function mkItem(time, title, icon, category) {
  return { id: uid('item'), time, title, icon, category };
}

function getTodayKey(date = new Date()) {
  const map = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
  return map[date.getDay()];
}

function formatDateLocal(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getChild(id) { return sharedData.children.find(c => c.id === id); }

function categoryColor(key) {
  const c = CATEGORIES.find(c => c.key === key);
  return c ? c.color : '#9AA5A6';
}
function categoryLabel(key) {
  const c = CATEGORIES.find(c => c.key === key);
  return c ? c.label : 'Outro';
}

function getChecksFor(childId, dateKey) {
  return (sharedData.checks[childId] && sharedData.checks[childId][dateKey]) || {};
}

function toggleCheck(childId, dateKey, itemId) {
  if (!sharedData.checks[childId]) sharedData.checks[childId] = {};
  if (!sharedData.checks[childId][dateKey]) sharedData.checks[childId][dateKey] = {};
  const wasChecked = !!sharedData.checks[childId][dateKey][itemId];
  if (wasChecked) {
    delete sharedData.checks[childId][dateKey][itemId];
  } else {
    sharedData.checks[childId][dateKey][itemId] = true;
    if (localPrefs.settings.sound) playChime(false);
  }
  saveShared();
  return !wasChecked;
}

function initials(name) {
  return (name || '?').trim().slice(0, 1).toUpperCase();
}

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, s => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[s]));
}

/* ---------------- sound feedback ---------------- */

let audioCtx = null;
function playChime(celebratory) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = celebratory ? [523.25, 659.25, 783.99] : [659.25, 880];
    notes.forEach((freq, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = audioCtx.currentTime + i * 0.09;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.28);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch (e) { /* audio not available */ }
}

/* ---------------- toast ---------------- */

let toastTimer = null;
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 1800);
}

/* =========================================================
   CHILD VIEW
   ========================================================= */

function renderChildView() {
  const root = document.getElementById('view-root');

  if (sharedData.children.length === 0) {
    root.innerHTML = `
      <div class="empty-state">
        <span class="big-emoji">📋</span>
        <h2 style="font-family:var(--font-display); color:var(--teal-900); margin:0 0 6px;">Ainda não há nenhuma rotina</h2>
        <p>Peça para o seu professor cadastrar sua turma na aba "Sou o professor".</p>
      </div>`;
    return;
  }

  if (!getChild(localPrefs.activeChildViewer)) {
    localPrefs.activeChildViewer = sharedData.children[0].id;
  }
  const child = getChild(localPrefs.activeChildViewer);
  const todayKey = getTodayKey();
  const dateKey = formatDateLocal();
  const weekdayLabel = WEEKDAYS.find(w => w.key === todayKey).label;
  const items = child.routines[todayKey] || [];
  const checks = getChecksFor(child.id, dateKey);
  const doneCount = items.filter(i => checks[i.id]).length;
  const total = items.length;
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  const unchecked = items.filter(i => !checks[i.id]);
  const now = unchecked[0];
  const next = unchecked[1];

  const whoPicker = sharedData.children.length > 1 ? `
    <div class="who-picker">
      ${sharedData.children.map(c => `
        <button class="who-btn ${c.id === child.id ? 'is-active' : ''}" data-action="pick-viewer" data-child="${c.id}">
          <span class="avatar" style="width:30px;height:30px;font-size:0.8rem;background:${c.color}">${escapeHtml(initials(c.name))}</span>
          ${escapeHtml(c.name)}
        </button>`).join('')}
    </div>` : '';

  let bodyHtml = '';

  if (total === 0) {
    bodyHtml = `
      <div class="empty-state">
        <span class="big-emoji">🗓️</span>
        <h2 style="font-family:var(--font-display); color:var(--teal-900); margin:0 0 6px;">Sem atividades para hoje</h2>
        <p>Aproveite o dia! Se achar que isso é engano, avise o seu professor.</p>
      </div>`;
  } else {
    bodyHtml = `
      <div class="progress-card">
        <div class="progress-top">
          <span>Sua rotina de hoje</span>
          <span class="count">${doneCount} de ${total} feitas</span>
        </div>
        <div class="progress-track"><div class="progress-fill" style="width:${pct}%"></div></div>
      </div>

      <div class="now-next">
        <div class="nn-card now">
          ${now ? `
            <span class="nn-icon" style="background:#fff">${now.icon || '⭐'}</span>
            <div>
              <span class="nn-label">Agora</span>
              <div class="nn-title">${escapeHtml(now.title)}</div>
              ${now.time ? `<div class="nn-time">${escapeHtml(now.time)}</div>` : ''}
            </div>` : `<div class="nn-empty">Tudo feito por aqui! 🎉</div>`}
        </div>
        <div class="nn-card next">
          ${next ? `
            <span class="nn-icon">${next.icon || '⭐'}</span>
            <div>
              <span class="nn-label">A seguir</span>
              <div class="nn-title">${escapeHtml(next.title)}</div>
              ${next.time ? `<div class="nn-time">${escapeHtml(next.time)}</div>` : ''}
            </div>` : `<div class="nn-empty">Essa é a última atividade.</div>`}
        </div>
      </div>

      ${doneCount === total ? `
        <div class="celebration">
          <span class="big-emoji">🎉</span>
          <h2>Você concluiu toda a rotina de hoje!</h2>
          <p>Muito bem, ${escapeHtml(child.name)}!</p>
        </div>` : ''}

      <div>
        <div class="routine-list-head">Lista completa de ${weekdayLabel.toLowerCase()}</div>
        <div class="routine-list">
          ${items.map(item => {
      const done = !!checks[item.id];
      return `
            <div class="routine-item ${done ? 'done' : ''}" style="--cat-color:${categoryColor(item.category)}">
              <span class="r-icon">${item.icon || '⭐'}</span>
              <div class="r-body">
                <div class="r-title">${escapeHtml(item.title)}</div>
                ${item.time ? `<div class="r-time">${escapeHtml(item.time)}</div>` : ''}
              </div>
              <button class="check-btn ${done ? 'checked' : ''}"
                      aria-pressed="${done}"
                      aria-label="Marcar ${escapeHtml(item.title)} como ${done ? 'não feita' : 'feita'}"
                      data-action="toggle-check" data-item="${item.id}">
                ${done ? '✓' : ''}
              </button>
            </div>`;
    }).join('')}
        </div>
      </div>
    `;
  }

  root.innerHTML = `
    <div class="child-view">
      <div class="child-greeting-row">
        <div class="child-greeting">
          <h1>Oi, ${escapeHtml(child.name)}! 👋</h1>
          <p>Hoje é ${weekdayLabel.toLowerCase()}</p>
        </div>
        <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
          ${whoPicker}
          <button class="sound-toggle" data-on="${localPrefs.settings.sound}" data-action="toggle-sound">
            ${localPrefs.settings.sound ? '🔊 Som ligado' : '🔇 Som desligado'}
          </button>
        </div>
      </div>
      ${bodyHtml}
    </div>
  `;
}

/* =========================================================
   TEACHER VIEW
   ========================================================= */

function renderTeacherView() {
  const root = document.getElementById('view-root');

  const studentsHtml = sharedData.children.map(c => `
    <div class="student-row ${c.id === localPrefs.activeChildTeacher ? 'is-active' : ''}" data-action="pick-teacher-child" data-child="${c.id}">
      <span class="avatar" style="background:${c.color}">${escapeHtml(initials(c.name))}</span>
      <span class="name">${escapeHtml(c.name)}</span>
      <button class="del-student" title="Remover aluno" aria-label="Remover ${escapeHtml(c.name)}" data-action="delete-child" data-child="${c.id}">🗑️</button>
    </div>
  `).join('');

  root.innerHTML = `
    <div class="teacher-view">
      <aside class="students-panel">
        <h2>Alunos</h2>
        ${studentsHtml || `<p style="color:var(--ink-faint); font-size:0.85rem;">Nenhum aluno cadastrado ainda.</p>`}
        <button class="add-student-btn" data-action="add-child">+ Novo aluno</button>
      </aside>
      <section class="editor-panel" id="editor-panel"></section>
    </div>
  `;

  renderEditorPanel();
}

function renderEditorPanel() {
  const panel = document.getElementById('editor-panel');
  if (!panel) return;

  const child = getChild(localPrefs.activeChildTeacher);
  if (!child) {
    panel.innerHTML = `
      <div class="no-items-hint">
        <p>Selecione um aluno à esquerda ou cadastre um novo para montar a rotina.</p>
      </div>`;
    return;
  }

  const wd = localPrefs.activeWeekdayTeacher || getTodayKey();
  const copyOptions = WEEKDAYS.filter(w => w.key !== wd).map(w =>
    `<option value="${w.key}">${w.label}</option>`).join('');
  const todayKey = getTodayKey();
  const items = child.routines[wd] || [];

  const weekdayTabs = WEEKDAYS.map(w => `
    <button class="wd-btn ${w.key === wd ? 'is-active' : ''} ${w.key === todayKey ? 'is-today' : ''}"
            data-action="pick-weekday" data-weekday="${w.key}" title="${w.key === todayKey ? 'Hoje' : ''}">
      ${w.short}
    </button>`).join('');

  const rowsHtml = items.map((item, idx) => `
    <div class="item-row" data-item="${item.id}">
      <button class="icon-pick-btn" data-action="open-icon-picker" data-item="${item.id}" aria-label="Escolher ícone">${item.icon || '⭐'}</button>
      <input type="time" value="${escapeHtml(item.time || '')}" data-action="edit-time" data-item="${item.id}" aria-label="Horário">
      <input type="text" value="${escapeHtml(item.title)}" placeholder="Nome da atividade" data-action="edit-title" data-item="${item.id}" aria-label="Nome da atividade">
      <select data-action="edit-category" data-item="${item.id}" aria-label="Categoria">
        ${CATEGORIES.map(c => `<option value="${c.key}" ${c.key === item.category ? 'selected' : ''}>${c.label}</option>`).join('')}
      </select>
      <div class="row-actions">
        <button class="icon-mini-btn" data-action="move-up" data-item="${item.id}" aria-label="Mover para cima" ${idx === 0 ? 'disabled style="opacity:.3;cursor:default;"' : ''}>↑</button>
        <button class="icon-mini-btn" data-action="move-down" data-item="${item.id}" aria-label="Mover para baixo" ${idx === items.length - 1 ? 'disabled style="opacity:.3;cursor:default;"' : ''}>↓</button>
        <button class="icon-mini-btn danger" data-action="delete-item" data-item="${item.id}" aria-label="Excluir atividade">🗑️</button>
      </div>
    </div>
  `).join('');

  panel.innerHTML = `
    <div class="editor-head">
      <h2>${escapeHtml(child.name)} — rotina de ${WEEKDAYS.find(w => w.key === wd).label.toLowerCase()}</h2>
      <div class="editor-actions">
      <label class="btn subtle" style="cursor:pointer;">
      copiar de
      <select id="copy-from-select" style="border:none;background:transparent;font-weight:600;">
    <option value="">escolher dia…</option>
    ${copyOptions}
  </select>
</label>
<button class="btn" data-action="copy-day">Copiar</button>
        <button class="btn" data-action="clear-day">Limpar dia</button>
        <button class="btn primary" data-action="open-preview">👁️ Ver como a criança</button>
      </div>
    </div>

    <div class="weekday-tabs" role="tablist" aria-label="Dias da semana">${weekdayTabs}</div>

    ${items.length ? `
      <div class="item-row-head">
        <span>Ícone</span><span>Hora</span><span>Atividade</span><span>Categoria</span><span></span>
      </div>
      ${rowsHtml}
    ` : `
      <div class="no-items-hint">Nenhuma atividade para ${WEEKDAYS.find(w => w.key === wd).label.toLowerCase()} ainda. Adicione a primeira abaixo.</div>
    `}

    <button class="add-item-btn" data-action="add-item">+ Adicionar atividade</button>
  `;
}

/* ---------------- teacher actions ---------------- */

function addChild() {
  const name = prompt('Nome do aluno:');
  if (!name || !name.trim()) return;
  const color = AVATAR_COLORS[sharedData.children.length % AVATAR_COLORS.length];
  const emptyRoutines = {};
  WEEKDAYS.forEach(w => emptyRoutines[w.key] = []);
  const child = { id: uid('child'), name: name.trim(), color, routines: emptyRoutines };
  sharedData.children.push(child);
  localPrefs.activeChildTeacher = child.id;
  saveShared();
  saveLocalPrefs();
  renderTeacherView();
  showToast('Aluno adicionado');
}

function deleteChild(childId) {
  const child = getChild(childId);
  if (!child) return;
  if (!confirm(`Remover ${child.name} e toda a rotina dele(a)? Essa ação não pode ser desfeita.`)) return;
  sharedData.children = sharedData.children.filter(c => c.id !== childId);
  delete sharedData.checks[childId];
  if (localPrefs.activeChildTeacher === childId) {
    localPrefs.activeChildTeacher = sharedData.children[0] ? sharedData.children[0].id : null;
  }
  if (localPrefs.activeChildViewer === childId) {
    localPrefs.activeChildViewer = sharedData.children[0] ? sharedData.children[0].id : null;
  }
  saveShared();
  saveLocalPrefs();
  renderTeacherView();
  showToast('Aluno removido');
}

function addItem(childId, wd) {
  const child = getChild(childId);
  if (!child) return;
  const item = mkItem('', 'Nova atividade', '⭐', 'outro');
  child.routines[wd].push(item);
  saveShared();
  renderEditorPanel();
  const input = document.querySelector(`.item-row[data-item="${item.id}"] input[data-action="edit-title"]`);
  if (input) { input.focus(); input.select(); }
}

function deleteItem(childId, wd, itemId) {
  const child = getChild(childId);
  child.routines[wd] = child.routines[wd].filter(i => i.id !== itemId);
  saveShared();
  renderEditorPanel();
}

function moveItem(childId, wd, itemId, dir) {
  const child = getChild(childId);
  const arr = child.routines[wd];
  const idx = arr.findIndex(i => i.id === itemId);
  const newIdx = idx + dir;
  if (newIdx < 0 || newIdx >= arr.length) return;
  [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
  saveShared();
  renderEditorPanel();
}

function copyDay(childId, fromWd, toWd){
  const child = getChild(childId);
  if (!fromWd || fromWd === toWd) return;
  const source = child.routines[fromWd] || [];
  child.routines[toWd] = source.map(i => ({ ...i, id: uid('item') }));
  saveShared();
  renderEditorPanel();
  showToast('Rotina copiada');
}

function clearDay(childId, wd) {
  const child = getChild(childId);
  if (!child.routines[wd].length) return;
  if (!confirm('Limpar todas as atividades deste dia?')) return;
  child.routines[wd] = [];
  saveShared();
  renderEditorPanel();
}

/* ---------------- icon picker modal ---------------- */

function buildIconGrid() {
  const grid = document.getElementById('icon-grid');
  grid.innerHTML = ICONS.map(ic => `<button type="button" data-icon="${ic}">${ic}</button>`).join('');
}

function openIconPicker(itemId) {
  editingIcon = { childId: localPrefs.activeChildTeacher, weekday: localPrefs.activeWeekdayTeacher, itemId };
  document.getElementById('icon-picker-modal').classList.remove('hidden');
}
function closeIconPicker() {
  editingIcon = null;
  document.getElementById('icon-picker-modal').classList.add('hidden');
}

/* ---------------- preview modal ---------------- */

function openPreview() {
  const child = getChild(localPrefs.activeChildTeacher);
  if (!child) return;
  const wd = localPrefs.activeWeekdayTeacher;
  const items = child.routines[wd] || [];
  document.getElementById('preview-title-day').textContent = `— ${WEEKDAYS.find(w => w.key === wd).label}`;
  const body = document.getElementById('preview-body');
  if (!items.length) {
    body.innerHTML = `<div class="empty-state"><span class="big-emoji">🗓️</span><p>Nenhuma atividade cadastrada para este dia.</p></div>`;
  } else {
    body.innerHTML = `
      <div class="routine-list">
        ${items.map(item => `
          <div class="routine-item" style="--cat-color:${categoryColor(item.category)}">
            <span class="r-icon">${item.icon || '⭐'}</span>
            <div class="r-body">
              <div class="r-title">${escapeHtml(item.title)}</div>
              ${item.time ? `<div class="r-time">${escapeHtml(item.time)}</div>` : ''}
            </div>
            <button class="check-btn" disabled aria-hidden="true"></button>
          </div>
        `).join('')}
      </div>`;
  }
  document.getElementById('preview-modal').classList.remove('hidden');
}
function closePreview() {
  document.getElementById('preview-modal').classList.add('hidden');
}

/* =========================================================
   TEMA
   ========================================================= */

function applyTheme() {
  document.documentElement.setAttribute('data-theme', localPrefs.settings.theme === 'escuro' ? 'escuro' : 'claro');
}

function toggleTheme() {
  localPrefs.settings.theme = localPrefs.settings.theme === 'escuro' ? 'claro' : 'escuro';
  saveLocalPrefs();
  applyTheme();
  renderApp();
}

/* =========================================================
   APP SHELL / RENDER DISPATCH
   ========================================================= */

function renderApp() {
  applyTheme();

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    const isDark = localPrefs.settings.theme === 'escuro';
    themeBtn.textContent = isDark ? '☀️ Tema claro' : '🌙 Tema escuro';
    themeBtn.setAttribute('aria-pressed', String(isDark));
  }

  document.getElementById('tab-crianca').classList.toggle('is-active', localPrefs.activeMode === 'crianca');
  document.getElementById('tab-crianca').setAttribute('aria-selected', localPrefs.activeMode === 'crianca');
  document.getElementById('tab-professor').classList.toggle('is-active', localPrefs.activeMode === 'professor');
  document.getElementById('tab-professor').setAttribute('aria-selected', localPrefs.activeMode === 'professor');

  if (localPrefs.activeMode === 'crianca') renderChildView();
  else renderTeacherView();
}

const PROFESSOR_PASSWORD = '789';
let professorUnlocked = false;

function openProfessorPasswordModal() {
  const input = document.getElementById('professor-password-input');
  input.value = '';
  document.getElementById('professor-password-modal').classList.remove('hidden');
  setTimeout(() => input.focus(), 50);
}
function closeProfessorPasswordModal() {
  document.getElementById('professor-password-modal').classList.add('hidden');
}
function submitProfessorPassword() {
  const input = document.getElementById('professor-password-input');
  if (input.value === PROFESSOR_PASSWORD) {
    professorUnlocked = true;
    closeProfessorPasswordModal();
    setMode('professor');
  } else {
    showToast('Senha incorreta');
    input.value = '';
    input.focus();
  }
}

function setMode(mode) {
  localPrefs.activeMode = mode;
  saveLocalPrefs();
  renderApp();
}

/* ---------------- portão de entrada da turma ---------------- */

function initTurmaGate() {
  const gate = document.getElementById('turma-gate');
  const input = document.getElementById('turma-code-input');
  const joinBtn = document.getElementById('turma-join-btn');

  joinBtn.addEventListener('click', () => {
    const code = input.value.trim();
    if (!code) { input.focus(); return; }
    connectToTurma(code);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') joinBtn.click();
  });

  if (turmaCode) {
    gate.classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    connectToTurma(turmaCode);
  } else {
    gate.classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
  }
}

/* ---------------- global event delegation ---------------- */

document.addEventListener('click', (e) => {

  const modeBtn = e.target.closest('[data-mode]');
  if (modeBtn) {
    if (modeBtn.dataset.mode === 'professor' && !professorUnlocked) {
      openProfessorPasswordModal();
    } else {
      setMode(modeBtn.dataset.mode);
    }
    return;
  }

  if (e.target.closest('#professor-password-submit')) { submitProfessorPassword(); return; }
  if (e.target.closest('[data-action="close-professor-password"]')) { closeProfessorPasswordModal(); return; }

  if (e.target.closest('#theme-toggle')) { toggleTheme(); return; }
  if (e.target.closest('#turma-leave-btn')) { leaveTurma(); return; }

  const actionEl = e.target.closest('[data-action]');
  if (actionEl) {
    const action = actionEl.dataset.action;

    switch (action) {
      case 'pick-viewer':
        localPrefs.activeChildViewer = actionEl.dataset.child;
        saveLocalPrefs(); renderChildView(); return;

      case 'toggle-sound':
        localPrefs.settings.sound = !localPrefs.settings.sound;
        saveLocalPrefs(); renderChildView(); return;

      case 'toggle-check': {
        const child = getChild(localPrefs.activeChildViewer);
        const dateKey = formatDateLocal();
        const items = child.routines[getTodayKey()] || [];
        const total = items.length;
        const nowChecked = toggleCheck(child.id, dateKey, actionEl.dataset.item);
        renderChildView();
        if (nowChecked) {
          const checks = getChecksFor(child.id, dateKey);
          const doneCount = items.filter(i => checks[i.id]).length;
          if (doneCount === total && total > 0 && localPrefs.settings.sound) playChime(true);
        }
        return;
      }

      case 'pick-teacher-child':
        localPrefs.activeChildTeacher = actionEl.dataset.child;
        saveLocalPrefs(); renderTeacherView(); return;

      case 'delete-child':
        deleteChild(actionEl.dataset.child); return;

      case 'add-child':
        addChild(); return;

      case 'pick-weekday':
        localPrefs.activeWeekdayTeacher = actionEl.dataset.weekday;
        saveLocalPrefs(); renderEditorPanel(); return;

      case 'add-item':
        addItem(localPrefs.activeChildTeacher, localPrefs.activeWeekdayTeacher); return;

      case 'delete-item':
        deleteItem(localPrefs.activeChildTeacher, localPrefs.activeWeekdayTeacher, actionEl.dataset.item); return;

      case 'move-up':
        moveItem(localPrefs.activeChildTeacher, localPrefs.activeWeekdayTeacher, actionEl.dataset.item, -1); return;

      case 'move-down':
        moveItem(localPrefs.activeChildTeacher, localPrefs.activeWeekdayTeacher, actionEl.dataset.item, 1); return;

      case 'clear-day':
        clearDay(localPrefs.activeChildTeacher, localPrefs.activeWeekdayTeacher); return;

      case 'open-icon-picker':
        buildIconGrid();
        openIconPicker(actionEl.dataset.item); return;

      case 'close-icon-picker':
        closeIconPicker(); return;

      case 'open-preview':
        openPreview(); return;

      case 'close-preview':
        closePreview(); return;
    }
  }

  // icon grid selection
  const iconChoice = e.target.closest('#icon-grid button');
  if (iconChoice && editingIcon) {
    const child = getChild(editingIcon.childId);
    const item = child.routines[editingIcon.weekday].find(i => i.id === editingIcon.itemId);
    if (item) item.icon = iconChoice.dataset.icon;
    saveShared();
    closeIconPicker();
    renderEditorPanel();
    return;
  }

  // close modais ao clicar no fundo
  if (e.target.id === 'icon-picker-modal') closeIconPicker();
  if (e.target.id === 'preview-modal') closePreview();
  if (e.target.id === 'professor-password-modal') closeProfessorPasswordModal();
});

document.addEventListener('input', (e) => {
  const action = e.target.dataset.action;
  if (!action) return;
  const child = getChild(localPrefs.activeChildTeacher);
  if (!child) return;
  const wd = localPrefs.activeWeekdayTeacher;
  const item = (child.routines[wd] || []).find(i => i.id === e.target.dataset.item);
  if (!item) return;

  if (action === 'edit-title') item.title = e.target.value;
  if (action === 'edit-time') item.time = e.target.value;
  saveSharedDebounced();
});

document.addEventListener('change', (e) => {
  const action = e.target.dataset.action;
  if (action === 'edit-category') {
    const child = getChild(localPrefs.activeChildTeacher);
    const item = child.routines[localPrefs.activeWeekdayTeacher].find(i => i.id === e.target.dataset.item);
    if (item) { item.category = e.target.value; saveShared(); renderEditorPanel(); }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.target.id === 'professor-password-input' && e.key === 'Enter') {
    submitProfessorPassword();
    return;
  }
  if (e.key === 'Escape') {
    closeIconPicker();
    closePreview();
    closeProfessorPasswordModal();
  }
});

/* ---------------- init ---------------- */
initTurmaGate();