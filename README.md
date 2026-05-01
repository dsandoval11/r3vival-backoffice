# R3vival Backoffice

Internal desktop-first admin panel for managing second-hand clothing inventory and catalog data.

## Tech stack

- Next.js (App Router) + TypeScript
- Supabase (database + storage)
- TailwindCSS

## Required environment variables

Create `.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Optional (defaults to `product-images`):

```bash
NEXT_PUBLIC_SUPABASE_PRODUCT_IMAGES_BUCKET=product-images
```

## Run locally

```bash
pnpm install
pnpm dev
```

Open http://localhost:3000 (redirects to `/products`).

Before using the backoffice, log in at `/login` with your email and password (Supabase Auth).

## Implemented modules

- Products (full CRUD)
  - name, price, brand, subcategory, color, condition
  - catalog visibility toggle (`catalog` table sync)
  - image upload/delete/cover selection (`product_images` + Supabase Storage)
- Brands (CRUD)
- Categories (CRUD)
- Subcategories (CRUD, with required category)
- Colors (CRUD)
- Conditions (CRUD)

## Project structure

```text
app/
  products/
  brands/
  categories/
  subcategories/
  colors/
  conditions/
components/
  layout/
  products/
  crud/
  ui/
lib/
  supabase/
  services/
  utils/
```

## Notes

- This tool uses the Supabase anon key on the frontend.
- Most CRUD routes require an authenticated Supabase session (`auth.uid()` present) to satisfy RLS policies.
- Ensure your Supabase RLS policies allow the required CRUD/storage operations for local admin usage.
