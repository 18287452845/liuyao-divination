#!/bin/bash

# ===================================================================
# 六爻排盘系统 - 数据库迁移脚本 (Bash版本)
# 版本: 2.0
# 功能: 完整的数据库初始化和认证权限管理增强
# ===================================================================

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m' # No Color

# MySQL连接配置
MYSQL_USER="root"
MYSQL_PASSWORD="123456"
MYSQL_HOST="localhost"
MYSQL_PORT="3306"

# 显示帮助信息
show_help() {
    echo "用法: $0 [参数]"
    echo ""
    echo "参数:"
    echo "  -u, --user <用户名>        MySQL用户名 (默认: root)"
    echo "  -p, --password <密码>       MySQL密码 (默认: 123456)"
    echo "  -h, --host <主机>          MySQL主机 (默认: localhost)"
    echo "  -P, --port <端口>          MySQL端口 (默认: 3306)"
    echo "  --skip-init                跳过数据库初始化"
    echo "  --skip-data                跳过基础数据插入"
    echo "  --skip-enhancement         跳过认证权限增强功能"
    echo "  --force                    忽略错误继续执行"
    echo "  --help                     显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0"
    echo "  $0 -u myuser -p mypass"
    echo "  $0 --skip-init --skip-data"
    echo "  $0 --force"
    echo ""
}

# 检查MySQL命令是否可用
check_mysql_command() {
    if ! command -v mysql &> /dev/null; then
        echo -e "${RED}[错误] 未找到MySQL命令${NC}"
        echo -e "${YELLOW}请确保MySQL已安装并添加到PATH环境变量${NC}"
        return 1
    fi
    return 0
}

# 测试MySQL连接
test_mysql_connection() {
    local result=$(mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -e "SELECT VERSION();" 2>&1)
    if [ $? -eq 0 ]; then
        return 0
    else
        echo -e "${RED}[错误] MySQL连接失败${NC}"
        echo -e "${YELLOW}请检查以下配置:${NC}"
        echo -e "  - 用户名: $MYSQL_USER"
        echo -e "  - 密码: $MYSQL_PASSWORD"
        echo -e "  - 主机: $MYSQL_HOST"
        echo -e "  - 端口: $MYSQL_PORT"
        echo -e "  - MySQL服务是否已启动"
        return 1
    fi
}

# 执行SQL文件
execute_sql_file() {
    local file=$1
    local description=$2
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}[错误] SQL文件不存在: $file${NC}"
        return 1
    fi
    
    echo -e "正在执行: $description..." -e "${GREEN}"
    local result=$(mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" < "$file" 2>&1)
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[成功] $description 完成${NC}"
        return 0
    else
        echo -e "${RED}[错误] $description 失败${NC}"
        echo -e "$result"
        return 1
    fi
}

# 验证数据库结构
verify_database_structure() {
    echo -e "正在验证数据库结构..." -e "${GREEN}"
    
    local queries=(
        "SELECT '八卦数据' as table_name, COUNT(*) as count FROM trigrams"
        "SELECT '卦象数据' as table_name, COUNT(*) as count FROM gua_data"
        "SELECT '用户表' as table_name, COUNT(*) as count FROM users"
        "SELECT '角色表' as table_name, COUNT(*) as count FROM roles"
        "SELECT '权限表' as table_name, COUNT(*) as count FROM permissions"
    )
    
    for query in "${queries[@]}"; do
        local result=$(mysql -h"$MYSQL_HOST" -P"$MYSQL_PORT" -u"$MYSQL_USER" -p"$MYSQL_PASSWORD" -D"liuyao_db" -e "$query" 2>&1)
        if [ $? -eq 0 ]; then
            echo -e "$result" -e "${WHITE}"
        else
            echo -e "${YELLOW}[警告] 验证查询失败: $query${NC}"
        fi
    done
}

# 显示迁移结果
show_migration_result() {
    echo ""
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}数据库迁移完成!${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
    echo -e "${WHITE}数据库信息:${NC}"
    echo -e "  - 数据库名: liuyao_db"
    echo -e "  - 用户名: $MYSQL_USER"
    echo -e "  - 主机: $MYSQL_HOST"
    echo -e "  - 端口: $MYSQL_PORT"
    echo ""
    echo -e "${WHITE}默认账号:${NC}"
    echo -e "  - 管理员: admin / admin123" -e "${YELLOW}"
    echo -e "  - 测试用户: testuser / test123" -e "${YELLOW}"
    echo ""
    echo -e "${WHITE}新增功能:${NC}"
    echo -e "  - 登录日志记录" -e "${GREEN}"
    echo -e "  - 操作日志审计" -e "${GREEN}"
    echo -e "  - Token黑名单管理" -e "${GREEN}"
    echo -e "  - 邮箱验证功能" -e "${GREEN}"
    echo -e "  - 用户会话管理" -e "${GREEN}"
    echo -e "  - 双因素认证支持" -e "${GREEN}"
    echo -e "  - 账号锁定机制" -e "${GREEN}"
    echo ""
    echo -e "${YELLOW}详细说明请查看: sql/README.md${NC}"
    echo ""
}

