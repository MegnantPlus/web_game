const express = require('express');
const router = express.Router();
const homeController = require('../controllers/homeController');

// Khi người dùng truy cập trang chủ ('/')
router.get('/', homeController.getHomePage);

// Ví dụ trang giới thiệu (bạn có thể tạo thêm controller cho nó)
// router.get('/about', homeController.getAboutPage);

module.exports = router;