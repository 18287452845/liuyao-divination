#!/bin/bash

# 测试数据库迁移脚本

echo "================================"
echo "测试数据库迁移脚本"
echo "================================"
echo ""

# 测试1: 检查脚本语法
echo "测试1: 检查脚本语法..."
if bash -n migrate_database.sh; then
    echo "✓ Bash脚本语法正确"
else
    echo "✗ Bash脚本语法错误"
    exit 1
fi

if [ -f "migrate_database.ps1" ]; then
    echo "✓ PowerShell脚本存在"
else
    echo "✗ PowerShell脚本不存在"
fi

echo ""

# 测试2: 检查SQL文件
echo "测试2: 检查SQL文件..."
sql_files=(
    "sql/00_init_complete.sql"
    "sql/01_init_data.sql"
    "sql/02_auth_permissions_enhancement.sql"
)

for file in "${sql_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file 存在"
    else
        echo "✗ $file 不存在"
    fi
done

echo ""

# 测试3: 检查控制器文件
echo "测试3: 检查控制器文件..."
controller_files=(
    "src/controllers/logController.ts"
    "src/controllers/sessionController.ts"
    "src/controllers/securityController.ts"
    "src/controllers/emailController.ts"
)

for file in "${controller_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file 存在"
    else
        echo "✗ $file 不存在"
    fi
done

echo ""

# 测试4: 检查中间件文件
echo "测试4: 检查中间件文件..."
middleware_files=(
    "src/middleware/operationLog.ts"
    "src/middleware/enhancedAuth.ts"
)

for file in "${middleware_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file 存在"
    else
        echo "✗ $file 不存在"
    fi
done

echo ""

# 测试5: 检查文档
echo "测试5: 检查文档..."
doc_files=(
    "AUTH_PERMISSIONS_ENHANCEMENT.md"
)

for file in "${doc_files[@]}"; do
    if [ -f "$file" ]; then
        echo "✓ $file 存在"
    else
        echo "✗ $file 不存在"
    fi
done

echo ""

# 测试6: 检查脚本帮助
echo "测试6: 检查脚本帮助功能..."
if ./migrate_database.sh --help > /dev/null 2>&1; then
    echo "✓ 帮助功能正常"
else
    echo "✗ 帮助功能异常"
fi

echo ""

# 测试7: 检查脚本权限
echo "测试7: 检查脚本权限..."
if [ -x "migrate_database.sh" ]; then
    echo "✓ Bash脚本有执行权限"
else
    echo "✗ Bash脚本没有执行权限"
fi

echo ""

echo "================================"
echo "测试完成!"
echo "================================"
echo ""
echo "如需实际测试数据库迁移，请确保:"
echo "1. MySQL服务已启动"
echo "2. 数据库连接配置正确"
echo "3. 有足够的数据库权限"
echo ""
echo "运行迁移命令:"
echo "./migrate_database.sh"
echo ""
echo "或测试特定功能:"
echo "./migrate_database.sh --skip-init --skip-data"
echo ""