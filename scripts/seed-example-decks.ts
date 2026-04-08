import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { and, eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { cardsTable, decksTable } from "../src/db/schema";

const TARGET_USER_ID = "user_3C52jz0xheFgH3tWqvKpFSg1R0T";

type DeckSeed = {
  title: string;
  description: string;
  cards: Array<{ front: string; back: string }>;
};

const seeds: DeckSeed[] = [
  {
    title: "Spanish Essentials (English → Spanish)",
    description:
      "Core everyday vocabulary: English words with Spanish translations.",
    cards: [
      { front: "Hello", back: "Hola" },
      { front: "Goodbye", back: "Adiós" },
      { front: "Please", back: "Por favor" },
      { front: "Thank you", back: "Gracias" },
      { front: "You're welcome", back: "De nada" },
      { front: "Yes", back: "Sí" },
      { front: "No", back: "No" },
      { front: "Excuse me", back: "Perdón" },
      { front: "Sorry", back: "Lo siento" },
      { front: "Water", back: "Agua" },
      { front: "Food", back: "Comida" },
      { front: "Where?", back: "¿Dónde?" },
      { front: "How much?", back: "¿Cuánto cuesta?" },
      { front: "Help!", back: "¡Ayuda!" },
      { front: "I don't understand", back: "No entiendo" },
    ],
  },
  {
    title: "British History: Key Questions",
    description:
      "Quick Q&A cards on major events, people, and turning points in British history.",
    cards: [
      {
        front: "In what year did the Norman Conquest take place?",
        back: "1066.",
      },
      {
        front: "Which battle in 1066 led to Norman rule in England?",
        back: "The Battle of Hastings.",
      },
      {
        front: "Who signed the Magna Carta in 1215?",
        back: "King John of England.",
      },
      {
        front: "Which Tudor monarch broke with Rome and established the Church of England?",
        back: "Henry VIII.",
      },
      {
        front: "What was the name of the conflict between Parliament and King Charles I (1642–1651)?",
        back: "The English Civil War.",
      },
      {
        front: "Which event in 1666 devastated much of London?",
        back: "The Great Fire of London.",
      },
      {
        front: "What was the 'Glorious Revolution' (1688) best known for?",
        back: "The overthrow of James II and the establishment of constitutional monarchy under William and Mary.",
      },
      {
        front: "In which year was the Act of Union between England and Scotland passed, creating Great Britain?",
        back: "1707.",
      },
      {
        front: "What major war (1756–1763) significantly expanded British influence worldwide?",
        back: "The Seven Years' War.",
      },
      {
        front: "What was the Battle of Trafalgar (1805) notable for?",
        back: "A decisive Royal Navy victory over France and Spain under Admiral Nelson.",
      },
      {
        front: "What reform act began expanding the British electorate in 1832?",
        back: "The Great Reform Act (Reform Act 1832).",
      },
      {
        front: "Which queen's reign (1837–1901) is associated with rapid industrial growth and empire expansion?",
        back: "Queen Victoria.",
      },
      {
        front: "In which year did Britain enter World War I?",
        back: "1914.",
      },
      {
        front: "What was the name of the German air campaign against Britain in 1940?",
        back: "The Blitz (during the wider Battle of Britain period).",
      },
      {
        front: "In what year did the United Kingdom join the European Economic Community (EEC)?",
        back: "1973.",
      },
    ],
  },
];

function assertEnv() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing (check your .env).");
  }
}

async function upsertDeckWithCards(db: ReturnType<typeof drizzle>, seed: DeckSeed) {
  const existingDeck = await db
    .select({ id: decksTable.id })
    .from(decksTable)
    .where(
      and(eq(decksTable.clerkUserId, TARGET_USER_ID), eq(decksTable.title, seed.title))
    )
    .limit(1);

  const deckId =
    existingDeck[0]?.id ??
    (
      await db
        .insert(decksTable)
        .values({
          clerkUserId: TARGET_USER_ID,
          title: seed.title,
          description: seed.description,
        })
        .returning({ id: decksTable.id })
    )[0]!.id;

  const existingCard = await db
    .select({ id: cardsTable.id })
    .from(cardsTable)
    .where(eq(cardsTable.deckId, deckId))
    .limit(1);

  if (existingCard.length > 0) {
    return { deckId, createdDeck: existingDeck.length === 0, insertedCards: 0, skippedCards: true };
  }

  const cardRows = seed.cards.map((c) => ({
    deckId,
    front: c.front,
    back: c.back,
  }));

  await db.insert(cardsTable).values(cardRows);

  return { deckId, createdDeck: existingDeck.length === 0, insertedCards: cardRows.length, skippedCards: false };
}

async function main() {
  assertEnv();

  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle({ client: sql });

  const results = [];
  for (const seed of seeds) {
    results.push(await upsertDeckWithCards(db, seed));
  }

  const decksForUser = await db
    .select({ id: decksTable.id, title: decksTable.title })
    .from(decksTable)
    .where(eq(decksTable.clerkUserId, TARGET_USER_ID));

  console.log("Seed complete.", {
    userId: TARGET_USER_ID,
    decksFoundForUser: decksForUser.length,
    decks: decksForUser,
    results,
  });
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

