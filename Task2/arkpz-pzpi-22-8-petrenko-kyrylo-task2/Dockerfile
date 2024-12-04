# Вибір базового образу Node.js
FROM node:18

# Встановлення робочої директорії
WORKDIR /app

# Копіюємо файли package.json і package-lock.json
COPY package*.json ./

# Встановлюємо залежності
RUN npm install

# Копіюємо весь код у робочу директорію
COPY . .

# Вказуємо порт, який буде слухати додаток
EXPOSE 8080

# Запускаємо сервер
CMD ["npm", "start"]
