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

// React hooks and APIs that should resolve directly from global React/ReactDOM
const REACT_HOOKS = ['useState','useEffect','useRef','useCallback','useMemo','useContext',
  'useReducer','useLayoutEffect','useImperativeHandle','useDebugValue','useId',
  'createContext','createRef','forwardRef','memo','Fragment','Children','cloneElement','isValidElement'];

let bundle = `// MiNegocio v2.0 - Built ${new Date().toISOString()}
const { ${REACT_HOOKS.join(', ')} } = React;

const __modules = {};
const __require = (name) => {
  if (name === 'react') return React;
  if (name === 'react-dom' || name === 'react-dom/client') return ReactDOM;
  const key = name.replace(/^\\.\\//, '').replace(/\\.\\.\\/[^/]+\\//g, '').replace(/\\.(tsx?|jsx?)$/, '');
  if (__modules[key]) return __modules[key];
  for (const k of Object.keys(__modules)) {
    if (k === key || k.endsWith('/' + key) || k.endsWith(key)) return __modules[k];
  }
  console.warn('Module not found:', name);
  return {};
};
`;

console.log('Compiling TypeScript...');
const srcFiles = [];
function getFiles(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) getFiles(full);
    else if (/\.(tsx?|jsx?)$/.test(e.name)) srcFiles.push(full);
  }
}
getFiles('./src');
console.log(`Found ${srcFiles.length} source files`);

for (const file of files) {
  if (!fs.existsSync(file)) { console.warn(`Missing: ${file}`); continue; }
  console.log(`  Compiling: ${file}`);
  let code = transpileFile(file);

  // 1. Strip boilerplate
  code = code.replace(/^"use strict";\s*/mg, '');
  code = code.replace(/Object\.defineProperty\(exports,\s*["']__esModule["'],\s*\{[^}]*\}\);\s*/g, '');
  code = code.replace(/var __importDefault\s*=[\s\S]*?;\n/g, '');
  code = code.replace(/var __importStar\s*=[\s\S]*?;\n/g, '');

  // 2. Remove react/reactdom require lines entirely
  code = code.replace(/^const \w+ = require\(["']react['"]\);\s*\n/mg, '');
  code = code.replace(/^const \w+ = require\(["']react-dom\/client['"]\);\s*\n/mg, '');
  code = code.replace(/^const \w+ = require\(["']react-dom['"]\);\s*\n/mg, '');

  // 3. Replace (0, react_1.hookName)( -> hookName(
  code = code.replace(/\(0,\s*react_1\.(use\w+|create\w+|memo|forwardRef|Fragment|Children|cloneElement|isValidElement)\)/g, '$1');

  // 4. Replace react_1.createElement -> React.createElement and react_1.X -> React.X
  code = code.replace(/\breact_1\.createElement\b/g, 'React.createElement');
  code = code.replace(/\breact_1\.(\w+)\b/g, 'React.$1');

  // 5. Replace ReactDOM patterns
  code = code.replace(/\(0,\s*client_1\.createRoot\)/g, 'ReactDOM.createRoot');
  code = code.replace(/\bclient_1\.createRoot\b/g, 'ReactDOM.createRoot');

  // 6. Replace remaining require() -> __require()
  code = code.replace(/\brequire\(/g, '__require(');

  const moduleName = file.replace(/^src\//, '').replace(/\.(tsx?|jsx?)$/, '');
  code = `\n// === ${file} ===\n(function() {\nconst exports = {};\n${code}\n__modules['${moduleName}'] = exports;\n})();\n`;
  bundle += code;
}

fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/app.js', bundle);
console.log(`Bundle created: dist/app.js (${(bundle.length/1024).toFixed(1)}kb)`);
