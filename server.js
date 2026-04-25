const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const JSON_PATH = path.join(__dirname, 'layout.json');

// HTTPサーバーの設定
const server = http.createServer((req, res) => {
    const urlPath = req.url.split('?')[0];
    let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        const ext = path.extname(filePath);
        const mime = {
            '.html': 'text/html; charset=utf-8',
            '.json': 'application/json',
            '.js': 'text/javascript',
            '.css': 'text/css'
        }[ext] || 'text/plain';
        
        res.writeHead(200, { 
            'Content-Type': mime,
            'Cache-Control': 'no-store, no-cache, must-revalidate, private'
        });
        res.end(content);
    });
});

// Socket.ioの設定（リアルタイムエンジン）
const io = new Server(server, {
    cors: { origin: "*" }
});

io.on('connection', (socket) => {
    console.log('新しいデバイスが接続されました');

    // 接続時に最新のデータを送信する
    fs.readFile(JSON_PATH, 'utf8', (err, data) => {
        if (!err) {
            try {
                socket.emit('dataChanged', JSON.parse(data));
            } catch (e) {
                console.error('JSON解析エラー');
            }
        }
    });

    // デバイスからの更新を受け取り、全員に配信する
    socket.on('updateData', (data) => {
        // ファイルに保存
        fs.writeFile(JSON_PATH, JSON.stringify(data), 'utf8', (err) => {
            if (err) console.error('保存エラー:', err);
            // 送信者以外全員の画面を即座に更新
            socket.broadcast.emit('dataChanged', data);
        });
    });

    socket.on('disconnect', () => {
        console.log('デバイスが切断されました');
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`松乃木飯店 Pro 稼働中: Port ${PORT}`);
});