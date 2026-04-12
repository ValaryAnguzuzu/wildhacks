/**
 * Seeds Firestore `lessons` collection from local JSON (skip existing docs).
 * Run: GOOGLE_APPLICATION_CREDENTIALS=... node scripts/seedContent.js
 */
import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

const files = ['investing.json', 'budgeting.json', 'taxes.json', 'realEstate.json'];

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
  for (const f of files) {
    const raw = readFileSync(join(root, 'src/content', f), 'utf8');
    /** @type {Array<{ id: string }>} */
    const lessons = JSON.parse(raw);
    for (const lesson of lessons) {
      const ref = db.collection('lessons').doc(lesson.id);
      const snap = await ref.get();
      if (snap.exists) {
        console.log(`Skip (exists) ${lesson.id}`);
        continue;
      }
      await ref.set(lesson);
      console.log(`Seeded ${lesson.id}`);
    }
  }
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
