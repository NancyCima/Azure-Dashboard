# Projects Management Application

A fullstack web application for project and ticket management, built with React and Python.

## Prerequisites

Before starting, make sure you have installed:

- Node.js (version 18 or higher)
- Python (version 3.8 or higher)
- npm (usually comes with Node.js)

## Installation

### Frontend (React)

1. Install frontend dependencies:
```bash
npm install
```

### Backend (Python/FastAPI)

1. Create a Python virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows use: venv\Scripts\activate
```

2. Install backend dependencies:
```bash
pip install -r requirements.txt
```

## Running the Application

### Frontend

To start the React development server:
```bash
npm run dev
```
The frontend will be available at `http://localhost:5173`

### Backend

Or directly with Python:
```bash
python3 main.py # On Windows use: python main.py
```
The backend will be available at `http://localhost:8000`

## Project Structure

```
├── api/                    # Backend Python/FastAPI
│   ├── main.py             # Backend entry point
│   └── requirements.txt    # Python dependencies
├── src/                    # Frontend React
│   ├── pages/              # Page components
│   ├── services/           # API services
│   └── ...                 # Other frontend files
└── package.json            # npm dependencies and scripts
```

## Features

- ✨ Modern frontend with React and TypeScript
- 🎨 Responsive design with Tailwind CSS
- 🔍 Ticket management
- 📊 Ticket analysis
- 📱 Interactive dashboard
- 🚀 REST API with FastAPI
- ⚡ Rapid development with Vite

## Available Scripts

- `npm run dev`: Start the frontend development server
- `npm run build`: Build the application for production
- `npm run preview`: Preview the production build
- `npm run start-api`: Start the backend server
- `npm run lint`: Run the linter
