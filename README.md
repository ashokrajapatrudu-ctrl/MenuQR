# Amigos Menu-Only QR Website

A complete, mobile-first restaurant menu for customers who scan a QR code at the table.

## Included

- All **427 dishes** and **527 portions/variants** from the supplied Amigos menu workbook
- **35 categories**
- Dine-in prices only
- No delivery price, takeaway price, cart, checkout, login or ordering flow
- Search across the full menu
- Vegetarian, egg, non-vegetarian and under-₹199 filters
- Mobile category drawer and expandable category sections
- One lightweight local WebP illustration for every product
- Responsive phone, tablet and desktop layouts
- Offline-friendly service worker after the first successful visit
- No external framework, image CDN or web-font dependency

## Product images

The workbook did not include exact product photography. To avoid blank cards or unrelated internet photos, this package contains consistent **illustrative visuals** for all dishes.

For exact restaurant photography, replace the corresponding file while keeping the same filename:

`assets/menu/<dish-id>.webp`

Recommended production photos:

- 4:3 aspect ratio
- 1200 × 900 pixels or larger
- WebP or AVIF
- ideally below 180 KB per image

`image-manifest.csv` and `image-manifest.json` map each dish to its image filename.

## Preview locally

Run this command inside the folder:

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

Opening `index.html` directly also works for normal browsing, but offline caching requires HTTP or HTTPS.

## Publish and create the QR code

Upload the complete folder to Netlify, Vercel, Cloudflare Pages, GitHub Pages or your existing hosting. Connect a permanent URL such as:

`menu.yourrestaurant.com`

Create and print the QR code only after the permanent URL works. You can later update dishes, prices and photos without changing the printed QR code.

## Details to verify before launch

Edit the `meta` object near the beginning of `menu-data.js` and confirm:

- restaurant name
- IIT Kharagpur location text
- opening hours
- all prices and portion labels
- dietary classifications
- current item availability

Two Veg Arabian Mandi portions did not have credible confirmed dine-in prices in the source data, so the website displays **Ask staff** rather than publishing an implausible value.
