import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import routes from './routes';
import { initDatabase } from './models/database';

const app = express();
const PORT = parseInt(process.env.PORT || '5000', 10);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 设置默认响应头为UTF-8
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

// API路由
app.use('/api', routes);

// 健康检查接口
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    env: process.env.NODE_ENV || 'development'
  });
});

// 静态文件（生产环境）
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
  });
}

// 启动服务器
async function startServer() {
  try {
    // 初始化数据库
    await initDatabase();

    // 启动HTTP服务器
    const HOST = process.env.HOST || '0.0.0.0'; // 允许从网络访问
    app.listen(PORT, HOST, () => {
      console.log(`✓ 服务器运行在端口 ${PORT}`);
      console.log(`  本地访问: http://localhost:${PORT}`);
      if (HOST === '0.0.0.0') {
        // 获取本机IP地址（仅用于提示）
        const networkInterfaces = os.networkInterfaces();
        const addresses: string[] = [];
        for (const interfaceName in networkInterfaces) {
          const interfaces = networkInterfaces[interfaceName];
          if (interfaces) {
            for (const iface of interfaces) {
              // 兼容不同版本的 Node.js（family 可能是字符串或数字）
              const family = (iface as any).family;
              const isIPv4 = family === 'IPv4' || family === 4;
              if (isIPv4 && !iface.internal) {
                addresses.push(iface.address);
              }
            }
          }
        }
        if (addresses.length > 0) {
          console.log(`  网络访问: http://${addresses[0]}:${PORT}`);
        }
      }
    });
  } catch (error) {
    console.error('✗ 服务器启动失败:', error);
    process.exit(1);
  }
}

startServer();
