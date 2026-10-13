# 🌱 AI Farm Guardian

### Intelligent Crop Risk Analysis and Dynamic Intervention Prioritization System

AI Farm Guardian is an AI-powered agricultural support platform designed to help farmers monitor crop conditions, understand potential farming risks, and prioritize suitable interventions.

The platform combines crop analysis, weather intelligence, economic risk assessment, and AI-assisted recommendations to support better agricultural decision-making.

## 📌 Problem Statement

Farmers may face crop diseases, unpredictable weather, financial risks, and delays in taking appropriate action. When several problems occur simultaneously, deciding which issue needs immediate attention can be difficult.

AI Farm Guardian aims to address this challenge by identifying potential risks and prioritizing interventions according to their urgency and impact.

## 🎯 Objectives

* Identify potential crop health issues.
* Monitor weather conditions that may affect crops.
* Assess agricultural and economic risks.
* Prioritize interventions based on risk and urgency.
* Provide AI-assisted agricultural recommendations.
* Help farmers track treatments and important notifications.

## ✨ Key Features

### 1. AI Crop Scanner

Supports crop image submission and crop health analysis through the crop-scanning module.

### 2. Dynamic Intervention Prioritization

Organizes identified farming risks and recommended interventions according to their assessed priority.

### 3. AI Rescue Planner

Provides AI-assisted guidance to help farmers understand potential problems and consider suitable corrective actions.

### 4. Weather Intelligence

Provides weather-related information to help farmers understand environmental conditions affecting their crops.

### 5. Economic Risk Analysis

Helps assess potential agricultural risks related to farming costs and economic conditions.

### 6. Farm Management

Allows users to manage farm-related information through the application.

### 7. Treatment Tracking

Supports tracking of farming treatments and related activities.

### 8. AI Farm Assistant

Provides an AI-assisted interface for agricultural questions and farming guidance.

### 9. Dashboard and Notifications

Provides a central dashboard for important farming information and notifications.

## 🛠️ Technologies Used

### Frontend

* React.js
* Vite
* JavaScript
* Tailwind CSS
* HTML
* CSS

### Backend

* Python
* FastAPI
* REST APIs

### Database

* SQLite

### Artificial Intelligence and External Services

* Groq API for AI-assisted features
* OpenWeatherMap API for weather information
* Image analysis through the crop-vision service

*The exact models and algorithms depend on the current implementation of the corresponding services.*

## 🏗️ Project Architecture

The application follows a frontend-backend architecture.

1. The user interacts with the React frontend.
2. The frontend sends requests to the Python backend through REST APIs.
3. The backend processes requests and interacts with the database or relevant services.
4. AI and weather services provide information when configured.
5. The backend returns results to the frontend for display.

## 📂 Project Structure

```text
ai-farm-guardian/
│
├── backend/
│   ├── main.py
│   ├── auth.py
│   ├── config.py
│   ├── database.py
│   ├── models.py
│   ├── schemas.py
│   ├── requirements.txt
│   │
│   ├── routers/
│   │   ├── auth_router.py
│   │   ├── chat_router.py
│   │   ├── dashboard_router.py
│   │   ├── economic_router.py
│   │   ├── farms_router.py
│   │   ├── fields_router.py
│   │   ├── notifications_router.py
│   │   ├── priority_router.py
│   │   ├── rescue_router.py
│   │   ├── scans_router.py
│   │   ├── treatments_router.py
│   │   └── weather_router.py
│   │
│   └── services/
│       ├── ai_assistant_service.py
│       ├── ai_planner_service.py
│       ├── ai_service.py
│       ├── economic_engine.py
│       ├── farm_risk_service.py
│       ├── priority_engine.py
│       ├── vision_service.py
│       └── weather_service.py
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── context/
│   │   └── pages/
│   ├── public/
│   ├── package.json
│   └── vite.config.js
│
├── package.json
├── package-lock.json
└── README.md
```

## ⚙️ Installation and Setup

### Prerequisites

Install the following software:

* Python 3.11 or a compatible version supported by the project dependencies
* Node.js and npm
* Git

### Step 1: Clone the repository

```bash
git clone https://github.com/Madh181/ai-farm-guardian.git
cd ai-farm-guardian
```

### Step 2: Set up the backend

Open a terminal in the project folder.

```bash
cd backend
python -m venv .venv
```

Activate the virtual environment on Windows:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install the Python dependencies:

```bash
pip install -r requirements.txt
```

### Step 3: Configure environment variables

Create a private file named `.env` inside the `backend` folder.

Add the environment variables required by your backend configuration. For example:

```env
JWT_SECRET=replace_with_a_long_random_secret
GROQ_API_KEY=your_groq_api_key_here
OPENWEATHER_API_KEY=your_openweather_api_key_here
```

Replace the placeholders with your own valid credentials.

Never upload your real API keys or secrets to GitHub.

### Step 4: Start the backend

From the `backend` directory, run:

```bash
uvicorn main:app --reload
```

If the backend starts successfully and uses the default FastAPI configuration, its API documentation is typically available at:

`http://127.0.0.1:8000/docs`

### Step 5: Set up the frontend

Open a second terminal in the project folder.

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

**Note:** Configure the frontend API base URL to match the address and port used by your backend.

## 🔐 Security

* Keep API keys in private environment files.
* Do not commit `.env` files.
* Do not upload virtual environments or `node_modules`.
* Use secure, unique secrets for authentication.
* Review environment variables before publishing the project.

## 🚀 Future Enhancements

* Improve crop disease identification using validated machine learning models.
* Refine intervention prioritization using crop severity, urgency, weather conditions, and economic impact.
* Add more crop varieties and regional agricultural recommendations.
* Improve multilingual support for farmers.
* Provide more detailed risk reports and treatment histories.
* Validate AI recommendations with agricultural experts and reliable datasets.

## 🎓 Project Domain

Artificial Intelligence | Machine Learning | Smart Agriculture | Decision Support Systems

## 👩‍💻 Developer

**Madhu**

AI and Data Science Engineering Student

## 📄 License

A license has not yet been specified. Add an appropriate open-source license if you decide to distribute the project under one.
