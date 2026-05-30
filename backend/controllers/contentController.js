const prisma = require('../config/prisma');
const { store, createId } = require('../data/memoryStore');
const { withId } = require('../utils/dbFormat');

const homepageFields = [
  'heroTitle',
  'heroSubtitle',
  'heroImage',
  'heroImageSecondary',
  'buttonText',
  'buttonLink',
  'section2Title',
  'section2Image',
  'productOneImage',
  'productTwoImage',
  'productThreeImage',
  'featuredCategories',
];

const homePageDefaults = {
  heroLabel: 'Spring / Summer 2026',
  primaryImageLabel: 'Featured Editorial',
  secondaryImageLabel: 'Boo Thing',
  sectionSubtitle: 'New Arrivals',
  productOneName: 'Structured Linen Blazer',
  productOnePrice: 'LKR385',
  productOneImageLabel: 'Linen Blazer',
  productTwoName: 'Flowing Silk Midi',
  productTwoPrice: 'LKR450',
  productTwoImageLabel: 'Silk Dress',
  productThreeName: 'Relaxed Cotton Shirt',
  productThreePrice: 'LKR195',
  productThreeImageLabel: 'Cotton Shirt',
  principlesLabel: 'Our Principles',
  principlesTitle: 'Built on three commitments',
  marqueeOne: 'Handcrafted in small batches',
  marqueeTwo: 'Natural fibres only',
  marqueeThree: 'Zero-waste pattern cutting',
  marqueeFour: 'Made to last a lifetime',
  marqueeFive: 'Spring & Summer 2026',
  marqueeSix: 'Atelier Collection',
  pillarOneIndex: '01 - Sustainability',
  pillarOneTitle: 'Sustainable\nFashion',
  pillarOneBody:
    'We use eco-friendly materials and ethical production methods throughout every stage of our supply chain. From certified organic cotton to post-consumer recycled fibres, every piece is designed to minimise its footprint on the planet without compromising on quality.',
  pillarOneLink: 'Learn more',
  pillarTwoIndex: '02 - Craftsmanship',
  pillarTwoTitle: 'Artisan\nCraftsmanship',
  pillarTwoBody:
    'Each garment is handcrafted by skilled artisans who bring decades of experience to every stitch. We celebrate slow fashion - the kind that takes time, care, and an eye for detail that no machine can replicate. Quality is not a finish; it is the foundation.',
  pillarTwoLink: 'Meet our makers',
  pillarThreeIndex: '03 - Design',
  pillarThreeTitle: 'Timeless\nDesign',
  pillarThreeBody:
    'We create pieces that transcend seasons and resist trends. Our silhouettes are drawn to be worn, loved, and cherished for years - then handed on. A wardrobe built on intention rather than impulse is the most sustainable wardrobe of all.',
  pillarThreeLink: 'View collection',
  processOneIndex: '01 - Concept',
  processOneTitle: 'Sketch &\nDrape',
  processOneNote: 'Each silhouette begins on a live form, never a screen.',
  processTwoIndex: '02 - Source',
  processTwoTitle: 'Fabric\nSelection',
  processTwoNote: 'We visit mills in person. No catalogues. No shortcuts.',
  processThreeIndex: '03 - Cut',
  processThreeTitle: 'Hand\nTailoring',
  processThreeNote: 'Two tailors per garment. One for the body, one for the finish.',
  processFourIndex: '04 - Inspect',
  processFourTitle: '48-Hour\nQuality Hold',
  processFourNote: 'Every piece rests before it ships. Tension reveals truth.',
  processFiveIndex: '05 - Yours',
  processFiveTitle: 'Delivered\n& Registered',
  processFiveNote: 'Paired with a digital repair passport, valid for life.',
  processBackground: 'PROCESS',
};

const homepageDefaults = {
  heroTitle: 'Timeless\nElegance,\nRedefined',
  heroSubtitle:
    'Discover our curated collection of contemporary pieces that blend minimalist design with artisanal craftsmanship. Each garment tells a story of conscious creation and enduring style.',
  heroImage: '',
  heroImageSecondary: '',
  buttonText: 'Explore Collection',
  buttonLink: '#collections',
  section2Title: 'Essential Pieces',
  section2Image: '',
  productOneImage: '',
  productTwoImage: '',
  productThreeImage: '',
  featuredCategories: ['New Arrivals', 'Men', 'Accessories'],
};

