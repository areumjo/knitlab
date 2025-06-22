# Codebase Overview

This document provides a high-level technical overview of the Knitlab application.

## Guiding Principles

The architecture prioritizes a predictable, top-down data flow and simplicity over adding complex third-party libraries. This is achieved through two core concepts: a single state object and derived data.

### 1. Single State Object & Centralized Logic

All application state is held in a single `ApplicationState` object, managed by the `useChartHistory` custom hook within the root `App.tsx` component.

*   **`App.tsx` as the Conductor:** This component owns all state and state-modification logic. It passes down data and callback functions as props to child components. This makes the data flow explicit and easy to trace.
*   **`useChartHistory` for State & Undo/Redo:** This hook encapsulates the undo/redo history stack.
    *   `recordChange`: Wraps any state update that should be undoable. It creates a new, immutable state object and adds it to the history.
    *   `updateCurrentState`: Used for transient UI changes (like theme toggles) that should not create a history entry.

### 2. Source of Truth vs. Derived Data

The data model makes a clear distinction between the source of truth and data that is derived from it.

*   **Source of Truth: `keyPlacements`**
    A `Layer`'s visual state is defined by an array of `KeyInstance` objects (`keyPlacements`). Each `KeyInstance` is a simple record stating *which* key (`keyId`) is at *what* position (`anchor`). This is the canonical representation of the user's design.

*   **Derived Data: `grid`**
    The `grid` property on a `Layer` is a 2D array that is computationally expensive to build. It is generated on-demand by the `buildGridFromKeyPlacements` function. This `grid` is used for fast lookups during rendering and interaction, but it is always rebuilt from the `keyPlacements` source of truth.

This separation ensures data integrity and simplifies state updates, as logic only needs to modify the `keyPlacements` array.

## Key Files & Directories

*   **`App.tsx`**: The root component. Owns state and orchestrates all feature logic.
*   **`types.ts`**: Defines the entire data model. Understanding `ApplicationState`, `ChartState`, `Layer`, and `KeyDefinition` is essential.
*   **`hooks/useChartHistory.ts`**: The state management engine.
*   **`components/KnitCanvas.tsx`**: The most complex view component. Manages all canvas rendering (base grid + interactive overlays) and user input events.
*   **`components/KeyEditorModal.tsx`**: A self-contained component for the complex logic of creating and editing custom stitch `KeyDefinition` objects.
*   **`services/exportService.ts`**: Contains logic to render the chart state to an off-screen canvas for JPG export.
*   **`canvasUtils.ts`**: Provides performance optimizations by caching pre-rendered symbols.
