# Bank Statement QnA Frontend

This React frontend communicates with the backend REST APIs to:
- Upload a bank statement
- Ask questions using Azure GPT (Gemini temporarily disabled)
- Manage chat sessions

> **Note**: Model selection is disabled. Azure is the only active LLM provider. Gemini code remains commented for future reactivation.

## Setup

```bash
npm install
npm run dev
```

The app will start on `http://localhost:5173` by default. If another process is
using that port, Vite will fail to serve the app.

### Debug Mode

Run the preflight script to automatically check the dev server ports and kill
zombie Python processes:

```bash
npm run start:debug
```

This starts Vite on the first available port (5173 or 5174), verifies that the
React root element is served and warns if the port is occupied by another
process.

## Usage
1. The app automatically requests a new session and chat on load.
2. Upload a PDF or CSV statement file.
3. Ask questions in the chat panel.

Refer to `backend_api_reference.md` for full API details.
