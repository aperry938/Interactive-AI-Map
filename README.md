# Interactive AI Map

An interactive, 3D-like visualization of the Artificial Intelligence landscape, built with React, D3.js, and Vite.

## Features

*   **Interactive Tree Diagram**: Explore connections between AI, ML, Deep Learning, and various applications.
*   **Search Functionality**: Quickly find concepts and see their relationships.
*   **Mastery Tracking**: Mark concepts as "Mastered" to track your learning progress.
*   **Responsive Design**: Works on desktop and mobile devices.
*   **Premium UI**: Glassmorphism effects and smooth animations for an immersive experience.

## Tech Stack

*   **React 19**: UI library.
*   **D3.js v7**: Data visualization.
*   **Vite**: Build tool and dev server.
*   **Tailwind CSS**: Styling.
*   **TypeScript**: Type safety.
*   **Vitest**: Unit testing.

## Getting Started

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Run the development server**:
    ```bash
    npm run dev
    ```

3.  **Configure API Key**:
    *   Click the **Settings** (gear icon) in the top right corner.
    *   Enter your **Google Gemini API Key**.
    *   Click **Save**.
    *   (The key is stored locally in your browser).

4.  **Build for production**:
    ```bash
    npm run build
    ```

5.  **Run tests**:
    ```bash
    npm run test
    ```

## Project Structure

*   `src/components/features`: Core feature components (Tree Diagram, Controls, etc.).
*   `src/data`: Static data for the AI concepts.
*   `src/hooks`: Custom hooks (e.g., `useLocalStorage`).
*   `src/types.ts`: TypeScript definitions.

## License

MIT
