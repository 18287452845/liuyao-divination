# 六爻排盘与八字批命系统

一个完整的传统命理系统，集成六爻占卜和八字批命功能，结合现代Web技术和AI智能解析。

## 功能特点

### 核心功能

#### 六爻占卜系统
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

#### 八字批命系统
- **完整八字计算**
  - 年月日时四柱排盘
  - 天干地支自动配置
  - 十神关系分析（比肩、劫财、食神、伤官等）
  - 五行强弱分析
  - 用神、忌神判断
  - 纳音五行计算

- **大运推算**
  - 自动计算起运年龄
  - 顺排/逆排大运
  - 大运十神分析
  - 大运五行分析

- **八字记录管理**
  - 保存八字记录
  - 历史记录查询
  - AI批注功能
  - 验证反馈系统

#### AI智能解析
- **六爻AI解卦**
  - 集成DeepSeek API进行专业解卦
  - 流式显示解卦过程
  - 基于完整卦象信息的智能分析
  - 包含用神、原神、忌神等要素分析

- **八字AI批注**
  - 基于完整八字信息的智能分析
  - 流式显示批注过程
  - 性格、事业、财运、婚姻等多维度分析
  - 用户可配置个人DeepSeek API密钥

#### 用户认证与授权
- **JWT身份认证**
  - 安全的密码加密（bcrypt）
  - 访问令牌和刷新令牌机制
  - 自动令牌刷新
  - 会话管理

- **基于角色的访问控制（RBAC）**
  - 灵活的角色-权限系统
  - 细粒度权限控制
  - 默认角色：管理员、普通用户
  - 支持自定义角色和权限

- **用户数据隔离**
  - 用户只能访问自己的占卜记录
  - 管理员可查看所有数据
  - 安全的数据访问控制

#### 管理后台
- **用户管理**
  - 创建、编辑、删除用户
  - 启用/禁用用户账户
  - 重置用户密码
  - 查看用户详情和角色

- **角色与权限管理**
  - 创建自定义角色
  - 分配权限给角色
  - 分配角色给用户
  - 启用/禁用角色

- **会话管理**
  - 查看所有活跃会话
  - 强制用户登出
  - 会话统计和监控

- **日志与审计**
  - 登录历史记录（IP、用户代理）
  - 用户操作日志
  - 审计日志
  - 日志导出功能

- **邀请码系统**
  - 生成邀请码
  - 设置使用限制和过期时间
  - 跟踪邀请码使用情况
  - 批量创建邀请码

#### 安全特性
- **登录安全**
  - 失败登录尝试跟踪（最多5次）
  - 账户锁定机制（30分钟）
  - 密码强度要求
  - 密码修改功能

- **API密钥管理**
  - 系统级DeepSeek API密钥
  - 用户级个人API密钥（优先使用）
  - 安全的密钥存储

- **数据管理**
  - MySQL数据库持久化存储
  - 历史记录查询和搜索
  - 记录详情查看
  - 数据删除管理
  - 验证反馈系统

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
- JWT认证（jsonwebtoken + bcryptjs）
- lunar-javascript（农历转换和八字计算）

### AI集成
- DeepSeek API（智能解卦和八字批注）
- 支持流式SSE响应
- 用户级和系统级API密钥管理

## 项目结构

