# R3vival Backoffice – Claude Context

## Overview
This project is an internal backoffice for managing the R3vival second-hand clothing store.

It is NOT a public-facing application. It will run locally but connects to a remote Supabase database.

The purpose of this tool is to simplify and speed up product management and catalog operations.

## Core Features
The backoffice must support:

- Product management
- Brand management
- Category management
- Subcategory management
- Color management
- Condition management
- Measurements management
- Product images management
- Catalog visibility control

## Database
The system uses Supabase (PostgreSQL) as the backend.

### Main Tables
- products
- brands
- categories
- subcategories
- colors
- conditions
- measurements
- product_images
- catalog

### Important Notes
- `products` references `subcategories` (NOT categories directly)
- `product_images` contains multiple images per product
- `catalog` controls whether a product is visible to customers

## Usage Context
- Used only by the store owner/admin
- No need for complex authentication (can use a simple Supabase session or even service role locally if safe)
- Performance and simplicity are more important than scalability

## UX Principles
- Fast and minimal clicks
- Bulk actions where possible
- Clean and simple UI
- Optimized for desktop use

## Functional Requirements

### Products
- Create, edit, delete products
- Assign:
  - brand
  - subcategory
  - color
  - condition
  - measurements
- Upload multiple images
- Select a cover image
- Toggle catalog visibility

### Brands / Categories / Subcategories
- Full CRUD
- Prevent duplicates
- Subcategories must belong to a category

### Images
- Multiple images per product
- One must be marked as `is_cover = true`

### Catalog
- Toggle product visibility
- Only visible products should appear in storefront

## Non-Goals
- No payment integration
- No customer-facing features
- No SEO considerations
- No complex role system

## Tech Stack (Suggested)
- Frontend: Next.js
- Backend: Supabase
- Hosting: Local environment (no deployment required)

## Design Philosophy
- Keep it simple
- Avoid over-engineering
- Prioritize speed of use over aesthetics
