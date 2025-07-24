#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 构建后处理脚本 - ES模块到CommonJS的转换
const distDir = path.join(__dirname, '../dist-electron');

console.log('开始构建后处理：转换ES模块为CommonJS...');

/**
 * 将ES模块语法转换为CommonJS语法
 */
function convertToCommonJS(content) {
  let converted = content;

  // 转换 import 语句
  // import { ... } from "module" -> const { ... } = require("module")
  converted = converted.replace(
    /import\s+\{\s*([^}]+)\s*\}\s+from\s+["']([^"']+)["'];?/g,
    'const { $1 } = require("$2");'
  );

  // import defaultExport from "module" -> const defaultExport = require("module")
  converted = converted.replace(
    /import\s+(\w+)\s+from\s+["']([^"']+)["'];?/g,
    'const $1 = require("$2");'
  );

  // import * as name from "module" -> const name = require("module")
  converted = converted.replace(
    /import\s+\*\s+as\s+(\w+)\s+from\s+["']([^"']+)["'];?/g,
    'const $1 = require("$2");'
  );

  // import "module" -> require("module")
  converted = converted.replace(
    /import\s+["']([^"']+)["'];?/g,
    'require("$1");'
  );

  // 转换 export 语句
  // export { ... } -> module.exports = { ... }
  converted = converted.replace(
    /export\s+\{\s*([^}]+)\s*\};?/g,
    'module.exports = { $1 };'
  );

  // export default ... -> module.exports = ...
  converted = converted.replace(
    /export\s+default\s+(.*);?/g,
    'module.exports = $1;'
  );

  // export const/let/var -> module.exports.name = ...
  converted = converted.replace(
    /export\s+(const|let|var)\s+(\w+)\s*=\s*([^;]+);?/g,
    '$1 $2 = $3;\nmodule.exports.$2 = $2;'
  );

  // export function -> module.exports.functionName = function
  converted = converted.replace(
    /export\s+function\s+(\w+)/g,
    'function $1'
  );

  // 如果有 export function，需要在文件末尾添加 module.exports
  if (content.includes('export function')) {
    const functionExports = [];
    const functionMatches = content.matchAll(/export\s+function\s+(\w+)/g);
    for (const match of functionMatches) {
      functionExports.push(match[1]);
    }
    if (functionExports.length > 0) {
      converted += '\n\n// Export functions\n';
      for (const funcName of functionExports) {
        converted += `module.exports.${funcName} = ${funcName};\n`;
      }
    }
  }

  return converted;
}

// 需要处理的文件映射 - 检查多个可能的位置
const filesToProcess = [
  { js: 'main.js', cjs: 'main.cjs' },
  { js: 'preload.js', cjs: 'preload.cjs' },
  { js: 'electron/main.js', cjs: 'main.cjs' },
  { js: 'electron/preload.js', cjs: 'preload.cjs' }
];

// 优化处理逻辑：避免重复处理相同的目标文件
const processedFiles = new Set();

for (const file of filesToProcess) {
  const jsPath = path.join(distDir, file.js);
  const cjsPath = path.join(distDir, file.cjs);
  
  // 跳过已处理的目标文件
  if (processedFiles.has(file.cjs)) {
    continue;
  }
  
  if (fs.existsSync(jsPath)) {
    console.log(`处理文件: ${file.js} -> ${file.cjs}`);
    
    // 读取文件内容
    let content = fs.readFileSync(jsPath, 'utf8');
    
    // 转换ES模块语法为CommonJS
    content = convertToCommonJS(content);
    
    // 修复内部引用：将.js引用改为.cjs引用
    if (file.cjs === 'main.cjs') {
      content = content.replace(
        /["']preload\.js["']/g,
        '"preload.cjs"'
      );
      console.log('  修复了preload引用');
    }
    
    // 写入.cjs文件
    fs.writeFileSync(cjsPath, content, 'utf8');
    console.log(`  ✅ 生成 ${file.cjs} (已转换为CommonJS)`);
    
    // 删除原.js文件
    fs.unlinkSync(jsPath);
    console.log(`  🗑️  删除 ${file.js}`);
    
    processedFiles.add(file.cjs);
  } else if (!processedFiles.has(file.cjs)) {
    console.log(`⚠️  文件不存在: ${file.js}`);
  }
}

console.log('构建后处理完成！');