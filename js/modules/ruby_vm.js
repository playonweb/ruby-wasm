// js/modules/ruby_vm.js
const { DefaultRubyVM } = window["ruby-wasm-wasi"];

class RubyManager {
    constructor() {
        this.vm = null;
    }

    async init(onProgress) {
        onProgress(20, 'Fetching ruby+stdlib.wasm (~25 MB)…');
        const res = await fetch("https://cdn.jsdelivr.net/npm/@ruby/4.0-wasm-wasi@2.8.1/dist/ruby+stdlib.wasm");
        if (!res.ok) throw new Error(`HTTP ${res.status} fetching wasm`);

        onProgress(50, 'Compiling WebAssembly…');
        const mod = await WebAssembly.compileStreaming(res);

        onProgress(70, 'Booting Ruby VM…');
        const { vm } = await DefaultRubyVM(mod);
        this.vm = vm;
        window.rubyVM = vm; // For legacy global access if needed

        return vm;
    }

    async loadFiles(files, onProgress) {
        let count = 0;
        for (const file of files) {
            count++;
            const progress = 70 + (Math.floor((count / files.length) * 30));
            onProgress(progress, `Loading ${file}…`);

            const res = await fetch(file);
            if (!res.ok) throw new Error(`HTTP ${res.status} fetching ${file}`);
            const code = await res.text();
            this.vm.eval(code);
        }
    }

    eval(code) {
        return this.vm.eval(code);
    }

    evalStr(code) {
        return String(this.eval(code));
    }

    evalJSON(code) {
        return JSON.parse(this.evalStr(`(${code}).to_json`));
    }
}

export const rubyManager = new RubyManager();
