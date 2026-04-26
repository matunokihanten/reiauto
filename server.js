const http = require('http');
const fs = require('fs');
const path = require('path');
const { Server } = require('socket.io');

const PORT = process.env.PORT || 3000;
const JSON_PATH = path.join(__dirname, 'layout.json');

// HTTPサーバーの設定（HTMLなどのファイルをブラウザに送る）
const server = http.createServer((req, res) => {
    let urlPath = req.url.split('?')[0];
    let filePath = path.join(__dirname, urlPath === '/' ? 'index.html' : urlPath);

    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(404);
            res.end('Not Found');
            return;
        }
        const ext = path.extname(filePath);
        const mimeTypes = {
            '.html': 'text/html; charset=utf-8',
            '.json': 'application/json',
            '.js': 'text/javascript',
            '.css': 'text/css'
        };
        res.writeHead(200, {
            'Content-Type': mimeTypes[ext] || 'text/plain',
            'Cache-Control': 'no-store, no-cache, must-revalidate, private'
        });
        res.end(content);
    });
});

// 🚀 Socket.io（リアルタイム通信）の設定
const io = new Server(server, { cors: { origin: "*" } });

io.on('connection', (socket) => {
    console.log('📱 デバイスが接続しました');

    // ① 新しく画面を開いたデバイスに、現在の最新データを渡す
    fs.readFile(JSON_PATH, 'utf8', (err, data) => {
        if (!err) {
            try {
                socket.emit('dataChanged', JSON.parse(data));
            } catch(e) { console.error('JSON解析エラー'); }
        }
    });

    // ② 誰かが席をタップ・編集してデータを送ってきた時の処理
    socket.on('updateData', (stateData) => {
        // サーバーの layout.json に上書き保存
        fs.writeFile(JSON_PATH, JSON.stringify(stateData), 'utf8', (err) => {
            if (err) console.error('保存エラー:', err);
            
            // ★重要: 変更した人「以外」の全員の画面に、新しい状態を即座にプッシュ配信する！
            socket.broadcast.emit('dataChanged', stateData);
        });
    });

    socket.on('disconnect', () => {
        console.log('🔌 デバイスが切断されました');
    });
});

server.listen(PORT, '0.0.0.0', () => {
    console.log(`松乃木飯店 Pro 稼働中: http://0.0.0.0:${PORT}`);
});
