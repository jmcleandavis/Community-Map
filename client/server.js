// server.js
import express from 'express';
import path from 'path';
// For __dirname and __filename in ESM, you need these utilities
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist'), {
  maxAge: '1y',
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      // Don't cache HTML files to ensure users always get the latest version
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    }
  }
}));

// Catch-all route to serve index.html for any unknown routes
app.get('*', (req, res) => {
  // If the request looks like a static asset (has an extension), don't serve index.html
  // This prevents the browser from receiving HTML when it expects JS/CSS, 
  // which often causes the "white page" issue.
  if (req.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|json|woff|woff2|ttf|otf)$/)) {
    return res.status(404).send('Not Found');
  }

  // Ensure index.html is not cached
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});