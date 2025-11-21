@echo off
chcp 65001 >nul
echo ================================
echo 六爻排盘系统 MySQL数据库初始化
echo ================================
echo.

REM 设置MySQL连接信息
set MYSQL_USER=root
set MYSQL_PASSWORD=123456
set MYSQL_HOST=localhost

echo 正在检查MySQL连接...
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% -e "SELECT VERSION();" >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 无法连接到MySQL服务器
    echo 请确认:
    echo 1. MySQL服务已启动
    echo 2. 用户名和密码正确
    echo 3. MySQL在PATH环境变量中
    pause
    exit /b 1
)

echo [成功] MySQL连接正常
echo.

echo 步骤 1/3: 创建数据库和表结构...
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% < sql\init_database.sql
if %errorlevel% neq 0 (
    echo [错误] 数据库初始化失败
    pause
    exit /b 1
)
echo [成功] 数据库和表创建完成
echo.

echo 步骤 2/3: 插入基础数据...
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% < sql\insert_data.sql
if %errorlevel% neq 0 (
    echo [错误] 数据插入失败
    pause
    exit /b 1
)
echo [成功] 基础数据插入完成
echo.

echo 步骤 3/3: 验证数据...
mysql -h %MYSQL_HOST% -u %MYSQL_USER% -p%MYSQL_PASSWORD% -D liuyao_db -e "SELECT '八卦数据:' as info, COUNT(*) as count FROM trigrams UNION ALL SELECT '卦象数据:', COUNT(*) FROM gua_data;"
echo.

echo ================================
echo 数据库初始化完成!
echo ================================
echo.
echo 数据库信息:
echo - 数据库名: liuyao_db
echo - 用户名: %MYSQL_USER%
echo - 密码: %MYSQL_PASSWORD%
echo - 主机: %MYSQL_HOST%
echo.
echo 您现在可以配置应用程序连接到MySQL数据库
echo 详细说明请查看 sql\README.md
echo.
pause
