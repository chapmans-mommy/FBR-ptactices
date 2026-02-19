const express = require('express');
const { nanoid } = require('nanoid');
const cors = require('cors');
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

function findProductOr404(id, res) {
    const product = products.find(p => p.id == id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

// POST 
app.post('/api/products', (req, res) => {
    const { name, category, description, price, stock, rating, image } = req.body;
    
    const newProduct = {
        id: nanoid(6),
        name: name.trim(),
        category: category.trim(),
        description: description.trim(),
        price: Number(price),
        stock: Number(stock),
        rating: rating ? Number(rating) : 5.0,
        image: image || 'https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=200'
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

// GET
app.get('/api/products', (req, res) => {
    res.json(products);
});

// GET айдишник
app.get('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const product = findProductOr404(id, res);
    if (!product) return;
    res.json(product);
});

// PATCH с рейтингом и фото
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

// DELETE айдишник
app.delete('/api/products/:id', (req, res) => {
    const id = req.params.id;
    const exists = products.some(p => p.id == id);
    if (!exists) return res.status(404).json({ error: "Product not found" });
    
    products = products.filter(p => p.id != id);
    res.status(204).send();
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});