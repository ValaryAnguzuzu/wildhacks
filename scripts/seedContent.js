/**
 * Seeds Firestore `content/lessons/items` from `src/content/lessons.json` (skip existing docs).
 * Run: GOOGLE_APPLICATION_CREDENTIALS=... node scripts/seedContent.js
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.warn(
    'Warning: GOOGLE_APPLICATION_CREDENTIALS not set. Using default credentials if available.',
  );
}

try {
  admin.initializeApp();
} catch {
  /* already initialized */
}

const db = admin.firestore();

async function main() {
  const raw = readFileSync(join(root, 'src/content/lessons.json'), 'utf8');
  /** @type {Array<{ id: string }>} */
  const lessons = JSON.parse(raw);
  const col = db.collection('content').doc('lessons').collection('items');

  for (const lesson of lessons) {
    const ref = col.doc(lesson.id);
    const snap = await ref.get();
    if (snap.exists) {
      console.log(`Skip (exists) ${lesson.id}`);
      continue;
    }
    await ref.set(lesson);
    console.log(`Seeded ${lesson.id}`);
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
