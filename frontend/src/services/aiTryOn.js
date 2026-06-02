import api, { getErrorMessage } from './api.js';

const MAX_UPLOAD_DIMENSION = 1600;
const UPLOAD_QUALITY = 0.84;

function createTryOnError(message) {
  return new Error(message);
}

function readBlobAsDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(createTryOnError('We could not read that image. Please try another photo.'));
    reader.readAsDataURL(blob);
  });
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(createTryOnError('We could not process that image. Please upload a clear JPG, PNG, or WEBP photo.'));
    };
    image.src = url;
  });
}

function validateTryOnPhoto(image) {
  const width = image.naturalWidth;
  const height = image.naturalHeight;

  if (width < 512 || height < 512) {
    throw createTryOnError('Upload a higher quality full-body photo. Minimum recommended size is 512px wide and 512px tall.');
  }

  if (height / width < 0.75) {
    throw createTryOnError('Upload a portrait or full-body photo where your upper body is clearly visible.');
  }
}

export async function compressTryOnImage(file) {
  if (!file) {
    throw createTryOnError('Upload a full-body photo first.');
  }

  const supportedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!supportedTypes.includes(file.type)) {
    throw createTryOnError('Please upload a JPG, JPEG, PNG, or WEBP image.');
  }

  const image = await loadImageFromBlob(file);
  validateTryOnPhoto(image);

  const scale = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { alpha: false });
  context.fillStyle = '#050505';
  context.fillRect(0, 0, width, height);
  context.drawImage(image, 0, 0, width, height);

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(createTryOnError('Image compression failed. Please try again.'));
      },
      'image/jpeg',
      UPLOAD_QUALITY,
    );
  });

  const compressedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
  return {
    file: compressedFile,
    meta: { width, height },
    dataUrl: await readBlobAsDataUrl(compressedFile),
  };
}

async function fetchProductImageDataUrl(productImageUrl) {
  const response = await fetch(productImageUrl);
  if (!response.ok) {
    throw createTryOnError('We could not load the selected Astravia tee. Please choose another tee.');
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw createTryOnError('The selected Astravia tee image is invalid.');
  }

  return readBlobAsDataUrl(blob);
}

export async function generateVirtualTryOn({
  userImageDataUrl,
  productImageUrl,
  productName,
  size,
  humanMeta,
  bypassCache = false,
}) {
  if (!userImageDataUrl) {
    throw createTryOnError('Upload a full-body photo first.');
  }

  const garmentImage = await fetchProductImageDataUrl(productImageUrl);

  try {
    const response = await api.post(
      '/virtual-tryon',
      {
        personImage: userImageDataUrl,
        garmentImage,
        productName: productName || 'Astravia Tee',
        size: size || '',
        humanMeta,
        bypassCache,
      },
      { timeout: 120000 },
    );

    const resultImage = response.data?.resultImage;
    if (!resultImage) {
      throw createTryOnError('The AI response did not include a try-on image.');
    }

    return { imageUrl: resultImage, cached: Boolean(response.data?.cached) };
  } catch (error) {
    throw createTryOnError(getErrorMessage(error) || 'Astravia AI could not generate your try-on. Please try again.');
  }
}