const pickHomepageData = (body = {}) =>
  homepageFields.reduce((data, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) data[field] = body[field];
    return data;
  }, {});

const pickPageData = (body = {}) =>
  Object.keys(homePageDefaults).reduce((data, field) => {
    if (Object.prototype.hasOwnProperty.call(body, field)) data[field] = body[field];
    return data;
  }, {});

const parseJsonContent = (content) => {
  if (!content) return {};
  if (typeof content === 'object') return content;
  try {
    const parsed = JSON.parse(content);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const fillMissingHomepageDefaults = (content = {}) =>
  Object.entries(homepageDefaults).reduce((data, [key, value]) => {
    const current = content[key];
    const isEmptyArray = Array.isArray(current) && current.length === 0;
    data[key] = current === '' || current === undefined || current === null || isEmptyArray ? value : current;
    return data;
  }, {});

const hydrateHomepageContent = async (content) => {
  const hydrated = fillMissingHomepageDefaults(content);
  if (!content?.id) return hydrated;

  const needsUpdate = homepageFields.some((field) => {
    const current = content[field];
    return current === '' || current === undefined || current === null || (Array.isArray(current) && current.length === 0);
  });

  if (!needsUpdate) return content;
  return prisma.homepageContent.update({ where: { id: content.id }, data: hydrated });
};

const getHomepageContent = async (req, res) => {
  try {
    if (global.useMemoryStore) return res.json(store.homepageContent);
    const existing = await prisma.homepageContent.findFirst();
    const content = existing
      ? await hydrateHomepageContent(existing)
      : await prisma.homepageContent.create({ data: homepageDefaults });
    res.json(withId(content));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch homepage content', error: error.message });
  }
};

const updateHomepageContent = async (req, res) => {
  try {
    const data = pickHomepageData(req.body);
    if (global.useMemoryStore) {
      store.homepageContent = { ...store.homepageContent, ...data, updatedAt: new Date() };
      return res.json(store.homepageContent);
    }
    const existing = await prisma.homepageContent.findFirst();
    const content = existing
      ? await prisma.homepageContent.update({ where: { id: existing.id }, data })
      : await prisma.homepageContent.create({ data });
    res.json(withId(content));
  } catch (error) {
    res.status(400).json({ message: 'Failed to update homepage content', error: error.message });
  }
};

const getCmsContent = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const page = store.pageContents.find((item) => item.pageName === 'home');
      return res.json({
        ...homepageDefaults,
        ...store.homepageContent,
        ...homePageDefaults,
        ...parseJsonContent(page?.content),
      });
    }

    const existingHomepage = await prisma.homepageContent.findFirst();
    const homepage = existingHomepage
      ? await hydrateHomepageContent(existingHomepage)
      : await prisma.homepageContent.create({ data: homepageDefaults });
    const page = await prisma.pageContent.upsert({
      where: { pageName: 'home' },
      update: {},
      create: { pageName: 'home', content: JSON.stringify(homePageDefaults, null, 2) },
    });

    res.json({
      ...homepageDefaults,
      ...withId(homepage),
      ...homePageDefaults,
      ...parseJsonContent(page.content),
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch CMS content', error: error.message });
  }
};

const updateCmsContent = async (req, res) => {
  try {
    const homepageData = pickHomepageData(req.body);
    const pageData = pickPageData(req.body);

    if (global.useMemoryStore) {
      store.homepageContent = { ...store.homepageContent, ...homepageData, updatedAt: new Date() };
      const existing = store.pageContents.find((item) => item.pageName === 'home');
      const content = JSON.stringify({ ...homePageDefaults, ...parseJsonContent(existing?.content), ...pageData }, null, 2);
      if (existing) {
        existing.content = content;
        existing.updatedAt = new Date();
      } else {
        store.pageContents.push({ _id: createId(), pageName: 'home', content, createdAt: new Date(), updatedAt: new Date() });
      }
      return res.json({ ...store.homepageContent, ...parseJsonContent(content) });
    }

    const existingHomepage = await prisma.homepageContent.findFirst();
    const homepage = existingHomepage
      ? await prisma.homepageContent.update({ where: { id: existingHomepage.id }, data: homepageData })
      : await prisma.homepageContent.create({ data: { ...homepageDefaults, ...homepageData } });

    const existingPage = await prisma.pageContent.findUnique({ where: { pageName: 'home' } });
    const nextPageContent = {
      ...homePageDefaults,
      ...parseJsonContent(existingPage?.content),
      ...pageData,
    };
    await prisma.pageContent.upsert({
      where: { pageName: 'home' },
      update: { content: JSON.stringify(nextPageContent, null, 2) },
      create: { pageName: 'home', content: JSON.stringify(nextPageContent, null, 2) },
    });

    res.json({
      ...homepageDefaults,
      ...withId(homepage),
      ...nextPageContent,
    });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update CMS content', error: error.message });
  }
};

const getBanners = async (req, res) => {
  try {
    if (global.useMemoryStore) return res.json(store.banners);
    const banners = await prisma.banner.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(banners.map(withId));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch banners', error: error.message });
  }
};

const createBanner = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const banner = { _id: createId(), isActive: true, ...req.body, createdAt: new Date(), updatedAt: new Date() };
      store.banners.unshift(banner);
      return res.status(201).json(banner);
    }
    const banner = await prisma.banner.create({ data: req.body });
    res.status(201).json(withId(banner));
  } catch (error) {
    res.status(400).json({ message: 'Failed to create banner', error: error.message });
  }
};

