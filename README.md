# StockSense AI Dashboard

StockSense AI is a modern web application that combines a glassmorphism-style trading dashboard with a lightweight authentication and portfolio system. It is designed to showcase a polished UI for stock forecasting, simulated trading activity, and portfolio management in a single experience.

## Features

- Elegant glassmorphism dashboard layout
- Interactive stock cards and market insights
- Simulated stock forecasting charts
- User authentication with sign-in and sign-up flows
- Portfolio tracking with funds, active holdings, and closed positions
- Lightweight Node.js backend with session-based authentication

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express.js
- Data storage: local JSON-based database
- Authentication: bcryptjs with express-session

## Project Structure

- index.html - Main dashboard UI
- style.css - Styling and visual design
- app.js - Frontend logic and dashboard interactions
- server.js - Backend API routes and session handling
- db.json - Local user and portfolio data storage
- package.json - Project dependencies and scripts

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create environment file

Copy the sample environment file and adjust values if needed:

```bash
copy .env.example .env
```

### 3. Run the application

```bash
npm start
```

Then open your browser at:

```text
http://localhost:8080
```

## Notes

This project uses a local JSON database for demo purposes. For production use, it should be connected to a real database and secure authentication provider.
