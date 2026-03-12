const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

//JWT
const ACCESS_SECRET = 'access-secret-key-change-this';
const REFRESH_SECRET = 'refresh-secret-key-change-this';
const ACCESS_EXPIRES_IN = '15s';
const REFRESH_EXPIRES_IN = '7d';

// Хранилища
let users = [];
let products = [];
let refreshTokens = new Set(); //активные refresh-токены

app.use(express.json());
app.use(cors({ origin: '*' }));

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
    });
    next();
});

const SALT_ROUNDS = 10;

async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password, hash) {
    return bcrypt.compare(password, hash);
}

function findUserByEmail(email) {
    return users.find(u => u.email === email);
}

function findUserById(id) {
    return users.find(u => u.id === id);
}

function findProductOr404(id, res) {
    const product = products.find(p => p.id === id);
    if (!product) {
        res.status(404).json({ error: "Товар не найден" });
        return null;
    }
    return product;
}

//ГЕНЕРАЦИЯ ТОКЕНОВ 
function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        { sub: user.id },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

// MIDDLEWARE 
function authMiddleware(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");

    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
    }

    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}

//SWAGGER
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Магазина с Refresh-токенами',
            version: '1.0.0',
            description: 'Практические занятия №9-10',
        },
        servers: [{ url: `http://localhost:${port}`, description: 'Локальный сервер' }],
        components: {
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' }
                    }
                },
                Product: {
                    type: 'object',
                    required: ['title', 'category', 'description', 'price'],
                    properties: {
                        id: { type: 'string' },
                        title: { type: 'string' },
                        category: { type: 'string' },
                        description: { type: 'string' },
                        price: { type: 'number' }
                    }
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' },
                        user: { $ref: '#/components/schemas/User' }
                    }
                },
                RefreshResponse: {
                    type: 'object',
                    properties: {
                        accessToken: { type: 'string' },
                        refreshToken: { type: 'string' }
                    }
                }
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            }
        },
        security: [{ bearerAuth: [] }]
    },
    apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

//МАРШРУТЫ 

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, firstName, lastName, password]
 *             properties:
 *               email: { type: string, example: ivanova.v.d@mail.ru }
 *               firstName: { type: string, example: Валерия }
 *               lastName: { type: string, example: Иванова }
 *               password: { type: string, example: 90475 }
 *     responses:
 *       201:
 *         description: Пользователь создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Ошибка
 */
app.post('/api/auth/register', async (req, res) => {
    const { email, firstName, lastName, password } = req.body;

    if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }

    if (findUserByEmail(email)) {
        return res.status(400).json({ error: "Пользователь с таким email уже существует" });
    }

    const hashedPassword = await hashPassword(password);

    const newUser = {
        id: nanoid(6),
        email,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        passwordHash: hashedPassword
    };

    users.push(newUser);

    res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName
    });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, example: ivanova.v.d@mail.ru }
 *               password: { type: string, example: 90475 }
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginResponse'
 *       401:
 *         description: Ошибка
 */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email и пароль обязательны" });
    }

    const user = findUserByEmail(email);
    if (!user) {
        return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ error: "Неверный email или пароль" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    res.json({
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName
        }
    });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновление токенов
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken: { type: string }
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RefreshResponse'
 *       401:
 *         description: Ошибка
 */
app.post('/api/auth/refresh', (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({ error: "refreshToken обязателен" });
    }

    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: "Invalid refresh token" });
    }

    try {
        const payload = jwt.verify(refreshToken, REFRESH_SECRET);
        const user = findUserById(payload.sub);

        if (!user) {
            return res.status(401).json({ error: "User not found" });
        }

        // Ротация токенов
        refreshTokens.delete(refreshToken);
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);

        res.json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (err) {
        return res.status(401).json({ error: "Invalid or expired refresh token" });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Данные текущего пользователя
 *     tags: [Auth]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Не авторизован
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = findUserById(userId);

    if (!user) {
        return res.status(404).json({ error: "Пользователь не найден" });
    }

    res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName
    });
});

//CRUDы

app.post('/api/products', authMiddleware, (req, res) => {
    const { title, category, description, price } = req.body;

    if (!title || !category || !description || !price) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }

    const newProduct = {
        id: nanoid(6),
        title: title.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price)
    };

    products.push(newProduct);
    res.status(201).json(newProduct);
});

app.get('/api/products', (req, res) => {
    res.json(products);
});

app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

app.put('/api/products/:id', authMiddleware, (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;

    const { title, category, description, price } = req.body;

    if (!title || !category || !description || !price) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }

    product.title = title.trim();
    product.category = category.trim();
    product.description = description.trim();
    product.price = Number(price);

    res.json(product);
});

app.delete('/api/products/:id', authMiddleware, (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id === id);
    if (!exists) return res.status(404).json({ error: "Товар не найден" });

    products = products.filter(p => p.id !== id);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger: http://localhost:${port}/api-docs`);
});