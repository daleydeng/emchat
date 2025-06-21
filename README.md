# EmChat - AI Chat Application with Bluetooth Scanner

A cross-platform desktop application built with Tauri, React, and TypeScript that provides:
- **Bluetooth Low Energy (BLE) device scanning** using btleplug
- **Local LLM chat interface** powered by llama-cpp-rs
- **Tabbed interface** for seamless switching between functionalities

## Features

### 🔵 Bluetooth Scanner
- Scan for nearby Bluetooth Low Energy devices
- Display device information (name, address, RSSI, services)
- Real-time device discovery with automatic updates
- Cross-platform support (Windows, macOS, Linux)

### 🤖 Local LLM Integration
- Local LLM inference using llama-cpp-rs
- Chat interface with conversation management
- Configurable model parameters (temperature, context size, etc.)
- Service lifecycle management (start/stop LLM service)

### 🎯 User Interface
- Clean tabbed interface separating Bluetooth and LLM functionality
- Real-time status indicators
- Error handling and user feedback
- Responsive design with dark mode support

## Prerequisites

### Required Software
1. **Node.js** (v18 or later) - [Download](https://nodejs.org/)
2. **Rust** (latest stable) - [Install via rustup](https://rustup.rs/)

### Model Setup
1. **Download a Model** (example with Llama 3.2 1B):
   ```bash
   mkdir models
   curl -LO https://huggingface.co/second-state/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q5_K_M.gguf
   mv Llama-3.2-1B-Instruct-Q5_K_M.gguf models/
   ```

## Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd emchat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the application**:
   ```bash
   npm run tauri build
   ```

## Development

1. **Start development server**:
   ```bash
   npm run tauri dev
   ```

2. **Build for production**:
   ```bash
   npm run tauri build
   ```

## Usage

### Bluetooth Scanner
1. Open the application
2. Navigate to the "Bluetooth Scanner" tab
3. Click "Initialize Bluetooth" to set up the adapter
4. Click "Start Scan" to discover nearby BLE devices
5. View discovered devices in real-time

### LLM Chat
1. Navigate to the "LLM Service" tab
2. Configure model settings:
   - Set model path (e.g., `models/Llama-3.2-1B-Instruct-Q5_K_M.gguf`)
   - Adjust parameters as needed
3. Click "Initialize" then "Start Service"
4. Switch to the "AI Chat" tab
5. Start chatting with the local LLM

## Configuration

### LLM Service Configuration
The LLM service can be configured with the following parameters:

- **Model Path**: Path to the GGUF model file
- **Model Name**: Identifier for the model
- **Context Size**: Maximum context length (default: 4096)
- **Batch Size**: Processing batch size (default: 512)
- **Temperature**: Randomness in generation (0.1-2.0, default: 0.8)
- **Top P**: Nucleus sampling parameter (0.1-1.0, default: 0.9)
- **Port**: Service port (default: 8080)
- **Max Tokens**: Maximum tokens to generate (-1 for unlimited)

## Architecture

### Backend (Rust)
- **Tauri Framework**: Cross-platform app framework
- **btleplug**: Bluetooth Low Energy library
- **llama-cpp-rs**: Local LLM inference library
- **tokio**: Async runtime

### Frontend (TypeScript/React)
- **React 18**: UI framework with hooks
- **TypeScript**: Type-safe JavaScript
- **Custom Hooks**: `useLlm`, `useChat` for state management
- **Tabbed Interface**: Clean separation of concerns
- **CSS Modules**: Scoped styling with dark mode support

### LLM Integration
- **llama-cpp-rs**: Rust bindings for llama.cpp
- **Local Inference**: No data sent to external services
- **GGUF Model Support**: Compatible with Hugging Face GGUF models

## Troubleshooting

### Common Issues

#### LLM Service Won't Start
1. **Verify Model File**: Ensure the model file exists and is a valid GGUF format
2. **Check Memory**: Ensure sufficient RAM is available for the model
3. **Model Path**: Verify the model path is correct and accessible

#### Bluetooth Issues
1. **Permissions**: On Linux/macOS, ensure Bluetooth permissions are granted
2. **Adapter Not Found**: Check if Bluetooth is enabled on your system
3. **Windows**: May require running as administrator for Bluetooth access

#### Build Issues
1. **Rust Toolchain**: Ensure latest stable Rust is installed
2. **Node Dependencies**: Clear `node_modules` and reinstall if needed
3. **Tauri CLI**: Update to latest version: `npm install -g @tauri-apps/cli`

### Performance Tips

1. **Model Selection**: Smaller models (1B-3B parameters) provide faster inference
2. **Context Size**: Reduce context size for better performance on limited hardware
3. **Batch Size**: Adjust batch size based on available memory

## File Structure

```
emchat/
├── src/                          # Frontend source
│   ├── components/              # React components
│   │   ├── BluetoothScanner.tsx # Bluetooth functionality
│   │   ├── ChatInterface.tsx    # LLM chat interface
│   │   ├── LlmServicePanel.tsx  # LLM service control
│   │   └── TabContainer.tsx     # Tabbed interface
│   ├── hooks/                   # Custom React hooks
│   │   ├── useLlm.ts           # LLM service management
│   │   └── useChat.ts          # Chat functionality
│   ├── types/                   # TypeScript type definitions
│   │   ├── bluetooth.ts        # Bluetooth types
│   │   └── llm.ts              # LLM types
│   └── App.tsx                 # Main application component
├── src-tauri/                   # Backend source
│   ├── src/
│   │   ├── bluetooth.rs        # Bluetooth scanner implementation
│   │   ├── llm.rs              # LLM service integration
│   │   ├── lib.rs              # Main library with Tauri commands
│   │   └── main.rs             # Application entry point
│   └── Cargo.toml              # Rust dependencies
├── contrib/                     # Third-party contributions
├── models/                      # LLM model files (.gguf)
└── README.md                   # This file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) - Cross-platform app framework
- [llama-cpp-rs](https://github.com/utilityai/llama-cpp-rs) - Rust bindings for llama.cpp
- [btleplug](https://github.com/deviceplug/btleplug) - Bluetooth Low Energy library

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)
