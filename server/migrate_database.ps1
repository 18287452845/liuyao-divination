# ===================================================================
# 六爻排盘系统 - 数据库迁移脚本 (PowerShell版本)
# 版本: 2.0
# 功能: 完整的数据库初始化和认证权限管理增强
# ===================================================================

# 设置控制台编码为UTF-8
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8

Write-Host "================================" -ForegroundColor Cyan
Write-Host "六爻排盘系统 数据库迁移脚本" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# MySQL连接配置
$env:MYSQL_USER = "root"
$env:MYSQL_PASSWORD = "123456"
$env:MYSQL_HOST = "localhost"
$env:MYSQL_PORT = "3306"

# 可配置参数
param(
    [string]$User = $env:MYSQL_USER,
    [string]$Password = $env:MYSQL_PASSWORD,
    [string]$Host = $env:MYSQL_HOST,
    [string]$Port = $env:MYSQL_PORT,
    [switch]$SkipInit = $false,
    [switch]$SkipData = $false,
    [switch]$SkipEnhancement = $false,
    [switch]$Force = $false
)

# 检查MySQL命令是否可用
function Test-MySQLCommand {
    try {
        $null = Get-Command mysql -ErrorAction Stop
        return $true
    }
    catch {
        Write-Host "[错误] 未找到MySQL命令" -ForegroundColor Red
        Write-Host "请确保MySQL已安装并添加到PATH环境变量" -ForegroundColor Yellow
        return $false
    }
}

