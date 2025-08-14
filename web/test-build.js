#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🔍 检查Next.js应用构建状态...\n');

// 检查TypeScript类型
console.log('1. 检查TypeScript类型...');
const typeCheck = spawn('npm', ['run', 'type-check'], {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

typeCheck.on('close', (code) => {
  if (code === 0) {
    console.log('✅ TypeScript类型检查通过\n');
    
    // 检查ESLint
    console.log('2. 检查代码规范...');
    const lint = spawn('npm', ['run', 'lint'], {
      stdio: 'inherit',
      shell: true,
      cwd: __dirname
    });
    
    lint.on('close', (lintCode) => {
      if (lintCode === 0) {
        console.log('✅ 代码规范检查通过\n');
        
        // 尝试构建
        console.log('3. 尝试构建应用...');
        const build = spawn('npm', ['run', 'build'], {
          stdio: 'inherit',
          shell: true,
          cwd: __dirname
        });
        
        build.on('close', (buildCode) => {
          if (buildCode === 0) {
            console.log('\n🎉 应用构建成功！');
            console.log('\n📋 下一步：');
            console.log('1. 配置环境变量：编辑 .env.local');
            console.log('2. 启动开发服务器：npm run dev');
            console.log('3. 访问应用：http://localhost:3000');
          } else {
            console.log('\n❌ 构建失败，请检查错误信息');
            process.exit(1);
          }
        });
      } else {
        console.log('\n⚠️  代码规范检查有警告，但可以继续');
      }
    });
  } else {
    console.log('\n❌ TypeScript类型检查失败');
    process.exit(1);
  }
});