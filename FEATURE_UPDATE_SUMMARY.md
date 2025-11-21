# 功能更新总结：API Key 管理与用户数据隔离

## 更新概述

本次更新实现了用户级别的 API Key 管理和数据隔离功能，让每个用户可以独立管理自己的 DeepSeek API Key，并且只能查看自己的占卜数据。

## 核心功能

### 1. API Key 管理
- ✅ 每个用户可以配置自己的 DeepSeek API Key
- ✅ API Key 存储在数据库中（建议后续加密存储）
- ✅ 提供脱敏显示（只显示前8位和后4位）
- ✅ 支持 API Key 的增删改查
- ✅ 提供 API Key 有效性测试功能

### 2. 数据隔离
- ✅ 每个用户只能查看自己的占卜记录
- ✅ 所有数据操作（创建、查询、更新、删除）都按用户ID过滤
- ✅ AI 解卦优先使用用户自己的 API Key，回退到系统默认 API Key

### 3. 前端界面
- ✅ 新增 API Key 设置页面 (`/settings/api-key`)
- ✅ 在导航栏添加"API Key设置"入口
- ✅ 提供友好的 API Key 管理界面
- ✅ 包含如何获取 API Key 的帮助信息

## 技术实现

### 数据库变更

#### 1. users 表新增字段
```sql
ALTER TABLE users
ADD COLUMN deepseek_api_key VARCHAR(255) COMMENT 'DeepSeek API密钥(用户个人)';

ALTER TABLE users
ADD COLUMN api_key_updated_at TIMESTAMP NULL COMMENT 'API密钥最后更新时间';
```

#### 2. divination_records 表新增字段
```sql
ALTER TABLE divination_records
ADD COLUMN user_id VARCHAR(50) COMMENT '创建用户ID';

ALTER TABLE divination_records
ADD INDEX idx_user_id (user_id);
```

### 后端变更

#### 1. 新增 API Key 管理控制器
- `server/src/controllers/apiKeyController.ts`
  - `getApiKey()` - 获取当前用户的 API Key（脱敏）
  - `updateApiKey()` - 更新 API Key
  - `deleteApiKey()` - 删除 API Key
  - `testApiKey()` - 测试 API Key 有效性

#### 2. 新增路由
- `GET /api/user/api-key` - 获取 API Key
- `PUT /api/user/api-key` - 更新 API Key
- `DELETE /api/user/api-key` - 删除 API Key
- `POST /api/user/api-key/test` - 测试 API Key

#### 3. 修改现有控制器
- `divinationController.ts`
  - `createDivination()` - 添加 user_id
  - `getRecords()` - 按用户过滤
  - `getRecordById()` - 按用户过滤
  - `updateAiAnalysis()` - 按用户过滤
  - `deleteRecord()` - 按用户过滤
  - 所有验证反馈相关方法 - 按用户过滤

- `aiController.ts`
  - `analyzeGua()` - 优先使用用户的 API Key

#### 4. 修改数据库模型
- `DivinationRecordModel` 所有方法都支持 `userId` 参数
  - `create()` - 添加 user_id 字段
  - `findAll()` - 支持用户过滤
  - `findById()` - 支持用户过滤
  - `updateAnalysis()` - 支持用户过滤
  - `deleteById()` - 支持用户过滤
  - `updateVerification()` - 支持用户过滤
  - `cancelVerification()` - 支持用户过滤
  - `findVerified()` - 支持用户过滤
  - `findUnverified()` - 支持用户过滤
  - `getStatistics()` - 支持用户过滤

### 前端变更

#### 1. 新增页面
- `client/src/pages/ApiKeySettingsPage.tsx`
  - 显示当前 API Key（脱敏）
  - 配置/更新 API Key
  - 删除 API Key
  - 测试 API Key 连接

#### 2. 路由更新
- `App.tsx` 添加新路由 `/settings/api-key`
- 导航栏添加"API Key设置"链接

#### 3. API 调用
- 所有 API 调用已经通过 axios 拦截器自动添加认证 token
- 无需额外修改现有 API 调用代码

## 文件清单

### 新增文件
```
server/
├── sql/
│   ├── add_user_apikey.sql          # 数据库迁移脚本
│   └── UPDATE_README.md              # 数据库更新说明
└── src/
    └── controllers/
        └── apiKeyController.ts       # API Key 管理控制器

client/
└── src/
    └── pages/
        └── ApiKeySettingsPage.tsx    # API Key 设置页面

FEATURE_UPDATE_SUMMARY.md             # 本文件
```

