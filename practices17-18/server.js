const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const webpush = require('web-push');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

// Хранилище активных напоминаний
const reminders = new Map();

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

    // ===== НОВОЕ: напоминание =====
    socket.on('newReminder', (reminder) => {
        const { id, text, reminderTime } = reminder;
        const delay = reminderTime - Date.now();
        
        if (delay <= 0) {
            console.log('Напоминание в прошлом, игнорируем');
            return;
        }
        
        console.log(`Запланировано напоминание "${text}" через ${Math.round(delay / 1000 / 60)} минут`);
        
        // Сохраняем таймер
        const timeoutId = setTimeout(() => {
            const payload = JSON.stringify({
                title: 'Напоминание!',
                body: text,
                reminderId: id
            });
            
            subscriptions.forEach(sub => {
                webpush.sendNotification(sub, payload).catch(err => {
                    console.error('Push error:', err);
                });
            });
            
            // Удаляем напоминание из хранилища
            reminders.delete(id);
            console.log(`Напоминание "${text}" отправлено`);
        }, delay);
        
        reminders.set(id, { timeoutId, text, reminderTime });
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

// ========== ОТЛОЖИТЬ НАПОМИНАНИЕ ==========
app.post('/snooze', (req, res) => {
    const reminderId = parseInt(req.query.reminderId, 10);
    
    if (!reminderId || !reminders.has(reminderId)) {
        return res.status(404).json({ error: 'Reminder not found' });
    }
    
    const reminder = reminders.get(reminderId);
    
    // Отменяем предыдущий таймер
    clearTimeout(reminder.timeoutId);
    
    // Устанавливаем новый через 5 минут (300 000 мс)
    const newDelay = 5 * 60 * 1000;
    const newTimeoutId = setTimeout(() => {
        const payload = JSON.stringify({
            title: 'Напоминание (отложенное)',
            body: reminder.text,
            reminderId: reminderId
        });
        
        subscriptions.forEach(sub => {
            webpush.sendNotification(sub, payload).catch(err => {
                console.error('Push error:', err);
            });
        });
        
        reminders.delete(reminderId);
        console.log(`Отложенное напоминание "${reminder.text}" отправлено`);
    }, newDelay);
    
    // Обновляем хранилище
    reminders.set(reminderId, {
        timeoutId: newTimeoutId,
        text: reminder.text,
        reminderTime: Date.now() + newDelay
    });
    
    console.log(`⏰ Напоминание "${reminder.text}" отложено на 5 минут`);
    res.status(200).json({ message: 'Reminder snoozed for 5 minutes' });
});

//ЗАПУСК СЕРВЕРА 
const PORT = 3001;
server.listen(PORT, () => {
    console.log(`Сервер запущен на http://localhost:${PORT}`);
    console.log(`Public VAPID Key: ${vapidKeys.publicKey.substring(0, 30)}...`);
});