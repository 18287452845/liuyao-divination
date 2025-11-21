# 六爻排盘系统 - 快速参考手册

## 🚀 快速启动

### 一键启动开发环境

```bash
# 克隆项目后
cd lt

# 安装所有依赖
npm run install:all

# 初始化数据库
cd server && setup_mysql.bat  # Windows
cd server && ./setup_mysql.sh  # Linux/Mac

# 启动开发服务器
cd ..
npm run dev
```

访问: http://localhost:3000

---

## 📁 项目结构速览

```
lt/
├── client/         # 前端 (React + TS + Tailwind)
├── server/         # 后端 (Express + TS + MySQL)
├── package.json    # 根配置
└── README.md       # 项目说明
```

---

## 🗄️ 数据库信息

### 连接配置

```
数据库: liuyao_db
用户名: root
密码: 123456
主机: localhost
端口: 3306
字符集: utf8mb4
```

### 表结构

| 表名 | 说明 | 记录数 |
|------|------|--------|
| divination_records | 卦象记录 | 5 (测试数据) |
| trigrams | 八卦基础数据 | 8 |
| gua_data | 六十四卦数据 | 10 (示例) |

### 快速查询

```sql
-- 使用数据库
USE liuyao_db;

-- 查看所有表
SHOW TABLES;

-- 查看八卦数据
SELECT * FROM trigrams ORDER BY number;

-- 查看卦象数据
SELECT number, name, upper_trigram, lower_trigram FROM gua_data;

-- 查看最近的记录
SELECT id, question, method, created_at
FROM divination_records
ORDER BY created_at DESC
LIMIT 10;

-- 搜索记录
SELECT * FROM divination_records
WHERE question LIKE '%事业%';
```

---

## 🔌 API端点速览

### Base URL
```
http://localhost:5000/api
```

### 主要接口

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/divination` | 创建卦象 |
| GET | `/divination/simulate` | 模拟摇卦 |
| GET | `/records` | 获取历史记录 |
| GET | `/records/:id` | 获取单条记录 |
| PUT | `/records/:id/analysis` | 更新AI解析 |
| DELETE | `/records/:id` | 删除记录 |
| POST | `/ai/analyze` | AI解卦(流式) |

### 示例请求

**创建卦象**:
```bash
curl -X POST http://localhost:5000/api/divination \
  -H "Content-Type: application/json" \
  -d '{
    "question": "今年运势如何？",
    "method": "time"
  }'
```

**获取记录**:
```bash
curl http://localhost:5000/api/records?search=事业
```

---

## ⚙️ 环境配置

### server/.env

```env
# 服务器
PORT=5000
NODE_ENV=development

# DeepSeek API
DEEPSEEK_API_KEY=sk-xxxxx

# 数据库 (MySQL)
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=liuyao_db
```

---

## 🎨 主要组件

### 前端组件

```
client/src/
├── pages/
│   ├── Home.tsx         # 起卦页面
│   ├── Paipan.tsx      # 排盘页面
│   └── History.tsx     # 历史记录
├── components/
│   ├── GuaDisplay.tsx  # 卦象展示
│   └── YaoLine.tsx     # 爻位组件
└── utils/
    └── api.ts          # API封装
```

### 后端模块

```
server/src/
├── controllers/
│   ├── divinationController.ts  # 起卦逻辑
│   └── aiController.ts          # AI解析
├── models/
│   └── database.ts              # 数据库
└── utils/
    ├── liuyao.ts                # 六爻算法
    └── constants.ts             # 常量数据
```

---

## 🛠️ 常用命令

### 安装依赖

```bash
npm run install:all        # 安装所有依赖
cd client && npm install   # 仅安装前端
cd server && npm install   # 仅安装后端
```

### 开发模式

```bash
npm run dev               # 同时启动前后端
npm run client:dev        # 仅启动前端
npm run server:dev        # 仅启动后端
```

### 构建项目

```bash
npm run client:build      # 构建前端
npm run server:build      # 构建后端
```

### 生产模式

```bash
cd server
npm start                 # 启动生产服务器
```

### 数据库操作

```bash
# 初始化数据库
cd server
setup_mysql.bat           # Windows
./setup_mysql.sh          # Linux/Mac

# 手动执行SQL
mysql -u root -p123456 < sql/init_database.sql
mysql -u root -p123456 < sql/insert_data.sql
mysql -u root -p123456 < sql/test_data.sql

# 重置数据库
mysql -u root -p123456 -e "DROP DATABASE liuyao_db;"
mysql -u root -p123456 < sql/init_database.sql
```

---

## 🐛 调试技巧

### 查看日志

```bash
# 后端日志 (终端输出)
cd server
npm run dev

# 前端日志 (浏览器Console)
F12 -> Console
```

### 数据库调试

```bash
# 连接数据库
mysql -u root -p123456 -D liuyao_db

# 查看表结构
DESC divination_records;

# 查看最近错误
SHOW WARNINGS;

