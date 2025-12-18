@echo off
REM GitHub Container Registry (GHCR) 部署脚本 - Windows 版本
REM 此脚本用于从 GHCR 拉取镜像并启动应用

setlocal enabledelayedexpansion

echo.
echo ========================================
echo GHCR Docker Compose 部署脚本 (Windows)
echo ========================================
echo.

REM 检查必需的工具
docker --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 docker，请先安装 Docker Desktop
    exit /b 1
)

docker-compose --version >nul 2>&1
if errorlevel 1 (
    echo 错误: 未找到 docker-compose，请确保 Docker Desktop 已安装且 docker-compose 可用
    exit /b 1
)

REM 检查 .env 文件
if not exist ".env" (
    if not exist ".env.ghcr.example" (
        echo 错误: 缺少 .env.ghcr.example 文件
        exit /b 1
    )
    echo 创建 .env 文件...
    copy .env.ghcr.example .env
    echo 已创建 .env 文件，请编辑它并设置正确的环境变量
    echo 特别是：GHCR_REPO, GHCR_USERNAME, GHCR_PASSWORD 等
    pause
    exit /b 1
)

REM 加载环境变量（简单实现，仅读取关键变量）
for /f "delims== tokens=1,2" %%a in (.env) do (
    if "%%a"=="GHCR_REGISTRY" set GHCR_REGISTRY=%%b
    if "%%a"=="GHCR_REPO" set GHCR_REPO=%%b
    if "%%a"=="IMAGE_TAG" set IMAGE_TAG=%%b
    if "%%a"=="SERVER_PORT" set SERVER_PORT=%%b
    if "%%a"=="CLIENT_HTTP_PORT" set CLIENT_HTTP_PORT=%%b
    if "%%a"=="GHCR_USERNAME" set GHCR_USERNAME=%%b
    if "%%a"=="GHCR_PASSWORD" set GHCR_PASSWORD=%%b
)

REM 设置默认值
if "!GHCR_REGISTRY!"=="" set GHCR_REGISTRY=ghcr.io
if "!GHCR_REPO!"=="" (
    echo 错误: 未设置 GHCR_REPO
    exit /b 1
)
if "!IMAGE_TAG!"=="" set IMAGE_TAG=latest
if "!SERVER_PORT!"=="" set SERVER_PORT=5000
if "!CLIENT_HTTP_PORT!"=="" set CLIENT_HTTP_PORT=80

echo 环境变量加载成功
echo   GHCR_REGISTRY: !GHCR_REGISTRY!
echo   GHCR_REPO: !GHCR_REPO!
echo   IMAGE_TAG: !IMAGE_TAG!
echo.

REM 登录到 GHCR（如果提供了用户名和密码）
if not "!GHCR_USERNAME!"=="" if not "!GHCR_PASSWORD!"=="" (
    echo 登录到 GHCR...
    echo !GHCR_PASSWORD! | docker login !GHCR_REGISTRY! -u !GHCR_USERNAME! --password-stdin
    echo GHCR 登录成功
    echo.
) else (
    echo 警告: 未提供 GHCR 登录凭据
    echo 如果镜像是私有的，部署可能会失败
    echo.
)

REM 检查是否有运行的容器
echo 检查现有容器...
docker-compose -f docker-compose.ghcr.yml ps 2>nul | find "liuyao" >nul
if not errorlevel 1 (
    echo 发现现有容器，将停止并删除...
    docker-compose -f docker-compose.ghcr.yml down
    echo 旧容器已删除
    echo.
)

REM 拉取最新镜像
echo 从 GHCR 拉取最新镜像...
docker-compose -f docker-compose.ghcr.yml pull
if errorlevel 1 (
    echo 错误: 拉取镜像失败
    exit /b 1
)
echo.

REM 启动服务
echo 启动服务...
docker-compose -f docker-compose.ghcr.yml up -d
if errorlevel 1 (
    echo 错误: 启动服务失败
    exit /b 1
)
echo.

REM 等待服务就绪
echo 等待服务就绪...
timeout /t 5 /nobreak

REM 检查服务状态
echo 检查服务状态...
docker-compose -f docker-compose.ghcr.yml ps
echo.

REM 检查后端健康状态
echo 检查后端服务健康状态...
set /a max_attempts=30
set /a attempt=0

:health_check_loop
if %attempt% geq %max_attempts% goto health_check_timeout

powershell -Command "try { $null = Invoke-WebRequest -Uri 'http://localhost:!SERVER_PORT!/api/health' -ErrorAction Stop; exit 0 } catch { exit 1 }"
if errorlevel 1 (
    set /a attempt=!attempt!+1
    echo 等待中... (!attempt!/%max_attempts%)
    timeout /t 2 /nobreak
    goto health_check_loop
)

echo.
echo ========================================
echo 部署成功！
echo ========================================
echo 服务已启动
echo.
echo 前端 (Nginx): http://localhost:!CLIENT_HTTP_PORT!
echo 后端 API:    http://localhost:!SERVER_PORT!/api
echo.
echo 查看日志:
echo   docker-compose -f docker-compose.ghcr.yml logs -f
echo   docker-compose -f docker-compose.ghcr.yml logs -f server
echo   docker-compose -f docker-compose.ghcr.yml logs -f client
echo.
echo 停止服务:
echo   docker-compose -f docker-compose.ghcr.yml down
echo.
echo 查看服务状态:
echo   docker-compose -f docker-compose.ghcr.yml ps
echo.
pause
exit /b 0

:health_check_timeout
echo 错误: 后端服务启动超时
echo 查看日志: docker-compose -f docker-compose.ghcr.yml logs server
echo.
pause
exit /b 1
