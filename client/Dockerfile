# 构建阶段
FROM node:18-alpine AS build

WORKDIR /app

# 安装构建依赖（python3和build-base包含了make和g++）
RUN apk add --no-cache python3 build-base git

# 设置npm配置
RUN npm config set registry https://registry.npmjs.org/ && \
    npm config set fund false && \
    npm config set audit false

# 复制package文件
COPY package*.json ./

# 安装所有依赖（包括devDependencies）
RUN npm ci --quiet

# 复制源代码
COPY . .

# 验证构建工具并构建项目
RUN npx vite --version && \
    npm run build

# 生产阶段
FROM nginx:1.25-alpine

# nginx用户和curl已存在于基础镜像中，无需额外安装

# 复制构建产物
COPY --from=build /app/dist /usr/share/nginx/html

# 设置正确的文件权限
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html

# 复制默认nginx配置
RUN echo 'server {' > /etc/nginx/conf.d/default.conf && \
    echo '    listen 80;' >> /etc/nginx/conf.d/default.conf && \
    echo '    server_name _;' >> /etc/nginx/conf.d/default.conf && \
    echo '    root /usr/share/nginx/html;' >> /etc/nginx/conf.d/default.conf && \
    echo '    index index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    location / {' >> /etc/nginx/conf.d/default.conf && \
    echo '        try_files $uri $uri/ /index.html;' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "no-cache, no-store, must-revalidate";' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Pragma "no-cache";' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Expires "0";' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '' >> /etc/nginx/conf.d/default.conf && \
    echo '    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {' >> /etc/nginx/conf.d/default.conf && \
    echo '        expires 1y;' >> /etc/nginx/conf.d/default.conf && \
    echo '        add_header Cache-Control "public, immutable";' >> /etc/nginx/conf.d/default.conf && \
    echo '    }' >> /etc/nginx/conf.d/default.conf && \
    echo '}' >> /etc/nginx/conf.d/default.conf

# 更改文件所有权
RUN chown -R nginx:nginx /etc/nginx

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:80/

# 启动nginx
CMD ["nginx", "-g", "daemon off;"]
