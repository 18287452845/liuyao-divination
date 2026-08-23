# 构建阶段 - 安装所有依赖并构建
FROM node:20-alpine AS builder

WORKDIR /app

# 复制package文件
COPY package*.json ./

# 设置npm配置以提高安装成功率
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fund false && \
    npm config set audit false

# 安装所有依赖（包括开发依赖，用于构建）
RUN npm ci --quiet

# 复制源代码
COPY . .

# 构建项目
RUN npm run build

# 生产镜像
FROM node:20-alpine

WORKDIR /app

# 创建非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 复制package文件
COPY package*.json ./

# 设置npm配置
RUN npm config set registry https://registry.npmjs.org/

# 仅安装生产依赖
RUN npm ci --only=production --quiet && npm cache clean --force

# 从构建镜像复制编译后的代码
COPY --from=builder /app/dist ./dist

# 复制必要的静态资源（如果存在）
RUN if [ -d /app/sql ]; then cp -r /app/sql ./sql; fi

# 更改文件所有权
RUN chown -R nodejs:nodejs /app
USER nodejs

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "try{require('http').get('http://127.0.0.1:5000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})}catch(e){process.exit(1)}"

# 启动应用
CMD ["node", "dist/index.js"]
