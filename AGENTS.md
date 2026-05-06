# R3vival Backoffice – Agent Instructions

## Your Role
You are responsible for building and maintaining an internal backoffice tool for R3vival.

Focus on simplicity, speed, and usability.

---

## Environment Setup

- Use Supabase JS client
- Connect to remote Supabase project
- Use environment variables:
  - NEXT_PUBLIC_SUPABASE_URL
  - NEXT_PUBLIC_SUPABASE_ANON_KEY

---

## Core Development Rules

1. DO NOT over-engineer
2. Prefer simple CRUD operations
3. Keep components reusable but not abstracted too early
4. Optimize for speed of development and usability
5. Avoid unnecessary state management libraries unless needed

---

## Data Handling

- Always validate required fields before insert/update
- Use foreign keys properly:
  - product → subcategory_id
  - subcategory → category_id
- Ensure referential integrity in UI (dropdowns, selectors)

---

## UI Guidelines

- Use simple layouts (tables + forms)
- Each module should have:
  - List view
  - Create form
  - Edit form

### Example Modules

#### Products Module
- Table with:
  - name
  - brand
  - subcategory
  - price
  - visible (catalog)
- Actions:
  - edit
  - delete

#### Product Form
- Inputs:
  - name
  - price
  - brand (select)
  - subcategory (select)
  - color (select)
  - condition (select)
- Image uploader
- Cover image selector
- Toggle "visible in catalog"

---

## Images Handling

- Upload images to Cloudinary via signed upload (`/api/cloudinary/sign`)
- Save `secure_url` as `image_url` and `public_id` as `cloudinary_public_id` in `product_images`
- Delete assets via `/api/cloudinary/delete` (server-side, needs secret)
- Legacy rows without `cloudinary_public_id` are on Supabase Storage — both delete paths are supported
- Ensure:
  - Only one `is_cover = true` per product
- Allow reordering (optional but valuable)

---

## Catalog Logic

- Toggle visibility:
  - If visible → insert/update in `catalog`
  - If not → remove or mark inactive

---

## Error Handling

- Show simple error messages
- Log errors in console for debugging
- Avoid blocking UX with complex validation

---

## Performance

- Use pagination or limit queries if needed
- Avoid fetching unnecessary relations
- Use indexed columns when possible

---

## Future Improvements (Optional)

- Bulk product upload (CSV)
- Bulk image upload
- Inline editing in tables
- Search & filters

---

## Security Considerations

Since this is a local tool:
- Basic protection is acceptable
- Avoid exposing service role key in frontend
- Prefer anon key with proper RLS if possible

---

## Definition of Done

A feature is complete when:
- It works end-to-end with Supabase
- UI is usable without confusion
- Errors are handled gracefully
- Data integrity is preserved

---

## Mindset

Build fast.
Keep it simple.
Make it practical for daily use.
