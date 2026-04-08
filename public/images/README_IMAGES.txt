Images structure conventions

General rule
- All images under this folder are served from `/images/...`.
- Keep file names numeric (`1.jpg`, `2.jpg`, `3.jpg`, `4.jpg`) to match data references.

Hotels
- Folder format: `/images/hotels/hX/`
- Example: `/images/hotels/h25/1.jpg`

Rentals
- Folder format: `/images/rentals/rX/`
- Example: `/images/rentals/r25/1.jpg`
- Add images exactly like hotels: `1.jpg`, `2.jpg`, `3.jpg`, `4.jpg` (or more, if referenced in data)

Important
- If you add a new rental entry in travel data with `rX`, make sure folder `public/images/rentals/rX/` exists.
- The app reads image paths from `src/app/data/travelData.ts`.

