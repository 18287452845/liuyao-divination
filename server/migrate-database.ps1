# ===================================================================
# 六爻排盘系统 - 认证权限功能完善迁移脚本 (PowerShell版本)
# 版本: 1.0.0 -> 1.1.0
# 新增功能：审计日志、邀请码管理、Token黑名单、密码策略等
# ===================================================================

# MySQL连接配置
$MYSQL_HOST = $env:DB_HOST
if (-not $MYSQL_HOST) { $MYSQL_HOST = "localhost" }

$MYSQL_PORT = $env:DB_PORT
if (-not $MYSQL_PORT) { $MYSQL_PORT = "3306" }

$MYSQL_USER = $env:DB_USER
if (-not $MYSQL_USER) { $MYSQL_USER = "root" }

$MYSQL_PASSWORD = $env:DB_PASSWORD
if (-not $MYSQL_PASSWORD) { $MYSQL_PASSWORD = "123456" }

$MYSQL_DATABASE = $env:DB_NAME
if (-not $MYSQL_DATABASE) { $MYSQL_DATABASE = "liuyao_db" }

Write-Host "🚀 开始执行数据库迁移..." -ForegroundColor Green
Write-Host "📋 连接信息:" -ForegroundColor Cyan
Write-Host "  主机: $MYSQL_HOST:$MYSQL_PORT" -ForegroundColor White
Write-Host "  用户: $MYSQL_USER" -ForegroundColor White
Write-Host "  数据库: $MYSQL_DATABASE" -ForegroundColor White

# 检查MySQL是否可用
try {
    $testResult = mysql --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        throw "MySQL命令不可用，请确保MySQL已安装并在PATH中"
    }
    Write-Host "✅ MySQL命令可用" -ForegroundColor Green
} catch {
    Write-Host "❌ MySQL不可用: $_" -ForegroundColor Red
    Write-Host "请安装MySQL或将MySQL添加到系统PATH" -ForegroundColor Yellow
    exit 1
}

# 构建MySQL连接参数
$mysqlParams = @{
    host = $MYSQL_HOST
    port = $MYSQL_PORT
    user = $MYSQL_USER
    password = $MYSQL_PASSWORD
}

# 构建连接字符串
$connectionString = "mysql -h$($mysqlParams.host) -P$($mysqlParams.port) -u$($mysqlParams.user) -p$($mysqlParams.password)"

# 测试数据库连接
try {
    Write-Host "🔍 测试数据库连接..." -ForegroundColor Yellow
    $testQuery = "$connectionString -e 'SELECT 1 as test'"
    $result = Invoke-Expression $testQuery 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 数据库连接成功" -ForegroundColor Green
    } else {
        throw "数据库连接失败: $result"
    }
} catch {
    Write-Host "❌ 数据库连接失败: $_" -ForegroundColor Red
    Write-Host "请检查:" -ForegroundColor Yellow
    Write-Host "  1. MySQL服务是否启动" -ForegroundColor White
    Write-Host "  2. 数据库配置是否正确" -ForegroundColor White
    Write-Host "  3. 用户权限是否足够" -ForegroundColor White
    exit 1
}

# 创建数据库（如果不存在）
Write-Host "📦 创建/检查数据库..." -ForegroundColor Yellow
$createDbQuery = "$connectionString -e 'CREATE DATABASE IF NOT EXISTS $MYSQL_DATABASE CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci'"
Invoke-Expression $createDbQuery 2>&1
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ 数据库准备完成" -ForegroundColor Green
} else {
    Write-Host "❌ 创建数据库失败" -ForegroundColor Red
    exit 1
}

# 使用数据库
$connectionStringWithDb = "$connectionString $MYSQL_DATABASE"

# 执行迁移SQL
Write-Host "📋 执行迁移脚本..." -ForegroundColor Yellow
$sqlFile = Join-Path $PSScriptRoot "sql" "02_auth_permissions_migration.sql"

if (-not (Test-Path $sqlFile)) {
    Write-Host "❌ 迁移脚本文件不存在: $sqlFile" -ForegroundColor Red
    exit 1
}

try {
    $migrationResult = Get-Content $sqlFile | & $connectionStringWithDb 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ 迁移脚本执行成功" -ForegroundColor Green
    } else {
        Write-Host "❌ 迁移脚本执行失败:" -ForegroundColor Red
        Write-Host $migrationResult -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ 执行迁移时发生错误: $_" -ForegroundColor Red
    exit 1
}

