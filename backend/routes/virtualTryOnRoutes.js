const crypto = require('crypto');
const express = require('express');

const router = express.Router();

const CACHE_LIMIT = 25;
const ENGINE_TIMEOUT_MS = 120000;
const generatedCache = new Map();

function isDataImage(value) {
  return typeof value === 'string' && /^data:image\/(jpeg|jpg|png|webp);base64,/i.test(value);
}

function getCacheKey(personImage, garmentImage, engineModel) {
  return crypto
    .createHash('sha256')
    .update(engineModel || 'catvton')
    .update('|')
    .update(personImage)
    .update('|')
    .update(garmentImage)
    .digest('hex');
}

function cacheSet(key, value) {
  if (generatedCache.size >= CACHE_LIMIT) {
    const oldestKey = generatedCache.keys().next().value;
    generatedCache.delete(oldestKey);
  }
  generatedCache.set(key, value);
}

function pickResultImage(payload) {
  const candidates = [
    payload?.resultImage,
    payload?.result_image,
    payload?.image,
    payload?.imageUrl,
    payload?.image_url,
    payload?.output,
    payload?.output?.[0],
    payload?.data?.resultImage,
    payload?.data?.result_image,
    payload?.data?.image,
    payload?.data?.imageUrl,
    payload?.data?.image_url,
    payload?.data?.output,
    payload?.data?.output?.[0],
    payload?.data?.[0],
  ].filter(Boolean);

  const direct = candidates.find((value) => typeof value === 'string');
  if (direct) return direct;

  const objectValue = candidates.find((value) => value && typeof value === 'object');
  return objectValue?.url || objectValue?.image || objectValue?.path || '';
}

function validatePersonMeta(meta) {
  if (!meta || typeof meta !== 'object') return '';

  const width = Number(meta.width || 0);
  const height = Number(meta.height || 0);
  if (width && height && (width < 512 || height < 512)) {
    return 'Upload a higher quality full-body photo. Minimum recommended size is 512px wide and 512px tall.';
  }

  if (width && height && height / width < 0.75) {
    return 'Upload a portrait or full-body image where the upper body is clearly visible.';
  }

  return '';
}

async function parseEngineResponse(response) {
  const contentType = response.headers.get('content-type') || '';

  if (contentType.includes('image/')) {
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:${contentType.split(';')[0]};base64,${base64}`;
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'The virtual try-on engine could not generate this image.');
  }

  const resultImage = pickResultImage(payload);
  if (!resultImage) {
    throw new Error('The virtual try-on engine did not return a generated image.');
  }

  return resultImage;
}

async function callVirtualTryOnEngine({ personImage, garmentImage, productName, size }) {
  const endpoint = process.env.VTON_ENGINE_ENDPOINT;
  const engineModel = process.env.VTON_ENGINE_MODEL || 'catvton';

  if (!endpoint) {
    const error = new Error(
      'Real virtual try-on engine is not connected. Start an IDM-VTON or CatVTON service and set VTON_ENGINE_ENDPOINT in backend/.env.',
    );
    error.status = 503;
    throw error;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ENGINE_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        personImage,
        garmentImage,
        model_image: personImage,
        garment_image: garmentImage,
        human_image: personImage,
        cloth_image: garmentImage,
        category: 'upper_body',
        garmentType: 'upper_body',
        model: engineModel,
        productName,
        size,
      }),
    });

    return await parseEngineResponse(response);
  } catch (error) {
    if (error.name === 'AbortError') {
      const timeoutError = new Error('The virtual try-on engine took too long. Please try again with a smaller image.');
      timeoutError.status = 504;
      throw timeoutError;
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

router.post('/', async (req, res) => {
  const {
    personImage,
    garmentImage,
    humanMeta,
    productName = 'Astravia Tee',
    size = '',
    bypassCache = false,
  } = req.body || {};

  if (!isDataImage(personImage)) {
    return res.status(400).json({ message: 'Upload a valid JPG, PNG, or WEBP full-body photo.' });
  }

  if (!isDataImage(garmentImage)) {
    return res.status(400).json({ message: 'The selected Astravia tee image could not be loaded.' });
  }

  const metaError = validatePersonMeta(humanMeta);
  if (metaError) {
    return res.status(400).json({ message: metaError });
  }

  const cacheKey = getCacheKey(personImage, garmentImage, process.env.VTON_ENGINE_MODEL);
  if (!bypassCache && generatedCache.has(cacheKey)) {
    return res.json({ resultImage: generatedCache.get(cacheKey), cached: true });
  }

  try {
    const resultImage = await callVirtualTryOnEngine({ personImage, garmentImage, productName, size });
    cacheSet(cacheKey, resultImage);
    return res.json({ resultImage, cached: false });
  } catch (error) {
    const status = error.status && error.status >= 400 && error.status < 600 ? error.status : 502;
    return res.status(status).json({
      message: error.message || 'Astravia AI could not generate this try-on.',
    });
  }
});

module.exports = router;
