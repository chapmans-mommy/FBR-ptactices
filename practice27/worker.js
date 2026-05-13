// worker.js
import amqplib from 'amqplib';

const WORKER_ID = process.env.WORKER_ID || Math.floor(Math.random() * 1000);
const QUEUE_NAME = 'tasks_queue';
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000;
const MAX_DELAY_MS = 30000;

// Функция обработки задачи (может падать для демонстрации)
async function processTask(task) {
    console.log(`[Worker ${WORKER_ID}] Обработка задачи ${task.id}:`, task);
    
    // Имитация обработки (email, генерация отчёта и т.д.)
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Для демонстрации retry: 50% задач будут падать
    if (task.type === 'email' && Math.random() < 0.5) {
        throw new Error(' Ошибка отправки email (сервис недоступен)');
    }
    
    console.log(`[Worker ${WORKER_ID}]  Задача ${task.id} выполнена успешно`);
}

// Функция повторной отправки в очередь с увеличенным счётчиком
async function retryTask(channel, msg, task, retryCount) {
    const delay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount - 1), MAX_DELAY_MS);
    const jitter = Math.random() * 1000;
    const totalDelay = delay + jitter;
    
    console.log(`[Worker ${WORKER_ID}]  Повторная попытка ${retryCount + 1}/${MAX_RETRIES} через ${Math.round(totalDelay)}ms`);
    
    setTimeout(async () => {
        channel.sendToQueue(QUEUE_NAME, msg.content, {
            persistent: true,
            headers: { 'x-retry-count': retryCount + 1 }
        });
        channel.ack(msg);
    }, totalDelay);
}

// Запуск воркера
async function startWorker() {
    const connection = await amqplib.connect('amqp://localhost');
    const channel = await connection.createChannel();
    
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    
    // Обрабатываем по одному сообщению за раз
    channel.prefetch(1);
    
    console.log(`[Worker ${WORKER_ID}] Запущен, ожидание задач...`);
    
    channel.consume(QUEUE_NAME, async (msg) => {
        if (!msg) return;
        
        const task = JSON.parse(msg.content.toString());
        const retryCount = msg.properties.headers?.['x-retry-count'] || 0;
        
        console.log(`[Worker ${WORKER_ID}] Получена задача ${task.id}, попытка ${retryCount + 1}/${MAX_RETRIES}`);
        
        try {
            await processTask(task);
            channel.ack(msg); // Подтверждаем успешную обработку
        } catch (err) {
            console.error(`[Worker ${WORKER_ID}] Ошибка: ${err.message}`);
            
            if (retryCount + 1 < MAX_RETRIES) {
                // Повторяем задачу с задержкой
                await retryTask(channel, msg, task, retryCount);
            } else {
                // Исчерпаны все попытки — отправляем в DLQ
                console.log(`[Worker ${WORKER_ID}]  Задача ${task.id} отправлена в Dead Letter Queue`);
                channel.ack(msg); // Подтверждаем, чтобы убрать из основной очереди
                // Сообщение уже попадёт в DLQ из-за настроек x-dead-letter-exchange
            }
        }
    });
}

startWorker();