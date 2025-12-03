exports.getHomePage = (req, res) => {
    // Giả sử lấy dữ liệu từ Model (sau này sẽ query DB ở đây)
    let title = "Trang chủ test hệ thống MVC với Node.js & Express";
    let user = "Sinh viên K69 Đại Học Xây Dựng Hà Nội";

    // Trả về file home.ejs trong thư mục views
    // Truyền biến 'title' và 'user' sang view
    res.render('home', {
        pageTitle: title,
        userName: user
    });
};