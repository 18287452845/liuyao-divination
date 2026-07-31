# 六爻排盘系统 - 完整项目文档

## 📖 目录

1. [项目概述](#项目概述)
2. [系统架构](#系统架构)
3. [技术栈](#技术栈)
4. [功能模块](#功能模块)
5. [数据库设计](#数据库设计)
6. [API接口文档](#api接口文档)
7. [前端组件说明](#前端组件说明)
8. [安装与部署](#安装与部署)
9. [开发指南](#开发指南)
10. [测试说明](#测试说明)
11. [常见问题](#常见问题)
12. [未来规划](#未来规划)

---

## 项目概述

### 简介

六爻排盘系统是一个完整的传统六爻占卜排盘系统，结合现代Web技术和AI智能解卦功能。系统提供三种起卦方式（时间起卦、数字起卦、手动摇卦），自动生成完整的卦象信息，并通过DeepSeek AI提供专业的解卦分析。

### 核心特性

- ✅ **多种起卦方式**：支持时间、数字、手动三种起卦方法
- ✅ **完整排盘系统**：自动装纳甲、地支、五行、六亲、六神
- ✅ **AI智能解卦**：集成DeepSeek API进行专业解卦分析
- ✅ **数据持久化**：MySQL数据库存储历史记录
- ✅ **响应式设计**：支持PC端和移动端访问
- ✅ **传统风格**：中国传统配色和UI设计

### 应用场景

- 传统文化学习和研究
- 六爻占卜实践
- AI辅助决策参考
- 历史记录管理和分析

---

## 系统架构

### 整体架构

```
┌─────────────────────────────────────────────────────────┐
│                      客户端层 (Client)                    │
│  React + TypeScript + Tailwind CSS                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │ 起卦页面 │  │ 排盘页面 │  │ 历史记录 │               │
│  └──────────┘  └──────────┘  └──────────┘               │
└────────────────────┬────────────────────────────────────┘
                     │ HTTP/REST API
┌────────────────────┴────────────────────────────────────┐
│                   服务端层 (Server)                       │
│  Node.js + Express + TypeScript                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ 起卦控制器   │  │ AI控制器     │  │ 记录控制器   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │ 六爻算法     │  │ 数据模型     │                     │
│  └──────────────┘  └──────────────┘                     │
└────────────────────┬───────────────┬────────────────────┘
                     │               │
         ┌───────────┴───────┐       │
         │   MySQL数据库      │   ┌───┴───────┐
         │                   │   │ DeepSeek  │
         │ - divination_records│   │    API    │
         │ - trigrams        │   └───────────┘
         │ - gua_data        │
         └───────────────────┘
```

### 技术架构分层

#### 1. 表现层 (Presentation Layer)
- **框架**: React 18
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **路由**: React Router v6
- **状态管理**: React Hooks
- **HTTP客户端**: Axios

#### 2. 业务逻辑层 (Business Logic Layer)
- **框架**: Express.js
- **语言**: TypeScript
- **路由**: Express Router
- **中间件**: CORS, body-parser
- **工具库**: lunar-javascript (农历计算)

#### 3. 数据访问层 (Data Access Layer)
- **数据库**: MySQL 5.7+
- **ORM**: 原生SQL查询
- **连接池**: mysql2

#### 4. 外部服务层 (External Services)
- **AI服务**: DeepSeek API
- **通信协议**: HTTPS/REST

---

## 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| Tailwind CSS | 3.x | 样式框架 |
| React Router | 6.x | 路由管理 |
| Axios | 1.x | HTTP请求 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18+ | 运行环境 |
| Express | 4.x | Web框架 |
| TypeScript | 5.x | 类型安全 |
| MySQL | 5.7+ | 数据库 |
| lunar-javascript | 1.x | 农历转换 |

### 开发工具

- **版本控制**: Git
- **包管理**: npm
- **代码规范**: ESLint, Prettier
- **API测试**: Postman, Thunder Client

---

## 功能模块

### 1. 起卦模块

#### 1.1 时间起卦法
- 使用当前系统时间（农历）
- 年取年支序数（子1……亥12），月取农历月数，时取时支序数
- 自动确定动爻位置

```typescript
// 算法示例
上卦数 = (年支数 + 月 + 日) % 8
下卦数 = (年支数 + 月 + 日 + 时支数) % 8
动爻 = (年支数 + 月 + 日 + 时支数) % 6
```

#### 1.2 数字起卦法
- 用户输入三个正整数
- 第一个数确定上卦
- 第二个数确定下卦
- 第三个数确定动爻

```typescript
上卦 = 数1 % 8
下卦 = 数2 % 8
动爻 = 数3 % 6
```

#### 1.3 手动摇卦法
- 模拟传统摇铜钱起卦
- 六次摇卦从下往上
- 每次生成老阳/少阳/老阴/少阴
- 老阳和老阴为动爻

```typescript
// 概率分布
老阳(○): 3个正面 - 12.5%
少阴(--): 2个正面1个反面 - 37.5%
少阳(—): 1个正面2个反面 - 37.5%
老阴(×): 3个反面 - 12.5%
```

### 2. 排盘模块

#### 2.1 装卦系统

**纳甲（天干配置）**
- 根据八卦类型配置天干
- 乾纳甲壬、坤纳乙癸等

**地支配置**
- 按照传统六爻规则配置十二地支
- 从初爻到上爻依次配置

**五行配置**
- 根据地支确定五行属性
- 金木水火土五行相生相克

**六亲配置**
- 父母、兄弟、子孙、妻财、官鬼
- 根据卦宫和五行关系确定

**六神配置**
- 青龙、朱雀、勾陈、螣蛇、白虎、玄武
- 根据日干确定起始六神

**世应位置**
- 根据八宫卦序确定世爻位置
- 应爻位置 = (世爻位置 + 3) % 6

#### 2.2 本卦与变卦
- **本卦**: 原始起卦结果
- **变卦**: 动爻变化后的卦象
- 老阳变少阴，老阴变少阳

### 3. AI解卦模块

#### 3.1 DeepSeek集成
- 使用DeepSeek API进行智能解析
- 流式响应提升用户体验
- 基于完整卦象信息分析

#### 3.2 解卦内容
- 卦象总体分析
- 动爻含义解读
- 用神、原神、忌神分析
- 时空因素考虑
- 具体建议和预测

### 4. 历史记录模块

#### 4.1 记录列表
- 分页显示历史记录
- 搜索功能（按问题内容）
- 按时间倒序排列

#### 4.2 记录详情
- 完整卦象信息展示
- AI解析内容查看
- 支持重新解析

#### 4.3 记录管理
- 删除单条记录
- 批量删除功能
- 导出记录（未来功能）

---

## 数据库设计

### 数据库信息

- **数据库名**: `liuyao_db`
- **字符集**: `utf8mb4`
- **排序规则**: `utf8mb4_unicode_ci`
- **存储引擎**: InnoDB

### 表结构设计

#### 1. divination_records (卦象记录表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | VARCHAR(50) | PRIMARY KEY | 记录唯一标识 |
| timestamp | BIGINT | NOT NULL | 起卦时间戳 |
| question | TEXT | NOT NULL | 占问事项 |
| method | VARCHAR(20) | NOT NULL | 起卦方式(time/number/manual) |
| ben_gua | TEXT | NOT NULL | 本卦数据(JSON) |
| bian_gua | TEXT | NULL | 变卦数据(JSON) |
| decoration | TEXT | NOT NULL | 装卦信息(JSON) |
| ai_analysis | TEXT | NULL | AI解析内容 |
| created_at | TIMESTAMP | DEFAULT NOW | 创建时间 |

**索引**:
- `idx_timestamp` - 时间戳索引
- `idx_method` - 起卦方式索引
- `idx_created_at` - 创建时间索引

**JSON数据结构**:

```typescript
// ben_gua 和 bian_gua 结构
{
  "name": "乾为天",
  "lines": [1,1,1,1,1,1],
  "changes": [false,false,false,false,true,false],
  "trigrams": {
    "upper": "乾",
    "lower": "乾"
  }
}

// decoration 结构
{
  "earthBranches": ["子","寅","辰","午","申","戌"],
  "sixRelatives": ["父母","兄弟","官鬼","父母","妻财","子孙"],
  "fiveElements": ["金","金","金","金","金","金"],
  "heavenlyStems": ["甲","甲","甲","壬","壬","壬"],
  "sixSpirits": ["青龙","朱雀","勾陈","螣蛇","白虎","玄武"],
  "shiYing": [3,0]
}
```

#### 2. trigrams (八卦基础数据表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| id | INT | PRIMARY KEY AUTO_INCREMENT | 主键ID |
| name | VARCHAR(50) | NOT NULL UNIQUE | 卦名 |
| symbol | VARCHAR(50) | NOT NULL | 卦符(☰☱☲☳☴☵☶☷) |
| nature | VARCHAR(50) | NOT NULL | 卦象属性 |
| element | VARCHAR(50) | NOT NULL | 五行属性 |
| number | INT | NOT NULL UNIQUE | 卦序号(1-8) |

**数据内容**:
- 乾(天/金)、兑(泽/金)、离(火/火)、震(雷/木)
- 巽(风/木)、坎(水/水)、艮(山/土)、坤(地/土)

#### 3. gua_data (六十四卦数据表)

| 字段名 | 类型 | 约束 | 说明 |
|--------|------|------|------|
| number | INT | PRIMARY KEY | 卦序号(1-64) |
| name | VARCHAR(20) | NOT NULL UNIQUE | 卦名 |
| upper_trigram | VARCHAR(10) | NOT NULL | 上卦名称 |
| lower_trigram | VARCHAR(10) | NOT NULL | 下卦名称 |
| gua_ci | TEXT | NOT NULL | 卦辞 |
| yao_ci | TEXT | NOT NULL | 爻辞(JSON数组) |

**索引**:
- `idx_trigrams` - 上下卦组合索引

**数据示例**:
```sql
{
  number: 1,
  name: "乾为天",
  upper_trigram: "乾",
  lower_trigram: "乾",
  gua_ci: "元亨利贞",
  yao_ci: ["初九:潜龙勿用", "九二:见龙在田,利见大人", ...]
}
```

### ER图

```
┌─────────────────────┐
│ divination_records  │
│─────────────────────│
│ id (PK)             │
│ timestamp           │
│ question            │
│ method              │
│ ben_gua             │
│ bian_gua            │
│ decoration          │
│ ai_analysis         │
│ created_at          │
└─────────────────────┘

┌─────────────────────┐
│ trigrams            │
│─────────────────────│
│ id (PK)             │
│ name (UK)           │
│ symbol              │
│ nature              │
│ element             │
│ number (UK)         │
└─────────────────────┘

┌─────────────────────┐
│ gua_data            │
│─────────────────────│
│ number (PK)         │
│ name (UK)           │
│ upper_trigram       │
│ lower_trigram       │
│ gua_ci              │
│ yao_ci              │
└─────────────────────┘
```

---

## API接口文档

### 基础信息

- **Base URL**: `http://localhost:5000/api`
- **Content-Type**: `application/json`
- **字符编码**: UTF-8

### 接口列表

#### 1. 创建卦象

**接口**: `POST /divination`

**描述**: 根据起卦信息创建新的卦象记录

**请求体**:
```json
{
  "question": "今年事业发展如何？",
  "method": "time",
  "numbers": [12, 34, 56],  // method为number时必填
  "yaoResults": [8, 6, 7, 9, 7, 8]  // method为manual时必填
}
```

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid-string",
    "timestamp": 1699876543000,
    "question": "今年事业发展如何？",
    "method": "time",
    "benGua": {
      "name": "乾为天",
      "lines": [1,1,1,1,1,1],
      "changes": [false,false,false,false,true,false],
      "trigrams": {"upper": "乾", "lower": "乾"}
    },
    "bianGua": {...},
    "decoration": {...}
  }
}
```

#### 2. 模拟摇卦

**接口**: `GET /divination/simulate`

**描述**: 模拟一次摇卦，返回6/7/8/9中的一个数字

**响应**:
```json
{
  "success": true,
  "data": {
    "value": 8,  // 6-老阴×, 7-少阳—, 8-少阴--, 9-老阳○
    "description": "少阴"
  }
}
```

#### 3. 获取历史记录列表

**接口**: `GET /records`

**描述**: 获取所有历史卦象记录

**查询参数**:
- `search` (可选): 搜索关键词
- `page` (可选): 页码，默认1
- `pageSize` (可选): 每页数量，默认20

**响应**:
```json
{
  "success": true,
  "data": {
    "records": [
      {
        "id": "uuid",
        "timestamp": 1699876543000,
        "question": "问题内容",
        "method": "time",
        "benGua": {...},
        "bianGua": {...},
        "decoration": {...},
        "aiAnalysis": "解析内容",
        "created_at": "2024-01-15T10:30:00Z"
      }
    ],
    "total": 50,
    "page": 1,
    "pageSize": 20
  }
}
```

#### 4. 获取单条记录

**接口**: `GET /records/:id`

**描述**: 根据ID获取单条卦象记录详情

**响应**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "timestamp": 1699876543000,
    "question": "问题内容",
    "method": "time",
    "benGua": {...},
    "bianGua": {...},
    "decoration": {...},
    "aiAnalysis": "完整解析内容",
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

#### 5. 更新AI解析

**接口**: `PUT /records/:id/analysis`

**描述**: 更新指定记录的AI解析内容

**请求体**:
```json
{
  "aiAnalysis": "新的AI解析内容..."
}
```

**响应**:
```json
{
  "success": true,
  "message": "AI解析已更新"
}
```

#### 6. 删除记录

**接口**: `DELETE /records/:id`

**描述**: 删除指定的卦象记录

**响应**:
```json
{
  "success": true,
  "message": "记录已删除"
}
```

#### 7. AI智能解卦

**接口**: `POST /ai/analyze`

**描述**: 使用AI对卦象进行智能解析（流式响应）

**请求体**:
```json
{
  "recordId": "uuid-string",
  "question": "问题内容",
  "benGua": {...},
  "bianGua": {...},
  "decoration": {...}
}
```

**响应**: Server-Sent Events (SSE) 流式响应
```
data: {"type":"start","message":"开始解析..."}

data: {"type":"chunk","content":"此卦为乾为天..."}

data: {"type":"chunk","content":"五爻发动..."}

data: {"type":"end","message":"解析完成"}
```

### 错误响应

所有接口统一错误响应格式:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "错误描述信息"
  }
}
```

常见错误码:
- `400` - 请求参数错误
- `404` - 资源不存在
- `500` - 服务器内部错误
- `503` - DeepSeek API不可用

---

## 前端组件说明

### 页面组件

#### 1. Home.tsx - 起卦页面

**路径**: `/client/src/pages/Home.tsx`

**功能**:
- 三种起卦方式切换
- 起卦表单输入和验证
- 摇卦动画效果
- 起卦结果提交

**主要状态**:
```typescript
const [method, setMethod] = useState<DivinationMethod>('time');
const [question, setQuestion] = useState('');
const [numbers, setNumbers] = useState([0, 0, 0]);
const [yaoResults, setYaoResults] = useState<number[]>([]);
```

#### 2. Paiпan.tsx - 排盘页面

**路径**: `/client/src/pages/Paipan.tsx`

**功能**:
- 显示本卦和变卦信息
- 展示装卦详细数据
- AI解卦按钮和结果展示
- 保存到历史记录

**核心功能**:
```typescript
const handleAIAnalyze = async () => {
  // 流式接收AI解析
  const eventSource = new EventSource(url);
  eventSource.onmessage = (event) => {
    // 处理流式数据
  };
};
```

#### 3. History.tsx - 历史记录页面

**路径**: `/client/src/pages/History.tsx`

**功能**:
- 记录列表展示
- 搜索和筛选
- 记录详情查看
- 删除记录

**组件树**:
```
History
├── SearchBar
├── RecordList
│   └── RecordCard
│       ├── GuaInfo
│       └── ActionButtons
└── Pagination
```

### 通用组件

#### 1. GuaDisplay - 卦象展示组件

**路径**: `/client/src/components/GuaDisplay.tsx`

**Props**:
```typescript
interface GuaDisplayProps {
  gua: Gua;
  decoration: GuaDecoration;
  title: string;
  showChanges?: boolean;
}
```

**功能**:
- 六爻堆叠展示
- 装卦信息标注
- 动爻标记
- 世应位置

#### 2. YaoLine - 爻位组件

**路径**: `/client/src/components/YaoLine.tsx`

**Props**:
```typescript
interface YaoLineProps {
  type: YaoType;  // 0-阴 1-阳
  isChanging: boolean;  // 是否为动爻
  earthBranch: string;
  sixRelative: string;
  fiveElement: string;
  heavenlyStem: string;
  sixSpirit: string;
  position: 'shi' | 'ying' | null;
}
```

#### 3. LoadingSpinner - 加载组件

简单的加载动画组件，用于异步操作提示。

### 工具函数

#### 1. api.ts - API请求封装

**路径**: `/client/src/utils/api.ts`

```typescript
export const api = {
  divination: {
    create: (data) => axios.post('/api/divination', data),
    simulate: () => axios.get('/api/divination/simulate'),
  },
  records: {
    list: (params) => axios.get('/api/records', { params }),
    get: (id) => axios.get(`/api/records/${id}`),
    delete: (id) => axios.delete(`/api/records/${id}`),
  },
  ai: {
    analyze: (data) => axios.post('/api/ai/analyze', data),
  },
};
```

---

## 安装与部署

### 环境要求

#### 最低配置
- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0
- **MySQL**: >= 5.7
- **操作系统**: Windows 10+, macOS 10.15+, Ubuntu 20.04+

#### 推荐配置
- **Node.js**: 20.x LTS
- **MySQL**: 8.0+
- **内存**: 2GB+
- **磁盘**: 500MB+

### 开发环境安装

#### 1. 克隆项目

```bash
cd lt
```

#### 2. 安装依赖

**方式一: 一键安装**
```bash
npm run install:all
```

**方式二: 分别安装**
```bash
# 根目录依赖
npm install

# 前端依赖
cd client
npm install

# 后端依赖
cd ../server
npm install
```

#### 3. 配置环境变量

在 `server` 目录创建 `.env` 文件:

```env
# 服务器配置
PORT=5000
NODE_ENV=development

# DeepSeek API配置
DEEPSEEK_API_KEY=your_api_key_here
DEEPSEEK_API_URL=https://api.deepseek.com

# 数据库配置（MySQL）
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=liuyao_db
```

#### 4. 初始化数据库

**使用MySQL**:

```bash
cd server

# Windows
setup_mysql.bat

# Linux/Mac
chmod +x setup_mysql.sh
./setup_mysql.sh

# 或手动执行
mysql -u root -p123456 < sql/init_database.sql
mysql -u root -p123456 < sql/insert_data.sql
mysql -u root -p123456 < sql/test_data.sql
```

#### 5. 启动开发服务器

**方式一: 同时启动前后端**
```bash
# 在根目录
npm run dev
```

**方式二: 分别启动**
```bash
# 终端1 - 启动后端 (http://localhost:5000)
cd server
npm run dev

# 终端2 - 启动前端 (http://localhost:3000)
cd client
npm run dev
```

访问 `http://localhost:3000` 开始使用。

### 生产环境部署

#### 1. 构建项目

```bash
# 构建前端
cd client
npm run build

# 构建后端
cd ../server
npm run build
```

#### 2. 配置生产环境变量

编辑 `server/.env`:
```env
NODE_ENV=production
PORT=5000
DEEPSEEK_API_KEY=your_production_api_key
DB_HOST=your_db_host
# ... 其他配置
```

#### 3. 启动生产服务器

```bash
cd server
npm start
```

#### 4. 使用PM2进行进程管理

```bash
# 安装PM2
npm install -g pm2

# 启动应用
cd server
pm2 start dist/index.js --name liuyao-server

# 查看状态
pm2 status

# 查看日志
pm2 logs liuyao-server

# 设置开机自启
pm2 startup
pm2 save
```

#### 5. Nginx反向代理配置

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/lt/client/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Docker部署

#### Dockerfile (Server)

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000

CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: 123456
      MYSQL_DATABASE: liuyao_db
    volumes:
      - mysql_data:/var/lib/mysql
      - ./server/sql:/docker-entrypoint-initdb.d
    ports:
      - "3306:3306"

  server:
    build: ./server
    ports:
      - "5000:5000"
    environment:
      DB_HOST: mysql
      DB_USER: root
      DB_PASSWORD: 123456
      DB_NAME: liuyao_db
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
    depends_on:
      - mysql

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./client/dist:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/conf.d/default.conf
    depends_on:
      - server

volumes:
  mysql_data:
```

启动:
```bash
docker-compose up -d
```

---

## 开发指南

### 项目结构

```
lt/
├── client/                          # 前端项目
│   ├── src/
│   │   ├── components/              # 可复用组件
│   │   │   ├── GuaDisplay.tsx       # 卦象展示
│   │   │   ├── YaoLine.tsx          # 爻位组件
│   │   │   └── LoadingSpinner.tsx   # 加载动画
│   │   ├── pages/                   # 页面组件
│   │   │   ├── Home.tsx             # 起卦页面
│   │   │   ├── Paipan.tsx           # 排盘页面
│   │   │   └── History.tsx          # 历史记录
│   │   ├── types/                   # TypeScript类型
│   │   │   └── index.ts             # 通用类型定义
│   │   ├── utils/                   # 工具函数
│   │   │   └── api.ts               # API请求封装
│   │   ├── styles/                  # 样式文件
│   │   │   └── index.css            # 全局样式
│   │   ├── App.tsx                  # 根组件
│   │   └── main.tsx                 # 入口文件
│   ├── public/                      # 静态资源
│   ├── index.html                   # HTML模板
│   ├── package.json                 # 依赖配置
│   ├── vite.config.ts              # Vite配置
│   ├── tailwind.config.js          # Tailwind配置
│   └── tsconfig.json               # TS配置
│
├── server/                          # 后端项目
│   ├── src/
│   │   ├── controllers/             # 控制器层
│   │   │   ├── divinationController.ts  # 起卦控制器
│   │   │   └── aiController.ts          # AI控制器
│   │   ├── models/                  # 数据模型层
│   │   │   └── database.ts          # 数据库模型
│   │   ├── routes/                  # 路由层
│   │   │   └── index.ts             # 路由配置
│   │   ├── utils/                   # 工具函数
│   │   │   ├── constants.ts         # 常量定义
│   │   │   └── liuyao.ts            # 六爻算法
│   │   └── index.ts                 # 服务器入口
│   ├── sql/                         # SQL脚本
│   │   ├── init_database.sql        # 数据库初始化
│   │   ├── insert_data.sql          # 基础数据
│   │   ├── test_data.sql            # 测试数据
│   │   └── README.md                # SQL文档
│   ├── dist/                        # 编译输出
│   ├── package.json                 # 依赖配置
│   ├── tsconfig.json               # TS配置
│   ├── setup_mysql.bat             # Windows安装脚本
│   └── setup_mysql.sh              # Unix安装脚本
│
├── package.json                     # 根依赖配置
├── README.md                        # 项目说明
└── QUICKSTART.md                    # 快速开始
```

### 代码规范

#### TypeScript规范

```typescript
// 使用接口定义类型
interface User {
  id: string;
  name: string;
  email?: string;  // 可选属性
}

// 使用类型别名定义联合类型
type Status = 'pending' | 'success' | 'error';

// 函数类型注解
function calculateGua(year: number, month: number): number {
  return (year + month) % 8;
}

// 箭头函数
const formatDate = (timestamp: number): string => {
  return new Date(timestamp).toISOString();
};
```

#### 命名规范

- **文件名**: PascalCase (组件) 或 camelCase (工具)
  - `GuaDisplay.tsx`
  - `apiClient.ts`
- **组件名**: PascalCase
  - `function GuaDisplay() {}`
- **变量名**: camelCase
  - `const benGua = ...`
- **常量名**: UPPER_SNAKE_CASE
  - `const MAX_RECORDS = 100`
- **类型名**: PascalCase
  - `interface DivinationRecord {}`

#### 注释规范

```typescript
/**
 * 计算卦象
 * @param year - 年份
 * @param month - 月份
 * @param day - 日期
 * @returns 卦象数字(1-8)
 */
function calculateGua(year: number, month: number, day: number): number {
  // 实现逻辑
  return (year + month + day) % 8;
}
```

### 添加新功能

#### 1. 添加新的起卦方式

**步骤**:

1. 在 `types/index.ts` 添加新方法类型:
```typescript
export type DivinationMethod = 'time' | 'number' | 'manual' | 'custom';
```

2. 在 `server/src/utils/liuyao.ts` 添加算法:
```typescript
export function customMethod(params: CustomParams): GuaResult {
  // 实现新的起卦算法
}
```

3. 在 `server/src/controllers/divinationController.ts` 添加处理:
```typescript
case 'custom':
  result = customMethod(req.body.customParams);
  break;
```

4. 在 `client/src/pages/Home.tsx` 添加UI:
```tsx
{method === 'custom' && (
  <CustomMethodForm onSubmit={handleSubmit} />
)}
```

#### 2. 添加新的API接口

**步骤**:

1. 在 `server/src/controllers/` 创建新控制器
2. 在 `server/src/routes/index.ts` 注册路由:
```typescript
router.post('/custom-endpoint', customController.handler);
```

3. 在 `client/src/utils/api.ts` 添加请求方法:
```typescript
export const api = {
  // ...
  custom: {
    action: (data) => axios.post('/api/custom-endpoint', data),
  },
};
```

#### 3. 自定义样式主题

编辑 `client/tailwind.config.js`:
```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        'custom-red': '#B91C1C',
        'custom-green': '#047857',
      },
      fontFamily: {
        'custom': ['CustomFont', 'serif'],
      },
    },
  },
};
```

### 调试技巧

#### 后端调试

1. **使用console.log**:
```typescript
console.log('[DEBUG] 卦象数据:', guaData);
```

2. **使用VS Code调试器**:

`.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/server/src/index.ts",
  "runtimeArgs": ["-r", "ts-node/register"],
  "env": {
    "NODE_ENV": "development"
  }
}
```

#### 前端调试

1. **React DevTools**: 安装浏览器扩展
2. **Console调试**: 使用 `console.log`
3. **Source Maps**: Vite自动生成

---

## 测试说明

### 数据库测试

已提供测试数据脚本，包含5条完整的卦象记录:

```bash
mysql -u root -p123456 < server/sql/test_data.sql
```

**测试数据包含**:
- 时间起卦示例
- 数字起卦示例
- 手动摇卦示例
- 有变卦和无变卦的情况
- 完整的AI解析内容

### API测试

#### 使用Postman测试

1. **创建卦象**:
```
POST http://localhost:5000/api/divination
Content-Type: application/json

{
  "question": "测试问题",
  "method": "time"
}
```

2. **获取记录列表**:
```
GET http://localhost:5000/api/records?search=测试
```

3. **AI解析** (需要有效的API Key):
```
POST http://localhost:5000/api/ai/analyze
Content-Type: application/json

{
  "recordId": "test-record-001",
  "question": "测试问题",
  "benGua": {...},
  "decoration": {...}
}
```

### 功能测试清单

- [ ] 时间起卦功能正常
- [ ] 数字起卦功能正常
- [ ] 手动摇卦功能正常
- [ ] 排盘信息显示完整
- [ ] AI解析流式响应正常
- [ ] 历史记录保存和查询正常
- [ ] 记录删除功能正常
- [ ] 搜索功能正常
- [ ] 响应式布局正常
- [ ] 错误处理友好

---

## 常见问题

### 1. 安装问题

**Q: npm install失败**

A: 尝试以下方法:
```bash
# 清除缓存
npm cache clean --force

# 使用国内镜像
npm config set registry https://registry.npmmirror.com

# 重新安装
npm install
```

**Q: MySQL连接失败**

A: 检查:
- MySQL服务是否启动
- 用户名密码是否正确
- 端口3306是否被占用
- 防火墙是否允许连接

### 2. 运行问题

**Q: 端口被占用**

A: 修改端口配置:
```env
# server/.env
PORT=5001

# client/vite.config.ts
server: { port: 3001 }
```

**Q: DeepSeek API调用失败**

A: 检查:
- API Key是否有效
- 网络连接是否正常
- API配额是否充足
- 请求格式是否正确

### 3. 数据库问题

**Q: 字符集乱码**

A: 确保数据库和表使用utf8mb4:
```sql
ALTER DATABASE liuyao_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE trigrams CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

**Q: 数据库初始化失败**

A: 手动执行SQL:
```bash
# 删除旧数据库
mysql -u root -p123456 -e "DROP DATABASE IF EXISTS liuyao_db;"

# 重新初始化
mysql -u root -p123456 < server/sql/init_database.sql
mysql -u root -p123456 < server/sql/insert_data.sql
```

### 4. 功能问题

**Q: 动爻不显示**

A: 检查:
- 起卦算法是否正确生成changes数组
- GuaDisplay组件是否正确传入changes属性
- 样式是否正确应用

**Q: AI解析没有内容**

A: 检查:
- DeepSeek API Key配置
- 网络连接
- 后端日志错误信息
- 前端EventSource监听

---

## 未来规划

### 短期计划 (v1.1)

- [ ] 完善64卦完整数据
- [ ] 添加卦象分享功能
- [ ] 支持导出PDF报告
- [ ] 添加用户系统和认证
- [ ] 移动端APP开发

### 中期计划 (v2.0)

- [ ] 多AI模型支持(ChatGPT, Claude等)
- [ ] 高级筛选和统计功能
- [ ] 六爻算命系统
- [ ] 社区功能(讨论、评论)
- [ ] 学习教程和视频

### 长期计划 (v3.0)

- [ ] 其他占卜系统集成(梅花易数、奇门遁甲)
- [ ] 大数据分析和趋势预测
- [ ] 专家系统和知识图谱
- [ ] 国际化多语言支持
- [ ] 企业级SaaS服务

---

## 贡献指南

欢迎贡献代码、报告问题或提出建议！

### 如何贡献

1. Fork本项目
2. 创建特性分支: `git checkout -b feature/AmazingFeature`
3. 提交更改: `git commit -m 'Add some AmazingFeature'`
4. 推送到分支: `git push origin feature/AmazingFeature`
5. 提交Pull Request

### 代码审查标准

- 符合项目代码规范
- 包含必要的注释
- 通过所有测试
- 更新相关文档

---

## 许可证

MIT License - 详见LICENSE文件

---

## 联系方式

- **项目地址**: [GitHub仓库]
- **问题反馈**: [Issues页面]
- **邮件**: your-email@example.com

---

## 致谢

- **lunar-javascript**: 农历转换库
- **DeepSeek**: AI解卦支持
- **React**: 前端框架
- **Express**: 后端框架
- **所有贡献者**

---

## 免责声明

本系统仅供学习、研究和娱乐使用。六爻占卜属于传统文化范畴，不应作为重大决策的唯一依据。AI解析结果仅供参考，不代表任何确定性预测。使用者应理性对待占卜结果，并对自己的决策负责。

---

**文档版本**: v1.0.0
**最后更新**: 2024-01-15
**维护者**: 开发团队
