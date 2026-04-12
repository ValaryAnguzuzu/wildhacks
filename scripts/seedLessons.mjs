import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

initializeApp({
  credential: cert(join(__dirname, 'serviceAccountKey.json')),
})

const db = getFirestore()
const lessons = JSON.parse(readFileSync(join(__dirname, '../src/content/lessons.json'), 'utf8'))

async function seed() {
  console.log(`\nSeeding ${lessons.length} lessons to Firestore...\n`)

  let seeded = 0
  let skipped = 0
  let failed = 0

  for (const lesson of lessons) {
    try {
      const ref = db.collection('content').doc('lessons').collection('items').doc(lesson.id)
      const existing = await ref.get()

      if (existing.exists) {
        console.log(`  SKIP   ${lesson.id} (already exists)`)
        skipped++
        continue
      }

      await ref.set({
        ...lesson,
        createdAt: new Date().toISOString(),
      })

      console.log(`  OK     ${lesson.id}`)
      seeded++
    } catch (err) {
      console.error(`  FAIL   ${lesson.id} — ${err.message}`)
      failed++
    }
  }

  console.log('\n─────────────────────────────')
  console.log(`  Seeded:  ${seeded}`)
  console.log(`  Skipped: ${skipped}`)
  console.log(`  Failed:  ${failed}`)
  console.log('─────────────────────────────\n')

  if (failed > 0) process.exit(1)
  else process.exit(0)
}

seed()