# 查看连接
SHOW PROCESSLIST;
```

### 常见问题快速修复

**端口被占用**:
```bash
# Windows查看端口占用
netstat -ano | findstr :5000
taskkill /PID <进程ID> /F

# Linux/Mac
lsof -ti:5000 | xargs kill -9
```

**MySQL连接失败**:
```bash
# 检查MySQL服务
net start mysql             # Windows
sudo service mysql start    # Linux

# 测试连接
mysql -u root -p123456 -e "SELECT 1;"
```

**依赖安装失败**:
```bash
# 清除缓存
npm cache clean --force
rm -rf node_modules
npm install
```

---

## 📊 数据类型定义

### DivinationRecord (卦象记录)

```typescript
interface DivinationRecord {
  id: string;
  timestamp: number;
  question: string;
  method: 'time' | 'number' | 'manual';
  benGua: Gua;        // 本卦
  bianGua: Gua | null; // 变卦
  decoration: GuaDecoration;
  aiAnalysis?: string;
}
```

### Gua (卦象)

```typescript
interface Gua {
  name: string;
  lines: [YaoType, YaoType, YaoType, YaoType, YaoType, YaoType];
  changes: [boolean, boolean, boolean, boolean, boolean, boolean];
  trigrams: {
    upper: string;
    lower: string;
  };
}
```

### GuaDecoration (装卦信息)

```typescript
interface GuaDecoration {
  earthBranches: string[];   // 地支 [6]
  sixRelatives: string[];    // 六亲 [6]
  fiveElements: string[];    // 五行 [6]
  heavenlyStems: string[];   // 天干 [6]
  sixSpirits: string[];      // 六神 [6]
  shiYing: [number, number]; // 世应位置
}
```

---

## 🔑 核心算法

### 时间起卦

```typescript
function timeMethod(lunar: LunarDate): GuaResult {
  const lower = (lunar.year + lunar.month + lunar.day) % 8;
  const upper = (lunar.year + lunar.month + lunar.day + lunar.hour) % 8;
  const changingLine = (lunar.year + lunar.month + lunar.day + lunar.hour) % 6;

  return { lower, upper, changingLine };
}
```

### 数字起卦

```typescript
function numberMethod(n1: number, n2: number, n3: number): GuaResult {
  return {
    lower: n1 % 8,
    upper: n2 % 8,
    changingLine: n3 % 6
  };
}
```

### 手动摇卦

```typescript
function simulateShake(): number {
  const coins = Array(3).fill(0).map(() => Math.random() < 0.5 ? 0 : 1);
  const heads = coins.filter(c => c === 1).length;

  switch(heads) {
    case 0: return 6; // 老阴 ×
    case 1: return 7; // 少阳 —
    case 2: return 8; // 少阴 --
    case 3: return 9; // 老阳 ○
  }
}
```

---

## 📚 学习资源

### 六爻基础知识

**八卦**:
- 乾☰(天/金)、兑☱(泽/金)、离☲(火/火)、震☳(雷/木)
- 巽☴(风/木)、坎☵(水/水)、艮☶(山/土)、坤☷(地/土)

**六爻组成**:
- 初爻、二爻、三爻、四爻、五爻、上爻 (由下至上)
- 阳爻(—)、阴爻(--)
- 动爻: 老阳○、老阴×

**装卦要素**:
- 纳甲: 天干配置
- 地支: 子丑寅卯辰巳午未申酉戌亥
- 五行: 金木水火土
- 六亲: 父母、兄弟、子孙、妻财、官鬼
- 六神: 青龙、朱雀、勾陈、螣蛇、白虎、玄武
- 世应: 世爻和应爻位置

---

## 📝 测试数据

系统已包含5条测试记录，涵盖:

1. **test-record-001**: 时间起卦 - 事业发展
2. **test-record-002**: 数字起卦 - 投资理财
3. **test-record-003**: 手动摇卦 - 感情婚姻
4. **test-record-004**: 时间起卦 - 健康状况 (无变爻)
5. **test-record-005**: 数字起卦 - 考试运势

可用于功能测试和界面展示。

---

## 🔐 安全注意事项

1. **API密钥保护**: 不要提交.env文件到Git
2. **SQL注入防护**: 使用参数化查询
3. **XSS防护**: 前端输入验证和转义
4. **CORS配置**: 生产环境限制允许的源
5. **敏感数据**: 不要在前端暴露API密钥

---

## 📞 获取帮助

- **完整文档**: `PROJECT_DOCUMENTATION.md`
- **数据库文档**: `server/sql/README.md`
- **快速开始**: `QUICKSTART.md`
- **项目说明**: `README.md`

---

## ✅ 功能检查清单

部署前确认:

- [ ] MySQL数据库已初始化
- [ ] 环境变量已配置
- [ ] DeepSeek API Key有效
- [ ] 前后端依赖已安装
- [ ] 开发服务器可正常启动
- [ ] API接口响应正常
- [ ] 前端页面显示正常
- [ ] 起卦功能正常
- [ ] AI解析功能正常
- [ ] 历史记录功能正常

---

**文档版本**: v1.0.0
**最后更新**: 2024-01-15
