# DeepSeek API密钥配置指南

## 📌 配置步骤

### 第一步：获取DeepSeek API密钥

1. **访问DeepSeek官网**
   ```
   https://platform.deepseek.com/
   ```

2. **注册并登录账户**
   - 使用邮箱或手机号注册
   - 完成实名认证（可能需要）

3. **创建API密钥**
   - 登录后进入"API Keys"页面
   - 点击"创建新密钥"按钮
   - 给密钥命名（如：liuyao-project）
   - 复制生成的密钥（格式：`sk-xxxxxxxxxxxxxxxx`）
   - ⚠️ **重要**：密钥只显示一次，请妥善保存！

4. **充值账户余额**
   - DeepSeek按量计费
   - 建议先充值10-20元测试
   - 价格参考（2024年）：
     - 输入：约 ¥0.001/1K tokens
     - 输出：约 ¥0.002/1K tokens

### 第二步：在项目中配置密钥

#### 方式一：编辑 .env 文件（推荐）

1. **打开配置文件**
   ```bash
   # 在项目的 server 目录下
   cd server

   # Windows
   notepad .env

   # Mac/Linux
   nano .env
   # 或
   vim .env
   ```

2. **修改密钥配置**
   找到这一行：
   ```env
   DEEPSEEK_API_KEY=your_deepseek_api_key_here
   ```

   替换为你的实际密钥：
   ```env
   DEEPSEEK_API_KEY=sk-your-actual-api-key-here
   ```

3. **保存文件**
   - Windows记事本：Ctrl+S
   - Nano编辑器：Ctrl+O, 回车, Ctrl+X
   - Vim编辑器：ESC, 输入`:wq`, 回车

#### 方式二：通过命令行配置

**Windows CMD:**
```cmd
cd server
echo DEEPSEEK_API_KEY=sk-your-actual-api-key-here >> .env
```

**Windows PowerShell:**
```powershell
cd server
Add-Content .env "DEEPSEEK_API_KEY=sk-your-actual-api-key-here"
```

**Linux/Mac:**
```bash
cd server
sed -i 's/your_deepseek_api_key_here/sk-your-actual-api-key-here/' .env
```

### 第三步：验证配置

#### 方法1：查看配置文件

```bash
cd server
cat .env | grep DEEPSEEK
```

应该看到类似输出：
```
DEEPSEEK_API_KEY=sk-xxxxxxxxxxxxxxxx
DEEPSEEK_API_URL=https://api.deepseek.com
```

#### 方法2：启动服务器测试

```bash
# 安装依赖（如果还没安装）
cd server
npm install

# 启动服务器
npm run dev
```

如果配置正确，你会看到：
```
✓ MySQL数据库连接成功
✓ 八卦基础数据: 8 条
✓ 六十四卦数据: 10 条
✓ 卦象记录: 5 条
✓ 数据库初始化检查完成
✓ 服务器运行在端口 5000
```

#### 方法3：测试AI解卦功能

1. 启动完整项目：
   ```bash
   # 在项目根目录
   npm run dev
   ```

2. 访问前端页面：
   ```
   http://localhost:3000
   ```

3. 进行一次起卦操作

4. 在排盘页面点击"AI智能解卦"按钮

5. 如果配置正确，应该能看到流式返回的解卦内容

## ⚙️ 完整配置文件示例

`server/.env` 文件的完整内容：

```env
# 服务器配置
PORT=5000
NODE_ENV=development

# MySQL数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=123456
DB_NAME=liuyao_db

# DeepSeek API配置
DEEPSEEK_API_KEY=sk-1234567890abcdefghijklmnopqrstuvwxyz
DEEPSEEK_API_URL=https://api.deepseek.com
```

## 🔐 安全注意事项

1. **不要提交密钥到Git仓库**
   - `.env` 文件已在 `.gitignore` 中
   - 永远不要将真实密钥提交到公开仓库

2. **密钥保护**
   - 不要在代码中硬编码密钥
   - 不要在前端代码中使用密钥
   - 定期轮换API密钥

3. **环境隔离**
   - 开发环境和生产环境使用不同的密钥
   - 可以创建多个密钥分别用于不同环境

4. **监控使用量**
   - 定期检查DeepSeek控制台的用量统计
   - 设置用量告警避免超额消费

## 🐛 常见问题

### Q1: 提示"API密钥无效"

**原因**：
- 密钥复制错误（多余空格或换行）
- 密钥已过期或被删除
- 账户余额不足

**解决**：
```bash
# 检查密钥格式
cd server
cat .env | grep DEEPSEEK_API_KEY
# 确保没有多余的空格或引号
```

### Q2: 提示"网络连接失败"

**原因**：
- 网络问题
- API地址配置错误
- 防火墙拦截

**解决**：
```bash
# 测试网络连接
curl https://api.deepseek.com

# 检查API地址配置
cd server
cat .env | grep DEEPSEEK_API_URL
```

### Q3: AI解卦没有响应

**可能原因**：
1. API密钥未配置
2. 服务器未读取到环境变量
3. 余额不足

**调试步骤**：
```bash
# 1. 重启服务器
cd server
npm run dev

# 2. 查看服务器日志
# 应该能看到详细的错误信息

# 3. 检查代码是否正确加载env
# 在 server/src/controllers/aiController.ts 中
# 应该有类似代码：
# const apiKey = process.env.DEEPSEEK_API_KEY;
```

### Q4: 如何临时更改密钥（不修改文件）

**Windows:**
```cmd
set DEEPSEEK_API_KEY=sk-new-key-here
npm run dev
```

**Linux/Mac:**
```bash
export DEEPSEEK_API_KEY=sk-new-key-here
npm run dev
```

## 💰 费用估算

基于DeepSeek当前定价（2024年）：

**单次解卦费用**：
- 输入token（卦象信息）：约500 tokens
- 输出token（解析内容）：约1000 tokens
- 单次费用：约 ¥0.001 - ¥0.003

**100次解卦**：约 ¥0.10 - ¥0.30

**1000次解卦**：约 ¥1.00 - ¥3.00

建议初次充值 ¥10-20 元即可使用较长时间。

## 📞 获取帮助

- **DeepSeek官方文档**：https://platform.deepseek.com/docs
- **API状态监控**：https://status.deepseek.com
- **技术支持**：通过DeepSeek官网联系客服

## 🔄 密钥轮换建议

为了安全，建议定期更换API密钥：

1. 在DeepSeek控制台创建新密钥
2. 更新 `.env` 文件中的密钥
3. 重启服务器
4. 在DeepSeek控制台删除旧密钥

建议轮换周期：3-6个月

---

**配置完成后，记得重启服务器使配置生效！**
