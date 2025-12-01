// api/index.js
const path = require("path");

module.exports = async (req, res) => {
  try {
    // absolute file:// URL to the built ESM server bundle
    const serverPath = path.join(
      process.cwd(),
      "dist/meet-portfolio/server/main.mjs"
    );
    const serverModule = await import("file://" + serverPath);

    // Angular Universal server exports vary by build. Try common exports:
    const handler =
      serverModule.app || // if you exported `app`
      serverModule.default || // default export
      serverModule.handler || // other common name
      serverModule.bootstrap; // whatever your bundle exports

    if (typeof handler === "function") {
      // If it's an express-like (req, res) handler:
      return handler(req, res);
    }

    // If your server export is an object that has `app` with `handle`:
    if (handler && typeof handler.handle === "function") {
      return handler.handle(req, res);
    }

    res.statusCode = 500;
    res.end("SSR server export not found. Check what main.mjs exports.");
  } catch (err) {
    console.error(err);
    res.statusCode = 500;
    res.end("Error loading SSR bundle: " + err.message);
  }
};
