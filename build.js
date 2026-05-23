const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ts = require('/home/claude/.npm-global/lib/node_modules/typescript/lib/typescript.js');

function transpileFile(filePath) {
  const src = fs.readFileSync(filePath, 'utf8');
  const result = ts.transpileModule(src, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      strict: false,
      esModuleInterop: false,
      allowSyntheticDefaultImports: true,
    },
    fileName: filePath,
  });
  return result.outputText;
}

const files = [
  'src/types.ts',
  'src/lib/utils.ts',
  'src/lib/firebase.ts',
  'src/components/Icon.tsx',
  'src/components/Toast.tsx',
  'src/components/Modal.tsx',
  'src/components/Scanner.tsx',
  'src/components/LoginScreen.tsx',
  'src/components/Presupuesto.tsx',
  'src/hooks/useAppData.ts',
  'src/tabs/TabCalculadora.tsx',
  'src/tabs/TabProveedores.tsx',
  'src/tabs/TabMisPrecios.tsx',
  'src/tabs/TabStock.tsx',
  'src/tabs/TabVentas.tsx',
  'src/tabs/TabPedidos.tsx',
  'src/tabs/TabPresupuestos.tsx',
  'src/tabs/TabConfig.tsx',
  'src/App.tsx',
  'src/main.tsx',
];

let bundle = `// MiNegocio v2.0 - Built ${new Date().toISOString()}
const { useState, useEffect, useRef, useCallback, useMemo } = React;

const __modules = {};
const __require = (name) => {
  if (name === 'react') return React;
  if (name === 'react-dom' || name === 'react-dom/client') return ReactDOM;
  const key = name.replace(/^\\.\\//,'').replace(/\\.\\.\\/[^/]+\\//g,'').replace(/\\.(tsx?|jsx?)$/,'');
  if (__modules[key]) return __modules[key];
  for (const k of Object.keys(__modules)) {
    if (k === key || k.endsWith('/' + key) || k.endsWith(key)) return __modules[k];
  }
  console.warn('Module not found:', name);
  return {};
};
`;

console.log('Compiling TypeScript...');

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

for (const file of files) {
  if (!fs.existsSync(file)) { console.warn(`Missing: ${file}`); continue; }
  console.log(`  Compiling: ${file}`);
  let code = transpileFile(file);

  // Strip TS boilerplate
  code = code.replace(/^"use strict";\s*/mg, '');
  code = code.replace(/Object\.defineProperty\(exports,\s*["']__esModule["'],\s*\{[^}]*\}\);\s*/g, '');

  // Strip __importDefault / __importStar helpers entirely
  code = code.replace(/var __importDefault\s*=.*?;\n/gs, '');
  code = code.replace(/var __importStar\s*=.*?;\n/gs, '');

  // Replace react imports: const react_1 = require("react") -> removed, replace react_1.default -> React
  code = code.replace(/^const \w+ = require\(["']react['"]\);\s*/mg, '');
  code = code.replace(/^const \w+ = require\(["']react-dom['"]\);\s*/mg, '');
  code = code.replace(/^const \w+ = require\(["']react-dom\/client['"]\);\s*/mg, '');

  // Replace _1.default.createElement -> React.createElement etc
  code = code.replace(/\b(\w+)_1\.default\.createElement/g, 'React.createElement');
  code = code.replace(/\b(\w+)_1\.default\b/g, 'React');

  // Replace remaining require() with __require()
  code = code.replace(/\brequire\(/g, '__require(');

  // Fix createRoot
  code = code.replace(/\(0,\s*\w+\.createRoot\)/g, 'ReactDOM.createRoot');
  code = code.replace(/\bReactDOM\.createRoot\b/g, 'ReactDOM.createRoot');

  const moduleName = file.replace(/^src\//, '').replace(/\.(tsx?|jsx?)$/, '');
  code = `\n// === ${file} ===\n(function() {\nconst exports = {};\n${code}\n__modules['${moduleName}'] = exports;\n})();\n`;

  bundle += code;
}

fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/app.js', bundle);
console.log(`Bundle created: dist/app.js (${(bundle.length/1024).toFixed(1)}kb)`);
