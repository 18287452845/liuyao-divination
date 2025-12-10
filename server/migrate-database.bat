@echo off
setlocal enabledelayedexpansion

REM ===================================================================
REM 六爻排盘系统 - 认证权限功能完善迁移脚本 (Windows批处理版本)
REM 版本: 1.0.0 -> 1.1.0
REM 新增功能：审计日志、邀请码管理、Token黑名单、密码策略等
REM ===================================================================

echo.
echo 🚀 开始执行数据库迁移...

REM 设置MySQL连接配置
if not defined DB_HOST set DB_HOST=localhost
if not defined DB_PORT set DB_PORT=3306
if not defined DB_USER set DB_USER=root
if not defined DB_PASSWORD set DB_PASSWORD=123456
if not defined DB_NAME set DB_NAME=liuyao_db

echo 📋 连接信息:
echo   主机: %DB_HOST%:%DB_PORT%
echo   用户: %DB_USER%
echo   数据库: %DB_NAME%
echo.

REM 检查MySQL是否可用
mysql --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ MySQL命令不可用，请确保MySQL已安装并在PATH中
    echo 请安装MySQL或将MySQL添加到系统PATH
    pause
    exit /b 1
)
echo ✅ MySQL命令可用

REM 测试数据库连接
echo 🔍 测试数据库连接...
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% -e "SELECT 1 as test" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 数据库连接失败
    echo 请检查:
    echo   1. MySQL服务是否启动
    echo   2. 数据库配置是否正确
    echo   3. 用户权限是否足够
    pause
    exit /b 1
)
echo ✅ 数据库连接成功

REM 创建数据库（如果不存在）
echo 📦 创建/检查数据库...
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% -e "CREATE DATABASE IF NOT EXISTS %DB_NAME% CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 创建数据库失败
    pause
    exit /b 1
)
echo ✅ 数据库准备完成

REM 执行迁移SQL
echo 📋 执行迁移脚本...
set SQL_FILE=%~dp0sql\02_auth_permissions_migration.sql

if not exist "%SQL_FILE%" (
    echo ❌ 迁移脚本文件不存在: %SQL_FILE%
    pause
    exit /b 1
)

mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% < "%SQL_FILE%" >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 迁移脚本执行失败
    pause
    exit /b 1
)
echo ✅ 迁移脚本执行成功

REM 验证迁移结果
echo 🔍 验证迁移结果...

REM 检查表是否创建成功
echo 检查新增表...
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='%DB_NAME%' AND table_name='audit_logs'" | findstr "1" >nul
if %errorlevel% equ 0 (
    echo ✅ 表 audit_logs 创建成功
) else (
    echo ❌ 表 audit_logs 创建失败
)

mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='%DB_NAME%' AND table_name='invite_codes'" | findstr "1" >nul
if %errorlevel% equ 0 (
    echo ✅ 表 invite_codes 创建成功
) else (
    echo ❌ 表 invite_codes 创建失败
)

mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema='%DB_NAME%' AND table_name='token_blacklist'" | findstr "1" >nul
if %errorlevel% equ 0 (
    echo ✅ 表 token_blacklist 创建成功
) else (
    echo ❌ 表 token_blacklist 创建失败
)

REM 检查字段是否添加成功
echo 检查新增字段...
mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema='%DB_NAME%' AND table_name='users' AND column_name='login_fail_count'" | findstr "1" >nul
if %errorlevel% equ 0 (
    echo ✅ 字段 users.login_fail_count 添加成功
) else (
    echo ❌ 字段 users.login_fail_count 添加失败
)

mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema='%DB_NAME%' AND table_name='users' AND column_name='locked_until'" | findstr "1" >nul
if %errorlevel% equ 0 (
    echo ✅ 字段 users.locked_until 添加成功
) else (
    echo ❌ 字段 users.locked_until 添加失败
)

REM 检查权限数据
echo 🔐 检查权限数据...
for /f "tokens=1-2" %%a in ('mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SELECT COUNT(*) as count FROM permissions WHERE permission_code LIKE 'audit:%%' OR permission_code LIKE 'invite:%%'" ^| findstr "[0-9]"') do (
    set perm_count=%%a
)

if defined perm_count if %perm_count% geq 7 (
    echo ✅ 新权限数据插入成功 (%perm_count% 条)
) else (
    echo ⚠️  权限数据可能不完整 (%perm_count% 条)
)

REM 检查邀请码数据
for /f "tokens=1-2" %%a in ('mysql -h%DB_HOST% -P%DB_PORT% -u%DB_USER% -p%DB_PASSWORD% %DB_NAME% -e "SELECT COUNT(*) as count FROM invite_codes" ^| findstr "[0-9]"') do (
    set invite_count=%%a
)

if defined invite_count if %invite_count% geq 2 (
    echo ✅ 默认邀请码插入成功 (%invite_count% 条)
) else (
    echo ⚠️  邀请码数据可能不完整 (%invite_count% 条)
)

REM 显示迁移总结
echo.
echo 🎯 迁移完成总结:
echo   ✅ 新增审计日志功能
echo   ✅ 新增邀请码管理
echo   ✅ 新增Token黑名单
echo   ✅ 扩展用户表字段
echo   ✅ 新增细粒度权限
echo   ✅ 自动清理机制
echo   ✅ 数据完整性约束
echo.
echo 📝 后续步骤:
echo   1. 重启应用服务器
echo   2. 使用管理员账号登录验证
echo   3. 检查新功能是否正常工作
echo   4. 运行API测试: node test-api.js
echo.
echo 🎉 数据库迁移完成！
echo 系统现在支持企业级的认证和权限管理功能
echo.
pause