# 主执行流程
main() {
    # 解析命令行参数
    SKIP_INIT=false
    SKIP_DATA=false
    SKIP_ENHANCEMENT=false
    FORCE=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -u|--user)
                MYSQL_USER="$2"
                shift 2
                ;;
            -p|--password)
                MYSQL_PASSWORD="$2"
                shift 2
                ;;
            -h|--host)
                MYSQL_HOST="$2"
                shift 2
                ;;
            -P|--port)
                MYSQL_PORT="$2"
                shift 2
                ;;
            --skip-init)
                SKIP_INIT=true
                shift
                ;;
            --skip-data)
                SKIP_DATA=true
                shift
                ;;
            --skip-enhancement)
                SKIP_ENHANCEMENT=true
                shift
                ;;
            --force)
                FORCE=true
                shift
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                echo -e "${RED}未知参数: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 显示配置信息
    echo -e "${CYAN}================================${NC}"
    echo -e "${CYAN}六爻排盘系统 数据库迁移脚本${NC}"
    echo -e "${CYAN}================================${NC}"
    echo ""
    echo -e "${WHITE}数据库配置:${NC}"
    echo -e "  - 主机: $MYSQL_HOST"
    echo -e "  - 端口: $MYSQL_PORT"
    echo -e "  - 用户: $MYSQL_USER"
    echo ""
    
    # 检查MySQL命令
    if ! check_mysql_command; then
        exit 1
    fi
    
    # 测试MySQL连接
    if ! test_mysql_connection; then
        exit 1
    fi
    
    echo -e "${GREEN}[成功] MySQL连接正常${NC}"
    echo ""
    
    error_count=0
    
    # 步骤1: 创建数据库和表结构
    if [ "$SKIP_INIT" = false ]; then
        echo -e "${CYAN}步骤 1/3: 创建数据库和表结构...${NC}"
        echo ""
        
        files=(
            "sql/00_init_complete.sql:数据库和表结构初始化"
        )
        
        for item in "${files[@]}"; do
            file="${item%%:*}"
            description="${item##*:}"
            if ! execute_sql_file "$file" "$description"; then
                ((error_count++))
                if [ "$FORCE" = false ]; then
                    echo -e "${YELLOW}使用 --force 参数可忽略错误继续执行${NC}"
                    exit 1
                fi
            fi
        done
    else
        echo -e "${YELLOW}跳过数据库初始化 (--skip-init)${NC}"
    fi
    
    echo ""
    
    # 步骤2: 插入基础数据
    if [ "$SKIP_DATA" = false ]; then
        echo -e "${CYAN}步骤 2/3: 插入基础数据...${NC}"
        echo ""
        
        files=(
            "sql/01_init_data.sql:基础数据插入"
        )
        
        for item in "${files[@]}"; do
            file="${item%%:*}"
            description="${item##*:}"
            if ! execute_sql_file "$file" "$description"; then
                ((error_count++))
                if [ "$FORCE" = false ]; then
                    echo -e "${YELLOW}使用 --force 参数可忽略错误继续执行${NC}"
                    exit 1
                fi
            fi
        done
    else
        echo -e "${YELLOW}跳过基础数据插入 (--skip-data)${NC}"
    fi
    
    echo ""
    
    # 步骤3: 认证权限管理增强
    if [ "$SKIP_ENHANCEMENT" = false ]; then
        echo -e "${CYAN}步骤 3/3: 认证权限管理增强...${NC}"
        echo ""
        
        files=(
            "sql/02_auth_permissions_enhancement.sql:认证权限管理增强功能"
        )
        
        for item in "${files[@]}"; do
            file="${item%%:*}"
            description="${item##*:}"
            if ! execute_sql_file "$file" "$description"; then
                ((error_count++))
                if [ "$FORCE" = false ]; then
                    echo -e "${YELLOW}使用 --force 参数可忽略错误继续执行${NC}"
                    exit 1
                fi
            fi
        done
    else
        echo -e "${YELLOW}跳过认证权限增强 (--skip-enhancement)${NC}"
    fi
    
    echo ""
    
    # 验证数据库结构
    echo -e "${CYAN}步骤 4/4: 验证数据库结构...${NC}"
    verify_database_structure
    
    # 显示结果
    show_migration_result
    
    if [ $error_count -gt 0 ]; then
        echo -e "${YELLOW}[警告] 迁移过程中发生 $error_count 个错误${NC}"
        echo -e "${YELLOW}请检查上述错误信息并手动修复${NC}"
        exit 1
    else
        echo -e "${GREEN}[成功] 数据库迁移完全成功!${NC}"
        exit 0
    fi
}

# 显示开始信息
echo -e "${CYAN}开始执行数据库迁移...${NC}"
echo -e "${YELLOW}使用 --help 参数查看详细用法${NC}"
echo ""

# 执行主流程
main "$@"