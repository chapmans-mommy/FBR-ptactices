const express = require('express');
const mongoose = require('mongoose');

const app = express();
const PORT = 3001;

// Middleware
app.use(express.json());

// Подключение к MongoDB
const uri = 'mongodb://YourMongoAdmin:1234@localhost:27017/userdb?authSource=admin';

mongoose.connect(uri)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => console.error('❌ MongoDB error:', err.message));

// Схема и модель
const userSchema = new mongoose.Schema({
    first_name: String,
    last_name: String,
    age: Number,
    created_at: { type: Date, default: Date.now },
    updated_at: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// ========== МАРШРУТЫ ==========

// POST /api/users - создать
app.post('/api/users', async (req, res) => {
    console.log('Получен запрос POST /api/users');
    console.log('Body:', req.body);
    
    try {
        const { first_name, last_name, age } = req.body;
        
        if (!first_name || !last_name) {
            return res.status(400).json({ error: 'first_name and last_name are required' });
        }
        
        const user = new User({ first_name, last_name, age });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        console.error('Ошибка:', error);
        res.status(400).json({ error: error.message });
    }
});

// GET /api/users - получить всех
app.get('/api/users', async (req, res) => {
    console.log('Получен запрос GET /api/users');
    
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET /api/users/:id - получить одного
app.get('/api/users/:id', async (req, res) => {
    console.log('Получен запрос GET /api/users/' + req.params.id);
    
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PATCH /api/users/:id - обновить
app.patch('/api/users/:id', async (req, res) => {
    console.log('Получен запрос PATCH /api/users/' + req.params.id);
    console.log('Body:', req.body);
    
    try {
        const { first_name, last_name, age } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { first_name, last_name, age, updated_at: Date.now() },
            { new: true }
        );
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// DELETE /api/users/:id - удалить
app.delete('/api/users/:id', async (req, res) => {
    console.log('Получен запрос DELETE /api/users/' + req.params.id);
    
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json({ message: 'User deleted', user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Запуск
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});