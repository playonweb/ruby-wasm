# Architecture

The project follows a "Future Scalable" architecture, separating concerns by language and responsibility.

## 🏗️ Folder Structure

```text
.
├── css/
│   └── style.css          # Premium Vanilla CSS (Dark Mode + Glassmorphism)
├── doc/                   # Documentation (Docsify)
├── js/
│   ├── app.js             # Main entry point and coordinator
│   └── modules/
│       ├── ruby_vm.js     # Ruby WASM initialization/management
│       └── todo_ui.js     # UI Rendering and Event Handling
├── ruby/
│   ├── models/            # Ruby Data Classes
│   │   └── todo.rb
│   ├── stores/            # Ruby Business Logic/Collections
│   │   └── todo_store.rb
│   └── init.rb            # App bootstrapping and seed data
└── wasm-build/            # Build artifacts
    └── ruby-custom.wasm   # Custom binary with packed Gems
```

## 🔄 Data Flow

1.  **Boot**: `app.js` initializes `ruby_vm.js`.
2.  **Load**: `ruby_vm.js` fetches `ruby-custom.wasm`, compiles it, and evaluates the Ruby source files.
3.  **Action**: User interacts with the UI (e.g., clicks "Add Task").
4.  **Bridge**: JavaScript calls a Ruby method through the `rubyVM` bridge.
5.  **Logic**: Ruby updates the internal state (`TodoStore`).
6.  **Render**: JavaScript requests the updated state as JSON and re-renders the DOM.

## 💎 Why Ruby WASM?

By moving the business logic to Ruby:
- We use Ruby's superior **Enumerable** and **Collection** methods in the browser.
- We keep the UI layer (JS) purely for "dumb" rendering.
- We can run complex tasks (like syntax highlighting with Rouge) without needing a server.
