# Feature Breakdown

This document maps user-facing features to the key files and functions where their logic is primarily implemented.

### Core Charting & Canvas Interaction
-   **Description:** The main grid interface where users pan, zoom, and apply stitches.
-   **Files:**
    -   `components/KnitCanvas.tsx`: Manages all canvas rendering and user input.
    -   `App.tsx`: The `handleCellAction` and view/zoom state handlers.
    -   `canvasUtils.ts`: Caches and draws symbols efficiently.
    -   `components/FloatingToolPalette.tsx`: The UI for selecting the active tool.

### State Management & Undo/Redo
-   **Description:** Tracking changes and allowing users to undo/redo actions.
-   **Files:**
    -   `hooks/useChartHistory.ts`: The custom hook implementing the history stack.
    -   `App.tsx`: The primary consumer of the hook, calling `recordChange` for undoable actions.

### Key & Symbol Management
-   **Description:** The system for defining, creating, and using stitch symbols (Keys).
-   **Files:**
    -   `components/TopRibbon.tsx`: UI for the main key palette.
    -   `components/KeyEditorModal.tsx`: UI and logic for creating/editing `KeyDefinition` objects, including the custom line-drawing canvas.
    -   `components/StitchSymbolDisplay.tsx`: Reusable component for rendering any key.
    -   `App.tsx`: Handlers like `addOrUpdateKeyInPalette` that modify application state.
    -   `types.ts`: `KeyDefinition`, `KeyCellContent`, `KeyInstance` interfaces.

### Layer & Sheet Management
-   **Description:** Working with multiple layers on a chart and multiple charts (sheets) in a project.
-   **Files:**
    -   `components/TabbedSidebar.tsx`: The main sidebar container.
    -   `components/LayerPanel.tsx` & `components/SheetPanel.tsx`: UI for managing layers and sheets.
    -   `App.tsx`: Handler functions (`handleAddLayer`, `handleRemoveSheet`, etc.).

### Selection & Clipboard
-   **Description:** The "Select" tool, including copy, cut, paste, and dragging selections.
-   **Files:**
    -   `components/KnitCanvas.tsx`: Renders the selection rectangle and handles drag events.
    -   `App.tsx`: Implements logic for `handleCopySelection`, `handleCutSelection`, `handlePasteFromClipboard`.
    -   `utils.ts`: The `getExpandedSelection` utility to ensure multi-cell stitches are fully selected.

### Image-to-Chart Conversion
-   **Description:** Uploading an image and converting a selected area into a colorwork chart.
-   **Files:**
    -   `components/ImageProcessorModal.tsx`: A self-contained component with UI and client-side algorithms for image processing.
    -   `App.tsx`: The `handleCreateChartFromProcessedImage` function, which integrates the modal's output into the application state.

### Written Instruction Generation
-   **Description:** Automatically generating row-by-row instructions from a chart.
-   **Files:**
    -   `components/InstructionsGenerator.tsx`: Contains the UI and the logic for parsing the chart grid and formatting the text.

### Exporting
-   **Description:** Generating a JPG image of the current chart.
-   **Files:**
    -   `services/exportService.ts`: The `generateChartJpeg` function, which renders the chart to an off-screen canvas.
    -   `components/ExportPreviewModal.tsx`: UI for previewing and downloading the exported image.
