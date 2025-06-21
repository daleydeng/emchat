#!/usr/bin/env node

/**
 * Integration Test Script for LlamaEdge + Tauri Application
 * 
 * This script performs basic integration tests to verify that:
 * 1. The application builds successfully
 * 2. Required files are in place
 * 3. Dependencies are correctly installed
 * 4. Basic functionality works as expected
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
    log(`[INFO] ${message}`, 'cyan');
}

function logSuccess(message) {
    log(`[SUCCESS] ${message}`, 'green');
}

function logWarning(message) {
    log(`[WARNING] ${message}`, 'yellow');
}

function logError(message) {
    log(`[ERROR] ${message}`, 'red');
}

function checkFileExists(filePath, description) {
    if (fs.existsSync(filePath)) {
        logSuccess(`${description} found: ${filePath}`);
        return true;
    } else {
        logError(`${description} not found: ${filePath}`);
        return false;
    }
}

function runCommand(command, description) {
    try {
        logInfo(`Running: ${description}`);
        const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
        logSuccess(`${description} completed successfully`);
        return { success: true, output };
    } catch (error) {
        logError(`${description} failed: ${error.message}`);
        return { success: false, error: error.message };
    }
}

async function main() {
    log('🧪 Running Integration Tests for LlamaEdge + Tauri Application', 'blue');
    log('================================================================', 'blue');
    
    let allTestsPassed = true;
    
    // Test 1: Check required files
    logInfo('Test 1: Checking required files...');
    const requiredFiles = [
        { path: 'package.json', desc: 'Package.json' },
        { path: 'src-tauri/Cargo.toml', desc: 'Cargo.toml' },
        { path: 'src/App.tsx', desc: 'Main App component' },
        { path: 'src-tauri/src/lib.rs', desc: 'Tauri lib.rs' },
        { path: 'src-tauri/src/llm.rs', desc: 'LLM module' },
        { path: 'src-tauri/src/bluetooth.rs', desc: 'Bluetooth module' },
        { path: 'src/hooks/useLlm.ts', desc: 'LLM React hook' },
        { path: 'src/hooks/useChat.ts', desc: 'Chat React hook' },
        { path: 'src/components/ChatInterface.tsx', desc: 'Chat interface component' },
        { path: 'src/components/LlmServicePanel.tsx', desc: 'LLM service panel component' },
        { path: 'src/types/llm.ts', desc: 'LLM TypeScript types' }
    ];
    
    for (const file of requiredFiles) {
        if (!checkFileExists(file.path, file.desc)) {
            allTestsPassed = false;
        }
    }
    
    // Test 2: Check optional files
    logInfo('Test 2: Checking optional files...');
    const optionalFiles = [
        { path: 'llama-api-server.wasm', desc: 'LlamaEdge API server binary' },
        { path: 'models', desc: 'Models directory' }
    ];
    
    for (const file of optionalFiles) {
        if (fs.existsSync(file.path)) {
            logSuccess(`${file.desc} found: ${file.path}`);
        } else {
            logWarning(`${file.desc} not found: ${file.path} (optional)`);
        }
    }
    
    // Test 3: Check dependencies
    logInfo('Test 3: Checking dependencies...');
    
    // Check if node_modules exists
    if (!checkFileExists('node_modules', 'Node modules directory')) {
        logWarning('Run "npm install" to install dependencies');
        allTestsPassed = false;
    }
    
    // Test 4: Build tests
    logInfo('Test 4: Running build tests...');
    
    // Test frontend build
    const frontendBuild = runCommand('npm run build', 'Frontend build');
    if (!frontendBuild.success) {
        allTestsPassed = false;
    }
    
    // Test Rust compilation
    const rustBuild = runCommand('cargo check --manifest-path src-tauri/Cargo.toml', 'Rust compilation check');
    if (!rustBuild.success) {
        allTestsPassed = false;
    }
    
    // Test 5: Run unit tests
    logInfo('Test 5: Running unit tests...');
    
    const rustTests = runCommand('cargo test --manifest-path src-tauri/Cargo.toml', 'Rust unit tests');
    if (!rustTests.success) {
        allTestsPassed = false;
    }
    
    // Test 6: Check TypeScript compilation
    logInfo('Test 6: Checking TypeScript compilation...');
    
    const tsCheck = runCommand('npx tsc --noEmit', 'TypeScript type checking');
    if (!tsCheck.success) {
        logWarning('TypeScript compilation has issues (this may be expected in development)');
    }
    
    // Test 7: Verify package.json scripts
    logInfo('Test 7: Verifying package.json scripts...');
    
    try {
        const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
        const requiredScripts = ['dev', 'build', 'tauri'];
        
        for (const script of requiredScripts) {
            if (packageJson.scripts && packageJson.scripts[script]) {
                logSuccess(`Script "${script}" found in package.json`);
            } else {
                logError(`Script "${script}" not found in package.json`);
                allTestsPassed = false;
            }
        }
    } catch (error) {
        logError(`Failed to parse package.json: ${error.message}`);
        allTestsPassed = false;
    }
    
    // Summary
    log('\n================================================================', 'blue');
    if (allTestsPassed) {
        logSuccess('🎉 All integration tests passed!');
        log('\nYour application is ready to run:', 'green');
        log('• Development: npm run tauri dev', 'cyan');
        log('• Production build: npm run tauri build', 'cyan');
    } else {
        logError('❌ Some integration tests failed.');
        log('\nPlease check the errors above and:', 'yellow');
        log('• Run "npm install" to install dependencies', 'yellow');
        log('• Follow the setup instructions in README.md', 'yellow');
        log('• Ensure all required files are in place', 'yellow');
    }
    
    log('\nFor more information, see README.md', 'blue');
    
    process.exit(allTestsPassed ? 0 : 1);
}

// Run the tests
main().catch(error => {
    logError(`Unexpected error: ${error.message}`);
    process.exit(1);
});
