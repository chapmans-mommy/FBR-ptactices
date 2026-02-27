const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const app = express();
const port = 3000;

//списочек милашек с фотографиями и рейтингом
let products = [
    { 
        id: nanoid(6), 
        name: 'Бонифация', 
        category: 'Коты', 
        description: 'Пушистая и ласковая кошка, 5 лет', 
        price: 12000, 
        stock: 1,
        rating: 4.8,
        image: '/images/боня.jpg'
    },
    { 
        id: nanoid(6), 
        name: 'Мишка', 
        category: 'Коты', 
        description: 'Независимый самодостаточный кот, 9 лет', 
        price: 15000, 
        stock: 1,
        rating: 4.9,
        image: '/images/мишка.jpg'
    },
    { 
        id: nanoid(6), 
        name: 'Нунби', 
        category: 'Коты', 
        description: 'Тактильная малышка, 8 месяцев', 
        price: 13000, 
        stock: 1,
        rating: 5.0,
        image: '/images/нунби.jpg'
    },
    { 
        id: nanoid(6), 
        name: 'Тихон', 
        category: 'Коты', 
        description: 'Таинственный и умный, 6 лет', 
        price: 14000, 
        stock: 1,
        rating: 4.7,
        image: '/images/тихон.jpg'
    },
    { 
        id: nanoid(6), 
        name: 'Антон', 
        category: 'Коты', 
        description: 'Игривый и упрямый кот, 4 года', 
        price: 16000, 
        stock: 1,
        rating: 4.8,
        image: '/images/антон.jpg'
    },
    { 
        id: nanoid(6), 
        name: 'София', 
        category: 'Собаки', 
        description: 'Умная исполнительная собака, 3 года', 
        price: 18000, 
        stock: 1,
        rating: 4.9,
        image: '/images/софия.jpg'
    },
    { 
        id: nanoid(6), 
        name: 'Алтай', 
        category: 'Собаки', 
        description: 'Спокойный преданный пес, 5 лет', 
        price: 25000, 
        stock: 1,
        rating: 5.0,
        image: '/images/алтай.jpg'
    },
];

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3001' }));
app.use('/images', express.static('public/images'));

app.use((req, res, next) => {
    res.on('finish', () => {
        console.log(`[${new Date().toISOString()}] [${req.method}] ${res.statusCode} ${req.path}`);
        if (req.method === 'POST' || req.method === 'PATCH') {
            console.log('Body:', req.body);
        }
    });
    next();
});

// ========== НАСТРОЙКА SWAGGER ==========
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'API Питомника',
            version: '1.0.0',
            description: 'API для управления питомцами (кошки, собаки)',
            contact: {
                name: 'Разработчик',
                email: 'your@email.com'
            }
        },
        servers: [
            {
                url: `http://localhost:${port}`,
                description: 'Локальный сервер'
            }
        ],
        components: {
            schemas: {
                Product: {
                    type: 'object',
                    required: ['name', 'category', 'description', 'price', 'stock'],
                    properties: {
                        id: {
                            type: 'string',
                            description: 'Уникальный ID питомца'
                        },
                        name: {
                            type: 'string',
                            description: 'Имя питомца'
                        },
                        category: {
                            type: 'string',
                            description: 'Категория (Коты/Собаки)'
                        },
                        description: {
                            type: 'string',
                            description: 'Описание питомца'
                        },
                        price: {
                            type: 'number',
                            description: 'Цена в рублях'
                        },
                        stock: {
                            type: 'integer',
                            description: 'Количество в питомнике'
                        },
                        rating: {
                            type: 'number',
                            description: 'Рейтинг (0-5)'
                        },
                        image: {
                            type: 'string',
                            description: 'Путь к фото или URL'
                        }
                    },
                    example: {
                        id: 'abc123',
                        name: 'Бонифация',
                        category: 'Коты',
                        description: 'Пушистая и ласковая кошка, 5 лет',
                        price: 12000,
                        stock: 1,
                        rating: 4.8,
                        image: '/images/боня.jpg'
                    }
                }
            }
        },
        tags: [
            {
                name: 'Products',
                description: 'Управление питомцами'
            }
        ]
    },
    apis: ['./app.js'],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ========== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ ==========
function findProductOr404(id, res) {
    const product = products.find(p => p.id == id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

// ========== CRUD МАРШРУТЫ ==========

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создаёт нового питомца
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *               - description
 *               - price
 *               - stock
 *             properties:
 *               name:
 *                 type: string
 *                 description: Имя питомца
 *               category:
 *                 type: string
 *                 description: Категория
 *               description:
 *                 type: string
 *                 description: Описание
 *               price:
 *                 type: number
 *                 description: Цена
 *               stock:
 *                 type: integer
 *                 description: Количество
 *               rating:
 *                 type: number
 *                 description: Рейтинг (0-5)
 *               image:
 *                 type: string
 *                 description: Ссылка на фото
 *     responses:
 *       201:
 *         description: Питомец успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Ошибка валидации
 */
app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock, rating, image } = req.body;
    
    if (!name || !category || !description || !price || !stock) {
        return res.status(400).json({ error: "Все поля обязательны" });
    }
    
    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        rating: rating ? Number(rating) : 5.0,
        image: image || '/images/default.jpg'
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Возвращает список всех питомцев
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Список питомцев
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
app.get('/api/products', (req, res) => {
    res.json(products);
});

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получает питомца по ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID питомца
 *     responses:
 *       200:
 *         description: Данные питомца
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       404:
 *         description: Питомец не найден
 */
app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Обновляет данные питомца
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID питомца
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *               rating:
 *                 type: number
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Обновлённый питомец
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       400:
 *         description: Нет данных для обновления
 *       404:
 *         description: Питомец не найден
 */
app.patch('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    
    const { name, category, description, price, stock, rating, image } = req.body;
    
    if (name !== undefined) product.name = name.trim();
    if (category !== undefined) product.category = category.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (rating !== undefined) product.rating = Number(rating);
    if (image !== undefined) product.image = image;
    
    res.json(product);
});

/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удаляет питомца
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID питомца
 *     responses:
 *       204:
 *         description: Питомец успешно удалён
 *       404:
 *         description: Питомец не найден
 */
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id == id);
    if (!exists) return res.status(404).json({ error: "Product not found" });
    
    products = products.filter(p => p.id != id);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
    console.log(`Swagger документация: http://localhost:${port}/api-docs`);
});