```
lt/
├── client/                 # 前端React应用
│   ├── src/
│   │   ├── components/    # 可复用组件
│   │   ├── pages/         # 页面组件
│   │   │   ├── admin/     # 管理后台页面
│   │   │   ├── LoginPage.tsx
│   │   │   ├── DivinationPage.tsx  # 六爻起卦
│   │   │   ├── PaidianPage.tsx     # 六爻排盘
│   │   │   ├── JieguaPage.tsx      # 六爻解卦
│   │   │   ├── HistoryPage.tsx     # 六爻历史
│   │   │   ├── BaziInputPage.tsx   # 八字输入
│   │   │   ├── BaziDisplayPage.tsx # 八字排盘
│   │   │   ├── BaziHistoryPage.tsx # 八字历史
│   │   │   └── ...
│   │   ├── contexts/      # React Context（认证等）
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
│   │   │   ├── authController.ts
│   │   │   ├── divinationController.ts
│   │   │   ├── baziController.ts
│   │   │   ├── aiController.ts
│   │   │   ├── userController.ts
│   │   │   └── ...
│   │   ├── middleware/    # 中间件（认证、权限）
│   │   ├── models/        # 数据模型
│   │   ├── routes/        # 路由
│   │   ├── utils/         # 工具函数
│   │   │   ├── liuyao.ts  # 六爻算法
│   │   │   ├── bazi.ts    # 八字算法
│   │   │   ├── password.ts # 密码加密
│   │   │   └── ...
│   │   └── index.ts       # 服务器入口
│   ├── sql/               # 数据库初始化脚本
│   ├── package.json
│   └── tsconfig.json
│
├── docker-compose.yml     # Docker编排配置
├── .env.example           # 环境变量示例
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

### 1. 登录系统

访问系统首页，使用账号密码登录：
- 默认管理员账号：`admin` / `admin123`（**生产环境请立即修改**）
- 普通用户需要邀请码注册

### 2. 六爻占卜

#### 起卦
访问首页，选择起卦方式：
- **时间起卦**：输入占问事项后直接点击"开始起卦"
- **数字起卦**：输入三个正整数（任意大小）
- **手动摇卦**：点击"摇卦"按钮六次，模拟传统摇卦过程

#### 查看排盘
起卦完成后自动跳转到排盘页面，可以看到：
- 占问信息
- 本卦详细信息（包含六神、纳甲、地支、五行、六亲、世应）
- 变卦信息（如果有动爻）

#### AI解卦
在排盘页面点击"AI智能解卦"按钮，系统将：
1. 构建包含完整卦象信息的prompt
2. 调用DeepSeek API进行解析
3. 流式显示解卦结果
4. 自动保存解卦记录

#### 历史记录
点击导航栏的"历史记录"可以：
- 查看所有历史卦象
- 搜索特定占问事项
- 快速访问之前的卦象和解析
- 删除不需要的记录

### 3. 八字批命

#### 创建八字
点击导航栏的"八字批命"，输入：
- 姓名（可选）
- 性别（必填，影响大运排列）
- 出生日期时间
- 出生地点（可选，用于真太阳时校正）

#### 查看八字排盘
系统自动计算并显示：
- 年月日时四柱
- 十神关系
- 五行强弱
- 用神、忌神
- 大运推算（8个大运周期）

#### AI批注
点击"AI批注"按钮，获取：
- 性格特点分析
- 事业运势
- 财运分析
- 婚姻感情
- 健康状况
- 流年运势

#### 八字记录
点击"八字记录"查看：
- 所有历史八字记录
- 详细八字信息
- AI批注内容
- 验证反馈

### 4. 管理后台（管理员）

访问 `/admin` 路径，可以：
- 管理用户账户
- 配置角色和权限
- 查看登录日志
- 管理活跃会话
- 生成邀请码
- 查看审计日志

### 5. 个人设置

- **修改密码**：点击右上角用户名 → 修改密码
- **API密钥设置**：配置个人DeepSeek API密钥（优先于系统密钥使用）

## API接口说明

### 认证相关
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册（需要邀请码）
- `POST /api/auth/logout` - 用户登出
- `POST /api/auth/refresh` - 刷新访问令牌
- `PUT /api/auth/change-password` - 修改密码
- `GET /api/auth/profile` - 获取用户信息

### 六爻占卜相关
- `POST /api/divination` - 创建卦象
- `GET /api/divination/simulate` - 模拟摇卦
- `GET /api/records` - 获取历史记录列表
- `GET /api/records/:id` - 获取单条记录
- `PUT /api/records/:id/analysis` - 更新AI解析
- `PUT /api/records/:id/verification` - 更新验证反馈
- `DELETE /api/records/:id` - 删除记录

### 八字批命相关
- `POST /api/bazi` - 创建八字记录
- `GET /api/bazi/records` - 获取八字记录列表
- `GET /api/bazi/records/:id` - 获取单条八字记录
- `DELETE /api/bazi/records/:id` - 删除八字记录
- `PUT /api/bazi/records/:id/analysis` - 更新AI批注
- `PUT /api/bazi/records/:id/verification` - 更新验证反馈
- `POST /api/bazi/tools/calculate-pillars` - 计算四柱（不保存）

### AI解析相关
- `POST /api/ai/analyze` - 六爻AI解卦（流式SSE响应）
- `POST /api/bazi/ai/analyze` - 八字AI批注（流式SSE响应）
- `POST /api/bazi/ai/analyze-sync` - 八字AI批注（同步响应）

### 用户管理（管理员）
- `GET /api/users` - 获取用户列表
- `POST /api/users` - 创建用户
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户
- `PUT /api/users/:id/status` - 启用/禁用用户
- `PUT /api/users/:id/reset-password` - 重置用户密码

### 角色与权限管理（管理员）
- `GET /api/roles` - 获取角色列表
- `POST /api/roles` - 创建角色
- `PUT /api/roles/:id` - 更新角色
- `DELETE /api/roles/:id` - 删除角色
- `GET /api/permissions` - 获取权限列表
- `POST /api/roles/:id/permissions` - 分配权限给角色

### 日志管理（管理员）
- `GET /api/logs/login` - 获取登录日志
- `GET /api/logs/operation` - 获取操作日志
- `GET /api/audit-logs` - 获取审计日志
- `GET /api/logs/export` - 导出日志

### 会话管理
- `GET /api/sessions` - 获取会话列表
- `DELETE /api/sessions/:id` - 删除指定会话

### 邀请码管理（管理员）
- `GET /api/invite-codes` - 获取邀请码列表
- `POST /api/invite-codes` - 创建邀请码
- `DELETE /api/invite-codes/:id` - 删除邀请码

### 个人设置
- `GET /api/user/api-key` - 获取个人API密钥
- `PUT /api/user/api-key` - 更新个人API密钥
- `DELETE /api/user/api-key` - 删除个人API密钥

### 工具接口
- `POST /api/tools/calendar` - 公历农历转换
- `POST /api/tools/branch-relations` - 地支关系查询
- `GET /api/tools/gua/:number` - 根据卦序查询卦象

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

## 八字基础知识

### 四柱
- **年柱**：出生年份的天干地支
- **月柱**：出生月份的天干地支
- **日柱**：出生日期的天干地支（日主/日元）
- **时柱**：出生时辰的天干地支

### 天干（十天干）
- 甲、乙、丙、丁、戊、己、庚、辛、壬、癸
- 阳干：甲、丙、戊、庚、壬
- 阴干：乙、丁、己、辛、癸

### 地支（十二地支）
- 子、丑、寅、卯、辰、巳、午、未、申、酉、戌、亥
- 对应生肖：鼠、牛、虎、兔、龙、蛇、马、羊、猴、鸡、狗、猪

### 五行属性
- **木**：甲乙寅卯
- **火**：丙丁巳午
- **土**：戊己辰戌丑未
- **金**：庚辛申酉
- **水**：壬癸亥子

### 十神关系
以日干为中心，根据五行生克关系确定：
- **比肩**：同性同五行
- **劫财**：异性同五行
- **食神**：同性我生
- **伤官**：异性我生
- **偏财**：同性我克
- **正财**：异性我克
- **偏官（七杀）**：同性克我
- **正官**：异性克我
- **偏印（枭神）**：同性生我
- **正印**：异性生我

### 大运
- 每步大运管10年
- 男命阳年生、女命阴年生：顺排
- 男命阴年生、女命阳年生：逆排
- 起运年龄根据出生日到节气的距离计算

### 纳音五行
六十甲子每两组配一个纳音：
- 海中金、炉中火、大林木、路旁土、剑锋金等
- 共30种纳音五行

## 开发说明

### 数据库架构

#### 核心表
- **users** - 用户账户（密码加密、状态管理）
- **roles** - 角色定义
- **permissions** - 权限定义
- **user_roles** - 用户-角色关联
- **role_permissions** - 角色-权限关联

#### 六爻相关表
- **trigrams** - 八卦基础数据
- **gua_data** - 64卦数据（卦名、卦辞）
- **divination_records** - 六爻记录（JSON存储完整卦象）

#### 八字相关表
- **bazi_records** - 八字记录（四柱、十神、五行、大运）
- **jie_qi_data** - 节气数据（用于精确起运计算）
- **liu_shi_jia_zi** - 六十甲子表（纳音五行）

#### 日志与审计表
- **login_logs** - 登录历史
- **operation_logs** - 操作日志
- **audit_logs** - 审计日志
- **user_sessions** - 会话管理

#### 其他表
- **invite_codes** - 邀请码系统

### 添加新的卦辞数据

编辑 `server/src/models/database.ts` 中的 `insertGuaData` 函数，添加完整的64卦数据。

### 自定义样式

修改 `client/tailwind.config.js` 和 `client/src/styles/index.css`。

### 扩展API

在 `server/src/controllers` 添加新的控制器，在 `server/src/routes` 中注册路由。

### 添加新权限

1. 在 `server/sql/02_auth_permissions_migration.sql` 中添加权限定义
2. 在 `server/src/middleware/auth.ts` 中使用 `requirePermissions` 中间件
3. 为相应角色分配新权限

## 注意事项

1. **DeepSeek API配置**：必须配置有效的API密钥才能使用AI解卦和批注功能
   - 系统级密钥：在 `server/.env` 中配置 `DEEPSEEK_API_KEY`
   - 用户级密钥：在个人设置中配置（优先使用）

2. **数据库初始化**：
   - 使用Docker部署时，数据库会自动初始化
   - 手动部署需要执行 `server/sql` 下的SQL脚本
   - 数据库包含：用户认证、权限系统、六爻记录、八字记录等表

3. **默认账户安全**：
   - 默认管理员账户：`admin` / `admin123`
   - **生产环境必须立即修改默认密码**
   - 建议启用邀请码系统控制用户注册

4. **权限配置**：
   - 系统使用RBAC权限模型
   - 默认角色：admin（管理员）、user（普通用户）
   - 可以自定义角色和权限组合

5. **数据隔离**：
   - 普通用户只能访问自己的占卜和八字记录
   - 管理员可以查看所有用户的数据
   - 通过 `user_id` 字段实现数据隔离

6. **卦辞数据**：
   - 当前包含64卦基础数据
   - 可以在数据库中补充完整的卦辞和爻辞

7. **真太阳时**：
   - 八字批命支持真太阳时校正
   - 需要提供出生地点信息
   - 影响时辰的准确性

8. **免责声明**：本系统仅供学习和娱乐使用，不应作为重大决策的依据

## 许可证

MIT License

## 贡献

欢迎提交Issue和Pull Request！

### 开发流程
1. Fork本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启Pull Request

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint配置
- 提交前运行测试
- 保持代码注释清晰

## 更新日志

### v2.0.0 (2025-01)
- ✅ 新增八字批命完整功能
- ✅ 新增用户认证与授权系统（JWT + RBAC）
- ✅ 新增管理后台（用户、角色、权限、日志管理）
- ✅ 新增会话管理和邀请码系统
- ✅ 新增个人API密钥管理
- ✅ 新增验证反馈系统
- ✅ Docker部署支持
- ✅ 数据库自动初始化

### v1.0.0 (2024)
- ✅ 六爻占卜核心功能
- ✅ 三种起卦方式
- ✅ 完整排盘系统
- ✅ AI智能解卦
- ✅ 历史记录管理

## 联系方式

如有问题或建议，请提交Issue。
