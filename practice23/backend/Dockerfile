# Базовый образ Node.js
FROM node:18-alpine

# Рабочая директория внутри контейнера
WORKDIR /app

# Копируем package.json (сначала для кэширования)
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем остальной код
COPY . .

# Порт, который слушает приложение
EXPOSE 3000

# Команда запуска
CMD ["npm", "start"]