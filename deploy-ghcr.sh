#!/bin/bash

# GitHub Container Registry (GHCR) 部署脚本
# 此脚本用于从 GHCR 拉取镜像并启动应用

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}GHCR Docker Compose 部署脚本${NC}"
echo -e "${BLUE}========================================${NC}"

# 检查必需的工具
if ! command -v docker &> /dev/null; then
    echo -e "${RED}错误: 未找到 docker，请先安装 Docker${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}错误: 未找到 docker-compose，请先安装 Docker Compose${NC}"
    exit 1
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    if [ ! -f ".env.ghcr.example" ]; then
        echo -e "${RED}错误: 缺少 .env.ghcr.example 文件${NC}"
        exit 1
    fi
    echo -e "${YELLOW}创建 .env 文件...${NC}"
    cp .env.ghcr.example .env
    echo -e "${YELLOW}已创建 .env 文件，请编辑它并设置正确的环境变量${NC}"
    echo -e "${YELLOW}特别是：GHCR_REPO, GHCR_REGISTRY_USERNAME, GHCR_REGISTRY_PASSWORD 等${NC}"
    exit 1
fi

# 加载环境变量
set -a
source .env
set +a

# 验证必需的环境变量
if [ -z "$GHCR_REGISTRY" ]; then
    echo -e "${RED}错误: 未设置 GHCR_REGISTRY${NC}"
    exit 1
fi

if [ -z "$GHCR_REPO" ]; then
    echo -e "${RED}错误: 未设置 GHCR_REPO${NC}"
    exit 1
fi

if [ -z "$IMAGE_TAG" ]; then
    IMAGE_TAG="latest"
    echo -e "${YELLOW}使用默认标签: latest${NC}"
fi

echo -e "${GREEN}环境变量加载成功${NC}"
echo -e "  GHCR_REGISTRY: ${BLUE}$GHCR_REGISTRY${NC}"
echo -e "  GHCR_REPO: ${BLUE}$GHCR_REPO${NC}"
echo -e "  IMAGE_TAG: ${BLUE}$IMAGE_TAG${NC}"

# 登录到 GHCR（如果提供了用户名和密码）
if [ ! -z "$GHCR_USERNAME" ] && [ ! -z "$GHCR_PASSWORD" ]; then
    echo -e "${YELLOW}登录到 GHCR...${NC}"
    echo "$GHCR_PASSWORD" | docker login "$GHCR_REGISTRY" -u "$GHCR_USERNAME" --password-stdin
    echo -e "${GREEN}GHCR 登录成功${NC}"
elif [ ! -z "$GITHUB_TOKEN" ]; then
    echo -e "${YELLOW}使用 GITHUB_TOKEN 登录到 GHCR...${NC}"
    echo "$GITHUB_TOKEN" | docker login "$GHCR_REGISTRY" -u "$GITHUB_USERNAME" --password-stdin
    echo -e "${GREEN}GHCR 登录成功${NC}"
else
    echo -e "${YELLOW}警告: 未提供 GHCR 登录凭据${NC}"
    echo -e "${YELLOW}如果镜像是私有的，部署可能会失败${NC}"
fi

# 检查是否有运行的容器
echo -e "${YELLOW}检查现有容器...${NC}"
if docker-compose -f docker-compose.ghcr.yml ps 2>/dev/null | grep -q "liuyao"; then
    echo -e "${YELLOW}发现现有容器，将停止并删除...${NC}"
    docker-compose -f docker-compose.ghcr.yml down
    echo -e "${GREEN}旧容器已删除${NC}"
fi

# 拉取最新镜像
echo -e "${YELLOW}从 GHCR 拉取最新镜像...${NC}"
docker-compose -f docker-compose.ghcr.yml pull

# 启动服务
echo -e "${YELLOW}启动服务...${NC}"
docker-compose -f docker-compose.ghcr.yml up -d

# 等待服务就绪
echo -e "${YELLOW}等待服务就绪...${NC}"
sleep 5

# 检查服务状态
echo -e "${YELLOW}检查服务状态...${NC}"
docker-compose -f docker-compose.ghcr.yml ps

# 检查后端健康状态
echo -e "${YELLOW}检查后端服务健康状态...${NC}"
max_attempts=30
attempt=0
while [ $attempt -lt $max_attempts ]; do
    if curl -f http://localhost:${SERVER_PORT:-5000}/api/health &> /dev/null; then
        echo -e "${GREEN}后端服务已就绪${NC}"
        break
    fi
    attempt=$((attempt + 1))
    echo -e "${YELLOW}等待中... ($attempt/$max_attempts)${NC}"
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}后端服务启动超时${NC}"
    echo -e "${YELLOW}查看日志: docker-compose -f docker-compose.ghcr.yml logs server${NC}"
else
    echo -e "${GREEN}✓ 部署成功！${NC}"
    echo -e ""
    echo -e "${BLUE}========================================${NC}"
    echo -e "${GREEN}服务已启动${NC}"
    echo -e "${BLUE}========================================${NC}"
    echo -e "前端 (Nginx): ${BLUE}http://localhost:${CLIENT_HTTP_PORT:-80}${NC}"
    echo -e "后端 API:    ${BLUE}http://localhost:${SERVER_PORT:-5000}/api${NC}"
    echo -e "MySQL:       ${BLUE}localhost:${MYSQL_PORT:-3306}${NC}"
    echo -e ""
    echo -e "查看日志:"
    echo -e "  ${BLUE}docker-compose -f docker-compose.ghcr.yml logs -f${NC}"
    echo -e "  ${BLUE}docker-compose -f docker-compose.ghcr.yml logs -f server${NC}"
    echo -e "  ${BLUE}docker-compose -f docker-compose.ghcr.yml logs -f client${NC}"
    echo -e ""
    echo -e "停止服务:"
    echo -e "  ${BLUE}docker-compose -f docker-compose.ghcr.yml down${NC}"
    echo -e ""
    echo -e "查看服务状态:"
    echo -e "  ${BLUE}docker-compose -f docker-compose.ghcr.yml ps${NC}"
fi
