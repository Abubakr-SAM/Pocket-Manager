
import sharp from "sharp";

const input = "app/icon.svg";

for (const size of [192, 512]) {
  await sharp(input)
    .resize(size, size)
    .png()
    .toFile(`public/icon-${size}.png`);

  console.log(`Created icon-${size}.png`);
}
