// js/modules/todo_ui.js
import { rubyManager } from './ruby_vm.js';

export class TodoUI {
    constructor() {
        this.curFilter = 'all';
        this.curSearch = '';
        this.elements = {
            list: document.getElementById('todo-list'),
            empty: document.getElementById('empty'),
            analytics: document.getElementById('analytics'),
            badge: document.getElementById('badge'),
            replOut: document.getElementById('repl-out'),
            replIn: document.getElementById('repl-in'),
            taskTitle: document.getElementById('ni'),
            taskTags: document.getElementById('nt'),
            taskDue: document.getElementById('nd'),
            taskPriority: document.getElementById('np'),
            search: document.getElementById('search')
        };
    }

    esc(s) {
        return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    renderAll() {
        this.renderList();
        this.renderAnalytics();
        this.renderBadge();
    }

    renderList() {
        const q = this.curSearch.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const items = rubyManager.evalJSON(`$store.sorted_filtered('${this.curFilter}', query: '${q}')`);

        this.elements.list.innerHTML = '';

        if (!items.length) {
            this.elements.empty.style.display = '';
            return;
        }
        this.elements.empty.style.display = 'none';

        const today = new Date(new Date().toDateString());
        items.forEach(t => {
            const priClass = { high: 'pri-high', medium: 'pri-medium', low: 'pri-low' }[t.priority] || '';
            const dueD = t.due_date ? new Date(t.due_date + 'T00:00:00') : null;
            const overdue = !t.done && dueD && dueD < today;
            const soon = !t.done && dueD && !overdue && (dueD - today) < 3 * 86400000;

            const tagsHtml = t.tags.map(g => `<span class="tag">${this.esc(g)}</span>`).join('');

            const dueHtml = dueD
                ? `<span style="color:${overdue ? 'var(--pri-high)' : soon ? 'var(--pri-med)' : 'var(--text-secondary)'}">
                    ${overdue ? '⚠️' : soon ? '⏰' : '📅'} ${t.due_date}
                   </span>`
                : '';

            const el = document.createElement('div');
            el.className = `todo-item glass ${priClass} ${t.done ? 'done' : ''}`;

            el.innerHTML = `
                <button class="todo-checkbox" data-id="${t.id}">
                    <i class="ph-bold ph-check"></i>
                </button>
                <div class="todo-content">
                    <div class="todo-header">
                        <span class="todo-title">${this.esc(t.title)}</span>
                        <div class="todo-meta">
                            <span class="badge-pri ${t.priority}">${t.priority}</span>
                            ${dueHtml}
                        </div>
                    </div>
                    ${tagsHtml ? `<div class="todo-tags">${tagsHtml}</div>` : ''}
                </div>
                <button class="btn-delete" data-id="${t.id}">
                    <i class="ph ph-trash"></i>
                </button>
            `;

            // Bind events
            el.querySelector('.todo-checkbox').onclick = () => this.handleToggle(t.id);
            el.querySelector('.btn-delete').onclick = () => this.handleRemove(t.id);

            this.elements.list.appendChild(el);
        });
    }

    renderAnalytics() {
        const a = rubyManager.evalJSON(`$store.analytics`);
        const pct = a.pct_complete;

        let tagRows = '';
        if (a.top_tags) {
            tagRows = Object.entries(a.top_tags).map(([t, c]) => `
                <div class="tag-row">
                    <span class="tag-name">#${this.esc(t)}</span>
                    <span class="tag-count">${c}</span>
                </div>
            `).join('');
        }

        this.elements.analytics.innerHTML = `
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

    renderBadge() {
        const a = rubyManager.evalJSON(`$store.analytics`);
        this.elements.badge.textContent = `${a.done}/${a.total} done · ${a.pct_complete}%`;
    }

    // Handlers
    handleToggle(id) {
        rubyManager.eval(`$store.toggle(${id})`);
        this.renderAll();
    }

    handleRemove(id) {
        rubyManager.eval(`$store.remove(${id})`);
        this.renderAll();
    }

    handleAdd() {
        const title = this.elements.taskTitle.value.trim();
        if (!title) return;

        const pri = this.elements.taskPriority.value;
        const tags = this.elements.taskTags.value;
        const due = this.elements.taskDue.value;

        const sT = title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
        const sG = tags.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

        try {
            rubyManager.eval(`$store.add(title:'${sT}',priority:'${pri}',tags:'${sG}'.split(',').map(&:strip)${due ? `,due_date:'${due}'` : ''})`);
            this.elements.taskTitle.value = '';
            this.elements.taskTags.value = '';
            this.elements.taskDue.value = '';
            this.renderAll();
        } catch (e) {
            console.error("Failed to add task:", e);
        }
    }

    handleRepl() {
        const code = this.elements.replIn.value.trim();
        if (!code) return;

        const addLine = (text, color) => {
            const d = document.createElement('div');
            d.className = 'repl-line';
            d.style.cssText = `color:${color};white-space:pre-wrap;word-break:break-all`;
            d.textContent = text;
            this.elements.replOut.appendChild(d);
            this.elements.replOut.scrollTop = this.elements.replOut.scrollHeight;
        };

        addLine('> ' + code, '#818cf8');
        try {
            const result = rubyManager.evalStr(code);
            addLine('=> ' + result, '#4ade80');
            this.renderAll();
        } catch (e) {
            addLine('!! ' + e.message, '#ef4444');
        }
        this.elements.replIn.value = '';
    }
}
