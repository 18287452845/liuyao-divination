#!/bin/bash

# 六爻排盘系统 MySQL数据库初始化脚本
# 这个脚本已被 migrate_database.sh 替代，建议使用新的迁移脚本

echo "================================"
echo "六爻排盘系统 MySQL数据库初始化"
echo "================================"
echo ""
echo "注意: 此脚本已被新的迁移脚本替代"
echo "建议使用: ./migrate_database.sh"
echo "新脚本支持更多功能和更好的错误处理"
echo ""
echo "继续使用旧脚本？(y/N)"
read -r response

if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo "已取消。请使用 ./migrate_database.sh"
    exit 0
fi

echo ""
echo "正在使用旧版脚本初始化..."
echo ""

# MySQL连接信息
MYSQL_USER="root"
MYSQL_PASSWORD="123456"
MYSQL_HOST="localhost"

# 检查MySQL是否安装
if ! command -v mysql &> /dev/null; then
    echo "[错误] 未找到MySQL命令"
    echo "请先安装MySQL并将其添加到PATH环境变量"
    exit 1
fi

# 检查MySQL连接
echo "正在检查MySQL连接..."
mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT VERSION();" &> /dev/null
if [ $? -ne 0 ]; then
    echo "[错误] 无法连接到MySQL服务器"
    echo "请确认:"
    echo "1. MySQL服务已启动"
    echo "2. 用户名和密码正确 (root/123456)"
    echo "3. MySQL允许root用户登录"
    exit 1
fi

echo "[成功] MySQL连接正常"
echo ""

# 创建数据库和表结构
echo "步骤 1/4: 创建数据库和表结构..."
mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" < sql/00_init_complete.sql
if [ $? -ne 0 ]; then
    echo "[错误] 数据库初始化失败"
    exit 1
fi
echo "[成功] 数据库和表创建完成"
echo ""

# 插入基础数据
echo "步骤 2/4: 插入基础数据..."
mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" < sql/01_init_data.sql
if [ $? -ne 0 ]; then
    echo "[错误] 数据插入失败"
    exit 1
fi

mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" < sql/insert_64_gua_complete.sql
if [ $? -ne 0 ]; then
    echo "[错误] 64卦数据插入失败"
    exit 1
fi

echo "[成功] 基础数据插入完成"
echo ""

# 认证权限增强（可选）
echo "步骤 3/4: 认证权限/审计增强（可选）..."
echo "是否要安装认证权限增强功能（审计/日志/会话/黑名单/邮箱验证等）？(y/N)"
read -r enhance_response

if [[ "$enhance_response" =~ ^[Yy]$ ]]; then
    if [ -f "sql/02_auth_permissions_migration.sql" ]; then
        mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" < sql/02_auth_permissions_migration.sql
        if [ $? -eq 0 ]; then
            echo "[成功] 认证/审计基础迁移完成"
        else
            echo "[警告] 认证/审计基础迁移失败，但基础功能可用"
        fi
    else
        echo "[警告] 未找到认证/审计迁移文件"
    fi

    if [ -f "sql/02_auth_permissions_enhancement.sql" ]; then
        mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" < sql/02_auth_permissions_enhancement.sql
        if [ $? -eq 0 ]; then
            echo "[成功] 认证权限增强功能安装完成"
        else
            echo "[警告] 认证权限增强功能安装失败，但基础功能可用"
        fi
    else
        echo "[警告] 未找到认证权限增强文件"
    fi
else
    echo "跳过认证权限增强功能"
fi

echo ""

# 验证数据
echo "步骤 4/4: 验证数据..."
mysql -h "$MYSQL_HOST" -u "$MYSQL_USER" -p"$MYSQL_PASSWORD" -D liuyao_db -e "
SELECT 'trigrams' as table_name, COUNT(*) as count FROM trigrams
UNION ALL
SELECT 'gua_data', COUNT(*) FROM gua_data
UNION ALL
SELECT 'users', COUNT(*) FROM users;"
echo ""

echo "================================"
echo "数据库初始化完成!"
echo "================================"
echo ""
echo "数据库信息:"
echo "- 数据库名: liuyao_db"
echo "- 用户名: $MYSQL_USER"
echo "- 密码: $MYSQL_PASSWORD"
echo "- 主机: $MYSQL_HOST"
echo ""
echo "默认账号:"
echo "- 管理员: admin / admin123"
echo "- 测试用户: testuser / test123"
echo ""
echo "建议使用新迁移脚本获得完整功能:"
echo "./migrate_database.sh"
echo ""
echo "详细说明请查看 sql/README.md 和 AUTH_PERMISSIONS_ENHANCEMENT.md"
echo ""