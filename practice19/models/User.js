const { Sequelize, DataTypes } = require('sequelize');

// ⚠️ ВАЖНО: замените 'ваш_пароль' на реальный пароль от PostgreSQL
const sequelize = new Sequelize('user_api', 'postgres', 'root', {
    host: 'localhost',
    dialect: 'postgres',
    logging: false
});

const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: true
        }
    },
    age: {
        type: DataTypes.INTEGER,
        validate: {
            min: 0,
            max: 150
        }
    },
    created_at: {
        type: DataTypes.BIGINT,
        allowNull: false
    },
    updated_at: {
        type: DataTypes.BIGINT,
        allowNull: false
    }
}, {
    tableName: 'users',
    timestamps: false,
    hooks: {
        beforeCreate: (user) => {
            const now = Date.now();
            user.created_at = now;
            user.updated_at = now;
        },
        beforeUpdate: (user) => {
            user.updated_at = Date.now();
        }
    }
});

module.exports = { sequelize, User };