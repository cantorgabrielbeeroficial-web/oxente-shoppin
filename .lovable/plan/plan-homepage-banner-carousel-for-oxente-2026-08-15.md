# Plan: Homepage Banner Carousel for Oxente

The goal is to replace the static hero banner on the homepage with a modern, fluid product slider (carousel) that showcases representative Northeastern products with a regional tone and identity.

## Proposed Changes

### Database & Content

- No database changes needed; the carousel will initially use high-quality mock data for featured products (hammock, leather hat, ceramics) that link to real categories/search.

### Components

- **`src/components/banner-carousel.tsx`**: Create a new component using `embla-carousel-react` (via `src/components/ui/carousel.tsx`) and `autoplay`.
  - Auto-transition every 4 seconds.
  - Split layout: Text/Price/CTA on the left, Image on the right.
  - Pagination dots and discrete side arrows.
  - Fully responsive design (stacked on mobile).

### Styling

- Use the existing "Oxente" brand colors (terracota/orange) for buttons and prices.
- Apply a soft shadow/background to the product images for depth.

### Copy & Tone

- Northeast Brazilian regional tone: "Arroxa o nó e comprar", "O melhor do artesanato... direto do sertão".

### Integration

- **`src/routes/index.tsx`**: Replace the static `<section>` with the new `<BannerCarousel />`.

## Technical Details

- **Autoplay**: Will use `embla-carousel-autoplay`.
- **Responsive**: `grid-cols-1 md:grid-cols-2` for the split layout.
- **Framing**: High-quality imagery (placeholders or generated) representing:
  - "Chapéu de Couro Arretado"
  - "Rede de Descanso Sertaneja"
  - "Cerâmica do Vale"
