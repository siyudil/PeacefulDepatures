# 🕊️ Peaceful Departures – Online Funeral Service Management System

A web-based platform that helps funeral service providers manage their services, bookings and clients in one place, and helps families arrange a funeral with dignity and ease, from anywhere, at any time.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)

---

## 📖 About the Project

Arranging a funeral is stressful, and many funeral homes still rely on phone calls, paper records and scattered spreadsheets. **Peaceful Departures** digitises this process. Families can browse packages, book services and track their arrangements online. Staff and administrators get a central system to manage services, schedules, customers and records.

**Goals**
- Make funeral arrangements simple, transparent and compassionate
- Replace manual paperwork with one organised system
- Give staff a clear view of bookings, services and payments

## ✨ Features

**For customers**
- 🔐 Register and log in
- 📦 Browse funeral packages and services
- 📅 Book and manage funeral service requests
- 📞 Contact the funeral service provider

**For administrators / staff**
- 🛠️ Manage packages and services (add, edit, delete)
- 📋 View and update customer bookings
- 👥 Manage users and staff accounts

## 🧰 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, JavaScript |
| Backend | Node.js |
| Tools | Git, GitHub, VS Code |

## 📁 Project Structure

```
PeacefulDepatures/
├── Frontend/      # HTML, CSS and client-side JavaScript
├── Backend/       # Server code
│   └── package.json
├── .gitignore
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later) and npm
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/siyudil/PeacefulDepatures.git
   cd PeacefulDepatures
   ```

2. **Install backend dependencies**
   ```bash
   cd Backend
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file inside `Backend/`:
   ```env
   PORT=5000
   DB_URI=your_database_connection_string
   JWT_SECRET=your_secret_key
   ```

4. **Start the server**
   ```bash
   npm start
   ```

5. **Open the frontend**
   Open `Frontend/index.html` in your browser, or use the VS Code *Live Server* extension.

## 🔮 Future Improvements

- Online payment integration
- Email / SMS notifications for bookings
- Live-streaming of funeral services for distant relatives
- Mobile-friendly design improvements

---

*In memory of those we love – made with care. 🕊️*
