# NAWI Test Report Generator - SIH Problem Statement 36

Welcome to the prototype project developed for **Smart India Hackathon (SIH)** - Problem Statement 36 (Development of a Software Program/Application for Generation of Test Reports for Non-Automatic Weighing Instruments - NAWI).

## 🚀 Team Name: Bytebrigade

## 📝 About The Project
This project is a web-based application designed to automate the generation and management of test reports for Non-Automatic Weighing Instruments (NAWI). It streamlines testing procedures and provides a centralized dashboard for managing all test data efficiently.

### 🌟 Key Features
- **Interactive Dashboard:** View, track, and manage previous NAWI test reports easily.
- **Digital Data Entry:** Seamlessly fill out NAWI test details including Instrument Data, Form 1, Form 2, and Form 3 results.
- **Automated Report Generation:** Instantly view detailed generated reports based on the submitted instrument data and test outcomes.
- **Database Integration:** Securely saves all reports and test history using MongoDB.
- **User-Friendly Interface:** Modern UI built with EJS, HTML, and CSS.

## 🛠️ Technology Stack
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (using Mongoose for ODM)
- **Frontend:** EJS (Embedded JavaScript templates), HTML5, Vanilla CSS, JavaScript
- **Icons:** Font Awesome

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

3. **Start MongoDB:**
   Ensure your local MongoDB server is running on `mongodb://127.0.0.1:27017`

4. **Run the application:**
   ```bash
   node server.js
   ```

5. **Open in Browser:**
   Go to `http://localhost:3000` to interact with the application.

## 📂 Project Structure
- `server.js` - Main entry point and API routes for the Express application.
- `/public` - Static assets including stylesheets (`style.css`), client-side scripts (`script.js`), and images.
- `/views` - EJS templates serving the frontend UI (`index.ejs`, `dashboard.ejs`, `new-test.ejs`, `report.ejs`).
- `/model` - Contains Mongoose schemas (e.g., `reportSchema.js`) for the database.

## 🏆 Hackathon Details
- **Hackathon:** Smart India Hackathon (SIH)
- **Problem Statement Number:** 36
- **Domain:** Generation of Test Reports for NAWI (Non-Automatic Weighing Instruments)

---
*Built with ❤️ by Bytebrigade*
