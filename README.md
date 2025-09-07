Inventory Management System

 Overview

The Inventory Management System is a full-stack web application designed to manage products, stock movements, and staff activities. It provides role-based dashboards for Admin, Manager, and Staff to handle day-to-day inventory operations.

This system helps organizations keep track of stock, reduce errors, and generate useful reports for decision-making.

 Features

 Authentication & Authorization (Login, Register, Protected Routes)

 Product Management (Add, Update, Delete, View)

 Role-Based Dashboards

Admin → Manage users, view logs, approve requests, generate reports

Manager → Monitor stock, handle reports, view staff activity

Staff → Create new stock movements, track assigned tasks

 Low Stock Notifications

 Reports & Analytics (Export to PDF/Excel)

 Image Upload & QR Code Generator for products

 Product Movement Tracking

 Responsive UI built with TailwindCSS

 Tech Stack
Frontend

React (Vite)

TailwindCSS

Shadcn/UI components

Axios (API communication)

Backend

ASP.NET Core Web API (C#)

Entity Framework Core

JWT Authentication

Database

Microsoft SQL Server (FinalSQL.sql provided)

 Project Structure
Inventory-Management-System/
│── DemoVideo.url                # Demo video link
│── FinalSQL.sql                 # Database schema
│── Inventory Management System.docx  # Documentation
│── inventory-frontend/          # React frontend
│   ├── src/                     # Pages, Components, Services
│   ├── public/                  # Public assets
│   ├── package.json             # Dependencies
│   └── vite.config.js           # Vite config
│── backend/ (if available)      # .NET Core API (not included here)

 Installation & Setup
1️ Clone Repository
git clone https://github.com/V939271/CapstoneProject-Venkat-.git
cd Inventory-Management-System

2️ Setup Database

Open SQL Server Management Studio (SSMS)

Run the script: FinalSQL.sql

Update connection string in backend appsettings.json

3️ Run Backend (ASP.NET Core API)
cd backend
dotnet restore
dotnet run


By default, API will run at: https://localhost:7225/

4️ Run Frontend (React)
cd inventory-frontend
npm install
npm run dev


Frontend will run at: http://localhost:5173/

 Usage

Open the application in browser.

Register/Login as Admin, Manager, or Staff.

Explore respective dashboards:

Admin → User Management, Reports, Logs

Manager → Stock Reports, Movements

Staff → Add New Movements

Generate reports & track low stock items.

 Demo

 Demo Video

 Documentation

Full project documentation is available in Inventory Management System.docx

 Contribution

Fork the repository

Create a feature branch (git checkout -b feature-name)

Commit changes (git commit -m 'Added feature')

Push to branch (git push origin feature-name)

Create a Pull Request

 License

This project is for educational purposes. You may modify and use it as needed.
