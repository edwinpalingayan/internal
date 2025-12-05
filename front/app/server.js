const express = require('express');
const path = require('path');
const { createProxyMiddleware } = require('http-proxy-middleware');
const app = express();

console.log(`run`);

// バックエンドへのプロキシ.
const PROXY_URL = process.env.PROXY_URL || '';
console.log(`proxy url: "${PROXY_URL}"`);
app.use('/api', createProxyMiddleware({
  target: `${PROXY_URL}`,
  changeOrigin: true,
  pathRewrite: { '^/': '/api/' },
}));

// AWSヘルスチェック.
app.get('/awshealthcheck', (req, res) => {
  console.log(`awshealthcheck`);
  res.status(200).send('OK');
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 80;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});