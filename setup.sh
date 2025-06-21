#!/bin/bash

# LlamaEdge + Tauri Setup Script
# This script helps set up the development environment for the Tauri application

set -e

echo "🚀 Setting up LlamaEdge + Tauri Application..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status "Checking prerequisites..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    print_success "npm found: $NPM_VERSION"
else
    print_error "npm not found. Please install npm."
    exit 1
fi

# Check Rust
if command_exists rustc; then
    RUST_VERSION=$(rustc --version)
    print_success "Rust found: $RUST_VERSION"
else
    print_error "Rust not found. Please install Rust from https://rustup.rs/"
    exit 1
fi

# Check Cargo
if command_exists cargo; then
    CARGO_VERSION=$(cargo --version)
    print_success "Cargo found: $CARGO_VERSION"
else
    print_error "Cargo not found. Please install Rust toolchain."
    exit 1
fi

# Check WasmEdge
if command_exists wasmedge; then
    WASMEDGE_VERSION=$(wasmedge --version 2>&1 | head -n1)
    print_success "WasmEdge found: $WASMEDGE_VERSION"
else
    print_warning "WasmEdge not found. Installing WasmEdge..."
    curl -sSf https://raw.githubusercontent.com/WasmEdge/WasmEdge/master/utils/install_v2.sh | bash
    
    # Source the environment
    if [ -f "$HOME/.wasmedge/env" ]; then
        source "$HOME/.wasmedge/env"
    fi
    
    if command_exists wasmedge; then
        print_success "WasmEdge installed successfully"
    else
        print_error "Failed to install WasmEdge. Please install manually."
        exit 1
    fi
fi

# Install npm dependencies
print_status "Installing npm dependencies..."
npm install
print_success "npm dependencies installed"

# Create models directory
print_status "Creating models directory..."
mkdir -p models
print_success "Models directory created"

# Download LlamaEdge API server
print_status "Downloading LlamaEdge API server..."
if [ ! -f "llama-api-server.wasm" ]; then
    curl -LO https://github.com/second-state/LlamaEdge/releases/latest/download/llama-api-server.wasm
    print_success "LlamaEdge API server downloaded"
else
    print_warning "LlamaEdge API server already exists"
fi

# Ask user if they want to download a model
echo ""
read -p "Do you want to download a sample model (Llama 3.2 1B - ~1.1GB)? [y/N]: " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "Downloading Llama 3.2 1B model..."
    cd models
    if [ ! -f "Llama-3.2-1B-Instruct-Q5_K_M.gguf" ]; then
        curl -LO https://huggingface.co/second-state/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q5_K_M.gguf
        print_success "Model downloaded successfully"
    else
        print_warning "Model already exists"
    fi
    cd ..
else
    print_status "Skipping model download. You can download models later."
fi

# Build the application
print_status "Building the application..."
npm run build
print_success "Application built successfully"

# Final instructions
echo ""
print_success "Setup completed successfully! 🎉"
echo ""
echo "Next steps:"
echo "1. Start development: npm run tauri dev"
echo "2. Or build for production: npm run tauri build"
echo ""
echo "Usage:"
echo "- Use the 'Bluetooth Scanner' tab to scan for BLE devices"
echo "- Use the 'LLM Service' tab to configure and start the LLM service"
echo "- Use the 'AI Chat' tab to chat with the local LLM"
echo ""
echo "For more information, see README.md"
