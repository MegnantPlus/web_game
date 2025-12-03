# Kiến Trúc MVC cho Ứng dụng Web (Node.js + Express + EJS)

Dự án này là một khung sườn (boilerplate) cơ bản để xây dựng ứng dụng Fullstack Web theo mô hình **MVC (Model - View - Controller)**. Dự án sử dụng **Server-Side Rendering (SSR)** với ExpressJS và EJS Template Engine.

## 🛠 Công nghệ sử dụng

* **Runtime:** Node.js
* **Framework:** ExpressJS
* **Template Engine:** EJS
* **Frontend:** HTML5, CSS3, Bootstrap 5 (tùy chọn)

## 📂 Cấu trúc thư mục (Project Structure)

Dưới đây là tổ chức thư mục của dự án, bao gồm cả Frontend và Backend trong cùng một repository:

```text
my-mvc-project/
├── controllers/          # Nơi chứa logic xử lý nghiệp vụ
│   └── homeController.js 
├── models/               # Nơi tương tác với cơ sở dữ liệu (Database)
│   └── (userModel.js...)
├── public/               # Tài nguyên tĩnh (Static Files) - FRONTEND
│   ├── css/
│   │   └── style.css
│   ├── js/               # Javascript chạy phía client (DOM)
│   └── img/
├── routes/               # Định tuyến đường dẫn (URL Routing)
│   └── web.js
├── views/                # Giao diện người dùng (Template) - FRONTEND
│   └── home.ejs
├── app.js                # File khởi chạy Server (Entry point)
└── package.json          # Quản lý thư viện và thông tin dự án
```
<img width="658" height="491" alt="image" src="https://github.com/user-attachments/assets/8ba1676c-e04f-456b-a5e8-d3138c503df2" />
