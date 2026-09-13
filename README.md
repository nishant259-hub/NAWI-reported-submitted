# NAWI Test Report Generator - SIH Problem Statement 36

Welcome to the prototype project developed for **Smart India Hackathon (SIH)** - Problem Statement 36 (Development of a Software Program/Application for Generation of Test Reports for Non-Automatic Weighing Instruments - NAWI).

## 🚀 Team Name: Bytebrigade

## 📝 About The Project
This project is a web-based application designed to automate the generation and management of test reports for Non-Automatic Weighing Instruments (NAWI). It streamlines testing procedures, performs automatic OIML R-76 compliant calculations, and provides a centralized dashboard for managing all test data efficiently.

### 🌟 Key Features
- **OIML R-76 Compliant Testing Engine:** Automatic real-time evaluation of weighing performance, repeatability, eccentricity, zero-setting, tare accuracy, and tilt test tolerances.
- **Official Certificate Export (PDF):** Generate high-fidelity, A4 vector-based PDF calibration certificates optimized for native browser printing, complete with dynamic layouts and official watermarks.
- **Fully Mobile Responsive:** The entire dashboard, history views, and complex data-entry tables are fluidly responsive and accessible on mobile and tablet devices.
- **Interactive Dashboard:** View, track, and manage previous NAWI test reports easily.
- **Digital Data Entry:** Seamlessly fill out NAWI test details with dynamic step-by-step forms.
- **Database Integration:** Securely saves all reports and test history using MongoDB.
- **Modular Architecture:** Clean separation of concerns with dedicated frontend scripts, stylesheets, and EJS partials for maintainability.

## 🛠️ Technology Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (using Mongoose for ODM)
- **Frontend:** EJS (Embedded JavaScript templates), HTML5, Vanilla CSS, JavaScript
- **Icons:** Font Awesome
- **Deployment:** Render

## ⚙️ How to Run Locally

Follow these steps to set up the project on your local machine:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/) installed on your system.

### Installation

1. **Navigate to the project directory:**
   ```bash
   cd "NAWI repoort submitted"
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```
   *(Note: For yarn users, use `yarn install`)*

3. **Configure Environment:**
   Create a `.env` file in the root directory and add your MongoDB connection string (or use the default local connection in the code).

4. **Start MongoDB:**
   Ensure your local MongoDB server is running on `mongodb://127.0.0.1:27017`

5. **Run the application:**
   ```bash
   npm start
   ```

6. **Open in Browser:**
   Go to `http://localhost:3000` to interact with the application.

## 📂 Project Structure
- `server.js` - Main entry point and API routes for the Express application.
- `/public` - Static assets including modular stylesheets (`/css/pages/`), client-side scripts (`/js/pages/`, `r76engine.js`), and images.
- `/views` - EJS templates serving the frontend UI (`index.ejs`, `home.ejs`, `new-test.ejs`, `test-plan.ejs`, `certificate.ejs`, etc.) with modular `/partials`.
- `/model` - Contains Mongoose schemas (e.g., `reportSchema.js`) for the database.
- `seed.js` - Utility script to populate the database with mock test reports.

## 🏆 Hackathon Details
- **Hackathon:** Smart India Hackathon (SIH)
- **Problem Statement Number:** 36
- **Domain:** Generation of Test Reports for NAWI (Non-Automatic Weighing Instruments)

---
*Built with ❤️ by Bytebrigade*
