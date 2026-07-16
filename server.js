const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "src", "renderer");
const port = 4173;
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8"
};

http.createServer((request, response) => {
  const cleanUrl = decodeURIComponent(request.url.split("?")[0]);
  const route = cleanUrl === "/" ? "/index.html" : cleanUrl;
  const file = path.normalize(path.join(root, route));

  if (!file.startsWith(root)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(file, (error, data) => {
    if (error) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }

    response.writeHead(200, {
      "Content-Type": types[path.extname(file)] || "application/octet-stream"
    });
    response.end(data);
  });
}).listen(port, "127.0.0.1", () => {
  console.log(`Focus Tomato disponible en http://127.0.0.1:${port}`);
});
