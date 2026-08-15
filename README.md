# Client - Full-Stack SaaS & ML Analytics Platform

Welcome! This repository showcases a comprehensive, production-ready SaaS application designed to demonstrate advanced full-stack development, microservices architecture, and practical machine learning integration. 

---

## 🎯 Project Objectives & Architectural Decisions

This project was engineered to solve complex business problems by seamlessly bridging modern web development with data science. 

**Key Technical Highlights Include:**
- **Microservices Architecture:** Decoupled the backend into two distinct services: a high-performance **Node.js/Express** REST API for core business logic, and a specialized **Python FastAPI** service dedicated solely to machine learning and analytics computations.
- **AI-Powered Analytics:** Engineered a predictive spending model using `scikit-learn` (Linear Regression). The system dynamically trains on historical user data and generates personalized trend visualizations on the fly using `matplotlib`.
- **Advanced UI/UX Engineering:** Built a highly responsive React frontend featuring a custom "Milky White Glassmorphic" design system. Implemented a fully functional dark/light mode toggle using raw CSS variables (`data-theme`) to demonstrate deep CSS proficiency without relying on heavy UI component libraries.
- **Secure Authentication:** Implemented secure JWT-based authentication with custom Axios interceptors to seamlessly manage session states across protected routes and external microservices.

---

## 🛠️ Technology Stack & Competencies

### Frontend (User Interface & State)
- **Core:** React 18, TypeScript, Vite
- **State Management:** Zustand (Global State), React Query (Server State)
- **Styling:** Custom Vanilla CSS (Glassmorphism, CSS Variables, Micro-animations)
- **Competency Displayed:** Building scalable component architectures, managing complex client-side state, and implementing pixel-perfect, responsive, and accessible UI designs.

### Backend API (Core Business Logic)
- **Core:** Node.js, Express, TypeScript
- **Database:** MongoDB (via Mongoose)
- **Security:** JSON Web Tokens (JWT), Role-Based Access Control (RBAC)
- **Competency Displayed:** Designing RESTful APIs, schema validation, middleware implementation, and secure database interactions.

### Machine Learning Service (Data Science)
- **Core:** Python, FastAPI, Uvicorn
- **Machine Learning:** `scikit-learn` (Linear Regression), `pandas`, `numpy`
- **Visualization:** `matplotlib` (rendering transparent Base64 graphs)
- **Competency Displayed:** Deploying AI/ML models as independent microservices, data wrangling, and cross-language API communication.

---

## 🚀 Running the Project Locally

The application utilizes a distributed architecture. To run the full suite, three separate services must be started concurrently:

### 1. Node.js Backend Server
```bash
cd server
npm install
npm run dev
```
*(Runs on `http://localhost:5000`)*

### 2. Python ML Service
```bash
cd ml_service
pip install fastapi uvicorn scikit-learn pandas numpy matplotlib pydantic
python -m uvicorn main:app --port 8000
```
*(Runs on `http://localhost:8000`)*

### 3. React Frontend
```bash
cd client
npm install
npm run dev
```
*(Runs on `http://localhost:5173`)*

---

## 📊 Live Feature Demonstration

If you are evaluating this project, I highly recommend testing the **Machine Learning Pipeline**:
1. Log in to the application and navigate to the **Expenses & ML** tab.
2. Add at least two distinct expenses with different dates (e.g., $100 for Software, $200 for Marketing). 
3. Click the **Run ML Model** button.
4. The React client will instantly communicate through the Node API to the Python service, which trains the regression model on your inputted data and returns a custom `matplotlib` visualization back to the UI.

---
*Thank you for reviewing my work. I am passionate about building scalable software and am always excited to discuss system design, architecture, and code quality.*
