# TeamHub Features & AI Implementation — Hassan Abdelhamed

This directory documents the contributions, architecture details, and accomplishments of Hassan Abdelhamed.

---

## 🚀 Accomplishments & Implemented Features

### 1. Document Management & Rich Text Editor
- **Full Document lifecycle (CRUD)**:
  - Users can create new documents within a workspace, view a paginated list of all active documents, and edit them via a rich visual editor.
- **Rich Editor Integration**:
  - Collaborative-ready interactive rich text editor built using TipTap.
  - Supports headings, nested bullet and ordered lists, task lists, code blocks, quotes, custom image embeds, links, and formatting options (bold, italic, strikethrough, code).
- **Auto-Save Mechanism**:
  - The editor listens for content changes and automatically saves edits in the background using a debounced hook. This protects user changes from loss without requiring manual page saves.
- **Document Metadata**:
  - Custom page cover banner picker (solids & gradients) stored and updated.
  - Custom page icon picker (emojis/unicode icons) with automatic database syncing.
  - Dynamically editable document titles with inline updating.
  - Document tag categorization and tagging controls.
- **Export Capabilities**:
  - **Markdown Exporter**: Recursive parser walking Tiptap JSON node structures to generate clean, standard Github-flavored Markdown (`.md`) files.
  - **PDF Exporter**: Clean client-side PDF (`.pdf`) generator using `html2pdf.js`. Features a temporary CSS injector to override dark mode themes to print-friendly light themes (white background, dark text, clean borders) and preserves active clickable links.

### 2. Multi-Target Attachment System
- **Unified Upload & Asset Storage**:
  - High-performance media upload and storage integrated with **Cloudinary**.
- **Attachment Linking Constraints**:
  - Securely supports uploading files and attaching them to different models in the database:
    - **Documents** (associated in editor attachments tab).
    - **Messages** (attached inside chat rooms).
    - **Tasks/Issues** (associated with cards).
  - Every uploaded attachment record belongs to **exactly one target**, ensured by database relations and exclusive foreign keys (`document_id`, `message_id`, `task_id`).
- **File Management UI**:
  - Displays lists of attachments with their respective names, sizes, formats, and file type icons. Supports quick file previewing, downloading, or removing.

### 3. Real-Time WebSockets
- **Bi-directional Engine**:
  - Full Socket.io connection layer integration in the Node.js backend and React frontend.
- **Real-Time Synchronizations**:
  - Instant workspace updates and collaborative state refreshes.
  - Active typing indicators in messaging panels to show when another teammate is writing.
  - Dynamic message delivery and instant messaging.
- **Resilience**:
  - Handles auto-reconnects, connection tracking, and specific room-based message broadcasting.

### 4. Interactive Notification Center
- **System Event Broadcasts**:
  - Automatically triggers, saves, and pushes notifications for key collaboration events:
    - **Task Assignments**: Notifies users immediately when they are assigned a task.
    - **Mentions**: Notifies users when they are tagged in messages or documents.
    - **Collaborator Invites**: Alerts users when added to workspaces or documents.
- **Persistent Storage**:
  - All system notifications are saved in PostgreSQL to ensure a persistent history is loaded when users log in.
- **Notification UI & Controls**:
  - Features an unread notification count badge, an indicator bell, a dropdown pane to view alerts, actions to mark individual or all notifications as read, and delete actions.

### 5. AI Microservice & Vector Database
- **Modular Python Microservice**:
  - High-performance, isolated backend service powered by **FastAPI** to execute computationally heavy vectorization and AI operations without blocking the main Express.js gateway.
- **Semantic Vector Store & Embedding Pipeline**:
  - Automatically parses document text and splits long documents into manageable chunks.
  - Generates dense vector embeddings using the HuggingFace `sentence-transformers/all-MiniLM-L6-v2` embedding model.
  - Saves chunks and vector embeddings inside PostgreSQL using the `pgvector` extension.
  - Provides a **Semantic Search API** that performs high-speed cosine similarity (`<=>` operator) vector matching, returning matches by meaning rather than exact keywords.
- **Global AI Command Palette (`Ctrl + K`)**:
  - A modal triggered globally from anywhere in the application. It lets users perform semantic search queries across all workspace documents, returning snippets of matching text.
- **SSE Streaming Engine**:
  - Implements **Server-Sent Events (SSE)** using `sse-starlette` and `EventSource` to stream responses chunk-by-chunk from Groq API, providing low latency responses.
- **AI Core Features**:
  - **Document Summarization**: Summarizes active document content with configurable length constraints (Short, Medium, Long) and streams the summary output.
  - **Document Q&A (RAG)**: Retrieves matching context from vector database chunks and sends it along with the user's question to the LLM (`llama-3.1-8b-instant`), returning accurate answers grounded in document content.
  - **Action Items Extractor**: Parses TipTap JSON document node structures directly, extracts checklists/TODO items, identifies potential assignees/due dates, and builds action lists.
- **Seamless Frontend AISidebar**:
  - Right-side slide-over drawer housing independent Q&A, Summaries, and Action Items tabs.
  - Custom state persistence: closing the drawer does not clear active conversation histories, while switching between documents triggers cleanups to reset the AI context and prevent data leaks.

---

## 🛠️ Tech Stack & Architecture

- **Backend API Gateway**: Node.js / Express.js / TypeScript
- **AI Microservice**: Python / FastAPI / SQLAlchemy / Alembic
- **Database & ORM**: PostgreSQL, pgvector extension, Prisma ORM
- **AI Models & Frameworks**: LangChain, HuggingFace SentenceTransformers, Groq Cloud API
- **Real-time Engine**: Socket.io
- **Media Storage**: Cloudinary
- **Frontend App**: React / Tailwind CSS / TipTap Editor / html2pdf.js
