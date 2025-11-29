# Marketing-Mavericks-Agent
An AI-powered marketing assistant designed to help businesses and marketers create compelling marketing content, develop strategic campaigns, and optimize their marketing efforts. The agent provides intelligent content generation, campaign planning, and marketing insights through a conversational interface accessible via web browser.

---

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- OpenAI API key

---

## Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your_actual_api_key_here
   ```

---

## Development

Run both frontend and backend in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Backend only
npm run dev:server

# Frontend only
npm run dev:client
```

---

## Building

Build both frontend and backend:
```bash
npm run build
```

---

## Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

---

## Production

Start the production server:
```bash
npm start
```

---

## Project Structure

```
marketing-mavericks-agent/
├── src/
│   ├── client/          # React frontend
│   │   ├── components/  # React components
│   │   ├── App.tsx      # Main app component
│   │   ├── main.tsx     # Entry point
│   │   └── index.css    # Global styles
│   └── server/          # Express backend
│       ├── index.ts     # Server entry point
│       └── ...          # Server modules
├── dist/                # Build output
├── index.html           # HTML template
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript config (frontend)
├── tsconfig.server.json # TypeScript config (backend)
├── vite.config.ts       # Vite config
├── tailwind.config.js   # Tailwind CSS config
└── jest.config.js       # Jest config
```

---

## Technologies

- **Frontend**: React, TypeScript, Tailwind CSS, Vite
- **Backend**: Node.js, Express, TypeScript
- **AI**: OpenAI API
- **Testing**: Jest, fast-check (property-based testing)

---

## Deployment

Quick deployment steps:
1. Push your code to a Git repository
2. Import the project to Vercel
3. Set the `OPENAI_API_KEY` environment variable
4. Deploy!

---

## Environment Variables

Required environment variables:

- `OPENAI_API_KEY` - Your OpenAI API key ([Get one here](https://platform.openai.com/api-keys))
- `PORT` - Server port (default: 3000)
- `NODE_ENV` - Environment mode (development/production)

---
