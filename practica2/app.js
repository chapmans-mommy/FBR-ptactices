const express = require('express');
const app = express();
const port = 3000;

let products = [
    {id: 1, name: 'Котёнок пушистый', price: 12000},
    {id: 2, name: 'Котёнок не пушистый', price: 3500},
    {id: 3, name: 'Маленькая мышка', price: 8900}
];

app.use(express.json());

app.get('/', (req, res) => {
    res.send('Главная страница');
});

// CRUDы

//добавление
app.post('/products', (req, res) => {
    const { name, price } = req.body;
    
    const newProduct = {
        id: Date.now(),
        name,
        price
    };
    
    products.push(newProduct);
    res.status(201).json(newProduct);
});

//показ товаров
app.get('/products', (req, res) => {
    res.send(JSON.stringify(products));
});

//инфа по айди
app.get('/products/:id', (req, res) => {
    let product = products.find(p => p.id == req.params.id);
    res.send(JSON.stringify(product));
});

//обновление
app.patch('/products/:id', (req, res) => {
    const product = products.find(p => p.id == req.params.id);
    const { name, price } = req.body;
    
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = price;
    
    res.json(product);
});

//удаление
app.delete('/products/:id', (req, res) => {
    products = products.filter(p => p.id != req.params.id);
    res.send('Ok');
});

app.listen(port, () => {
    console.log(`Сервер запущен на http://localhost:${port}`);
});