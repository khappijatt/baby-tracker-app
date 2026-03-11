import { db } from "./db";
  import { educationalResources } from "@shared/schema";

  async function checkDatabase() {
    try {
      console.log("🔍 Checking database connection...");
      
      // Try to query the database
      const resources = await db.select().from(educationalResources);
      console.log(`✅ Database connected! Found ${resources.length} educational resources.`);
      
      if (resources.length === 0) {
        console.log("⚠️  No resources found. Run 'npm run db:seed' to populate the database.");
      }
      
      return true;
    } catch (error) {
      console.error("❌ Database connection error:", error);
      return false;
    }
  }

  export { checkDatabase };
  