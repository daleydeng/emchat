# Ollama Integration Debugging Guide

## Root Cause Analysis

The "ollama request error" occurs because **Ollama is not installed or running** on your system. Your Tauri application is configured to auto-start the LLM service on startup, which immediately tries to connect to Ollama at `http://127.0.0.1:11434`.

## Quick Diagnosis

### 1. Check if Ollama is installed
```bash
ollama --version
```
If this command fails, Ollama is not installed.

### 2. Check if Ollama service is running
```bash
curl http://127.0.0.1:11434/api/tags
```
If this fails with connection error, Ollama service is not running.

### 3. Use the built-in health check
- Start your Tauri application
- Go to the LLM Service Panel
- Click the "🏥 Health Check" button
- This will provide detailed diagnostic information

## Installation and Setup

### Step 1: Install Ollama

#### Windows
1. Download from https://ollama.ai
2. Run the installer
3. Ollama will be added to your PATH

#### macOS
```bash
brew install ollama
```

#### Linux
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Step 2: Start Ollama Service

#### Option A: Start as a service (recommended)
```bash
ollama serve
```
This starts Ollama on `http://127.0.0.1:11434`

#### Option B: Run in background
```bash
# Windows (PowerShell)
Start-Process ollama -ArgumentList "serve" -WindowStyle Hidden

# macOS/Linux
nohup ollama serve &
```

### Step 3: Verify Installation
```bash
# Check if service is running
curl http://127.0.0.1:11434/api/tags

# Should return JSON with available models
```

### Step 4: Pull Required Model
```bash
ollama pull deepseek-r1-distill-qwen-1.5b
```

### Step 5: Verify Model is Available
```bash
ollama list
```
You should see `deepseek-r1-distill-qwen-1.5b` in the list.

## Debugging Strategies

### 1. Enhanced Error Messages
The application now provides detailed error messages including:
- Connection status to Ollama
- Specific error reasons
- Troubleshooting suggestions

### 2. Health Check Function
Use the new health check feature:
- **Frontend**: Click "🏥 Health Check" button in LLM Service Panel
- **Backend**: The `check_ollama_health` function tests connectivity without initializing the full client

### 3. Logging
The Rust backend now includes detailed logging:
- Connection attempts
- Success/failure reasons
- Model availability information

### 4. Step-by-Step Debugging

#### Check 1: Ollama Installation
```bash
where ollama  # Windows
which ollama  # macOS/Linux
```

#### Check 2: Service Status
```bash
# Test basic connectivity
curl -v http://127.0.0.1:11434/api/tags

# Check specific endpoints
curl http://127.0.0.1:11434/api/version
```

#### Check 3: Model Availability
```bash
ollama list
ollama show deepseek-r1-distill-qwen-1.5b
```

#### Check 4: Port Conflicts
```bash
# Windows
netstat -an | findstr :11434

# macOS/Linux
netstat -an | grep :11434
lsof -i :11434
```

## Common Issues and Solutions

### Issue 1: "Command not found: ollama"
**Solution**: Ollama is not installed or not in PATH
- Install Ollama from https://ollama.ai
- Restart terminal/command prompt
- Verify with `ollama --version`

### Issue 2: "Connection refused" or "Cannot reach Ollama service"
**Solution**: Ollama service is not running
- Run `ollama serve` in a terminal
- Keep the terminal open or run as background service
- Verify with `curl http://127.0.0.1:11434/api/tags`

### Issue 3: "Model not found"
**Solution**: Required model is not pulled
- Run `ollama pull deepseek-r1-distill-qwen-1.5b`
- Verify with `ollama list`

### Issue 4: Port 11434 already in use
**Solution**: Another service is using the port
- Find the process: `netstat -an | grep :11434`
- Kill the process or change Ollama port
- Configure your app to use different port in LLM settings

### Issue 5: Firewall blocking connections
**Solution**: Allow Ollama through firewall
- Windows: Add exception for ollama.exe
- macOS: System Preferences > Security & Privacy > Firewall
- Linux: Configure iptables/ufw

## Configuration Options

### Change Ollama Host/Port
In your application's LLM configuration:
```typescript
{
  host: "http://127.0.0.1",  // Change if Ollama runs elsewhere
  port: 11434,               // Change if using different port
  model_name: "deepseek-r1-distill-qwen-1.5b"
}
```

### Disable Auto-Start
If you want to manually control the LLM service:
```typescript
// In app configuration
{
  autoStartLlm: false,
  retryAttempts: 0
}
```

## Testing Your Setup

### 1. Manual Test
```bash
# Start Ollama
ollama serve

# In another terminal, test the model
ollama run deepseek-r1-distill-qwen-1.5b "Hello, how are you?"
```

### 2. Application Test
1. Start your Tauri application
2. Check the LLM Service Panel
3. Use "🏥 Health Check" button
4. Try manual initialization if auto-start is disabled

### 3. API Test
```bash
# Test chat completion
curl -X POST http://127.0.0.1:11434/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "model": "deepseek-r1-distill-qwen-1.5b",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

## Next Steps

1. **Install Ollama** if not already installed
2. **Start the service** with `ollama serve`
3. **Pull the model** with `ollama pull deepseek-r1-distill-qwen-1.5b`
4. **Restart your Tauri application**
5. **Use the health check** to verify everything is working

The enhanced error handling will now provide much more specific guidance when issues occur.
