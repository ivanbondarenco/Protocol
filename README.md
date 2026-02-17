# Protocol V4 - Personal Optimization System

## 🚀 Overview
**Protocol** is a personal tracking application designed to optimize biological and intellectual performance. It combines training logs, nutrition tracking, and a knowledge vault into a unified cyber-aesthetic interface.

## 🌟 Features (V4)

### 🏋️ Training Log
- **Lift & Cardio Modes**: distinct tracking for weightlifting and cardio sessions.
- **Grouped Sets**: Sets are grouped by exercise for better readability.
- **Exercise Info**: Integrated with **ExerciseDB** (RapidAPI) to show GIFs and target muscles.
- **History**: View last 30 days of training volume.
- **Charts**: Volume trend visualization.

### 🥗 Fuel Station
- **Macro Tracking**: Protein, Carbs, Fats, and Calories.
- **Smart Chef**: Generate quick recipes based on available time/ingredients.
- **Scavenger Mode**: Find recipes based on ingredients you have (e.g., "Eggs, Rice").
- **Hydration Tracker**: Persistent water logging.

### 🧠 The Vault
- **Library**: Manage your physical and digital book collection.
- **Google Books Integration**: Auto-fetch book covers and metadata.
- **Idea Spark**: Quick capture for thoughts and "Brain Dumps".
- **Pomodoro Timer**: Integrated focus timer (25/5).

## 🛠️ Setup & Installation

1.  **Clone the repository**
2.  **Install Dependencies**:
    ```bash
    npm install
    ```
3.  **Environment Variables**:
    Create a `.env` file in the root directory:
    ```env
    VITE_RAPIDAPI_KEY="YOUR_RAPIDAPI_KEY"
    ```
    *(Optional: If omitted, the app uses mock data for exercises)*

4.  **Run Locally**:
    ```bash
    npm run dev
    ```

5.  **Build for Production**:
    ```bash
    npm run build
    ```

## 🏗️ Deployment
Refer to `DEPLOY_GUIDE.md` for detailed instructions on deploying to a VPS (Ubuntu/Nginx).

## 🌍 Localization
Fully translated to **Spanish (ES)** and **English (EN)**. Defaults to Spanish.
