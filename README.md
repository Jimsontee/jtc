# JTC storefront

This folder is the shop interface. The running site is the backend, which serves the same pages from `jtc-backend/public`.

```bash
cd ../../jtc-backend/jtc-backend
npm install
npm start
```

Then open http://localhost:3000

The backend serves this folder directly. Courtesy codes at checkout: ATELIER10, GROOM15, IBADAN.

- `index.html` shop
- `admin.html` studio desk
- `pay.html` demo cashier (only used when Paystack is not configured)
- `app.js` catalogue, bag, checkout, tracking
- `styles.css` visual system

Edit products in the backend `catalog.json`. Photos: `assets/PHOTO-GUIDE.txt`.
