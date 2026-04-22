const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Основной маршрут для проверки балансировки
app.get('/', (req, res) => {
    res.json({
        message: 'Response from backend server',
        port: PORT,
        timestamp: new Date().toISOString(),
        serverId: `server-${PORT}`
    });
});

// Health check для проверки доступности сервера
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'ok', 
        port: PORT,
        uptime: process.uptime()
    });
});

// Простой тестовый маршрут
app.get('/api/test', (req, res) => {
    res.json({
        data: 'Test data',
        from: `port ${PORT}`
    });
});

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});