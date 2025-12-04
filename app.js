const express = require('express');
const app = express();
const path = require('path');
// const webRoutes = require('./routes/web'); // Tạm thời comment dòng này nếu chưa cần thiết

const PORT = 3000;

// Cấu hình Template Engine là EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Cấu hình thư mục Public (để chứa CSS, JS, Image, Game)
app.use(express.static(path.join(__dirname, 'public')));

// --- SỬA ĐOẠN NÀY ---
// Route trang chủ
app.get('/', (req, res) => {
    // Render file home.ejs và truyền dữ liệu để tránh lỗi
    res.render('home', {
        pageTitle: 'Trang chủ Pickleball Game',
        userName: 'Game Thủ' // Bạn có thể thay đổi tên tùy thích
    });
});
// --------------------

// Chạy server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại http://localhost:${PORT}`);
});