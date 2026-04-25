const http = require('http');
const fs = require('fs');
const path = require('path');

// Render環境のポート、またはローカルの3000番を使用
const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];

    // 保存処理 (save.php への POST)
    if (req.method === 'POST' && urlPath === '/save.php') {
        let body = '';
        req.on('data', chunk => { body += chunk.toString(); });
        req.on('end', () => {
            const jsonPath = path.join(__dirname, 'layout.json');
            fs.writeFile(jsonPath, body, 'utf8', (err) => {
                if (err) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Save Error');
                } else {
                    res.writeHead(200, { 'Content-Type': 'text/plain' });
                    res.end('success');
                }
            });
        });
        return;
    }

    // 静的なファイルの配信
    let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);
    const extname = path.extname(filePath);
    const mimeTypes = {
        '.html': 'text/html; charset=utf-8',
        '.json': 'application/json',
        '.js': 'text/javascript',
        '.css': 'text/css'
    };
    const contentType = mimeTypes[extname] || 'text/plain';

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
        } else {
            res.writeHead(200, { 
                'Content-Type': contentType,
                'Cache-Control': 'no-store, no-cache, must-revalidate, private' 
            });
            res.end(content, 'utf-8');
        }
    });
});

// '0.0.0.0' を指定することで、Renderの外部ネットワークからの接続を許可します
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
});