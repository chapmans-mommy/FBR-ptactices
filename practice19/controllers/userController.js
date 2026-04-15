const { User } = require('../models/User');

// GET /api/users
const getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({ order: [['id', 'ASC']] });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// POST /api/users
const createUser = async (req, res) => {
    try {
        const { first_name, last_name, age } = req.body;
        
        if (!first_name || !last_name) {
            return res.status(400).json({ error: 'first_name and last_name are required' });
        }
        
        const now = Date.now();
        const user = await User.create({
            first_name,
            last_name,
            age: age || null,
            created_at: now,
            updated_at: now
        });
        
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// PATCH /api/users/:id
const updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        const { first_name, last_name, age } = req.body;
        
        await user.update({
            first_name: first_name || user.first_name,
            last_name: last_name || user.last_name,
            age: age !== undefined ? age : user.age,
            updated_at: Date.now()
        });
        
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// DELETE /api/users/:id
const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        await user.destroy();
        res.json({ message: 'User deleted successfully', deletedUser: user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser
};