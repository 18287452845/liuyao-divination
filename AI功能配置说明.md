# AI功能配置说明

## 问题诊断

您遇到的"AI批注分析点击开始分析无效"和"AI解卦按钮点击直接成功但没有实际解卦"的问题，主要是由于 **DeepSeek API Key 未配置** 导致的。

## 问题原因

1. **缺少 `.env` 配置文件** - DeepSeek API Key 通过环境变量传递给后端
2. **API Key 为空** - 当后端无法访问 DeepSeek API 时，AI 分析功能无法正常工作
3. **前端错误提示不够明确** - 用户看到"成功"提示，但实际上没有内容生成

## 已修复的问题

我已经对代码进行了以下改进：

### 1. 创建了 `.env` 配置文件
在项目根目录创建了 `.env` 文件，包含所有必需的环境变量配置。

### 2. 改进了前端错误处理
- **修复了成功提示时机** - 现在只有在 AI 真正完成分析后才显示"AI解卦完成"提示
- **改进了错误消息** - 当请求失败时，显示更详细的错误信息
- **添加了完成回调** - 确保用户在正确的时间收到反馈

### 3. 加强了后端验证
- **API Key 检查** - 在调用 DeepSeek API 之前验证 API Key 是否已配置
- **明确的错误消息** - 当 API Key 未配置时，返回清晰的错误提示

## 配置步骤

### 第一步：获取 DeepSeek API Key

1. 访问 DeepSeek 平台：https://platform.deepseek.com/
2. 注册/登录账号
3. 进入"API Keys"页面：https://platform.deepseek.com/api_keys
4. 点击"创建新的API Key"
5. 复制生成的API Key（格式类似：`sk-xxxxxxxxxxxxxxxx`）

### 第二步：配置环境变量

编辑项目根目录的 `.env` 文件：

```bash
# DeepSeek API 配置
DEEPSEEK_API_KEY=sk-your-actual-api-key-here
DEEPSEEK_API_URL=https://api.deepseek.com
```

将 `sk-your-actual-api-key-here` 替换为您在第一步中获取的实际 API Key。

### 第三步：重启服务

配置完成后，需要重启 Docker 容器以使环境变量生效：

```bash
# 停止现有容器
docker compose down

# 重新启动（会读取新的 .env 配置）
docker compose up -d

# 查看日志确认启动成功
docker compose logs -f server
```

### 第四步：验证配置

1. 登录系统
2. 进行占卜，生成一个卦象
3. 点击"AI解卦"按钮
4. 应该能看到流式输出的 AI 分析结果

## 可选：用户个人 API Key

除了系统级别的 API Key，用户还可以配置自己的 DeepSeek API Key：

1. 登录系统
2. 进入"API设置"页面（路径：`/api-key-settings`）
3. 输入您的个人 API Key
4. 点击"保存"

**优先级**：用户个人 API Key > 系统默认 API Key

## 费用说明

- DeepSeek API 采用按使用量计费
- 具体价格请查看：https://platform.deepseek.com/pricing
- 建议在测试时先充值小额费用
- 可以在 API 设置中查看使用量统计

## 故障排查

### 问题1：提示"DeepSeek API Key未配置"

**解决方案**：
1. 确认 `.env` 文件中的 `DEEPSEEK_API_KEY` 已正确填写
2. 确保 API Key 以 `sk-` 开头
3. 检查 API Key 中是否有多余的空格或换行符
4. 重启 Docker 容器

### 问题2：提示"解卦失败: 401 Unauthorized"

**解决方案**：
1. API Key 无效或已过期
2. 前往 DeepSeek 平台重新生成 API Key
3. 更新 `.env` 文件并重启服务

### 问题3：提示"解卦失败: 429 Too Many Requests"

**解决方案**：
1. 请求频率过高，触发了限流
2. 等待一段时间后重试
3. 考虑升级 API 套餐以获得更高的配额

### 问题4：提示"解卦失败: Network Error"

**解决方案**：
1. 检查服务器网络连接
2. 确认可以访问 `https://api.deepseek.com`
3. 检查防火墙设置
4. 如果使用代理，需要配置 Docker 容器的代理设置

## 代码改进详情

### 修改文件清单

1. **前端文件**：
   - `client/src/utils/api.ts` - 添加 onComplete 回调，改进错误处理
   - `client/src/pages/JieguaPage.tsx` - 修复成功提示时机
   - `client/src/pages/BaziAiAnalysisPage.tsx` - 优化错误反馈

2. **后端文件**：
   - `server/src/controllers/aiController.ts` - 添加 API Key 验证
   - `.env` - 创建环境变量配置文件

### 主要改进

1. **添加了流式传输完成回调**：
   ```typescript
   await analyzeGuaStream(
     data,
     (content) => setAnalysis(prev => prev + content),
     (error) => toast.error('解卦失败: ' + error),
     () => {
       // 只在真正完成时显示成功
       toast.success('AI解卦完成');
       setAnalyzing(false);
     }
   );
   ```

2. **后端 API Key 验证**：
   ```typescript
   if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY.trim() === '') {
     return res.status(500).json({
       error: 'DeepSeek API Key未配置，请联系管理员配置API Key后再使用AI分析功能'
     });
   }
   ```

3. **改进的错误消息**：
   ```typescript
   const errorText = await response.text();
   throw new Error(errorText || `解卦请求失败 (${response.status})`);
   ```

## 测试建议

配置完成后，建议按以下步骤测试：

1. **测试六爻解卦**：
   - 创建一个卦象
   - 点击"AI解卦"
   - 观察流式输出是否正常
   - 确认分析完成后显示成功提示

2. **测试八字批注**：
   - 创建一个八字排盘
   - 点击"AI批注"
   - 观察流式输出是否正常

3. **测试错误处理**：
   - 临时使用无效的 API Key
   - 观察是否显示明确的错误消息
   - 恢复正确的 API Key

## 技术支持

如果配置后仍然遇到问题，请：

1. 查看后端日志：`docker compose logs server`
2. 检查浏览器控制台是否有错误信息
3. 确认 DeepSeek API 账户余额是否充足
4. 在项目 GitHub Issues 中提问

---

**更新时间**：2026-01-05
**版本**：v1.0
