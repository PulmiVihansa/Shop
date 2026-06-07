const fs = require('fs');
const path = require('path');
const prisma = require('../config/prisma');
const { productUploadsDir } = require('../middleware/productImageUpload');

const mimeExtensions = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
};

const parseDataImage = (value) => {
  const match = String(value || '').match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return null;
  const [, mime, base64] = match;
  return {
    mime,
    extension: mimeExtensions[mime] || 'jpg',
    buffer: Buffer.from(base64, 'base64'),
  };
};

const migrate = async () => {
  fs.mkdirSync(productUploadsDir, { recursive: true });
  const products = await prisma.product.findMany({
    select: { id: true, name: true, images: true },
  });

  let converted = 0;
  let updated = 0;
  const needsReupload = [];

  for (const product of products) {
    const nextImages = [];
    let changed = false;

    for (let index = 0; index < (product.images || []).length; index += 1) {
      const image = product.images[index];
      const parsed = parseDataImage(image);
      if (!parsed) {
        nextImages.push(image);
        continue;
      }

      try {
        const filename = `product-${product.id}-${index}-${Date.now()}.${parsed.extension}`;
        const filePath = path.join(productUploadsDir, filename);
        await fs.promises.writeFile(filePath, parsed.buffer);
        nextImages.push(`/uploads/products/${filename}`);
        converted += 1;
        changed = true;
      } catch (error) {
        changed = true;
        needsReupload.push({ id: product.id, name: product.name, imageIndex: index, error: error.message });
      }
    }

    if (changed) {
      await prisma.product.update({
        where: { id: product.id },
        data: { images: nextImages.filter(Boolean) },
      });
      updated += 1;
    }
  }

  console.log('[product-images:migrate] complete', {
    productsScanned: products.length,
    productsUpdated: updated,
    imagesConverted: converted,
    needsReupload,
  });
};

migrate()
  .catch((error) => {
    console.error('[product-images:migrate] failed', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
