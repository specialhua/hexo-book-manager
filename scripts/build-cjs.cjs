#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 构建后处理脚本 - 将.js文件重命名为.cjs并修复引用
const distDir = path.join(__dirname, '../dist-electron');

console.log('开始构建后处理：将.js文件转换为.cjs...');

// 需要处理的文件映射
const filesToProcess = [
  { js: 'main.js', cjs: 'main.cjs' },
  { js: 'preload.js', cjs: 'preload.cjs' },
  { js: 'picgo-service.js', cjs: 'picgo-service.cjs' }
];

for (const file of filesToProcess) {
  const jsPath = path.join(distDir, file.js);
  const cjsPath = path.join(distDir, file.cjs);
  
  if (fs.existsSync(jsPath)) {
    console.log(`处理文件: ${file.js} -> ${file.cjs}`);
    
    // 读取文件内容
    let content = fs.readFileSync(jsPath, 'utf8');
    
    // 修复引用：将.js引用改为.cjs引用
    if (file.js === 'main.js') {
      content = content.replace(
        'require("./picgo-service.js")',
        'require("./picgo-service.cjs")'
      );
      content = content.replace(
        'preload.js',
        'preload.cjs'
      );
      console.log('  修复了picgo-service和preload引用');
    }
    
    // 写入.cjs文件
    fs.writeFileSync(cjsPath, content, 'utf8');
    console.log(`  ✅ 生成 ${file.cjs}`);
    
    // 删除原.js文件
    fs.unlinkSync(jsPath);
    console.log(`  🗑️  删除 ${file.js}`);
  } else {
    console.log(`⚠️  文件不存在: ${file.js}`);
  }
}

console.log('构建后处理完成！');