# 测试MySQL连接
function Test-MySQLConnection {
    param($User, $Password, $Host, $Port)
    
    try {
        $result = & mysql -h"$Host" -P"$Port" -u"$User" -p"$Password" -e "SELECT VERSION();" 2>&1
        if ($LASTEXITCODE -eq 0) {
            return $true
        }
        else {
            Write-Host "[错误] MySQL连接失败" -ForegroundColor Red
            Write-Host "请检查以下配置:" -ForegroundColor Yellow
            Write-Host "  - 用户名: $User" -ForegroundColor Yellow
            Write-Host "  - 密码: $Password" -ForegroundColor Yellow
            Write-Host "  - 主机: $Host" -ForegroundColor Yellow
            Write-Host "  - 端口: $Port" -ForegroundColor Yellow
            Write-Host "  - MySQL服务是否已启动" -ForegroundColor Yellow
            return $false
        }
    }
    catch {
        Write-Host "[错误] 连接测试异常: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 执行SQL文件
function Invoke-SQLFile {
    param($File, $Description)
    
    if (-not (Test-Path $File)) {
        Write-Host "[错误] SQL文件不存在: $File" -ForegroundColor Red
        return $false
    }
    
    Write-Host "正在执行: $Description..." -ForegroundColor Green
    try {
        $result = & mysql -h"$Host" -P"$Port" -u"$User" -p"$Password" < $File 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "[成功] $Description 完成" -ForegroundColor Green
            return $true
        }
        else {
            Write-Host "[错误] $Description 失败" -ForegroundColor Red
            Write-Host $result -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "[错误] 执行SQL文件异常: $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# 验证数据库结构
function Test-DatabaseStructure {
    Write-Host "正在验证数据库结构..." -ForegroundColor Green
    
    $queries = @(
        "SELECT '八卦数据' as table_name, COUNT(*) as count FROM trigrams",
        "SELECT '卦象数据' as table_name, COUNT(*) as count FROM gua_data",
        "SELECT '用户表' as table_name, COUNT(*) as count FROM users",
        "SELECT '角色表' as table_name, COUNT(*) as count FROM roles",
        "SELECT '权限表' as table_name, COUNT(*) as count FROM permissions"
    )
    
    foreach ($query in $queries) {
        try {
            $result = & mysql -h"$Host" -P"$Port" -u"$User" -p"$Password" -D"liuyao_db" -e $query 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Host $result -ForegroundColor White
            }
        }
        catch {
            Write-Host "[警告] 验证查询失败: $query" -ForegroundColor Yellow
        }
    }
}

# 显示迁移结果
function Show-MigrationResult {
    Write-Host ""
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "数据库迁移完成!" -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "数据库信息:" -ForegroundColor White
    Write-Host "  - 数据库名: liuyao_db" -ForegroundColor White
    Write-Host "  - 用户名: $User" -ForegroundColor White
    Write-Host "  - 主机: $Host" -ForegroundColor White
    Write-Host "  - 端口: $Port" -ForegroundColor White
    Write-Host ""
    Write-Host "默认账号:" -ForegroundColor White
    Write-Host "  - 管理员: admin / admin123" -ForegroundColor Yellow
    Write-Host "  - 测试用户: testuser / test123" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "新增功能:" -ForegroundColor White
    Write-Host "  - 登录日志记录" -ForegroundColor Green
    Write-Host "  - 操作日志审计" -ForegroundColor Green
    Write-Host "  - Token黑名单管理" -ForegroundColor Green
    Write-Host "  - 邮箱验证功能" -ForegroundColor Green
    Write-Host "  - 用户会话管理" -ForegroundColor Green
    Write-Host "  - 双因素认证支持" -ForegroundColor Green
    Write-Host "  - 账号锁定机制" -ForegroundColor Green
    Write-Host ""
    Write-Host "详细说明请查看: sql\README.md" -ForegroundColor Yellow
    Write-Host ""
}

# 主执行流程
function Main {
    # 显示配置信息
    Write-Host "数据库配置:" -ForegroundColor White
    Write-Host "  - 主机: $Host" -ForegroundColor White
    Write-Host "  - 端口: $Port" -ForegroundColor White
    Write-Host "  - 用户: $User" -ForegroundColor White
    Write-Host ""
    
    # 检查MySQL命令
    if (-not (Test-MySQLCommand)) {
        exit 1
    }
    
    # 测试MySQL连接
    if (-not (Test-MySQLConnection -User $User -Password $Password -Host $Host -Port $Port)) {
        exit 1
    }
    
    Write-Host "[成功] MySQL连接正常" -ForegroundColor Green
    Write-Host ""
    
    $errorCount = 0
    
    # 步骤1: 创建数据库和表结构
    if (-not $SkipInit) {
        Write-Host "步骤 1/3: 创建数据库和表结构..." -ForegroundColor Cyan
        Write-Host ""
        
        $files = @(
            @{ File = "sql\00_init_complete.sql"; Description = "数据库和表结构初始化" }
        )
        
        foreach ($item in $files) {
            if (-not (Invoke-SQLFile -File $item.File -Description $item.Description)) {
                $errorCount++
                if (-not $Force) {
                    Write-Host "使用 -Force 参数可忽略错误继续执行" -ForegroundColor Yellow
                    exit 1
                }
            }
        }
    }
    else {
        Write-Host "跳过数据库初始化 (-SkipInit)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    # 步骤2: 插入基础数据
    if (-not $SkipData) {
        Write-Host "步骤 2/3: 插入基础数据..." -ForegroundColor Cyan
        Write-Host ""
        
        $files = @(
            @{ File = "sql\01_init_data.sql"; Description = "基础数据插入" }
        )
        
        foreach ($item in $files) {
            if (-not (Invoke-SQLFile -File $item.File -Description $item.Description)) {
                $errorCount++
                if (-not $Force) {
                    Write-Host "使用 -Force 参数可忽略错误继续执行" -ForegroundColor Yellow
                    exit 1
                }
            }
        }
    }
    else {
        Write-Host "跳过基础数据插入 (-SkipData)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    # 步骤3: 认证权限管理增强
    if (-not $SkipEnhancement) {
        Write-Host "步骤 3/3: 认证权限管理增强..." -ForegroundColor Cyan
        Write-Host ""
        
        $files = @(
            @{ File = "sql\02_auth_permissions_enhancement.sql"; Description = "认证权限管理增强功能" }
        )
        
        foreach ($item in $files) {
            if (-not (Invoke-SQLFile -File $item.File -Description $item.Description)) {
                $errorCount++
                if (-not $Force) {
                    Write-Host "使用 -Force 参数可忽略错误继续执行" -ForegroundColor Yellow
                    exit 1
                }
            }
        }
    }
    else {
        Write-Host "跳过认证权限增强 (-SkipEnhancement)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    
    # 验证数据库结构
    Write-Host "步骤 4/4: 验证数据库结构..." -ForegroundColor Cyan
    Test-DatabaseStructure
    
    # 显示结果
    Show-MigrationResult
    
    if ($errorCount -gt 0) {
        Write-Host "[警告] 迁移过程中发生 $errorCount 个错误" -ForegroundColor Yellow
        Write-Host "请检查上述错误信息并手动修复" -ForegroundColor Yellow
        exit 1
    }
    else {
        Write-Host "[成功] 数据库迁移完全成功!" -ForegroundColor Green
        exit 0
    }
}

# 显示帮助信息
function Show-Help {
    Write-Host "用法: .\migrate_database.ps1 [参数]" -ForegroundColor White
    Write-Host ""
    Write-Host "参数:" -ForegroundColor White
    Write-Host "  -User <用户名>        MySQL用户名 (默认: root)" -ForegroundColor White
    Write-Host "  -Password <密码>       MySQL密码 (默认: 123456)" -ForegroundColor White
    Write-Host "  -Host <主机>          MySQL主机 (默认: localhost)" -ForegroundColor White
    Write-Host "  -Port <端口>          MySQL端口 (默认: 3306)" -ForegroundColor White
    Write-Host "  -SkipInit            跳过数据库初始化" -ForegroundColor White
    Write-Host "  -SkipData            跳过基础数据插入" -ForegroundColor White
    Write-Host "  -SkipEnhancement     跳过认证权限增强功能" -ForegroundColor White
    Write-Host "  -Force               忽略错误继续执行" -ForegroundColor White
    Write-Host "  -Help                显示此帮助信息" -ForegroundColor White
    Write-Host ""
    Write-Host "示例:" -ForegroundColor White
    Write-Host "  .\migrate_database.ps1" -ForegroundColor Gray
    Write-Host "  .\migrate_database.ps1 -User myuser -Password mypass" -ForegroundColor Gray
    Write-Host "  .\migrate_database.ps1 -SkipInit -SkipData" -ForegroundColor Gray
    Write-Host "  .\migrate_database.ps1 -Force" -ForegroundColor Gray
    Write-Host ""
}

# 检查是否显示帮助
if ($args -contains "-Help" -or $args -contains "--help" -or $args -contains "-h") {
    Show-Help
    exit 0
}

# 显示开始信息
Write-Host "开始执行数据库迁移..." -ForegroundColor Cyan
Write-Host "使用 -Help 参数查看详细用法" -ForegroundColor Gray
Write-Host ""

# 执行主流程
try {
    Main
}
catch {
    Write-Host "[致命错误] 迁移过程中发生异常: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host $_.ScriptStackTrace -ForegroundColor Red
    exit 1
}