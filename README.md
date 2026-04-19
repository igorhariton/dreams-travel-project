
  # Smart Travel Platform UI

  This is a code bundle for Smart Travel Platform UI. The original project is available at https://traveling-website.com

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.
  

## Images (Local)

All images are served locally from `public/images/`.
Replace the placeholder JPG files (1.jpg..4.jpg) inside each destination folder with your own photos.
See `public/images/README_IMAGES.txt` for the full instructions.

## Environment Variables

Copy `.env.example` to `.env` and adjust as needed:

- `VITE_API_BASE_URL` (default: `/api`)
- `VITE_APP_ENV` (`development` | `staging` | `production` | `test`)
- `VITE_ENABLE_CHAT_FALLBACK` (`true`/`false`, development only)

## Backend API Contract Used By Frontend

Frontend now expects these backend endpoints:

- `POST /api/auth/login`
- `POST /api/auth/register`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/assistant/chat`
- `POST /api/assistant/booking-request`
- `POST /api/assistant/contact-host`
- `POST /api/assistant/support`
- `POST /api/geocode`
- `POST /api/translate`
