//библиотеки
const express = require('express');
const mongoose = require('mongoose');

const app = express(); //экземпляр приложения
const PORT = 3001;

// Middleware
app.use(express.json());

// подключение к MongoDB
const uri = 'mongodb://YourMongoAdmin:1234@localhost:27017/userdb?authSource=admin';

mongoose.connect(uri)
    .then(() => console.log('Connected to MongoDB')) //корректное подключение - сообщение
    .catch(err => console.error('MongoDB error:', err.message)); //некорректное - ошибка

// схема и модель полей в таблице
const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    age: Number,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema); //создание модели и сохранение 


// МАРШРУТЫ

// POST /api/users - создать
app.post('/api/users', async (req, res) => {
    try {
        const { first_name, last_name, age } = req.body; //достаем поля из запроса
        
        if (!first_name || !last_name) {
            return res.status(400).json({ error: 'first_name and last_name are required' }); //если не хватает чего то - ошибка
        }
        
        const user = new User({ first_name, last_name, age }); //если вес норм, создаем нового юзера
        await user.save(); 
        res.status(201).json(user);
    } catch (error) { //если другие ошибки
        console.error('Ошибка:', error);
        res.status(400).json({ error: error.message });
    }
});

// GET /api/users - получить всех
app.get('/api/users', async (req, res) => {
    try {
        const users = await User.find(); //достаем всех пользователей из бд
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/users/:id - получить одного
app.get('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id); //ищем в бд по айдишнику
        if (!user) return res.status(404).json({ error: 'User not found' }); //если не нашли - ошибка
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/users/:id - обновить
app.patch('/api/users/:id', async (req, res) => {
    try {
        const { first_name, last_name, age } = req.body; //вытаскиваем из запроса поля
        const user = await User.findByIdAndUpdate( 
            req.params.id,
            { first_name, last_name, age, updated_at: Date.now() }, //если нашли выводим
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' }); //если не нашли - ошибка
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/users/:id - удалить
app.delete('/api/users/:id', async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id); //ищем в бд по айди и удаляем
        if (!user) return res.status(404).json({ error: 'User not found' }); //если не нашли - ошибка
        res.json({ message: 'User deleted', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Запуск
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});