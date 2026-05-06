# Room Layout AI — Chat Frontend

A React chat interface for the Agentic RAG Room Layout Recommendation backend.

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Start development server
```bash
npm run dev
```

Opens at **http://localhost:5173**

## Setup backend first

### Installs

```bash
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
```

```bash
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Run

```bash
cloudflared tunnel --protocol http2 --url http://localhost:8000
```

```bash
uvicorn backend_server_vlm:app --host 0.0.0.0 --port 8000
```



## Configuration

Click the ⚙️ **Settings** icon (top-right) and set:

| Field | Description | Example |
|-------|-------------|---------|
| **Server URL** | URL of your remote FastAPI backend | `https://receptor-supporting-programmer-dramatically.trycloudflare.com` |
| **Layouts JSON Path** | Absolute path to the JSON file **on the server** | `/home/user/data/layouts.json` |
| **Furniture Filter** | Optional comma-separated furniture items to require | `bed, wardrobe` |
| **Your Name** | Display name shown in the greeting | `Sohith` |

## How It Works

1. **Welcome screen** — click a suggestion or type to begin
2. The frontend calls `POST /start` on your backend server
3. It polls `GET /question` every 1.5 seconds
4. When the AI asks a question, it appears as a chat bubble
5. Type your answer and press **Enter** → `POST /answer` is sent
6. Repeat until the best layout is found
7. Final result displayed as a card with furniture positions

## API Endpoints Used

| Method | Endpoint | Purpose |
|--------|----------|---------|
| `POST` | `/start` | Start a new recommendation session |
| `GET`  | `/question` | Poll for current question or result |
| `POST` | `/answer` | Submit user's answer |

## Build for Production

```bash
npm run build
```

Output in `dist/` — serve with any static file server.

## CORS

The backend already has `allow_origins=["*"]` so no proxy is needed.
If you tighten CORS in production, add your frontend URL to `allow_origins`.
