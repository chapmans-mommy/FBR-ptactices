const express = require('express');
const app = express();
const PORT = 3000;

// Получаем ID сервера из переменной окружения (устанавливается в docker-compose.yml)
const SERVER_ID = process.env.SERVER_ID || 'unknown';
const SERVER_COLOR = process.env.SERVER_COLOR || 'default';

app.get('/', (req, res) => {
    res.json({
        server: SERVER_ID,
        color: SERVER_COLOR,
        port: PORT,
        timestamp: new Date().toISOString(),
        hostname: process.env.HOSTNAME
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', server: SERVER_ID });
});

// Слушаем на 0.0.0.0 — обязательно для Docker!
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server ${SERVER_ID} running on port ${PORT}`);
});