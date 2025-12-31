# 八字批命功能 - 后端集成指南

## 📋 阶段3已完成内容

### ✅ 已创建的文件

1. **数据库表** - `server/sql/02_bazi_tables.sql`
2. **类型定义** - `server/src/types/bazi.ts`
3. **常量数据** - `server/src/utils/baziConstants.ts`
4. **核心算法** - `server/src/utils/bazi.ts`
5. **业务控制器** - `server/src/controllers/baziController.ts`
6. **路由配置** - `server/src/routes/baziRoutes.ts`

---

## 🚀 集成步骤

### 步骤1：执行数据库迁移

```bash
# 连接到MySQL并执行初始化脚本
mysql -u root -p liuyao_db < server/sql/02_bazi_tables.sql

# 或使用 Docker
docker-compose exec mysql mysql -u root -p123456 liuyao_db < server/sql/02_bazi_tables.sql
```

**验证：**
```sql
USE liuyao_db;
SHOW TABLES LIKE 'bazi%';  -- 应该看到 bazi_records 等表
SELECT * FROM permissions WHERE category = 'bazi';  -- 应该看到八字权限
```

### 步骤2：集成路由到主服务器

**方案A：如果有主路由文件（推荐）**

在 `server/src/index.ts` 或主路由文件中添加：

```typescript
import baziRoutes from './routes/baziRoutes';

// ... 其他代码

// 注册八字路由
app.use('/api/bazi', baziRoutes);
```

**方案B：如果需要重建服务器入口**

创建 `server/src/index.ts`：

```typescript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDatabase } from './models/database';
import baziRoutes from './routes/baziRoutes';
// 导入其他路由...

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/bazi', baziRoutes);
// 其他路由...

// 启动服务器
async function startServer() {
  try {
    await initDatabase();
    app.listen(PORT, () => {
      console.log(`✓ 服务器运行在 http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

startServer();
```

### 步骤3：启用认证中间件

编辑 `server/src/routes/baziRoutes.ts`，取消注释认证相关代码：

```typescript
import { authenticate, requirePermissions } from '../middleware/enhancedAuth';

// 然后在每个路由前添加中间件
router.post(
  '/',
  authenticate,                          // 启用登录验证
  requirePermissions(['bazi:create']),   // 启用权限检查
  baziController.createBazi
);
```

### 步骤4：验证API端点

使用 Postman 或 curl 测试：

**1. 创建八字**
```bash
curl -X POST http://localhost:5000/api/bazi \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "测试",
    "gender": "男",
    "birthDatetime": 638150400000,
    "birthLocation": "北京"
  }'
```

**2. 获取记录列表**
```bash
curl http://localhost:5000/api/bazi/records \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**3. 工具接口（仅计算）**
```bash
curl -X POST http://localhost:5000/api/bazi/tools/calculate-pillars \
  -H "Content-Type: application/json" \
  -d '{
    "gender": "男",
    "birthDatetime": 638150400000
  }'
```

---

## 📝 API 文档

### 1. 创建八字记录

**端点：** `POST /api/bazi`

**请求体：**
```json
{
  "name": "张三",
  "gender": "男",
  "birthDatetime": 638150400000,
  "birthLocation": "北京",
  "useTrueSolarTime": false
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "bazi": { /* 四柱信息 */ },
    "shiShen": { /* 十神分析 */ },
    "wuXing": { /* 五行统计 */ },
    "relations": { /* 地支关系 */ },
    "dayun": [ /* 大运列表 */ ],
    "qiyunAge": 3
  }
}
```

### 2. 获取记录列表

**端点：** `GET /api/bazi/records?search=xxx&limit=20&offset=0`

**查询参数：**
- `search` - 搜索关键词（可选）
- `limit` - 每页数量（默认20）
- `offset` - 偏移量（默认0）

**响应：**
```json
{
  "success": true,
  "data": [ /* 记录数组 */ ],
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0
  }
}
```

### 3. 获取单条记录

**端点：** `GET /api/bazi/records/:id`

### 4. 删除记录

**端点：** `DELETE /api/bazi/records/:id`

### 5. 更新AI分析

**端点：** `PUT /api/bazi/records/:id/analysis`

**请求体：**
```json
{
  "aiAnalysis": "AI批注内容...",
  "aiModel": "deepseek-chat"
}
```

### 6. 更新验证反馈

**端点：** `PUT /api/bazi/records/:id/verification`

**请求体：**
```json
{
  "actualFeedback": "实际情况反馈",
  "accuracyRating": 5,
  "userNotes": "备注"
}
```

### 7. 工具：仅计算八字

**端点：** `POST /api/bazi/tools/calculate-pillars`

**请求体：**
```json
{
  "gender": "男",
  "birthDatetime": 638150400000,
  "useTrueSolarTime": false,
  "birthLocation": "北京"
}
```

---

## 🧪 测试建议

### 单元测试

创建 `server/src/__tests__/bazi.test.ts`：

```typescript
import { calculateBaziFromDateTime, decorateBazi } from '../utils/bazi';

describe('八字计算测试', () => {
  test('计算1990年3月15日10时的八字', async () => {
    const timestamp = new Date('1990-03-15 10:00:00').getTime();
    const bazi = await calculateBaziFromDateTime(timestamp, '男');

    expect(bazi.year.ganZhi).toBe('庚午');
    expect(bazi.riGan).toBeDefined();
    expect(bazi.hour.ganZhi).toBeDefined();
  });

  test('五行分析', async () => {
    const timestamp = new Date('1990-03-15 10:00:00').getTime();
    const bazi = await calculateBaziFromDateTime(timestamp, '男');
    const decorated = decorateBazi(bazi);

    expect(decorated.wuXing.count).toBeDefined();
    expect(decorated.wuXing.strongest).toBeDefined();
  });
});
```

### 集成测试

1. 创建八字 → 检查数据库记录
2. 查询列表 → 验证分页
3. 更新分析 → 检查字段更新
4. 删除记录 → 验证硬删除

---

## ⚠️ 注意事项

### 1. 依赖检查

确保已安装：
```bash
cd server
npm install lunar-javascript uuid
```

### 2. TypeScript 编译

如果遇到类型错误：
```bash
cd server
npm run build
```

### 3. 权限配置

确保数据库中已有八字权限（已在SQL中配置）：
- `bazi:create`
- `bazi:view`
- `bazi:delete`
- `bazi:aiAnalysis`
- `bazi:verify`
- `bazi:export`

### 4. 用户隔离

所有查询自动过滤 `user_id = req.user.userId`，确保数据隔离。

---

## 🎯 后续步骤

1. ✅ 数据库迁移
2. ✅ 代码集成
3. ⏳ 创建AI分析控制器（可选，用于流式分析）
4. ⏳ 前端开发（阶段4）
5. ⏳ 端到端测试

---

## 📞 问题排查

### 问题1：lunar-javascript 导入错误

**解决：**
```bash
npm install lunar-javascript
# 或
yarn add lunar-javascript
```

### 问题2：数据库连接失败

**检查：**
- `.env` 文件配置
- MySQL 服务运行状态
- 数据库是否已创建

### 问题3：权限检查失败

**解决：**
```sql
-- 检查权限是否存在
SELECT * FROM permissions WHERE category = 'bazi';

-- 检查角色权限
SELECT * FROM role_permissions rp
JOIN permissions p ON rp.permission_id = p.id
WHERE p.category = 'bazi';
```

---

## ✨ 完成！

后端API已经准备就绪，可以开始测试或进行前端开发。
