# Project Genesis: AUTOMATA

## 1. Core Idea & Vision
*AUTOMATA is an innovative web application designed to simplify and accelerate the workflow for 3D artists and game developers. It allows users to upload their own 3D models and generate high-quality, AI-powered PBR (Physically Based Rendering) textures directly in the browser, aiming for a "one-click" solution to the traditionally complex texturing process.*

## 2. Key Features & User Stories
- **User Story 1:** As a 3D artist, I can upload my 3D model files (e.g., .glb, .fbx) to the platform.
- **User Story 2:** As a user, I can describe the textures I want using a simple text prompt.
- **User Story 3:** As a developer, I can see the generated textures (diffuse, normals, height, etc.) applied to my model in an interactive 3D viewer.
- **User Story 4:** As a user, I can download the generated textures for use in other software.

## 3. Tech Stack & Architecture
- **Frontend Framework:** Next.js
- **3D Visualization:** React Three Fiber & Drei
- **State Management:** Zustand
- **Backend-as-a-Service:** Supabase (for Authentication and Storage)
- **AI Texture Generation:** A dedicated ComfyUI instance, accessed via a secure API proxy using the `@saintno/comfyui-sdk`.

## 4. Non-Functional Requirements
*Specify critical requirements that aren't features.*
-   **Security:** All user authentication and session management will be handled by Supabase Auth (Supabase SSR). API routes that communicate with the ComfyUI backend must be secure proxies.
-   **Performance:** The application must provide a fast and responsive user experience, with interactive 3D rendering in the browser.
-   **Scalability:** The architecture is decoupled, with the heavy-lifting of AI generation handled by a dedicated ComfyUI instance, allowing the web frontend to remain lightweight and scalable.

## 5. Constraints & Assumptions
*List any limitations or assumptions.*
-   **Constraint:** The core texture generation functionality is dependent on a separate, running ComfyUI instance with a pre-configured workflow.
-   **Assumption:** Users will be on modern web browsers that support WebGL for the interactive 3D viewer. 