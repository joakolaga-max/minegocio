const fs = require('fs');
const ts = require('/home/claude/.npm-global/lib/node_modules/typescript/lib/typescript.js');

console.log('Compilando...');

function transpile(filePath) {
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

// Mapa de todos los nombres exportados por cada módulo
// Para que require('./Icon') devuelva { Icon: window.Icon }
const MODULE_MAP = {
  'react': null, // especial
  'react-dom': null,
  './Icon': ['Icon'],
  '../components/Icon': ['Icon'],
  './Toast': ['Toast'],
  '../components/Toast': ['Toast'],
  './Modal': ['Modal'],
  '../components/Modal': ['Modal'],
  './Scanner': ['Scanner'],
  '../components/Scanner': ['Scanner'],
  './LoginScreen': ['LoginScreen'],
  '../components/LoginScreen': ['LoginScreen'],
  './Presupuesto': ['Presupuesto'],
  '../components/Presupuesto': ['Presupuesto'],
  '../lib/utils': ['fmtPeso','fmtPesoInt','calcPrecioVenta','todayStr','nowStr','genId'],
  './utils': ['fmtPeso','fmtPesoInt','calcPrecioVenta','todayStr','nowStr','genId'],
  '../lib/firebase': ['saveToFirebase','loadFromFirebase'],
  './firebase': ['saveToFirebase','loadFromFirebase'],
  '../hooks/useAppData': ['useAppData'],
  './useAppData': ['useAppData'],
  '../tabs/TabCalculadora': ['TabCalculadora'],
  '../tabs/TabProveedores': ['TabProveedores'],
  '../tabs/TabMisPrecios': ['TabMisPrecios'],
  '../tabs/TabStock': ['TabStock'],
  '../tabs/TabVentas': ['TabVentas'],
  '../tabs/TabPedidos': ['TabPedidos'],
  '../tabs/TabPresupuestos': ['TabPresupuestos'],
  '../tabs/TabConfig': ['TabConfig'],
  './App': ['default'],
  './components/Icon': ['Icon'],
};

const requireFnBody = Object.entries(MODULE_MAP).map(([mod, names]) => {
  if (mod === 'react') return '';
  if (!names) return '';
  const obj = names.map(n => n === 'default' ? 'default: App' : n + ': typeof ' + n + ' !== "undefined" ? ' + n + ' : window["' + n + '"]').join(', ');
  return 'if (m === "' + mod + '") return { ' + obj + ' };';
}).filter(Boolean).join('\n    ');

function wrapModule(code, label) {
  code = code.replace(/^"use strict";\s*/m, '');
  code = code.replace(/Object\.defineProperty\(exports, "__esModule"[^;]+;\s*/g, '');

  return `
// ── ${label} ──
(function(){
  const exports = {};
  const module = { exports };
  const require = (m) => {
    if (m === 'react') return { default: React, createElement: React.createElement, useState, useEffect, useRef, useCallback, useMemo, Fragment: React.Fragment };
    if (m === 'react-dom' || m === 'react-dom/client') return { default: ReactDOM, createRoot: ReactDOM.createRoot };
    ${requireFnBody}
    console.warn('require not found:', m);
    return {};
  };
  ${code}
  // Promover exports al scope global
  if (typeof exports === 'object') {
    Object.keys(exports).forEach(k => {
      if (k !== '__esModule' && exports[k] !== undefined) {
        window[k] = exports[k];
      }
    });
  }
})();`;
}

const files = [
  ['src/types.ts',                   'types'],
  ['src/lib/utils.ts',               'utils'],
  ['src/lib/firebase.ts',            'firebase'],
  ['src/components/Icon.tsx',        'Icon'],
  ['src/components/Toast.tsx',       'Toast'],
  ['src/components/Modal.tsx',       'Modal'],
  ['src/components/Scanner.tsx',     'Scanner'],
  ['src/components/LoginScreen.tsx', 'LoginScreen'],
  ['src/components/Presupuesto.tsx', 'Presupuesto'],
  ['src/hooks/useAppData.ts',        'useAppData'],
  ['src/tabs/TabCalculadora.tsx',    'TabCalculadora'],
  ['src/tabs/TabProveedores.tsx',    'TabProveedores'],
  ['src/tabs/TabMisPrecios.tsx',     'TabMisPrecios'],
  ['src/tabs/TabStock.tsx',          'TabStock'],
  ['src/tabs/TabVentas.tsx',         'TabVentas'],
  ['src/tabs/TabPedidos.tsx',        'TabPedidos'],
  ['src/tabs/TabPresupuestos.tsx',   'TabPresupuestos'],
  ['src/tabs/TabConfig.tsx',         'TabConfig'],
  ['src/App.tsx',                    'App'],
  ['src/main.tsx',                   'main'],
];

let bundle = '// MiNegocio v3.0\n';
bundle += 'const { useState, useEffect, useRef, useCallback, useMemo } = React;\n\n';

for (const [file, label] of files) {
  if (!fs.existsSync(file)) { console.warn('Falta: ' + file); continue; }
  console.log('  ' + file);
  bundle += wrapModule(transpile(file), label) + '\n';
}

fs.mkdirSync('./dist', { recursive: true });
fs.writeFileSync('./dist/app.js', bundle);
console.log('dist/app.js (' + (bundle.length/1024).toFixed(1) + 'kb)');
