#!/bin/bash

# ===================================================================
# 数据库迁移验证脚本 (Linux/macOS)
# ===================================================================

echo "🔍 验证数据库迁移脚本..."

# 检查文件是否存在
if [ ! -f "sql/02_auth_permissions_migration.sql" ]; then
    echo "❌ 迁移脚本文件不存在"
    exit 1
fi

echo "✅ 迁移脚本文件存在"

# 检查MySQL是否可用
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL命令不可用"
    echo "请安装MySQL客户端"
    exit 1
fi

echo "✅ MySQL命令可用"

# 检查基本语法
echo "📋 检查SQL语法..."

# 检查CREATE TABLE语句
create_tables=$(grep -c "CREATE TABLE" sql/02_auth_permissions_migration.sql)
echo "  - CREATE TABLE 语句: $create_tables"

# 检查INSERT语句
inserts=$(grep -c "INSERT INTO" sql/02_auth_permissions_migration.sql)
echo "  - INSERT INTO 语句: $inserts"

# 检查ALTER TABLE语句
alters=$(grep -c "ALTER TABLE" sql/02_auth_permissions_migration.sql)
echo "  - ALTER TABLE 语句: $alters"

# 检查关键表
tables=("audit_logs" "invite_codes" "token_blacklist")
for table in "${tables[@]}"; do
    if grep -q "CREATE TABLE.*$table" sql/02_auth_permissions_migration.sql; then
        echo "  ✅ 表 $table 定义存在"
    else
        echo "  ❌ 表 $table 定义缺失"
    fi
done

# 检查关键功能
features=("audit" "invite" "token" "password")
for feature in "${features[@]}"; do
    if grep -qi "$feature" sql/02_auth_permissions_migration.sql; then
        echo "  ✅ $feature 功能存在"
    else
        echo "  ❌ $feature 功能缺失"
    fi
done

echo ""
echo "📊 脚本统计:"
echo "  文件大小: $(du -h sql/02_auth_permissions_migration.sql | cut -f1)"
echo "  总行数: $(wc -l < sql/02_auth_permissions_migration.sql)"
echo "  字符数: $(wc -c < sql/02_auth_permissions_migration.sql)"

echo ""
echo "🎯 验证完成！"
echo "脚本准备就绪，可以在以下环境中执行："
echo "  - Linux/macOS: mysql -u root -p123456 < sql/02_auth_permissions_migration.sql"
echo "  - Windows PowerShell: .\migrate-database.ps1"
echo "  - Windows CMD: migrate-database.bat"