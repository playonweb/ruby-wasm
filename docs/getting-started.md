# Getting Started

Follow these steps to set up and run the Ruby WASM Todo app on your local machine.

## Prerequisites
- **Ruby 3.2+** (for building the custom WASM)
- **Python 3** (for serving the app)

## 1. Setup Environment
Install the `ruby_wasm` gem to get access to the CLI tools:
```bash
gem install ruby_wasm
```

## 2. Build the Custom WASM
If you want to package your own gems:
1. Create a build directory: `mkdir wasm-build`.
2. Download base WASM: `curl -L -o ruby-base.wasm https://cdn.jsdelivr.net/npm/@ruby/4.0-wasm-wasi@latest/dist/ruby+stdlib.wasm`.
3. Install gems locally: `gem install faker rouge -i ./vfs/gems`.
4. Pack them: `rbwasm pack ruby-base.wasm --dir ./vfs/gems::/gems -o ruby-custom.wasm`.

## 3. Run the Server
Since WASM files are large and require specific MIME types, you should use a proper web server. Python's built-in server works great:
```bash
python3 -m http.server 8000
```

## 4. Explore
Navigate to [http://localhost:8000](http://localhost:8000) to see the app, or [http://localhost:8000/docs/index.html](http://localhost:8000/docs/index.html) to see the documentation.
