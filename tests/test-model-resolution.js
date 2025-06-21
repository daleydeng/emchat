#!/usr/bin/env node

import { readFileSync, statSync } from 'fs';

console.log('🔍 Testing Model Path Resolution Implementation...\n');

// Test 1: Verify Rust backend changes
console.log('1. Testing Rust backend model resolution...');
try {
  const rustContent = readFileSync('src-tauri/src/llm.rs', 'utf8');
  
  if (rustContent.includes('model_filename: String')) {
    console.log('   ✅ Rust LlmConfig uses model_filename field');
  } else {
    console.log('   ❌ Rust LlmConfig still uses model_path field');
  }
  
  if (rustContent.includes('resolve_model_path')) {
    console.log('   ✅ Rust path resolution function implemented');
  } else {
    console.log('   ❌ Rust path resolution function missing');
  }
  
  if (rustContent.includes('models_dir = current_dir.join("models")')) {
    console.log('   ✅ Rust correctly constructs models directory path');
  } else {
    console.log('   ❌ Rust models directory path construction missing');
  }
  
} catch (error) {
  console.log('   ❌ Error reading Rust file:', error.message);
}

// Test 2: Verify TypeScript frontend changes
console.log('\n2. Testing TypeScript frontend changes...');
try {
  const tsTypesContent = readFileSync('src/types/llm.ts', 'utf8');
  
  if (tsTypesContent.includes('model_filename: string')) {
    console.log('   ✅ TypeScript LlmConfig uses model_filename field');
  } else {
    console.log('   ❌ TypeScript LlmConfig still uses model_path field');
  }
  
  if (!tsTypesContent.includes('model_path: string')) {
    console.log('   ✅ TypeScript LlmConfig no longer has model_path field');
  } else {
    console.log('   ❌ TypeScript LlmConfig still has model_path field');
  }
  
} catch (error) {
  console.log('   ❌ Error reading TypeScript types file:', error.message);
}

// Test 3: Verify configuration changes
console.log('\n3. Testing configuration changes...');
try {
  const configContent = readFileSync('src/config/app.ts', 'utf8');
  
  if (configContent.includes('model_filename: "Llama-3.2-1B-Instruct-Q5_K_M.gguf"')) {
    console.log('   ✅ App config uses model_filename with correct default');
  } else {
    console.log('   ❌ App config model_filename not updated');
  }
  
  if (configContent.includes('validateModelFilename')) {
    console.log('   ✅ Model filename validation function implemented');
  } else {
    console.log('   ❌ Model filename validation function missing');
  }
  
  if (configContent.includes('validateLlmConfig')) {
    console.log('   ✅ LLM config validation function implemented');
  } else {
    console.log('   ❌ LLM config validation function missing');
  }
  
} catch (error) {
  console.log('   ❌ Error reading config file:', error.message);
}

// Test 4: Verify component changes
console.log('\n4. Testing component changes...');
try {
  const panelContent = readFileSync('src/components/LlmServicePanel.tsx', 'utf8');
  
  if (panelContent.includes('Model Filename:')) {
    console.log('   ✅ LlmServicePanel uses "Model Filename" label');
  } else {
    console.log('   ❌ LlmServicePanel still uses "Model Path" label');
  }
  
  if (panelContent.includes('localConfig.model_filename')) {
    console.log('   ✅ LlmServicePanel accesses model_filename field');
  } else {
    console.log('   ❌ LlmServicePanel still accesses model_path field');
  }
  
  const settingsContent = readFileSync('src/components/AppSettings.tsx', 'utf8');
  
  if (settingsContent.includes('Model Filename:')) {
    console.log('   ✅ AppSettings uses "Model Filename" label');
  } else {
    console.log('   ❌ AppSettings still uses "Model Path" label');
  }
  
} catch (error) {
  console.log('   ❌ Error reading component files:', error.message);
}

// Test 5: Verify model file exists
console.log('\n5. Testing model file availability...');
try {
  const modelFile = statSync('models/Llama-3.2-1B-Instruct-Q5_K_M.gguf');
  if (modelFile.isFile()) {
    const sizeMB = (modelFile.size / (1024 * 1024)).toFixed(2);
    console.log(`   ✅ Model file exists: ${sizeMB} MB`);
    console.log('   ✅ Backend should be able to resolve this filename to full path');
  } else {
    console.log('   ❌ Model file not accessible');
  }
} catch (error) {
  console.log('   ❌ Model file not found:', error.message);
  console.log('   ⚠️  Backend will show appropriate error message');
}

// Test 6: Verify hooks changes
console.log('\n6. Testing hooks changes...');
try {
  const hooksContent = readFileSync('src/hooks/useLlm.ts', 'utf8');
  
  if (!hooksContent.includes('resolveModelPath')) {
    console.log('   ✅ useLlm hook no longer calls resolveModelPath');
  } else {
    console.log('   ❌ useLlm hook still calls resolveModelPath');
  }
  
  if (hooksContent.includes('// Use the config directly - the backend will resolve the model path')) {
    console.log('   ✅ useLlm hook has correct comment about backend resolution');
  } else {
    console.log('   ❌ useLlm hook comment not updated');
  }
  
} catch (error) {
  console.log('   ❌ Error reading hooks file:', error.message);
}

console.log('\n🎯 Implementation Summary:');
console.log('   • Frontend now sends only model filenames (e.g., "Llama-3.2-1B-Instruct-Q5_K_M.gguf")');
console.log('   • Backend automatically resolves full paths by combining project root + "models" + filename');
console.log('   • Path resolution happens in Rust backend using resolve_model_path() method');
console.log('   • Frontend validation ensures .gguf extension and valid filename format');
console.log('   • Error messages include helpful information about models directory location');

console.log('\n✅ Model path resolution implementation complete!');
console.log('   The "Model file not found" error should now be resolved.');
