import { readFile, writeFile, access } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataFilePath = path.join(rootDir, 'src', 'app', 'data', 'travelData.ts');
const cacheFilePath = path.join(__dirname, '.translation-cache.json');

const outputFiles = {
  destinationDescriptions: path.join(rootDir, 'src', 'app', 'data', 'destinationDescriptions.i18n.ts'),
  destinationDetails: path.join(rootDir, 'src', 'app', 'data', 'destinationDetails.i18n.ts'),
  hotelsContent: path.join(rootDir, 'src', 'app', 'data', 'hotelsContent.i18n.ts'),
  rentalsContent: path.join(rootDir, 'src', 'app', 'data', 'rentalsContent.i18n.ts'),
};

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function extractSection(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  if (start === -1) return '';

  const end = endMarker ? content.indexOf(endMarker, start) : content.length;
  if (end === -1) return content.slice(start);

  return content.slice(start, end);
}

function extractQuotedList(source) {
  return [...source.matchAll(/'([^']+)'/g)].map(m => m[1]);
}

function extractDestinations(destinationsSection) {
  const destinationBlocks = [...destinationsSection.matchAll(/\{[\s\S]*?\n\s*\},/g)].map(m => m[0]);

  return destinationBlocks
    .map(block => {
      const id = (block.match(/id:\s*'([^']+)'/) || [])[1];
      const description = ((block.match(/description:\s*'([\s\S]*?)',\r?\n/) || [])[1] || '').replace(/\\'/g, "'");
      const culture = ((block.match(/culture:\s*'([\s\S]*?)',\r?\n/) || [])[1] || '').replace(/\\'/g, "'");
      const cuisine = ((block.match(/cuisine:\s*'([\s\S]*?)',\r?\n/) || [])[1] || '').replace(/\\'/g, "'");
      return { id, description, culture, cuisine };
    })
    .filter(item => item.id);
}

function extractHotelsOrRentals(section) {
  const blocks = [...section.matchAll(/\{[\s\S]*?\n\s*\},/g)].map(m => m[0]);

  return blocks
    .map(block => {
      const id = (block.match(/id:\s*'([^']+)'/) || [])[1];
      const description = ((block.match(/description:\s*'([\s\S]*?)',\r?\n/) || [])[1] || '').replace(/\\'/g, "'");
      const amenitiesRaw = (block.match(/amenities:\s*\[([\s\S]*?)\],/) || [])[1] || '';
      const amenities = extractQuotedList(amenitiesRaw);
      return { id, description, amenities };
    })
    .filter(item => item.id);
}

async function loadTranslationCache() {
  if (!(await fileExists(cacheFilePath))) return {};

  try {
    const raw = await readFile(cacheFilePath, 'utf8');
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

async function saveTranslationCache(cache) {
  await writeFile(cacheFilePath, JSON.stringify(cache, null, 2), 'utf8');
}

async function translateText(text, targetLanguage, cache) {
  const cacheKey = `${targetLanguage}::${text}`;
  if (cache[cacheKey]) return cache[cacheKey];

  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLanguage}&dt=t&q=${encodeURIComponent(text)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Translate request failed (${response.status})`);
  }

  const data = await response.json();
  const translated = (data?.[0] ?? []).map(part => part?.[0] ?? '').join('') || text;
  cache[cacheKey] = translated;
  return translated;
}

async function translateBatch(texts, targetLanguage, cache) {
  const result = {};

  for (const [key, text] of Object.entries(texts)) {
    result[key] = await translateText(text, targetLanguage, cache);
  }

  return result;
}

async function translateList(items, targetLanguage, cache) {
  const result = {};

  for (const item of items) {
    result[item] = await translateText(item, targetLanguage, cache);
  }

  return result;
}

async function run() {
  const source = await readFile(dataFilePath, 'utf8');
  const cache = await loadTranslationCache();

  const destinationsSection = extractSection(source, 'export const destinations', 'export const hotels');
  const hotelsSection = extractSection(source, 'export const hotels', 'export const rentals');
  const rentalsSection = extractSection(source, 'export const rentals', undefined);

  const destinations = extractDestinations(destinationsSection);
  const hotels = extractHotelsOrRentals(hotelsSection);
  const rentals = extractHotelsOrRentals(rentalsSection);

  const destinationDescriptionsSource = Object.fromEntries(destinations.map(d => [d.id, d.description]));
  const destinationCultureSource = Object.fromEntries(destinations.map(d => [d.id, d.culture]));
  const destinationCuisineSource = Object.fromEntries(destinations.map(d => [d.id, d.cuisine]));

  const hotelDescriptionsSource = Object.fromEntries(hotels.map(h => [h.id, h.description]));
  const rentalDescriptionsSource = Object.fromEntries(rentals.map(r => [r.id, r.description]));

  const hotelAmenities = [...new Set(hotels.flatMap(h => h.amenities))];
  const rentalAmenities = [...new Set(rentals.flatMap(r => r.amenities))];

  const roDestinationDescriptions = await translateBatch(destinationDescriptionsSource, 'ro', cache);
  const ruDestinationDescriptions = await translateBatch(destinationDescriptionsSource, 'ru', cache);

  const roDestinationCulture = await translateBatch(destinationCultureSource, 'ro', cache);
  const ruDestinationCulture = await translateBatch(destinationCultureSource, 'ru', cache);
  const roDestinationCuisine = await translateBatch(destinationCuisineSource, 'ro', cache);
  const ruDestinationCuisine = await translateBatch(destinationCuisineSource, 'ru', cache);

  const roHotelDescriptions = await translateBatch(hotelDescriptionsSource, 'ro', cache);
  const ruHotelDescriptions = await translateBatch(hotelDescriptionsSource, 'ru', cache);
  const roHotelAmenities = await translateList(hotelAmenities, 'ro', cache);
  const ruHotelAmenities = await translateList(hotelAmenities, 'ru', cache);

  const roRentalDescriptions = await translateBatch(rentalDescriptionsSource, 'ro', cache);
  const ruRentalDescriptions = await translateBatch(rentalDescriptionsSource, 'ru', cache);
  const roRentalAmenities = await translateList(rentalAmenities, 'ro', cache);
  const ruRentalAmenities = await translateList(rentalAmenities, 'ru', cache);

  const destinationDescriptionsData = {
    ro: roDestinationDescriptions,
    ru: ruDestinationDescriptions,
  };

  const destinationDetailsData = {
    ro: Object.fromEntries(destinations.map(d => [d.id, { culture: roDestinationCulture[d.id], cuisine: roDestinationCuisine[d.id] }])),
    ru: Object.fromEntries(destinations.map(d => [d.id, { culture: ruDestinationCulture[d.id], cuisine: ruDestinationCuisine[d.id] }])),
  };

  const hotelsContentData = {
    ro: { descriptions: roHotelDescriptions, amenities: roHotelAmenities },
    ru: { descriptions: ruHotelDescriptions, amenities: ruHotelAmenities },
  };

  const rentalsContentData = {
    ro: { descriptions: roRentalDescriptions, amenities: roRentalAmenities },
    ru: { descriptions: ruRentalDescriptions, amenities: ruRentalAmenities },
  };

  await writeFile(
    outputFiles.destinationDescriptions,
    `export const destinationDescriptionsI18n: Record<'ro' | 'ru', Record<string, string>> = ${JSON.stringify(destinationDescriptionsData, null, 2)};\n`,
    'utf8',
  );

  await writeFile(
    outputFiles.destinationDetails,
    `export const destinationDetailsI18n: Record<'ro' | 'ru', Record<string, { culture: string; cuisine: string }>> = ${JSON.stringify(destinationDetailsData, null, 2)};\n`,
    'utf8',
  );

  await writeFile(
    outputFiles.hotelsContent,
    `export const hotelsContentI18n: Record<'ro' | 'ru', { descriptions: Record<string, string>; amenities: Record<string, string> }> = ${JSON.stringify(hotelsContentData, null, 2)};\n`,
    'utf8',
  );

  await writeFile(
    outputFiles.rentalsContent,
    `export const rentalsContentI18n: Record<'ro' | 'ru', { descriptions: Record<string, string>; amenities: Record<string, string> }> = ${JSON.stringify(rentalsContentData, null, 2)};\n`,
    'utf8',
  );

  await saveTranslationCache(cache);
  console.log('[i18n] Synced destination/hotel/rental translation maps from travelData.ts');
}

run().catch(error => {
  console.error('[i18n] Sync failed:', error);
  process.exit(1);
});
