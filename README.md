# 💎 Ruby WASM Todo Showcase

A "Future Scalable" Todo application showcasing the power of **Ruby 4.0** running directly in the browser via **WebAssembly (WASM)** and **WASI**.

![Ruby WASM](https://img.shields.io/badge/Ruby-4.0--WASM-red?style=for-the-badge&logo=ruby)
![WebAssembly](https://img.shields.io/badge/WebAssembly-WASI-blueviolet?style=for-the-badge&logo=webassembly)
![Architecture](https://img.shields.io/badge/Architecture-Modular-blue?style=for-the-badge)

## ✨ Key Features
- **Sexy Premium Design**: Dark mode with Glassmorphism and smooth micro-animations.
- **Modular Arch**: Separation of concerns between JSON-driven UI (JS) and full business logic (Ruby).
- **Embedded Gems**: Bundled Ruby gems like `faker` and `rouge` running entirely client-side.
- **Ruby REPL**: Interactive Ruby terminal in your browser with syntax highlighting.
- **Full Stdlib**: Support for `Date`, `JSON`, `Time`, and more.

## 🚀 Quick Start
```bash
# Serve the project (MIME types for WASM are required)
python3 -m http.server 8000
```
Then visit [http://localhost:8000](http://localhost:8000).

## 📂 Project Structure
- `/ruby`: Contains the core models and logic.
- `/js`: The bridge modules and UI rendering.
- `/css`: Polished Vanilla CSS styling.
- `/wasm-build`: Custom Wasm build artifacts.
- `/docs`: Full technical documentation (built with Docsify).

## 📖 Documentation
For a deep dive into the architecture and gem packaging process, check out our [Documentation](http://localhost:8000/docs/index.html#/README).

## 💡 Showcase
This project proves that you can run production-grade Ruby logic in a web browser, making it possible to share 100% of your business rules between frontend and backend.