### 修改文件
```
server/src/
├── controllers/
│   ├── divinationController.ts       # 添加用户ID过滤
│   └── aiController.ts                # 使用用户API Key
├── models/
│   └── database.ts                    # 数据模型支持用户过滤
└── routes/
    └── index.ts                       # 添加API Key路由

client/src/
└── App.tsx                            # 添加路由和导航链接
```

## 部署步骤

### 1. 数据库更新
```bash
# 如果还没有运行用户认证表创建脚本
cd server
mysql -u root -p123456 < sql/auth_tables.sql
mysql -u root -p123456 < sql/auth_init_data.sql

# 执行本次更新脚本
mysql -u root -p123456 < sql/add_user_apikey.sql
```

### 2. 安装依赖
```bash
# 根目录
npm install

# 安装所有依赖
npm run install:all
```

### 3. 编译
```bash
# 编译后端
npm run server:build

# 编译前端
npm run client:build
```

### 4. 启动服务
```bash
# 开发模式（同时启动前后端）
npm run dev

# 或分别启动
npm run server:dev
npm run client:dev
```

## 使用指南

### 用户操作流程

1. **注册/登录**
   - 访问系统并登录账户

2. **配置 API Key**
   - 点击导航栏的"API Key设置"
   - 访问 [DeepSeek 开放平台](https://platform.deepseek.com) 获取 API Key
   - 在设置页面输入 API Key
   - 点击"测试连接"验证 API Key 有效性
   - 点击"保存"

3. **使用系统**
   - 起卦：创建的占卜记录会关联到当前用户
   - 查看历史：只能看到自己的占卜记录
   - AI 解卦：使用自己配置的 API Key

4. **管理 API Key**
   - 随时可以更新 API Key
   - 可以删除 API Key（删除后无法使用 AI 解卦）
   - 可以测试 API Key 是否有效

## API Key 安全建议

### 当前实现
- API Key 存储在数据库中（明文）
- 前端显示时进行脱敏处理
- 只有用户本人可以访问自己的 API Key

### 后续改进建议
1. **加密存储**
   - 使用 AES 加密算法加密 API Key
   - 密钥存储在环境变量中

2. **使用监控**
   - 记录 API Key 使用次数
   - 添加使用量统计
   - 设置使用限额提醒

3. **安全增强**
   - 添加 API Key 定期更换提醒
   - 支持多个 API Key 轮换使用
   - 添加 IP 白名单限制

## 测试要点

### 功能测试
- [ ] 新用户注册后可以配置 API Key
- [ ] API Key 配置后可以正常使用 AI 解卦
- [ ] 用户只能看到自己的占卜记录
- [ ] API Key 更新后立即生效
- [ ] 删除 API Key 后使用系统默认 Key
- [ ] API Key 测试功能正常
- [ ] 脱敏显示正确

### 数据隔离测试
- [ ] 用户 A 不能访问用户 B 的记录
- [ ] 用户 A 不能修改用户 B 的记录
- [ ] 用户 A 不能删除用户 B 的记录
- [ ] 用户 A 的统计数据只包含自己的记录

### API Key 测试
- [ ] 有效的 API Key 测试通过
- [ ] 无效的 API Key 测试失败
- [ ] 过期的 API Key 测试失败
- [ ] 网络错误时给出友好提示

## 已知问题与限制

1. **API Key 明文存储**
   - 当前版本 API Key 以明文存储在数据库中
   - 建议后续版本实施加密存储

2. **历史数据**
   - 更新前创建的占卜记录 user_id 为 NULL
   - 这些记录不会显示给任何用户
   - 可以通过数据迁移脚本分配给管理员或删除

3. **API Key 共享**
   - 当前不支持多用户共享同一个 API Key 的使用统计
   - 每个用户独立管理自己的 Key

## 常见问题

**Q: 如何获取 DeepSeek API Key？**
A: 访问 https://platform.deepseek.com 注册账号后，在 API Keys 页面创建。

**Q: 如果没有配置 API Key 会怎样？**
A: 系统会尝试使用服务器端配置的默认 API Key（如果有）。

**Q: 可以看到其他用户的占卜记录吗？**
A: 不可以。每个用户只能看到自己创建的记录。

**Q: API Key 会过期吗？**
A: DeepSeek API Key 本身不会过期，但可能因为账户余额不足而无法使用。

**Q: 可以使用多个 API Key 吗？**
A: 当前版本每个用户只能配置一个 API Key。

## 贡献者
- 功能设计与实现：AI Assistant
- 代码审查：待定

## 版本历史
- v1.1.0 (2024-11-21): 添加 API Key 管理和用户数据隔离功能
- v1.0.0: 初始版本

## 相关文档
- [数据库更新说明](server/sql/UPDATE_README.md)
- [项目文档](README.md)
- [快速开始](QUICKSTART.md)
