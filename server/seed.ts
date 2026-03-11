import { db } from "./db";
  import { educationalResources } from "@shared/schema";

  async function seed() {
    console.log("🌱 Starting database seed...");

    // Check if resources already exist
    const existing = await db.select().from(educationalResources);
    if (existing.length > 0) {
      console.log(`✅ Database already seeded with ${existing.length} resources`);
      return;
    }

    const resources = [
      {
        title: "Breastfeeding Positions Guide",
        content: "Complete guide to comfortable breastfeeding positions including cradle hold, cross-cradle, football hold, and side-lying positions. Tips for proper latch and avoiding common issues.",
        category: "nutrition",
        ageRange: "0-12mo",
        contentType: "guide",
        externalUrl: "https://www.who.int/health-topics/breastfeeding"
      },
      {
        title: "Baby Sleep Safety Tips",
        content: "Essential safety guidelines for infant sleep including back-to-sleep positioning, safe sleep environment setup, and SIDS prevention strategies.",
        category: "sleep",
        ageRange: "0-12mo",
        contentType: "tips",
        externalUrl: "https://www.cdc.gov/sids/parents-caregivers/index.html"
      },
      {
        title: "Introducing Solid Foods",
        content: "When and how to start solid foods, signs of readiness, first foods to try, and how to prevent choking hazards. Includes sample meal plans.",
        category: "nutrition",
        ageRange: "0-12mo",
        contentType: "guide",
        externalUrl: "https://www.healthychildren.org/English/ages-stages/baby/feeding-nutrition/Pages/default.aspx"
      },
      {
        title: "Developmental Milestones: First Year",
        content: "Comprehensive overview of physical, cognitive, social, and language milestones in the first 12 months. What to expect and when to consult your pediatrician.",
        category: "development",
        ageRange: "0-12mo",
        contentType: "article",
        externalUrl: "https://www.cdc.gov/ncbddd/actearly/milestones/index.html"
      },
      {
        title: "Toddler Tantrum Management",
        content: "Understanding why tantrums happen and effective strategies for managing them. Tips for staying calm and teaching emotional regulation.",
        category: "behavior",
        ageRange: "1-2yr",
        contentType: "tips",
        externalUrl: "https://www.zerotothree.org/resource/temper-tantrums/"
      },
      {
        title: "Potty Training Readiness",
        content: "Signs your toddler is ready for potty training, step-by-step approach, dealing with accidents, and transitioning to independence.",
        category: "development",
        ageRange: "1-2yr",
        contentType: "guide",
        externalUrl: "https://www.healthychildren.org/English/ages-stages/toddler/toilet-training/Pages/default.aspx"
      },
      {
        title: "Preschool Social Skills",
        content: "Building friendships, sharing, taking turns, and developing empathy. Activities to support social-emotional development.",
        category: "social",
        ageRange: "3-4yr",
        contentType: "article",
        externalUrl: "https://www.zerotothree.org/resource/social-emotional-development/"
      },
      {
        title: "Language Development Activities",
        content: "Age-appropriate activities to support language learning from birth through preschool. Reading tips, conversation starters, and vocabulary building.",
        category: "development",
        ageRange: "2-3yr",
        contentType: "tips",
        externalUrl: "https://www.asha.org/public/developmental-milestones/"
      },
      {
        title: "Child Safety at Home",
        content: "Comprehensive childproofing guide covering each room in your home. Poison prevention, fall prevention, and emergency preparedness.",
        category: "safety",
        ageRange: "0-12mo",
        contentType: "guide",
        externalUrl: "https://www.healthychildren.org/English/safety-prevention/at-home/Pages/default.aspx"
      },
      {
        title: "Kindergarten Readiness Skills",
        content: "Academic, social, and self-care skills needed for kindergarten success. Preparation timeline and activities to practice at home.",
        category: "development",
        ageRange: "4-5yr",
        contentType: "article",
        externalUrl: "https://www.naeyc.org/our-work/families/kindergarten-ready"
      }
    ];

    await db.insert(educationalResources).values(resources);
    
    console.log(`✅ Seeded ${resources.length} educational resources`);
    console.log("🎉 Database seeding complete!");
  }

  seed()
    .catch((error) => {
      console.error("❌ Error seeding database:", error);
      process.exit(1);
    })
    .then(() => {
      process.exit(0);
    });
  