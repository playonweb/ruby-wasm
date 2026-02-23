// js/app.js
const { DefaultRubyVM } = window["ruby-wasm-wasi"];
const bar = document.getElementById('splash-bar');
const msg = document.getElementById('splash-msg');
const splash = document.getElementById('splash');
const errEl = document.getElementById('splash-err');
const app = document.getElementById('app');

async function boot() {
    try {
        bar.style.width = '20%';
        msg.textContent = 'Fetching ruby+stdlib.wasm (~25 MB, cached after first load)…';

        const res = await fetch("https://cdn.jsdelivr.net/npm/@ruby/4.0-wasm-wasi@2.8.1/dist/ruby+stdlib.wasm");
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching wasm`);

        bar.style.width = '50%';
        msg.textContent = 'Compiling WebAssembly…';

        const mod = await WebAssembly.compileStreaming(res);
        bar.style.width = '70%';
        msg.textContent = 'Booting Ruby VM…';

        const { vm } = await DefaultRubyVM(mod);
        window.rubyVM = vm;

        bar.style.width = '85%';
        msg.textContent = 'Loading Ruby Application Logic…';

        // Fetch our external Ruby logic
        const rbRes = await fetch("ruby/todo.rb");
        if (!rbRes.ok) throw new Error(`HTTP ${rbRes.status} fetching ruby/todo.rb`);
        const rbCode = await rbRes.text();

        vm.eval(rbCode);

        bar.style.width = '100%';
        msg.textContent = 'Ready!';

        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.remove();
                app.style.display = '';
                renderAll();
            }, 500);
        }, 500);

    } catch (e) {
        console.error(e);
        errEl.style.display = 'block';
        errEl.textContent = 'Error: ' + e.message;
        msg.textContent = 'Failed to load Ruby WASM';
        bar.style.background = '#ef4444';
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const rb = code => window.rubyVM.eval(code);
const rbStr = code => String(rb(code));
const rbJSON = code => JSON.parse(rbStr(`(${code}).to_json`));
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ── State ─────────────────────────────────────────────────────────────────────
let curFilter = 'all';
let curSearch = '';

// ── Render ────────────────────────────────────────────────────────────────────
function renderAll() {
    renderList();
    renderAnalytics();
    renderBadge();
}

function renderList() {
    const q = curSearch.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const items = rbJSON(`$store.sorted_filtered('${curFilter}', query: '${q}')`);
    const list = document.getElementById('todo-list');
    const empty = document.getElementById('empty');
    list.innerHTML = '';

    if (!items.length) {
        empty.style.display = '';
        return;
    }
    empty.style.display = 'none';

    const today = new Date(new Date().toDateString());
    items.forEach(t => {
        const priClass = { high: 'pri-high', medium: 'pri-medium', low: 'pri-low' }[t.priority] || '';
        const dueD = t.due_date ? new Date(t.due_date + 'T00:00:00') : null;
        const overdue = !t.done && dueD && dueD < today;
        const soon = !t.done && dueD && !overdue && (dueD - today) < 3 * 86400000;

        const tagsHtml = t.tags.map(g => `<span class="tag">${esc(g)}</span>`).join('');

        const dueHtml = dueD
            ? `<span style="color:${overdue ? 'var(--pri-high)' : soon ? 'var(--pri-med)' : 'var(--text-secondary)'}">
                ${overdue ? '⚠️' : soon ? '⏰' : '📅'} ${t.due_date}
               </span>`
            : '';

        const el = document.createElement('div');
        el.className = `todo-item glass ${priClass} ${t.done ? 'done' : ''}`;

        // Use phosphors for icons
        el.innerHTML = `
            <button class="todo-checkbox" onclick="toggleTodo(${t.id})">
                <i class="ph-bold ph-check"></i>
            </button>
            <div class="todo-content">
                <div class="todo-header">
                    <span class="todo-title">${esc(t.title)}</span>
                    <div class="todo-meta">
                        <span class="badge-pri ${t.priority}">${t.priority}</span>
                        ${dueHtml}
                    </div>
                </div>
                ${tagsHtml ? `<div class="todo-tags">${tagsHtml}</div>` : ''}
            </div>
            <button class="btn-delete" onclick="removeTodo(${t.id})">
                <i class="ph ph-trash"></i>
            </button>
        `;
        list.appendChild(el);
    });
}

function renderAnalytics() {
    const a = rbJSON(`$store.analytics`);
    const pct = a.pct_complete;

    let tagRows = '';
    if (a.top_tags) {
        tagRows = Object.entries(a.top_tags).map(([t, c]) => `
            <div class="tag-row">
                <span class="tag-name">#${esc(t)}</span>
                <span class="tag-count">${c}</span>
            </div>
        `).join('');
    }

    document.getElementById('analytics').innerHTML = `
        <div class="progress-header">
            <span>Progress</span>
            <span>${pct}%</span>
        </div>
        <div class="progress-track mb-sm">
            <div class="progress-fill" style="width: ${pct}%"></div>
        </div>
        
        <div class="stats-grid mb-sm">
            <div class="stat-box">
                <div class="stat-val total">${a.total}</div>
                <div class="stat-label">Total</div>
            </div>
            <div class="stat-box">
                <div class="stat-val done">${a.done}</div>
                <div class="stat-label">Done</div>
            </div>
            <div class="stat-box">
                <div class="stat-val active">${a.active}</div>
                <div class="stat-label">Active</div>
            </div>
        </div>

        <div class="pri-stats mb-sm">
            <div class="pri-stat-item">
                <span class="dot high"></span> ${a.by_priority?.high || 0} high
            </div>
            <div class="pri-stat-item">
                <span class="dot med"></span> ${a.by_priority?.medium || 0} med
            </div>
            <div class="pri-stat-item">
                <span class="dot low"></span> ${a.by_priority?.low || 0} low
            </div>
        </div>

        <div class="alerts-container">
            ${a.overdue ? `<div class="alert overdue"><i class="ph-fill ph-warning-circle"></i> ${a.overdue} overdue</div>` : ''}
            ${a.due_soon ? `<div class="alert soon"><i class="ph-fill ph-clock"></i> ${a.due_soon} due soon</div>` : ''}
        </div>

        ${tagRows ? `
            <div class="tags-analytics">
                <div class="tags-title">Top Tags</div>
                ${tagRows}
            </div>
        ` : ''}
    `;
}

function renderBadge() {
    const a = rbJSON(`$store.analytics`);
    document.getElementById('badge').textContent = `${a.done}/${a.total} done · ${a.pct_complete}%`;
}

// ── Event Listeners ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Add button
    document.getElementById('add-btn').addEventListener('click', handleAddTodo);
    document.getElementById('ni').addEventListener('keydown', e => {
        if (e.key === 'Enter') handleAddTodo();
    });

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const f = e.target.dataset.filter;
            curFilter = f;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            renderList();
        });
    });

    // Search
    document.getElementById('search').addEventListener('input', (e) => {
        curSearch = e.target.value;
        renderList();
    });

    // REPL
    document.getElementById('repl-run-btn').addEventListener('click', runRepl);
    document.getElementById('repl-in').addEventListener('keydown', e => {
        if (e.key === 'Enter') runRepl();
    });

    // REPL Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const code = e.target.dataset.code;
            const input = document.getElementById('repl-in');
            input.value = code;
            input.focus();
        });
    });

    // Boot
    boot();
});

// ── Actions ───────────────────────────────────────────────────────────────────
function handleAddTodo() {
    const titleInp = document.getElementById('ni');
    const title = titleInp.value.trim();
    if (!title) return;

    const pri = document.getElementById('np').value;
    const tags = document.getElementById('nt').value;
    const due = document.getElementById('nd').value;

    const sT = title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    const sG = tags.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

    try {
        rb(`$store.add(title:'${sT}',priority:'${pri}',tags:'${sG}'.split(',').map(&:strip)${due ? `,due_date:'${due}'` : ''})`);

        titleInp.value = '';
        document.getElementById('nt').value = '';
        document.getElementById('nd').value = '';
        renderAll();
    } catch (e) {
        console.error("Failed to add logic:", e);
    }
}

// Attach globally so inline onclick can use them
window.toggleTodo = id => { rb(`$store.toggle(${id})`); renderAll(); };
window.removeTodo = id => { rb(`$store.remove(${id})`); renderAll(); };

// ── REPL ──────────────────────────────────────────────────────────────────────
function runRepl() {
    const inp = document.getElementById('repl-in');
    const out = document.getElementById('repl-out');
    const code = inp.value.trim();
    if (!code) return;

    const addLine = (text, color) => {
        const d = document.createElement('div');
        d.className = 'repl-line';
        d.style.cssText = `color:${color};white-space:pre-wrap;word-break:break-all`;
        d.textContent = text;
        out.appendChild(d);
        out.scrollTop = out.scrollHeight;
    };

    addLine('> ' + code, '#818cf8'); // prompt color
    try {
        const result = rbStr(code);
        addLine('=> ' + result, '#4ade80'); // success color
        renderAll(); // code might have mutated state
    } catch (e) {
        addLine('!! ' + e.message, '#ef4444'); // error color
    }
    inp.value = '';
}
