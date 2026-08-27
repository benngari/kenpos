# KenPOS — Kenyan Retail Point of Sale System

A production-oriented POS built for Kenyan supermarkets, minimarts, shops and pharmacies.

- **Frontend:** React + TypeScript + Vite + Tailwind CSS + Zustand + React Router
- **Backend:** Node.js + Express + TypeScript + Mongoose
- **Database:** MongoDB Atlas
- **Currency/locale:** KES, M-Pesa manual recording, VAT, KRA PIN fields

> Deploy target: Frontend → Vercel · Backend → Render · Database → MongoDB Atlas

---

## 1. Project Structure

```
kenpos/
  backend/     Express + TypeScript API
  frontend/    React + Vite + TypeScript app
```

---

## 2. Prerequisites

- Node.js 18+ and npm
- A free [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register) account
- Git + a GitHub account (for deployment)

---

## 3. Backend Setup (local)

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/kenpos?retryWrites=true&w=majority
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
```

Run the API:

```bash
npm run dev
```

The API starts on `http://localhost:5000`. Health check: `GET /health`.

### Seed demo data

```bash
npm run seed
```

This creates a store, 3 demo users, categories, ~18 realistic Kenyan products, customers,
suppliers, sample sales/purchases/expenses.

Demo logins (password for all: `password123`):

| Role    | Email                  |
|---------|------------------------|
| Admin   | admin@kenpos.co.ke     |
| Manager | manager@kenpos.co.ke   |
| Cashier | cashier@kenpos.co.ke   |

---

## 4. Frontend Setup (local)

```bash
cd frontend
npm install
cp .env.example .env
```

Edit `.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Run the app:

```bash
npm run dev
```

Open `http://localhost:5173` and log in with one of the seeded accounts above.

---

## 5. MongoDB Atlas Setup

1. Create a free cluster at cloud.mongodb.com.
2. Database Access → add a database user with a strong password.
3. Network Access → add `0.0.0.0/0` (or your Render's static IP once known) so the backend can connect.
4. Clusters → Connect → "Connect your application" → copy the connection string into `MONGO_URI`
   in `backend/.env` (replace `<password>` and add `/kenpos` as the database name before the `?`).

---

## 6. Deploying the Backend to Render

1. Push this repo to GitHub.
2. On [Render](https://render.com), create a **New Web Service** from your repo, root directory `backend`.
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables (same as your local `.env`):
   - `MONGO_URI`
   - `JWT_SECRET`
   - `JWT_EXPIRES_IN`
   - `CORS_ORIGIN` → set this to your deployed Vercel frontend URL once you have it (comma-separate
     multiple origins if needed)
   - `PORT` → Render sets this automatically; you don't need to set it
6. Deploy. Note the resulting URL, e.g. `https://kenpos-backend.onrender.com`.
7. Once deployed, run the seed script once via Render's Shell tab: `npm run seed`.

---

## 7. Deploying the Frontend to Vercel

1. On [Vercel](https://vercel.com), import the same GitHub repo, set root directory to `frontend`.
2. Framework preset: Vite.
3. Build command: `npm run build` — Output directory: `dist`.
4. Add environment variable:
   - `VITE_API_URL` → `https://kenpos-backend.onrender.com/api` (your Render URL + `/api`)
5. Deploy. Vercel will give you a URL like `https://kenpos.vercel.app`.
6. Go back to Render and update `CORS_ORIGIN` to this Vercel URL, then redeploy the backend.

---

## 8. Remaining Production Configuration / Integration Points

These are intentionally scaffolded but not "faked" — wire them up when you're ready:

- **Cloudinary image uploads:** product `imageUrl` is a plain string field today (paste any
  image URL). Add Cloudinary's Node SDK + an upload route under `/api/products/:id/image`
  when you're ready for direct uploads; env vars are already reserved in `.env.example`.
- **M-Pesa Daraja API:** the `Payment` schema already stores `method: "mpesa"`, transaction
  `reference`, and `phone` manually entered by the cashier. A real Daraja STK Push integration
  can post into the same fields via a webhook/callback route — no schema changes needed.
- **KRA eTIMS:** not implemented. Only VAT rate and KRA PIN fields exist today.
- **Settings persistence:** the Settings page currently saves to `localStorage` as a working
  placeholder. A `Store` Mongoose model and schema already exist on the backend
  (`backend/src/models/index.ts`) — add `GET/PUT /api/store` routes to persist settings
  server-side and share them across devices/branches.
- **Multi-branch stock transfer:** the `InventoryMovement` model supports a `"transfer"` type,
  but only single-branch/single-register operation is wired in the UI. Add a `Store` reference
  on `Product`/`Sale` and a transfer endpoint if you need multiple branches.
- **Barcode label printing:** barcode values are generated/stored on each product; a print-label
  screen (e.g. using a library like `jsbarcode`) is not yet built.

---

## 9. Offline-First POS

The POS screen caches the active product catalog in IndexedDB (via Dexie) and shows a
🟢 Online / 🔴 Offline / 🟡 Syncing indicator in the header. If the connection drops mid-shift:

- The cashier can keep searching/scanning and adding to cart using the cached catalog.
- Completed checkouts are queued locally instead of failing.
- When the browser detects it's back online, queued sales are POSTed to `/sales/checkout`
  in order and removed from the local queue on success.

This uses the browser's `online`/`offline` events plus a manual sync check on load — see
`frontend/src/hooks/useOnlineSync.ts`.

---

## 10. Keyboard Shortcuts (POS screen)

| Key  | Action              |
|------|---------------------|
| F2   | Focus search/scan box |
| F4   | Hold current sale   |
| F8   | Open payment modal  |
| Esc  | Close open modal    |

---

## 11. Roles & Permissions

| Role    | Access                                                                 |
|---------|-------------------------------------------------------------------------|
| Admin   | Everything, including Users & Roles                                    |
| Manager | Sales, inventory, products, purchases, suppliers, customers, reports   |
| Cashier | POS, customers, their own sales, register/shift                        |

Enforced both in the API (`middleware/auth.ts` → `permit()`) and in the frontend nav/routes.
