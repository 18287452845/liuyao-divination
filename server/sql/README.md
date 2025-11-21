# MySQL数据库配置说明

## 数据库信息
- **数据库名**: liuyao_db
- **用户名**: root
- **密码**: 123456
- **字符集**: utf8mb4
- **排序规则**: utf8mb4_unicode_ci

## 数据库表结构

### 1. divination_records (卦象记录表)
存储用户的起卦记录和解析结果

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | VARCHAR(50) | 记录唯一标识 (主键) |
| timestamp | BIGINT | 起卦时间戳 |
| question | TEXT | 占问事项 |
| method | VARCHAR(20) | 起卦方式: time/number/manual |
| ben_gua | TEXT | 本卦数据(JSON格式) |
| bian_gua | TEXT | 变卦数据(JSON格式) |
| decoration | TEXT | 装卦信息(JSON格式) |
| ai_analysis | TEXT | AI解卦分析 |
| created_at | TIMESTAMP | 创建时间 |

### 2. trigrams (八卦基础数据表)
存储八卦的基础信息

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | INT | 主键ID (自增) |
| name | VARCHAR(10) | 卦名 |
| symbol | VARCHAR(10) | 卦符 |
| nature | VARCHAR(10) | 卦象属性 |
| element | VARCHAR(10) | 五行属性 |
| number | INT | 卦序号 |

### 3. gua_data (六十四卦数据表)
存储六十四卦的卦辞和爻辞

| 字段名 | 类型 | 说明 |
|--------|------|------|
| number | INT | 卦序号(1-64) (主键) |
| name | VARCHAR(20) | 卦名 |
| upper_trigram | VARCHAR(10) | 上卦 |
| lower_trigram | VARCHAR(10) | 下卦 |
| gua_ci | TEXT | 卦辞 |
| yao_ci | TEXT | 爻辞(JSON数组格式) |

## 安装步骤

### 方式一: 命令行执行

1. **登录MySQL**
```bash
mysql -u root -p
# 输入密码: 123456
```

2. **执行数据库初始化脚本**
```sql
source C:/Users/ly182/Documents/claude_prj/lt/server/sql/init_database.sql
```

3. **执行数据初始化脚本**
```sql
source C:/Users/ly182/Documents/claude_prj/lt/server/sql/insert_data.sql
```

4. **验证安装**
```sql
USE liuyao_db;
SELECT COUNT(*) as trigrams_count FROM trigrams;
SELECT COUNT(*) as gua_data_count FROM gua_data;
```

### 方式二: 使用MySQL Workbench

1. 打开MySQL Workbench
2. 连接到MySQL服务器 (root/123456)
3. 打开 `init_database.sql` 文件并执行
4. 打开 `insert_data.sql` 文件并执行
5. 刷新Schema查看新建的表

### 方式三: Windows命令行一键执行

在项目的 `server` 目录下运行:

```cmd
mysql -u root -p123456 < sql/init_database.sql
mysql -u root -p123456 < sql/insert_data.sql
```

## 验证数据库

执行以下SQL验证数据是否正确插入:

```sql
-- 使用数据库
USE liuyao_db;

-- 查看八卦数据 (应该有8条记录)
SELECT * FROM trigrams ORDER BY number;

-- 查看六十四卦数据 (目前有10条示例数据)
SELECT number, name, upper_trigram, lower_trigram FROM gua_data ORDER BY number;

-- 查看表结构
SHOW TABLES;
DESC divination_records;
DESC trigrams;
DESC gua_data;
```

## 迁移现有代码

如需将现有的SQLite代码迁移到MySQL,需要修改 `server/src/models/database.ts`:

1. 安装MySQL依赖:
```bash
cd server
npm install mysql2
```

2. 修改数据库连接配置
3. 将SQLite语法改为MySQL兼容语法

## 注意事项

1. **字符编码**: 数据库使用 utf8mb4 编码,支持中文和特殊字符
2. **JSON数据**: yao_ci字段存储JSON数组格式的爻辞数据
3. **索引优化**: 已为常用查询字段添加索引
4. **数据完整性**: 目前只包含前10卦的示例数据,需要补充完整的64卦数据
5. **备份**: 建议定期备份数据库

## 连接字符串示例

Node.js (mysql2):
```javascript
const mysql = require('mysql2');
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '123456',
  database: 'liuyao_db',
  charset: 'utf8mb4'
});
```

## 常用管理命令

```sql
-- 查看数据库
SHOW DATABASES;

-- 查看表
USE liuyao_db;
SHOW TABLES;

-- 查看表结构
DESC divination_records;

-- 清空表数据
TRUNCATE TABLE divination_records;

-- 删除数据库
DROP DATABASE liuyao_db;
```
