const express = require('express');
const { sequelize } = require('./models/User');
const userRoutes = require('./routes/users');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Маршруты
app.use('/api/users', userRoutes);

// Запуск сервера
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('Connected to PostgreSQL');
        
        await sequelize.sync({ alter: true });
        console.log('Models synchronized');
        
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error(' Connection error:', error);
    }
}

startServer();