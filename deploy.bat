@echo off
REM 六爻排盘系统 - Windows生产环境部署脚本

echo ================================
echo 开始部署六爻排盘系统
echo ================================

REM 安装依赖
echo.
echo [1/5] 安装项目依赖...
call npm install
cd server && call npm install && cd ..
cd client && call npm install && cd ..
echo ✓ 依赖安装完成

REM 构建前端
echo.
echo [2/5] 构建前端项目...
cd client
call npm run build
if errorlevel 1 (
    echo ✗ 前端构建失败
    exit /b 1
)
echo ✓ 前端构建成功
cd ..

REM 构建后端
echo.
echo [3/5] 构建后端项目...
cd server
call npm run build
if errorlevel 1 (
    echo ✗ 后端构建失败
    exit /b 1
)
echo ✓ 后端构建成功
cd ..

REM 创建日志目录
echo.
echo [4/5] 创建日志目录...
if not exist "logs" mkdir logs
echo ✓ 日志目录创建完成

REM 检查环境变量
echo.
echo [5/5] 检查环境配置...
if not exist "server\.env" (
    echo 警告: server\.env 文件不存在
    echo 请从 server\.env.example 复制并配置
    exit /b 1
)
echo ✓ 环境变量文件存在

echo.
echo ================================
echo 部署完成！
echo ================================
echo.
echo 应用信息:
echo   • 前端文件: .\client\dist
echo   • 后端文件: .\server\dist
echo.
echo 启动服务:
echo   前端: 配置Nginx或使用serve工具
echo   后端: cd server ^&^& node dist/index.js
echo.
echo 或使用PM2管理:
echo   npm install -g pm2
echo   pm2 start ecosystem.config.js
echo.

pause
