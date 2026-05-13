// producer.js
import express from 'express';
import amqplib from 'amqplib';

const app = express();
app.use(express.json());

let channel;
const QUEUE_NAME = 'tasks_queue';
const DLX_EXCHANGE = 'dlx_exchange';
const DLQ_QUEUE = 'dead_letter_queue';

// Подключение к RabbitMQ и настройка очередей
async function setupRabbitMQ() {
    const connection = await amqplib.connect('amqp://localhost');
    channel = await connection.createChannel();

    // 1. Создаём Dead Letter Exchange
    await channel.assertExchange(DLX_EXCHANGE, 'direct', { durable: true });

    // 2. Создаём Dead Letter Queue
    await channel.assertQueue(DLQ_QUEUE, { durable: true });

    // 3. Привязываем DLQ к DLX
    await channel.bindQueue(DLQ_QUEUE, DLX_EXCHANGE, 'dead');

    // 4. Создаём основную очередь с настройками DLQ
    await channel.assertQueue(QUEUE_NAME, {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': DLX_EXCHANGE,
            'x-dead-letter-routing-key': 'dead',
            'x-message-ttl': 60000, // сообщение живёт 60 секунд
        }
    });

    console.log('RabbitMQ настроен. Очереди готовы.');
}

// API endpoint для создания задачи
app.post('/tasks', async (req, res) => {
    const task = {
        id: Date.now(),
        type: req.body.type || 'email',
        payload: req.body.payload || {},
        createdAt: new Date().toISOString()
    };

    try {
        channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(task)), {
            persistent: true,
            headers: { 'x-retry-count': 0 }
        });
        
        console.log(`Задача ${task.id} отправлена в очередь`);
        res.status(201).json({ message: 'Task created', task });
    } catch (err) {
        console.error('Ошибка отправки:', err);
        res.status(500).json({ error: err.message });
    }
});

// Запуск сервера
async function start() {
    await setupRabbitMQ();
    app.listen(3000, () => {
        console.log('Producer API запущен на http://localhost:3000');
        console.log('   POST /tasks - создать задачу');
    });
}

start();