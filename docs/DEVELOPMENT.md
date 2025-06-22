# Development Guide

This guide provides the essential steps to set up and contribute to the Knitlab project.

## Prerequisites

-   **Node.js:** Version 18 or higher.
-   **npm:** Comes bundled with Node.js.

## Running Locally

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start the Development Server:**
    ```bash
    npm run dev
    ```
    The server will start, typically at `http://localhost:5173`. Open this URL in your browser. The project uses Vite, so most code changes will be reflected instantly via Hot Module Replacement (HMR).

## Codebase Orientation

To understand the application, start with these files:

1.  **`types.ts`**: Defines the core data structures. Understanding this file is the fastest way to understand how the application works.
2.  **`App.tsx`**: The root component. It contains almost all application state and feature logic.
3.  **`docs/OVERVIEW.md`**: Provides a more detailed explanation of the architecture.

## Key Development Patterns

*   **State Flow:** `App.tsx` is the single source of truth. It passes state down to components as props. To update the state, components call functions passed down from `App.tsx` (e.g., `onSave`, `onAddLayer`). This is a simple, top-down data flow.

*   **Undo/Redo:** Any state change that should be undoable **must** be wrapped in a `recordChange(...)` call in `App.tsx`. This function, provided by the `useChartHistory` hook, properly updates the history stack. Transient UI changes that shouldn't be in the history (like theme updates) use `updateCurrentState`.

*   **Styling:** We use Tailwind CSS for all styling. The configuration is embedded directly in `index.html` for simplicity.

## Deployment

The project is configured for deployment to GitHub Pages. Pushing to the `main` branch will automatically trigger the `deploy.yml` GitHub Action, which builds the project and deploys the static files from the `dist` directory to the `gh-pages` branch.