const updateBanner = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const index = store.banners.findIndex((banner) => banner._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Banner not found' });
      store.banners[index] = { ...store.banners[index], ...req.body, updatedAt: new Date() };
      return res.json(store.banners[index]);
    }
    const existing = await prisma.banner.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ message: 'Banner not found' });
    const banner = await prisma.banner.update({ where: { id: req.params.id }, data: req.body });
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    res.json(withId(banner));
  } catch (error) {
    res.status(400).json({ message: 'Failed to update banner', error: error.message });
  }
};

const deleteBanner = async (req, res) => {
  try {
    if (global.useMemoryStore) {
      const index = store.banners.findIndex((banner) => banner._id === req.params.id);
      if (index === -1) return res.status(404).json({ message: 'Banner not found' });
      store.banners.splice(index, 1);
      return res.json({ message: 'Banner deleted' });
    }
    const banner = await prisma.banner.findUnique({ where: { id: req.params.id } });
    if (!banner) return res.status(404).json({ message: 'Banner not found' });
    await prisma.banner.delete({ where: { id: req.params.id } });
    res.json({ message: 'Banner deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete banner', error: error.message });
  }
};

const getPageContent = async (req, res) => {
  try {
    const pageName = req.params.pageName;
    if (global.useMemoryStore) {
      return res.json(store.pageContents.find((page) => page.pageName === pageName) || { pageName, content: '' });
    }
    const page = await prisma.pageContent.upsert({
      where: { pageName },
      update: {},
      create: { pageName }
    });
    res.json(withId(page));
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch page content', error: error.message });
  }
};

const updatePageContent = async (req, res) => {
  try {
    const pageName = req.params.pageName;
    if (global.useMemoryStore) {
      const existing = store.pageContents.find((page) => page.pageName === pageName);
      if (existing) {
        existing.content = req.body.content || '';
        existing.updatedAt = new Date();
        return res.json(existing);
      }
      const page = { _id: createId(), pageName, content: req.body.content || '', createdAt: new Date(), updatedAt: new Date() };
      store.pageContents.push(page);
      return res.json(page);
    }
    const page = await prisma.pageContent.upsert({
      where: { pageName },
      update: { content: req.body.content || '' },
      create: { pageName, content: req.body.content || '' }
    });
    res.json(withId(page));
  } catch (error) {
    res.status(400).json({ message: 'Failed to update page content', error: error.message });
  }
};

const uploadToCloudinary = async (image) => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

  if (!cloudName || !uploadPreset || typeof fetch !== 'function') return null;

  const formData = new FormData();
  formData.append('file', image);
  formData.append('upload_preset', uploadPreset);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Cloudinary upload failed: ${details}`);
  }

  const payload = await response.json();
  return payload.secure_url || payload.url;
};

const uploadImage = async (req, res) => {
  const { image, imageUrl } = req.body;
  if (!image && !imageUrl) {
    return res.status(400).json({ message: 'Image file or URL is required' });
  }
  try {
    const cloudinaryUrl = image ? await uploadToCloudinary(image) : null;
    res.json({ url: cloudinaryUrl || imageUrl || image });
  } catch (error) {
    res.status(400).json({ message: 'Failed to upload image', error: error.message });
  }
};

module.exports = {
  getHomepageContent,
  updateHomepageContent,
  getCmsContent,
  updateCmsContent,
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
  getPageContent,
  updatePageContent,
  uploadImage
};
