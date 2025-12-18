#!/bin/bash

# Docker 构建修复验证脚本
# 用途：验证 Dockerfile 修复是否有效

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${BLUE}   Docker 构建修复验证脚本${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

# 1. 验证 Dockerfile 配置
echo -e "${YELLOW}[1/5] 验证 Dockerfile 配置...${NC}"

if grep -q "FROM node:18-alpine AS builder" server/Dockerfile; then
    echo -e "${GREEN}  ✅ 多阶段构建（Builder）已配置${NC}"
else
    echo -e "${RED}  ❌ 多阶段构建（Builder）配置缺失${NC}"
    exit 1
fi

if grep -q "npm ci" server/Dockerfile && grep -q "npm run build" server/Dockerfile; then
    echo -e "${GREEN}  ✅ npm ci 和 npm run build 已配置${NC}"
else
    echo -e "${RED}  ❌ npm 命令配置缺失${NC}"
    exit 1
fi

if grep -q "COPY --from=builder /app/dist" server/Dockerfile; then
    echo -e "${GREEN}  ✅ 多阶段复制（--from=builder）已配置${NC}"
else
    echo -e "${RED}  ❌ 多阶段复制配置缺失${NC}"
    exit 1
fi

echo ""

# 2. 检查 package.json 是否存在
echo -e "${YELLOW}[2/5] 验证 package.json...${NC}"

if [ -f "server/package.json" ] && grep -q '"build": "tsc"' server/package.json; then
    echo -e "${GREEN}  ✅ server/package.json 包含 build 脚本${NC}"
else
    echo -e "${RED}  ❌ server/package.json 缺少 build 脚本${NC}"
    exit 1
fi

if [ -f "server/tsconfig.json" ]; then
    echo -e "${GREEN}  ✅ server/tsconfig.json 存在${NC}"
else
    echo -e "${RED}  ❌ server/tsconfig.json 不存在${NC}"
    exit 1
fi

echo ""

# 3. 检查 Docker 是否安装
echo -e "${YELLOW}[3/5] 验证 Docker 环境...${NC}"

if ! command -v docker &> /dev/null; then
    echo -e "${RED}  ❌ Docker 未安装或不在 PATH 中${NC}"
    echo -e "${YELLOW}  请先安装 Docker Desktop${NC}"
    exit 1
fi

docker_version=$(docker --version)
echo -e "${GREEN}  ✅ Docker 已安装: ${docker_version}${NC}"

echo ""

# 4. 尝试构建后端镜像
echo -e "${YELLOW}[4/5] 构建后端镜像（这可能需要几分钟）...${NC}"

if docker build -t liuyao-server:verify ./server > /tmp/docker-build.log 2>&1; then
    echo -e "${GREEN}  ✅ 后端镜像构建成功${NC}"
    docker rmi liuyao-server:verify > /dev/null 2>&1 || true
else
    echo -e "${RED}  ❌ 后端镜像构建失败${NC}"
    echo -e "${YELLOW}  查看完整日志：${NC}"
    tail -50 /tmp/docker-build.log
    exit 1
fi

echo ""

# 5. 验证 .dockerignore
echo -e "${YELLOW}[5/5] 验证 .dockerignore...${NC}"

if [ -f ".dockerignore" ]; then
    echo -e "${GREEN}  ✅ .dockerignore 文件存在${NC}"
    echo -e "  包含 $(wc -l < .dockerignore) 个规则"
else
    echo -e "${YELLOW}  ⚠️  .dockerignore 文件不存在（非关键）${NC}"
fi

echo ""
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ 所有验证通过！修复有效${NC}"
echo -e "${BLUE}════════════════════════════════════════${NC}"
echo ""

echo -e "${GREEN}下一步：${NC}"
echo "  1. 检查其他文件（可选）:"
echo "     docker build -t liuyao-client:verify ./client"
echo ""
echo "  2. 推送到 GitHub:"
echo "     git add server/Dockerfile"
echo "     git commit -m 'fix: Fix server Dockerfile build failure'"
echo "     git push origin ci-ghcr-github-actions-docker-compose-setup"
echo ""
echo "  3. 验证 GitHub Actions:"
echo "     进入 GitHub 仓库 → Actions 标签 → 查看最新工作流"
echo ""
