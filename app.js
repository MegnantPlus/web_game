const express = require('express');
const app = express();
const path = require('path');
const webRoutes = require('./routes/web'); // Import routes

const PORT = 3000;

// Cấu hình Template Engine là EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Cấu hình thư mục Public (để chứa CSS, JS, Image)
app.use(express.static(path.join(__dirname, 'public')));

// Sử dụng Routes
app.use('/', webRoutes);

// Chạy server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});