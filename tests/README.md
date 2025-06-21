# Test Suite

This directory contains all test files for the Tauri application.

## Test Files

- **test-integration.js** - Integration tests for the complete application
- **test-llama-config.js** - Tests for ollama-rs integration and configuration
- **test-startup.js** - Tests for application startup behavior
- **test-layout-fixes.js** - Tests for UI layout and responsiveness
- **test-model-resolution.js** - Tests for model path resolution and loading

## Running Tests

### Individual Tests
```bash
npm run test:integration    # Run integration tests
npm run test:llama-config   # Run ollama-rs configuration tests
npm run test:startup        # Run startup tests
npm run test:layout         # Run layout tests
npm run test:model          # Run model resolution tests
```

### All Tests
```bash
npm test                    # Run all tests (Rust + integration)
npm run test:rust           # Run only Rust tests
```

## Test Organization

All test files have been moved from the root directory to this `tests/` directory and renamed from `.mjs` to `.js` for consistency. The `package.json` has been updated with `"type": "module"` to enable ES modules support.

## Migration Notes

These tests have been updated to reflect the migration from LlamaEdge to ollama-rs:
- Configuration structure changed from file-based to HTTP client-based
- Default model changed to `deepseek-r1-distill-qwen-1.5b`
- Default port changed from 8080 to 11434 (Ollama standard)
- Removed process management tests (no longer applicable)
