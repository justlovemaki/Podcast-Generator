#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 PodcastHub Web应用设置向导\n');

// 检查Node.js版本
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion < 18) {
  console.error('❌ 需要Node.js 18或更高版本');
  console.error(`   当前版本: ${nodeVersion}`);
  process.exit(1);
}

console.log('✅ Node.js版本检查通过');

// 检查Python环境
try {
  const pythonVersion = execSync('python --version', { encoding: 'utf8' });
  console.log(`✅ Python环境: ${pythonVersion.trim()}`);
} catch (error) {
  console.error('❌ 未找到Python环境，请确保Python已安装并在PATH中');
  process.exit(1);
}

// 检查父目录中的Python脚本
const pythonScriptPath = path.join(__dirname, '../../podcast_generator.py');
if (!fs.existsSync(pythonScriptPath)) {
  console.error('❌ 未找到podcast_generator.py脚本');
  console.error(`   期望路径: ${pythonScriptPath}`);
  process.exit(1);
}

console.log('✅ Python播客生成器脚本找到');

// 创建环境变量文件
const envPath = path.join(__dirname, '../.env.local');
if (!fs.existsSync(envPath)) {
  const envExample = path.join(__dirname, '../.env.example');
  if (fs.existsSync(envExample)) {
    fs.copyFileSync(envExample, envPath);
    console.log('✅ 已创建.env.local文件');
    console.log('⚠️  请编辑.env.local文件，配置您的OpenAI API密钥');
  }
} else {
  console.log('✅ 环境配置文件已存在');
}

// 安装依赖
console.log('\n📦 安装依赖包...');
try {
  execSync('npm install', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
  console.log('✅ 依赖安装完成');
} catch (error) {
  console.error('❌ 依赖安装失败');
  process.exit(1);
}

// 创建输出目录
const outputDir = path.join(__dirname, '../../output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
  console.log('✅ 已创建输出目录');
}

console.log('\n🎉 设置完成！');
console.log('\n下一步：');
console.log('1. 编辑 .env.local 文件，配置您的OpenAI API密钥');
console.log('2. 运行 npm run dev 启动开发服务器');
console.log('3. 在浏览器中打开 http://localhost:3000');
console.log('\n享受使用PodcastHub！🎙️');