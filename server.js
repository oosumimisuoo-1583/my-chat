const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

// HTML画面のデータを直接定義（index.htmlが不要になります）
const htmlContent = `
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>名前付きリアルタイムチャット</title>
    <style>
        body { font-family: sans-serif; margin: 20px; background: #f9f9f9; }
        #login-wrap { max-width: 400px; margin: 100px auto; padding: 20px; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
        #chat-wrap { display: none; max-width: 600px; margin: 0 auto; }
        #messages { list-style-type: none; padding: 0; max-height: 400px; overflow-y: auto; border: 1px solid #ccc; padding: 10px; background: white; border-radius: 4px; }
        #messages li { padding: 8px; margin-bottom: 5px; background: #f4f4f4; border-radius: 4px; }
        .user-name { font-weight: bold; color: #337ab7; margin-right: 8px; }
        #messages li.system-msg { background: #e2e2e2; color: #555; text-align: center; font-size: 14px; font-style: italic; }
        #form { display: flex; gap: 10px; margin-top: 10px; }
        #input { flex-grow: 1; padding: 10px; }
        input, button { padding: 10px; font-size: 16px; }
    </style>
</head>
<body>

    <!-- 1. ニックネーム入力画面 -->
    <div id="login-wrap">
        <h2>ニックネームを入力</h2>
        <form id="login-form">
            <input id="nickname" autocomplete="off" placeholder="名前を入力してください" required />
            <button type="submit">参加する</button>
        </form>
    </div>

    <!-- 2. チャット画面 -->
    <div id="chat-wrap">
        <h2>リアルタイムチャット (<span id="my-name"></span>)</h2>
        <ul id="messages"></ul>
        <form id="form" action="">
            <input id="input" autocomplete="off" placeholder="メッセージを入力..." required /><button>送信</button>
        </form>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        const socket = io();
        let myName = "";

        const loginForm = document.getElementById('login-form');
        const nicknameInput = document.getElementById('nickname');
        const loginWrap = document.getElementById('login-wrap');
        const chatWrap = document.getElementById('chat-wrap');
        const myNameDisplay = document.getElementById('my-name');

        const form = document.getElementById('form');
        const input = document.getElementById('input');
        const messages = document.getElementById('messages');

        // 参加ボタンを押したとき
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (nicknameInput.value.trim()) {
                myName = nicknameInput.value.trim();
                myNameDisplay.textContent = myName;
                loginWrap.style.display = 'none';
                chatWrap.style.display = 'block';
                socket.emit('join', myName);
            }
        });

        // メッセージを送信したとき
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            if (input.value) {
                socket.emit('chat message', {
                    name: myName,
                    text: input.value
                });
                input.value = '';
            }
        });

        // メッセージを受信したとき
        socket.on('chat message', (data) => {
            const item = document.createElement('li');
            const nameSpan = document.createElement('span');
            nameSpan.classList.add('user-name');
            nameSpan.textContent = data.name + " :";
            const textSpan = document.createElement('span');
            textSpan.textContent = data.text;

            item.appendChild(nameSpan);
            item.appendChild(textSpan);
            messages.appendChild(item);
            messages.scrollTop = messages.scrollHeight;
        });

        // 入退室のシステムメッセージを受信したとき
        socket.on('system message', (msg) => {
            const item = document.createElement('li');
            item.classList.add('system-msg');
            item.textContent = msg;
            messages.appendChild(item);
            messages.scrollTop = messages.scrollHeight;
        });
    </script>
</body>
</html>
`;

// ブラウザがアクセスしてきたら上のHTMLデータを返す
app.get('/', (req, res) => {
    res.send(htmlContent);
});

// サーバー通信の処理
io.on('connection', (socket) => {
    socket.username = "ゲスト";

    socket.on('join', (name) => {
        socket.username = name;
        io.emit('system message', `${name} さんが参加しました`);
    });

    socket.on('chat message', (data) => {
        io.emit('chat message', data);
    });

    socket.on('disconnect', () => {
        io.emit('system message', `${socket.username} さんが退室しました`);
    });
});

// インターネット公開（Render等）の自動割り当てポート、または3000番で起動
const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
    console.log(`サーバーが起動しました: ポート ${PORT}`);
});
