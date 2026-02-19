# Orbitals - Personal Timeline Application

A minimalist personal timeline application designed for recording daily life moments. Like planets orbiting around your life's journey, each memory marks a point in your personal timeline. Supports text, images, videos, audio, and external links (including YouTube).

## Features

- **Rich Content Types**: Text, images, videos, audio, YouTube links
- **Timeline View**: Infinite scroll timeline with all your posts
- **Media Support**: Upload local files or link to external media
- **Avatar History**: Keep track of your different avatars over time
- **Clean Design**: Minimalist UI focused on content
- **Extensible**: Easy to add new content types

## Tech Stack

### Backend
- Node.js + Express
- PostgreSQL (with JSONB for flexible content storage)
- Multer (file uploads)
- Sharp (image processing)

### Frontend
- React + Vite
- TailwindCSS
- React Query (data fetching)
- Axios

## Prerequisites

- Node.js 18+ (with npm)
- Docker & Docker Compose (for database)

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Orbitals
```

---

### Option A: Local Development (recommended for development)

Run only the database in Docker; start the backend and frontend manually.

**1. Configure environment**

```bash
# Docker .env — used to start the PostgreSQL container
cp docker/dev/.env.example docker/dev/.env

# Backend .env — used by the local backend process
cp backend/.env.example backend/.env
```

Edit both files and set a password. `DB_PASSWORD` must match in both. In `backend/.env`, also update `DATABASE_URL` to include the same password.

**2. Start the database**

```bash
cd docker/dev
docker compose up -d
```

This starts PostgreSQL on port 12000.

**3. Start the backend**

```bash
cd backend
npm install
npm run dev
```

`npm run dev` automatically runs any pending database migrations before starting the server. The backend will start on port 37000.

**4. Start the frontend**

```bash
cd frontend
npm install
npm run dev
```

The frontend will start on port 5173. Open `http://localhost:5173` in your browser.

---

### Option B: Full Deployment (all services in Docker)

**1. Configure environment**

```bash
cp docker/prod/.env.example docker/prod/.env
```

Edit `docker/prod/.env` and set `DB_PASSWORD` and `AMAP_WEB_SERVICE_KEY`.

**2. Start all services**

```bash
cd docker/prod
docker compose up -d
```

The frontend will be available on port 5173.

## Usage

1. Open your browser and navigate to `http://localhost:5173`
2. Click the "+ New Post" button to create your first post
3. Choose a content type (Text, Image, Video, Audio)
4. Add your content and click "Post"
5. Your timeline will update automatically

## Project Structure

```
Orbitals/
├── backend/                  # Backend API
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   ├── middleware/      # Custom middleware
│   │   ├── utils/           # Utilities
│   │   └── app.js          # Express app entry
│   ├── migrations/          # node-pg-migrate SQL migration files
│   └── uploads/            # Uploaded media files
├── frontend/                # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── api/            # API client
│   │   ├── hooks/          # Custom hooks
│   │   └── App.jsx         # Main app component
│   └── public/
├── docker/
│   ├── dev/               # Local development (database only)
│   │   ├── docker-compose.yml
│   │   └── .env.example
│   └── prod/              # Full production deployment
│       ├── docker-compose.yml
│       └── .env.example
```

## API Endpoints

### Posts
- `GET /api/posts` - Get all posts (paginated)
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Media
- `POST /api/media/upload` - Upload media file
- `DELETE /api/media/:id` - Delete media file

### User
- `GET /api/user/profile` - Get user profile
- `PUT /api/user/profile` - Update user profile

### Avatars
- `GET /api/avatars` - Get avatar history
- `GET /api/avatars/current` - Get current avatar
- `POST /api/avatars` - Upload new avatar
- `PUT /api/avatars/:id/current` - Set avatar as current

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=12000
DB_USER=orbitals
DB_PASSWORD=your_password_here
DB_NAME=orbitals_db
DATABASE_URL=postgresql://orbitals:your_password_here@localhost:12000/orbitals_db
PORT=37000
NODE_ENV=development
MAX_FILE_SIZE=52428800
```

### Frontend

No environment variables needed. API requests are proxied through the frontend server:
- **Dev**: Vite dev server proxies `/api` and `/uploads` to `localhost:37000`
- **Container**: nginx proxies `/api` and `/uploads` to the `backend` container

## Database Configuration

The PostgreSQL database runs in Docker on port 12000:
- **Username**: orbitals (or as set in `DB_USER`)
- **Password**: as set in your `.env` file (`DB_PASSWORD`)
- **Database**: orbitals_db (or as set in `DB_NAME`)

To connect manually:
```bash
psql -h localhost -p 12000 -U orbitals -d orbitals_db
```

## Development

### Backend Development
```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development
```bash
cd frontend
npm run dev  # Vite dev server with HMR
```

### Building for Production

**Backend:**
```bash
cd backend
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview
```

## Adding New Content Types

To add a new content type (e.g., Spotify links):

1. **Frontend**: Add rendering logic in `PostCard.jsx`
```jsx
case 'spotify':
  return <SpotifyEmbed metadata={post.metadata} />;
```

2. **Frontend**: Add input in `PostForm.jsx`
```jsx
// Add button and handle Spotify URL input
```

3. **Backend**: No changes needed! The JSONB `metadata` field handles any structure.

## Troubleshooting

### Database Connection Error
- Make sure Docker is running: `docker ps`
- Check if PostgreSQL container is up: `docker-compose ps`
- Verify port 12000 is not in use: `lsof -i :12000`

### Frontend Can't Connect to Backend
- Check if backend is running on port 37000
- In dev mode, the Vite proxy forwards `/api` and `/uploads` to `localhost:37000` — no manual URL config needed
- Check CORS settings in `backend/src/app.js`

### File Upload Issues
- Check `uploads/` directory exists and has write permissions
- Verify `MAX_FILE_SIZE` in backend `.env`
- Ensure file type is allowed (see `backend/src/middleware/upload.js`)

## Others

Icon: https://commons.wikimedia.org/wiki/File:Icon_planet.svg

## License

MIT

## Author

Created with love for capturing life's orbital moments.
