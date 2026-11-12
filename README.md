<<<<<<< HEAD
# Chhath Puja Samiti

A responsive React + TypeScript website with:
- Home screen with Generate Your Badge and Donate actions
- Client-side badge generation from a fixed template
- PNG and PDF download
- UPI intent link and QR code
- No login, database, or photo upload server

## Before publishing

1. Open `src/config.ts`.
2. Replace `YOUR_UPI_ID@BANK` with the Samiti's verified UPI ID.
3. Set the correct payee name.
4. Replace `public/templates/badge-template.svg` with the final approved badge template.
5. Adjust the `photo` and `name` percentage coordinates in `src/config.ts` to match the final template.

The included SVG is only a sample template. It is not the Samiti's final artwork.

## Run locally

Requires a supported Node.js version (Node.js 18+ recommended for this Vite 5 project).

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

The production files are generated in `dist/`.

## Deploy on Vercel

1. Push this project to a GitHub repository.
2. Sign in at https://vercel.com/.
3. Select **Add New → Project** and import the repository.
4. Keep the build command as `npm run build`.
5. Keep the output directory as `dist`.
6. Click Deploy.

Vercel will provide a public HTTPS URL. You can later connect a custom domain.

## UPI behavior and limitations

- The QR code encodes a UPI payment URI with no amount parameter.
- Mobile browsers may offer/open compatible UPI apps, but exact behavior depends on OS, browser and installed apps.
- Desktop users can scan the QR using a UPI app on their phone.
- This is a payment hand-off only. It does not verify whether a donation succeeded.
- Do not show a “payment successful” message unless payment status is verified through a payment provider or bank integration.

## Privacy

Photographs are processed locally in the visitor's browser and are not sent to a backend. The site does not collect UPI PINs or bank credentials.
=======
# chhath-puja
>>>>>>> 5fb53f0f2f1eca050ab025b8cec36628a45d2cff
