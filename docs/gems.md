# Gem Integration

One of the most powerful features of this project is the ability to use standard Ruby gems directly in the browser.

## 📦 How it Works

Standard `ruby.wasm` modules don't include external gems for size reasons. We use `rbwasm pack` to create a custom binary.

### 1. Local Gem Installation
We install the gems into a local directory that will act as a virtual file system (VFS):
```bash
gem install faker rouge -i ./vfs/gems
```

### 2. Packing the WASM
We take the base Ruby WASM module and "pack" our gems directory into it at a specific mount point (e.g., `/gems`):
```bash
rbwasm pack ruby-base.wasm --dir ./vfs/gems::/gems -o ruby-custom.wasm
```

### 3. Setting the Path
In JavaScript, when we initialize the Ruby VM, we set the `GEM_PATH` environment variable so Ruby knows where to look for the gems:
```javascript
const { vm } = await DefaultRubyVM(mod, {
    env: {
        "GEM_PATH": "/gems"
    }
});
```

## 🛠️ Gems Used in this Project

### 🤡 Faker
Used to generate "smart" dummy data for tasks.
- **Usage**: `Faker::Hacker.say_something_smart` for titles.
- **Button**: The magic wand icon in the UI triggers this.

### 🎨 Rouge
A pure-ruby syntax highlighter.
- **Usage**: Used to format the REPL output.
- **Showcase**: When you run code in the Ruby REPL, the result is highlighted using the `monokai_sublime` theme by Rouge before being shown in the terminal.
