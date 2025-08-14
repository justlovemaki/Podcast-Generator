@echo off
echo 正在启动 PodcastHub 播客生成器...

echo.
echo 1. 检查 Node.js 环境...
node --version
if %errorlevel% neq 0 (
    echo 错误: 未找到 Node.js，请先安装 Node.js
    pause
    exit /b 1
)

echo.
echo 2. 安装依赖包...
npm install
if %errorlevel% neq 0 (
    echo 错误: 依赖安装失败
    pause
    exit /b 1
)

echo.
echo 3. 启动开发服务器...
echo 应用将在 http://localhost:3000 启动
echo 按 Ctrl+C 停止服务器
echo.

npm run dev