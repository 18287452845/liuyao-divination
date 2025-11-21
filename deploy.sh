#!/bin/bash

# 六爻排盘系统 - 生产环境部署脚本
# 使用方法: ./deploy.sh

set -e  # 遇到错误立即退出

echo "================================"
echo "开始部署六爻排盘系统"
echo "================================"

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# 检查Node.js版本
echo -e "${YELLOW}检查Node.js版本...${NC}"
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}错误: 需要Node.js 18或更高版本${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js版本符合要求${NC}"

# 安装依赖
echo -e "\n${YELLOW}安装项目依赖...${NC}"
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..
echo -e "${GREEN}✓ 依赖安装完成${NC}"

# 构建前端
echo -e "\n${YELLOW}构建前端项目...${NC}"
cd client
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 前端构建成功${NC}"
else
    echo -e "${RED}✗ 前端构建失败${NC}"
    exit 1
fi
cd ..

# 构建后端
echo -e "\n${YELLOW}构建后端项目...${NC}"
cd server
npm run build
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ 后端构建成功${NC}"
else
    echo -e "${RED}✗ 后端构建失败${NC}"
    exit 1
fi
cd ..

# 创建日志目录
echo -e "\n${YELLOW}创建日志目录...${NC}"
mkdir -p logs
echo -e "${GREEN}✓ 日志目录创建完成${NC}"

# 检查环境变量文件
echo -e "\n${YELLOW}检查环境变量配置...${NC}"
if [ ! -f "server/.env" ]; then
    echo -e "${RED}警告: server/.env 文件不存在${NC}"
    echo -e "${YELLOW}请从 server/.env.example 复制并配置${NC}"
    exit 1
fi
echo -e "${GREEN}✓ 环境变量文件存在${NC}"

# 检查PM2是否安装
echo -e "\n${YELLOW}检查PM2...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}PM2未安装，正在全局安装...${NC}"
    npm install -g pm2
fi
echo -e "${GREEN}✓ PM2已就绪${NC}"

# 启动或重启应用
echo -e "\n${YELLOW}启动应用...${NC}"
pm2 delete liuyao-server 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo -e "\n${GREEN}================================${NC}"
echo -e "${GREEN}部署完成！${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "应用信息:"
echo "  • 前端文件: ./client/dist"
echo "  • 后端进程: pm2 list"
echo "  • 查看日志: pm2 logs liuyao-server"
echo "  • 重启服务: pm2 restart liuyao-server"
echo ""
echo "下一步："
echo "  1. 配置Nginx反向代理"
echo "  2. 配置SSL证书"
echo "  3. 设置开机自启: pm2 startup && pm2 save"
echo ""
