require("dotenv").config();

const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");

async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from .env");
  }

  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  try {
    const connection = await prisma.$queryRaw`
      SELECT
        current_database() AS database,
        current_user AS username
    `;

    console.log("\nPOSTGRESQL CONNECTION SUCCESSFUL");
    console.table(connection);

    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `;

    console.log("\nPOSTGRESQL TABLES");
    console.table(tables);

    console.log(`\nTotal tables: ${tables.length}`);

    const businessTables = tables.filter(
      (row) => row.table_name !== "app_state"
    );

    console.log(`Business tables: ${businessTables.length}`);

    if (tables.length !== 25) {
      console.log(
        "\nWARNING: Expected 25 total tables (24 Business OS + app_state)."
      );
    } else {
      console.log("\nDATABASE STRUCTURE CHECK PASSED");
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\nPRISMA TEST FAILED");
  console.error(error);
  process.exit(1);
});