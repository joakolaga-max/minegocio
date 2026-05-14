const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REACT_PATH = '/home/claude/.npm-global/lib/node_modules/react';
const REACT_DOM_PATH = '/home/claude/.npm-global/lib/node_modules/react-dom';
const TSC = '/home/claude/.npm-global/bin/tsc';

// Transpile TypeScript files
console.log('Compiling TypeScript...');

// Get all TSX/TS files
function getFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) getFiles(full, files);
    else if (/\.(tsx?|jsx?)$/.test(entry.name)) files.push(full);
  }
  return files;
}

const srcFiles = getFiles('./src');
console.log(`Found ${srcFiles.length} source files`);

// Transpile each file using TypeScript
const ts = require('/home/claude/.npm-global/lib/node_modules/typescript/lib/typescript.js');

function transpileFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const result = ts.transpileModule(src, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      strict: false,
      esModuleInterop: true,
    },
    fileName: filePath,
  });
  return result.outputText;
}

// Build the bundle
const files = [
  'src/types.ts',
  'src/lib/utils.ts',
  'src/lib/firebase.ts',
  'src/components/Icon.tsx',
  'src/components/Toast.tsx',
  'src/components/Modal.tsx',
  'src/components/Scanner.tsx',
  'src/hooks/useAppData.ts',
  'src/tabs/TabCalculadora.tsx',
  'src/App.tsx',
  'src/main.tsx',
];

let bundle = `
// MiNegocio v2.0 - Built ${new Date().toISOString()}
const { useState, useEffect, useRef, useCallback } = React;
const { createRoot } = ReactDOM;

`;

// Simple module system
bundle += `
const __modules = {};
const __require = (name) => {
  if (name === 'react') return React;
  if (name === 'react-dom' || name === 'react-dom/client') return ReactDOM;
  return __modules[name] || {};
};
`;

for (const file of files) {
  if (!fs.existsSync(file)) { console.warn(`Missing: ${file}`); continue; }
  console.log(`  Compiling: ${file}`);
  let code = transpileFile(file);
  
  // Remove import/require statements and replace with our module system
  code = code.replace(/^"use strict";\s*/m, '');
  code = code.replace(/Object\.defineProperty\(exports, "__esModule", \{ value: true \}\);\s*/g, '');
  code = code.replace(/^const [\w]+ = require\(['"]react['"]\);\s*/mg, '');
  code = code.replace(/^const [\w]+ = require\(['"]react-dom['"]\);\s*/mg, '');
  code = code.replace(/^const [\w]+ = require\(['"]react-dom\/client['"]\);\s*/mg, '');
  code = code.replace(/^const (\w+) = require\(['"]([^'"]+)['"]\);\s*/mg, (_, name, mod) => {
    return `const ${name} = __require('${mod}');\n`;
  });
  
  // Replace exports with module registration
  const moduleName = file.replace(/^src\//, '').replace(/\.(tsx?|jsx?)$/, '');
  code = `\n// === ${file} ===\n(function() {\nconst exports = {};\nconst module = { exports };\n${code}\n__modules['${moduleName}'] = exports;\n})();\n`;
  
  bundle += code;
}

fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/app.js', bundle);
console.log(`Bundle created: dist/app.js (${(bundle.length/1024).toFixed(1)}kb)`);
