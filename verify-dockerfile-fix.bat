@echo off
REM Docker 构建修复验证脚本（Windows 版本）

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  Docker 构建修复验证脚本 (Windows)
echo ========================================
echo.

REM 1. 验证 Dockerfile 配置
echo [1/4] 验证 Dockerfile 配置...

findstr /M "FROM node:18-alpine AS builder" server\Dockerfile >nul
if errorlevel 1 (
    echo  ❌ 多阶段构建（Builder）配置缺失
    exit /b 1
)
echo  ✅ 多阶段构建（Builder）已配置

findstr /M "COPY --from=builder /app/dist" server\Dockerfile >nul
if errorlevel 1 (
    echo  ❌ 多阶段复制配置缺失
    exit /b 1
)
echo  ✅ 多阶段复制（--from=builder）已配置

echo.

REM 2. 检查 package.json
echo [2/4] 验证 package.json...

if not exist server\package.json (
    echo  ❌ server\package.json 不存在
    exit /b 1
)

findstr /M "tsc" server\package.json >nul
if errorlevel 1 (
    echo  ❌ build 脚本缺失或不是 tsc
    exit /b 1
)
echo  ✅ server\package.json 包含 build 脚本

if not exist server\tsconfig.json (
    echo  ❌ server\tsconfig.json 不存在
    exit /b 1
)
echo  ✅ server\tsconfig.json 存在

echo.

REM 3. 检查 Docker
echo [3/4] 验证 Docker 环境...

docker --version >nul 2>&1
if errorlevel 1 (
    echo  ❌ Docker 未安装或不在 PATH 中
    echo  请先安装 Docker Desktop
    exit /b 1
)

for /f "tokens=*" %%i in ('docker --version') do set docker_version=%%i
echo  ✅ Docker 已安装: !docker_version!

echo.

REM 4. 尝试构建镜像
echo [4/4] 构建后端镜像（这可能需要几分钟）...

docker build -t liuyao-server:verify ./server >nul 2>&1
if errorlevel 1 (
    echo  ❌ 后端镜像构建失败
    echo  运行以查看详细错误:
    echo  docker build -t liuyao-server:verify ./server
    exit /b 1
)

echo  ✅ 后端镜像构建成功

docker rmi liuyao-server:verify >nul 2>&1

echo.
echo ========================================
echo  ✅ 所有验证通过！修复有效
echo ========================================
echo.

echo 下一步：
echo  1. 推送到 GitHub:
echo     git add server\Dockerfile
echo     git commit -m "fix: Fix server Dockerfile build failure"
echo     git push origin ci-ghcr-github-actions-docker-compose-setup
echo.
echo  2. 验证 GitHub Actions:
echo     进入 GitHub 仓库 → Actions 标签 → 查看最新工作流
echo.

pause
