**Knitlab System Design & Architectural Decisions**

**1. Executive Summary**

Knitlab is a sophisticated, client-side Single-Page Application (SPA) for knitting chart design, deployed as a fully static website. Its architecture is intentionally minimalist, prioritizing zero operational cost, developer simplicity, and user data sovereignty over the conveniences of a server-backed application. All logic—from state management and rendering to image processing and data export—is executed entirely within the user's browser.

**2. Core Architecture**

*   **Client-Side Single-Page Application (SPA):** The entire application is delivered to the user's browser as a set of static files (HTML, CSS, JavaScript). After the initial load, navigation and interactions are handled dynamically on the client-side, providing a fluid, desktop-like experience without requiring server round-trips.
*   **Technology Stack:**
    *   **UI Framework:** **React with TypeScript** provides a robust, component-based structure for the complex UI, while ensuring type safety for the intricate application state.
    *   **Build Tool:** **Vite** is used for its fast development server (HMR) and optimized production builds, bundling the codebase into efficient static assets.
    *   **Styling:** **Tailwind CSS** (via CDN) offers a utility-first framework for rapid and consistent UI development without a complex build configuration.
*   **State Management:** The application state is managed in-memory using React hooks. A custom `useChartHistory` hook encapsulates the entire application state (`ApplicationState`), providing a transactional model with undo/redo capabilities without external libraries.
*   **Data Persistence:** Data persistence is a manual, user-driven process. The application state can be exported as a JSON file, which the user is responsible for saving. This JSON can be imported back into the application to restore a project, effectively making the user's local file system the database.

**3. Rationale for Key Design Choices**

*   **Static-First, No Backend:** The primary design driver was to eliminate server hosting, database management, and ongoing operational costs. This makes the project economically viable to maintain and allows for free, simple hosting on platforms like GitHub Pages. It also enhances user privacy, as no project data is ever transmitted to a server.
*   **Manual Data Persistence (JSON Export/Import):** This choice is a direct trade-off for having no backend.
    *   **Benefits:** It gives the user full ownership and control of their data. The JSON format is portable, transparent, and can be version-controlled by the user. It simplifies the application architecture immensely.
    *   **Drawbacks:** It is less convenient than automatic cloud saving and lacks features like real-time collaboration or cross-device sync. This trade-off was deemed acceptable for the target "prosumer" audience who may be more technically inclined.
*   **In-Browser Processing:** All computationally intensive tasks (image quantization, instruction generation, JPG export) are performed on the client. This leverages the power of modern user devices, keeping the infrastructure cost-free and scalable, as performance is tied to the user's machine, not a centralized server.

**4. Alternatives Considered & Trade-offs**

| Alternative Approach | Pros | Cons (Why Rejected) |
| :--- | :--- | :--- |
| **Full-Stack (Backend + DB)** | User accounts, seamless cloud sync, collaboration features. | **High Cost & Complexity:** Incurs significant server and database hosting costs. Adds immense operational overhead (security, backups, maintenance), violating the core design principle of a zero-cost, static application. |
| **Browser Storage (LocalStorage/IndexedDB)** | More convenient "auto-save" experience than manual export. | **Data Fragility & Lack of Portability:** Data is trapped in a single browser on one device. It can be easily lost (e.g., clearing browser data) and is not easily backed up or shared. The JSON model is more robust and user-controlled. |
| **React Meta-Frameworks (Next.js/Remix)** | Powerful features like Server-Side Rendering (SSR) and integrated API routes. | **Unnecessary Complexity:** The primary benefits of these frameworks (e.g., SEO, fast initial load for content sites) are not critical for a tool-based application like Knitlab. A simpler Vite SPA setup is more direct and sufficient for the project's needs. |

**5. Conclusion**

The system design of Knitlab is a deliberate and effective implementation of a static-first philosophy. By forgoing a traditional backend, it achieves its goals of being a powerful, feature-rich, and completely free-to-operate tool. The architecture makes a conscious trade-off, prioritizing user data ownership and zero operational cost over the cloud-based conveniences that a server-backed model would provide.
