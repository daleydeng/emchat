# LlamaEdge + Tauri Setup Script for Windows PowerShell
# This script helps set up the development environment for the Tauri application

$ErrorActionPreference = "Stop"

Write-Host "🚀 Setting up LlamaEdge + Tauri Application..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param($Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Function to check if command exists
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    }
    catch {
        return $false
    }
}

# Check prerequisites
Write-Status "Checking prerequisites..."

# Check Node.js
if (Test-Command "node") {
    $nodeVersion = node --version
    Write-Success "Node.js found: $nodeVersion"
}
else {
    Write-Error "Node.js not found. Please install Node.js 18+ from https://nodejs.org/"
    exit 1
}

# Check npm
if (Test-Command "npm") {
    $npmVersion = npm --version
    Write-Success "npm found: $npmVersion"
}
else {
    Write-Error "npm not found. Please install npm."
    exit 1
}

# Check Rust
if (Test-Command "rustc") {
    $rustVersion = rustc --version
    Write-Success "Rust found: $rustVersion"
}
else {
    Write-Error "Rust not found. Please install Rust from https://rustup.rs/"
    exit 1
}

# Check Cargo
if (Test-Command "cargo") {
    $cargoVersion = cargo --version
    Write-Success "Cargo found: $cargoVersion"
}
else {
    Write-Error "Cargo not found. Please install Rust toolchain."
    exit 1
}

# Check WasmEdge
if (Test-Command "wasmedge") {
    $wasmedgeVersion = wasmedge --version 2>&1 | Select-Object -First 1
    Write-Success "WasmEdge found: $wasmedgeVersion"
}
else {
    Write-Warning "WasmEdge not found. Please install WasmEdge manually from:"
    Write-Host "https://github.com/WasmEdge/WasmEdge/releases" -ForegroundColor Yellow
    Write-Host "Or use the installer script (requires WSL/Git Bash):" -ForegroundColor Yellow
    Write-Host "curl -sSf https://raw.githubusercontent.com/WasmEdge/WasmEdge/master/utils/install_v2.sh | bash" -ForegroundColor Yellow
}

# Install npm dependencies
Write-Status "Installing npm dependencies..."
npm install
Write-Success "npm dependencies installed"

# Create models directory
Write-Status "Creating models directory..."
if (!(Test-Path "models")) {
    New-Item -ItemType Directory -Path "models" | Out-Null
}
Write-Success "Models directory created"

# Download LlamaEdge API server
Write-Status "Downloading LlamaEdge API server..."
if (!(Test-Path "llama-api-server.wasm")) {
    try {
        Invoke-WebRequest -Uri "https://github.com/second-state/LlamaEdge/releases/latest/download/llama-api-server.wasm" -OutFile "llama-api-server.wasm"
        Write-Success "LlamaEdge API server downloaded"
    }
    catch {
        Write-Error "Failed to download LlamaEdge API server: $_"
        exit 1
    }
}
else {
    Write-Warning "LlamaEdge API server already exists"
}

# Ask user if they want to download a model
Write-Host ""
$downloadModel = Read-Host "Do you want to download a sample model (Llama 3.2 1B - ~1.1GB)? [y/N]"

if ($downloadModel -match "^[Yy]$") {
    Write-Status "Downloading Llama 3.2 1B model..."
    Set-Location "models"
    if (!(Test-Path "Llama-3.2-1B-Instruct-Q5_K_M.gguf")) {
        try {
            Invoke-WebRequest -Uri "https://huggingface.co/second-state/Llama-3.2-1B-Instruct-GGUF/resolve/main/Llama-3.2-1B-Instruct-Q5_K_M.gguf" -OutFile "Llama-3.2-1B-Instruct-Q5_K_M.gguf"
            Write-Success "Model downloaded successfully"
        }
        catch {
            Write-Error "Failed to download model: $_"
            Set-Location ".."
            exit 1
        }
    }
    else {
        Write-Warning "Model already exists"
    }
    Set-Location ".."
}
else {
    Write-Status "Skipping model download. You can download models later."
}

# Build the application
Write-Status "Building the application..."
try {
    npm run build
    Write-Success "Application built successfully"
}
catch {
    Write-Error "Failed to build application: $_"
    exit 1
}

# Final instructions
Write-Host ""
Write-Success "Setup completed successfully! 🎉"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Start development: npm run tauri dev" -ForegroundColor White
Write-Host "2. Or build for production: npm run tauri build" -ForegroundColor White
Write-Host ""
Write-Host "Usage:" -ForegroundColor Cyan
Write-Host "- Use the 'Bluetooth Scanner' tab to scan for BLE devices" -ForegroundColor White
Write-Host "- Use the 'LLM Service' tab to configure and start the LLM service" -ForegroundColor White
Write-Host "- Use the 'AI Chat' tab to chat with the local LLM" -ForegroundColor White
Write-Host ""
Write-Host "For more information, see README.md" -ForegroundColor Cyan
