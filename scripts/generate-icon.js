const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// Genera un ícono de tomate rojo como PNG 256x256 e ICO
const size = 256;
const outDir = path.join(__dirname, "..", "assets", "icons");
fs.mkdirSync(outDir, { recursive: true });

// Crear un SVG de tomate simple
const tomatoSvg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  <!-- Fondo -->
  <rect width="256" height="256" fill="transparent"/>

  <!-- Tomate rojo (círculo principal) -->
  <circle cx="128" cy="140" r="100" fill="#E63946" stroke="#C1121F" stroke-width="2"/>

  <!-- Brillo del tomate -->
  <ellipse cx="100" cy="100" rx="35" ry="45" fill="#FF6B6B" opacity="0.6"/>

  <!-- Hoja verde -->
  <path d="M 128 35 Q 145 30 155 45 Q 160 55 150 65 Q 140 55 128 52 Z" fill="#2A9D8F" stroke="#1B5E50" stroke-width="1.5"/>

  <!-- Tallo -->
  <rect x="124" y="50" width="8" height="25" fill="#6B4423"/>

  <!-- Sombra sutil -->
  <circle cx="128" cy="140" r="100" fill="#000000" opacity="0.1" filter="blur(8)"/>
</svg>
`;

async function generateIcon() {
  try {
    const pngPath = path.join(outDir, "tomato-icon.png");

    // Generar PNG desde SVG
    await sharp(Buffer.from(tomatoSvg))
      .png()
      .toFile(pngPath);

    console.log(`✓ Ícono PNG generado: ${pngPath}`);

    // Generar también versiones más pequeñas para Electron
    for (const s of [128, 64, 32]) {
      const smallPath = path.join(outDir, `tomato-icon-${s}.png`);
      await sharp(pngPath)
        .resize(s, s)
        .toFile(smallPath);
      console.log(`✓ Variante ${s}x${s} generada`);
    }
  } catch (err) {
    console.error("Error generando ícono:", err.message);
    process.exit(1);
  }
}

generateIcon();
