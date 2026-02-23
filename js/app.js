// js/app.js
import { rubyManager } from './modules/ruby_vm.js';
import { TodoUI } from './modules/todo_ui.js';

const ui = new TodoUI();

async function init() {
    const bar = document.getElementById('splash-bar');
    const msg = document.getElementById('splash-msg');
    const splash = document.getElementById('splash');
    const app = document.getElementById('app');
    const error = document.getElementById('splash-err');

    const updateProgress = (pct, text) => {
        bar.style.width = `${pct}%`;
        msg.textContent = text;
    };

    try {
        await rubyManager.init(updateProgress);

        // Scalable architecture: Load classes and initialization separately
        await rubyManager.loadFiles([
            'ruby/models/todo.rb',
            'ruby/stores/todo_store.rb',
            'ruby/init.rb'
        ], updateProgress);

        updateProgress(100, 'Ready!');

        setTimeout(() => {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.remove();
                app.style.display = 'block';
                ui.renderAll();
                setupEventListeners();
            }, 500);
        }, 500);

    } catch (e) {
        console.error("Initialization error:", e);
        error.style.display = 'block';
        error.textContent = `Critical Error: ${e.message}`;
        msg.textContent = 'Bootstrap failed.';
        bar.style.background = '#ef4444';
    }
}

function setupEventListeners() {
    // Task creation
    document.getElementById('add-btn').onclick = () => ui.handleAdd();
    document.getElementById('fake-btn').onclick = () => ui.handleFakeData();
    document.getElementById('ni').onkeydown = (e) => {
        if (e.key === 'Enter') ui.handleAdd();
    };

    // Filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.onclick = (e) => {
            ui.curFilter = e.target.dataset.filter;
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            ui.renderList();
        };
    });

    // Search
    document.getElementById('search').oninput = (e) => {
        ui.curSearch = e.target.value;
        ui.renderList();
    };

    // REPL
    document.getElementById('repl-run-btn').onclick = () => ui.handleRepl();
    document.getElementById('repl-in').onkeydown = (e) => {
        if (e.key === 'Enter') ui.handleRepl();
    };

    // REPL Presets
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.onclick = (e) => {
            document.getElementById('repl-in').value = e.target.dataset.code;
            document.getElementById('repl-in').focus();
        };
    });
}

// Global hook for debugging if needed
window.todoUI = ui;

document.addEventListener('DOMContentLoaded', init);
