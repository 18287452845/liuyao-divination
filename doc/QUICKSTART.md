# 快速启动指南

## 第一次运行项目

### 1. 安装依赖
```bash
# 在项目根目录执行
npm run install:all
```

### 2. 配置DeepSeek API
```bash
# 进入server目录
cd server

# 复制环境变量模板
copy .env.example .env

# 编辑.env文件，填入你的DeepSeek API密钥
# DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
```

### 3. 启动项目
```bash
# 返回项目根目录
cd ..

# 启动开发服务器（同时启动前后端）
npm run dev
```

### 4. 访问应用
打开浏览器访问：http://localhost:3000

## 获取DeepSeek API密钥

1. 访问 https://platform.deepseek.com/
2. 注册账号并登录
3. 在API密钥页面创建新的API密钥
4. 复制密钥并粘贴到 `server/.env` 文件中

## 常见问题

### Q: 安装依赖失败？
A: 尝试清理缓存后重新安装
```bash
npm cache clean --force
npm run install:all
```

### Q: 后端无法启动？
A: 检查端口5000是否被占用，或修改 `server/.env` 中的 PORT

### Q: AI解卦失败？
A: 检查DeepSeek API密钥是否正确配置

### Q: 数据库错误？
A: 确保 MySQL 服务/容器在运行，必要时删除 `mysql-data` 卷或重新执行 `server/sql` 脚本完成初始化

## 项目结构速览

```
lt/
├── client/          # 前端（React + TypeScript + Tailwind）
├── server/          # 后端（Express + MySQL）
├── package.json     # 根配置（包含启动脚本）
└── README.md        # 完整文档
```

## 主要功能

1. **起卦** - 支持时间、数字、手动摇卦三种方式
2. **排盘** - 完整的六爻装卦系统
3. **解卦** - DeepSeek AI智能解卦
4. **历史** - 查询、搜索、管理历史记录

祝您使用愉快！
