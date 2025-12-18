FROM node:18-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖，用于构建）
RUN npm ci

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 生产镜像
FROM node:18-alpine

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 仅安装生产依赖
RUN npm ci --only=production

# 从构建镜像复制编译后的代码
COPY --from=builder /app/dist ./dist

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "dist/index.js"]
