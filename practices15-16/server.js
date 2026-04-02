const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

//VAPID КЛЮЧИ 
const vapidKeys = {
    publicKey: 'BJm73pVOIB3NCZtvjqg4fQbJ-U1BAE-Z3omQnG6aTTDls45cQK3AcEw8ACmiGU1dQTiVyQjcpymxXIvCMioyqwo',   
    privateKey: 'wtAiKlQkk2WVOVbbLyS4UN9UcGSsUDyKB4NPUOokKOI'    
};

webpush.setVapidDetails(
    'mailto:ivanova.v.d@edu.mirea.ru',  
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Раздаём статические файлы из текущей папки
app.use(express.static(path.join(__dirname, './')));

// Хранилище push-подписок
let subscriptions = [];

const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
});

//WEBSOCKET
io.on('connection', (socket) => {
    console.log('Клиент подключён:', socket.id);

    // Получаем новую задачу от клиента
    socket.on('newTask', (task) => {
        console.log('Новая задача:', task.text);

        io.emit('taskAdded', task);

        // Формируем push-уведомление
        const payload = JSON.stringify({
            title: 'Новая заметка',
            body: task.text
        });

        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error('Push error:', err);
            });
        });
    });

    socket.on('disconnect', () => {
        console.log('Клиент отключён:', socket.id);
    });
});

//ЭНДПОИНТЫ ДЛЯ PUSH-ПОДПИСОК
app.post('/subscribe', (req, res) => {
    subscriptions.push(req.body);
    console.log('Подписка сохранена, всего подписок:', subscriptions.length);
    res.status(201).json({ message: 'Подписка сохранена' });
});

app.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    subscriptions = subscriptions.filter(sub => sub.endpoint !== endpoint);
    console.log('Подписка удалена, осталось:', subscriptions.length);
    res.status(200).json({ message: 'Подписка удалена' });
});

//ЗАПУСК СЕРВЕРА 
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Public VAPID Key: ${vapidKeys.publicKey.substring(0, 30)}...`);
});