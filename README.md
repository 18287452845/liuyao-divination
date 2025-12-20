# 六爻排盘系统

一个完整的传统六爻占卜排盘系统，结合现代Web技术和AI智能解卦功能。

## 功能特点

### 核心功能
- **三种起卦方式**
  - 时间起卦法：使用农历年月日时自动起卦
  - 数字起卦法：输入三个数字进行起卦
  - 手动摇卦法：模拟传统摇铜钱起卦

- **完整排盘系统**
  - 自动生成本卦和变卦
  - 装纳甲（天干配置）
  - 装地支（子丑寅卯等十二地支）
  - 装五行（金木水火土）
  - 装六亲（父母、兄弟、子孙、妻财、官鬼）
  - 配置六神（青龙、朱雀、勾陈、螣蛇、白虎、玄武）
  - 标注世应位置
  - 动爻标识

- **AI智能解卦**
  - 集成DeepSeek API进行专业解卦
  - 流式显示解卦过程
  - 基于完整卦象信息的智能分析
  - 包含用神、原神、忌神等要素分析

- **数据管理**
  - MySQL数据库持久化存储
  - 历史记录查询和搜索
  - 记录详情查看
  - 数据删除管理

### 界面特色
- 中国传统风格设计
- 朱红、墨绿、金色传统配色
- 响应式布局，支持移动端
- 流畅的交互体验

## 技术栈

### 前端
- React 18
- TypeScript
- Tailwind CSS
- React Router
- Axios

### 后端
- Node.js
- Express
- TypeScript
- MySQL 5.7+（通过 mysql2 驱动）
- lunar-javascript（农历转换）

### AI集成
- DeepSeek API（智能解卦）

## 项目结构

```
lt/
├── client/                 # 前端React应用
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   ├── types/         # TypeScript类型定义
│   │   ├── utils/         # 工具函数
│   │   ├── styles/        # 样式文件
│   │   ├── App.tsx        # 主应用组件
│   │   └── main.tsx       # 入口文件
│   ├── index.html
│   ├── package.json
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                # 后端Express服务
│   ├── src/
│   │   ├── controllers/   # 控制器
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── utils/         # 工具函数
│   │   └── index.ts       # 服务器入口
│   ├── data/              # 数据库文件目录
│   ├── package.json
│   └── tsconfig.json
│
└── package.json           # 根package.json
```

## 安装与运行

### 前置要求
- Node.js >= 18
- npm 或 yarn

### 安装步骤

1. **克隆项目**
```bash
cd lt
```

2. **安装所有依赖**
```bash
npm run install:all
```

或者分别安装：
```bash
# 安装根依赖
npm install

# 安装前端依赖
cd client && npm install

# 安装后端依赖
cd ../server && npm install
```

3. **配置环境变量**

在 `server` 目录下创建 `.env` 文件：
```bash
cd server
cp .env.example .env
```

编辑 `.env` 文件，填入你的DeepSeek API密钥：
```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
PORT=5000
NODE_ENV=development
```

### 运行项目

#### 开发模式（推荐）

在项目根目录运行：
```bash
npm run dev
```

这将同时启动前端（http://localhost:3000）和后端（http://localhost:5000）服务。

#### 分别运行

前端：
```bash
cd client
npm run dev
```

后端：
```bash
cd server
npm run dev
```

#### 生产模式

详细部署文档请查看：
- **Docker部署指南**: [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - **推荐用于生产环境**
- **快速部署**: [QUICK_DEPLOY.md](./QUICK_DEPLOY.md)
- **完整部署指南**: [doc/DEPLOYMENT.md](./doc/DEPLOYMENT.md)
- **部署检查清单**: [doc/DEPLOYMENT_CHECKLIST.md](./doc/DEPLOYMENT_CHECKLIST.md)

**一键部署**:
```bash
# Linux/Mac
chmod +x deploy.sh
./deploy.sh

# Windows
deploy.bat
```

**Docker部署（推荐）**:
```bash
# 1. 配置环境变量
cp .env.example .env
nano .env  # 修改JWT_SECRET、MYSQL密码、DEEPSEEK_API_KEY

# 2. 启动所有服务
docker-compose up -d

# 3. 查看日志
docker-compose logs -f

# 访问: http://localhost (前端) 和 http://localhost:5000 (后端API)
```

## 使用说明

### 1. 起卦

访问首页，选择起卦方式：

- **时间起卦**：输入占问事项后直接点击"开始起卦"
- **数字起卦**：输入三个正整数（任意大小）
- **手动摇卦**：点击"摇卦"按钮六次，模拟传统摇卦过程

### 2. 查看排盘

起卦完成后自动跳转到排盘页面，可以看到：
- 占问信息
- 本卦详细信息（包含六神、纳甲、地支、五行、六亲、世应）
- 变卦信息（如果有动爻）

### 3. AI解卦

在排盘页面点击"AI智能解卦"按钮，系统将：
1. 构建包含完整卦象信息的prompt
2. 调用DeepSeek API进行解析
3. 流式显示解卦结果
4. 自动保存解卦记录

### 4. 历史记录

点击导航栏的"历史记录"可以：
- 查看所有历史卦象
- 搜索特定占问事项
- 快速访问之前的卦象和解析
- 删除不需要的记录

## API接口说明

### 卦象相关

- `POST /api/divination` - 创建卦象
- `GET /api/divination/simulate` - 模拟摇卦
- `GET /api/records` - 获取历史记录列表
- `GET /api/records/:id` - 获取单条记录
- `PUT /api/records/:id/analysis` - 更新AI解析
- `DELETE /api/records/:id` - 删除记录

### AI解卦

- `POST /api/ai/analyze` - AI解卦（流式响应）

## 六爻基础知识

### 八卦
- 乾☰（天）、兑☱（泽）、离☲（火）、震☳（雷）
- 巽☴（风）、坎☵（水）、艮☶（山）、坤☷（地）

### 六爻组成
- 由下至上：初爻、二爻、三爻、四爻、五爻、上爻
- 阳爻（—）和阴爻（--）
- 动爻用○标记（老阴、老阳）

### 装卦要素
- **纳甲**：天干配置
- **地支**：十二地支配置
- **五行**：金木水火土
- **六亲**：父母、兄弟、子孙、妻财、官鬼
- **六神**：青龙、朱雀、勾陈、螣蛇、白虎、玄武
- **世应**：世爻和应爻的位置

## 开发说明

### 添加新的卦辞数据

编辑 `server/src/models/database.ts` 中的 `insertGuaData` 函数，添加完整的64卦数据。

### 自定义样式

修改 `client/tailwind.config.js` 和 `client/src/styles/index.css`。

### 扩展API

在 `server/src/controllers` 添加新的控制器，在 `server/src/routes` 中注册路由。

## 注意事项

1. **DeepSeek API配置**：必须配置有效的API密钥才能使用AI解卦功能
2. **数据库**：请确保 MySQL 服务/容器已初始化，可通过 `server/sql` 下的脚本导入基础数据
3. **卦辞数据**：当前只包含部分示例卦辞，需要补充完整的64卦卦辞和爻辞
4. **免责声明**：本系统仅供学习和娱乐使用，不应作为重大决策的依据

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

## 联系方式

如有问题或建议，请提交Issue。