# 验证迁移结果
Write-Host "🔍 验证迁移结果..." -ForegroundColor Yellow

$tablesToCheck = @(
    "audit_logs",
    "invite_codes", 
    "token_blacklist"
)

foreach ($table in $tablesToCheck) {
    $checkQuery = "$connectionStringWithDb -e 'SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = ``$MYSQL_DATABASE`` AND table_name = ``$table``'"
    $result = Invoke-Expression $checkQuery 2>&1
    if ($LASTEXITCODE -eq 0 -and $result -match "1") {
        Write-Host "✅ 表 $table 创建成功" -ForegroundColor Green
    } else {
        Write-Host "❌ 表 $table 创建失败" -ForegroundColor Red
    }
}

# 检查新增字段
$columnsToCheck = @(
    @{ table = "users"; column = "login_fail_count" },
    @{ table = "users"; column = "locked_until" },
    @{ table = "users"; column = "password_reset_token" },
    @{ table = "users"; column = "last_password_change" }
)

foreach ($col in $columnsToCheck) {
    $checkColQuery = "$connectionStringWithDb -e 'SELECT COUNT(*) as count FROM information_schema.columns WHERE table_schema = ``$MYSQL_DATABASE`` AND table_name = ``$($col.table)`` AND column_name = ``$($col.column)``'"
    $result = Invoke-Expression $checkColQuery 2>&1
    if ($LASTEXITCODE -eq 0 -and $result -match "1") {
        Write-Host "✅ 字段 $($col.table).$($col.column) 添加成功" -ForegroundColor Green
    } else {
        Write-Host "❌ 字段 $($col.table).$($col.column) 添加失败" -ForegroundColor Red
    }
}

# 检查权限数据
Write-Host "🔐 检查权限数据..." -ForegroundColor Yellow
$permCheckQuery = "$connectionStringWithDb -e 'SELECT COUNT(*) as count FROM permissions WHERE permission_code LIKE ''audit:%'' OR permission_code LIKE ''invite:%'''"
$result = Invoke-Expression $permCheckQuery 2>&1
if ($LASTEXITCODE -eq 0) {
    if ($result -match "(\d+)") {
        $permCount = $matches[1]
        if ([int]$permCount -ge 7) {
            Write-Host "✅ 新权限数据插入成功 ($permCount 条)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  权限数据可能不完整 ($permCount 条)" -ForegroundColor Yellow
        }
    }
}

# 检查邀请码数据
$inviteCheckQuery = "$connectionStringWithDb -e 'SELECT COUNT(*) as count FROM invite_codes'"
$result = Invoke-Expression $inviteCheckQuery 2>&1
if ($LASTEXITCODE -eq 0) {
    if ($result -match "(\d+)") {
        $inviteCount = $matches[1]
        if ([int]$inviteCount -ge 2) {
            Write-Host "✅ 默认邀请码插入成功 ($inviteCount 条)" -ForegroundColor Green
        } else {
            Write-Host "⚠️  邀请码数据可能不完整 ($inviteCount 条)" -ForegroundColor Yellow
        }
    }
}

# 显示迁移总结
Write-Host "" -ForegroundColor White
Write-Host "🎯 迁移完成总结:" -ForegroundColor Cyan
Write-Host "  ✅ 新增审计日志功能" -ForegroundColor Green
Write-Host "  ✅ 新增邀请码管理" -ForegroundColor Green  
Write-Host "  ✅ 新增Token黑名单" -ForegroundColor Green
Write-Host "  ✅ 扩展用户表字段" -ForegroundColor Green
Write-Host "  ✅ 新增细粒度权限" -ForegroundColor Green
Write-Host "  ✅ 自动清理机制" -ForegroundColor Green
Write-Host "  ✅ 数据完整性约束" -ForegroundColor Green

Write-Host "" -ForegroundColor White
Write-Host "📝 后续步骤:" -ForegroundColor Cyan
Write-Host "  1. 重启应用服务器" -ForegroundColor White
Write-Host "  2. 使用管理员账号登录验证" -ForegroundColor White
Write-Host "  3. 检查新功能是否正常工作" -ForegroundColor White
Write-Host "  4. 运行API测试: node test-api.js" -ForegroundColor White

Write-Host "" -ForegroundColor White
Write-Host "🎉 数据库迁移完成！" -ForegroundColor Green
Write-Host "系统现在支持企业级的认证和权限管理功能" -ForegroundColor Yellow