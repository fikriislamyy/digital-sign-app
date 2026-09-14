import { db } from '../src/db';
import { users, documents } from '../src/db/schema';
import { eq } from 'drizzle-orm';

async function seed() {
  try {
    // Find the first user
    const user = await db.select().from(users).limit(1);

    if (!user.length) {
      console.log('No users found. Register a user first.');
      process.exit(1);
    }

    const userId = user[0].id;

    // Create sample documents
    const sampleDocs = [
      {
        title: 'Non-Disclosure Agreement (NDA)',
        fileUrl: 'https://example.com/nda.pdf',
        status: 'draft' as const,
        metadata: { type: 'legal', pages: 5 },
      },
      {
        title: 'Employment Contract - 2026',
        fileUrl: 'https://example.com/employment.pdf',
        status: 'sent' as const,
        metadata: { type: 'hr', pages: 8 },
      },
      {
        title: 'Service Agreement',
        fileUrl: 'https://example.com/service.pdf',
        status: 'completed' as const,
        metadata: { type: 'commercial', pages: 12 },
      },
      {
        title: 'Confidentiality Agreement',
        fileUrl: 'https://example.com/confidentiality.pdf',
        status: 'draft' as const,
        metadata: { type: 'legal', pages: 3 },
      },
      {
        title: 'Lease Agreement',
        fileUrl: 'https://example.com/lease.pdf',
        status: 'completed' as const,
        metadata: { type: 'real-estate', pages: 15 },
      },
    ];

    await db.insert(documents).values(
      sampleDocs.map((doc) => ({
        ...doc,
        creatorId: userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      }))
    );

    console.log(`✓ Seeded ${sampleDocs.length} documents for user ${userId}`);
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));
