
import amqplib from 'amqplib';

const QUEUE_NAME = 'tasks_queue';
const DLX_EXCHANGE = 'dlx_exchange';
const DLQ_QUEUE = 'dead_letter_queue';

async function setup() {
    const connection = await amqplib.connect('amqp://localhost');
    const channel = await connection.createChannel();

    // 1. Dead Letter Exchange
    await channel.assertExchange(DLX_EXCHANGE, 'direct', { durable: true });

    // 2. Dead Letter Queue
    await channel.assertQueue(DLQ_QUEUE, { durable: true });

    // 3. Привязка
    await channel.bindQueue(DLQ_QUEUE, DLX_EXCHANGE, 'dead');

    // 4. Основная очередь с DLQ
    await channel.assertQueue(QUEUE_NAME, {
        durable: true,
        arguments: {
            'x-dead-letter-exchange': DLX_EXCHANGE,
            'x-dead-letter-routing-key': 'dead',
        }
    });

    console.log('Очереди настроены:');
    console.log(`   - ${QUEUE_NAME} (основная)`);
    console.log(`   - ${DLQ_QUEUE} (Dead Letter Queue)`);
    
    await connection.close();
}

setup();