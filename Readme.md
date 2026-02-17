# 🎬 YouTube Backend Clone

A scalable backend API for a **YouTube-like video sharing platform** built with Node.js and Express. This project focuses on implementing core backend functionalities such as authentication, video management, user interactions, and RESTful API design — similar to what powers real-world video streaming platforms.

📐 [View Data Model](https://app.eraser.io/workspace/YtPqZ1VogxGy1jzIDkzj)

---

## 🚀 Features

- 🔐 User Authentication (Register / Login)
- 🛡️ Secure Password Hashing
- 🎟️ JWT-Based Authorization
- 📹 Video Upload & Metadata Management
- 💬 Comment System
- 👍 Like / Dislike Functionality
- 🔔 Channel Subscription Logic
- 📜 Watch History Tracking
- 🔍 Video Search
- 📦 RESTful API Structure
- 🌍 Environment Variable Configuration

---

## 🧠 Tech Stack

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| MongoDB | Database |
| Mongoose | ODM for MongoDB |
| JWT | Authentication |
| bcrypt | Password hashing |
| Multer / Cloudinary | File handling |
| dotenv | Environment variable management |

---

## 📂 Project Structure

```
youtube-backend-clone/
│
├── controllers/        # Business logic
├── models/             # Database schemas
├── routes/             # API routes
├── middleware/         # Authentication & error handling
├── config/             # DB configuration
├── utils/              # Helper functions
├── server.js / app.js
└── package.json
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Batajoo/youtube-backend-clone.git
cd youtube-backend-clone
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory and add:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4️⃣ Start the Server

```bash
npm run dev   # Development
npm start     # Production
```

Server will run at: `http://localhost:5000`

---

## 📘 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register new user |
| `POST` | `/api/auth/login` | Login user |

### 📹 Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/videos` | Get all videos |
| `GET` | `/api/videos/:id` | Get single video |
| `POST` | `/api/videos/upload` | Upload new video |
| `DELETE` | `/api/videos/:id` | Delete video |

### 💬 Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/videos/:id/comment` | Add comment |
| `GET` | `/api/videos/:id/comments` | Get video comments |

### 👍 Likes / Subscriptions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `PUT` | `/api/videos/:id/like` | Like / Unlike video |
| `PUT` | `/api/users/:id/subscribe` | Subscribe to channel |

---

## 🧪 Testing

You can test the API using:

- [Postman](https://www.postman.com/)
- [Thunder Client](https://www.thunderclient.com/) (VS Code extension)
- cURL

**Example:**
```bash
curl http://localhost:5000/api/videos
```

---

## 🔒 Security Considerations

- Passwords are hashed before storing using `bcrypt`
- Protected routes require a valid JWT token
- Environment variables are secured via `.env`
- Input validation is recommended for all endpoints

---

## 📈 Future Improvements

- [ ] Pagination
- [ ] Video streaming optimization
- [ ] Recommendation system
- [ ] Real-time notifications
- [ ] API documentation with Swagger
- [ ] Unit & integration tests

---

## 👨‍💻 Author

**Sanjiv Batajoo**  
Computer Science Student | Backend & AI Enthusiast

[![GitHub](https://img.shields.io/badge/GitHub-Batajoo-181717?style=flat&logo=github)](https://github.com/Batajoo)
