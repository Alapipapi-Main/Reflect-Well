# ReflectWell - A Mindful Journaling App

[**Live Website**](https://reflect-well.vercel.app/)

ReflectWell is a web application designed to help you practice mindfulness through daily journaling and mood tracking. It provides a clean, personal, and secure space to record your thoughts, reflect on your feelings, and visualize your emotional trends over time. With powerful AI features, you can now interact with your journal in a completely new way.

This project was built using Firebase Studio.

## ✨ Features

-   **Daily Journaling**: A rich text editor to write and save your daily reflections.
-   **AI-Powered Reflections**: Receive a gentle, insightful reflection from a compassionate AI after each entry.
-   **AI Image Generation**: Create beautiful, abstract cover images for your entries based on their mood and content.
-   **AI Journal Search**: Ask natural language questions about your past entries and get synthesized answers from your journal.
-   **Weekly Insights**: Generate an AI-powered summary of your week's themes and moods for deeper reflection.
-   **Mood Tracking**: Select your mood for each entry from a range of expressive emojis.
-   **Journal History**: Browse, search, and filter through your past entries in an easy-to-navigate accordion view.
-   **Mood Trends**: A beautiful chart that visualizes your mood fluctuations over time.
-   **Journaling Stats**: Track your journaling streak, total entries, and most frequent moods.
-   **Yesterday & "On This Day"**: Revisit your entry from yesterday and see what you wrote on this day last month or in past years.
-   **Secure & Private**: All your entries are stored securely in your own private space using Firebase Authentication and Firestore.
-   **Responsive Design**: A seamless experience across desktop, tablet, and mobile devices.

## 🛠️ Tech Stack

-   **Framework**: [Next.js](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **UI Components**: [ShadCN UI](https://ui.shadcn.com/)
-   **Backend & Database**: [Firebase](https://firebase.google.com/) (Authentication & Firestore)
-   **AI Features**: [Puter.ai](https://developer.puter.com/) for generative text and images.
-   **Charts**: [Recharts](https://recharts.org/)
-   **Forms**: [React Hook Form](https://react-hook-form.com/) & [Zod](https://zod.dev/)

## 🚀 Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have [Node.js](https://nodejs.org/en/) (version 18 or later) and npm installed on your machine.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Alapipapi-Main/Reflect-Well
    cd Reflect-Well
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Firebase:**
    This project is pre-configured to connect to a Firebase backend. The necessary configuration is already included in `src/firebase/config.ts`. The application uses email/password and anonymous authentication.

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

Open [http://localhost:9002](http://localhost:9002) with your browser to see the result. You can start editing the page by modifying `src/app/page.tsx`.

## 🔥 Firebase Integration

This application leverages the following Firebase services:

-   **Firebase Authentication**: To provide a unique and secure session for each user. This ensures that each user's journal entries are private and accessible only to them.
-   **Firestore**: A NoSQL database used to store all journal entries. The data is structured in a user-centric way, where each user's entries are stored in a subcollection under their unique user ID, enforced by Firestore Security Rules.

The security rules in `firestore.rules` are configured to enforce that users can only read and write their own data, providing a strong guarantee of privacy.
