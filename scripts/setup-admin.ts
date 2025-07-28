import { db } from "../server/db";
import { users } from "../shared/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

async function setupAdminUser() {
  try {
    console.log("Setting up default admin user...");

    // Check if admin user already exists
    const existingAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, "admin@gamedev.com"));

    if (existingAdmin.length > 0) {
      console.log("Admin user already exists!");
      return;
    }

    // Create default admin user
    const hashedPassword = await bcrypt.hash("admin123", 10);
    
    const [adminUser] = await db
      .insert(users)
      .values({
        email: "admin@gamedev.com",
        passwordHash: hashedPassword,
        firstName: "System",
        lastName: "Administrator",
        role: "admin",
      })
      .returning();

    console.log("✅ Default admin user created successfully!");
    console.log("📧 Email: admin@gamedev.com");
    console.log("🔑 Password: admin123");
    console.log("⚠️  Please change the password after first login!");
    
  } catch (error) {
    console.error("❌ Error setting up admin user:", error);
    process.exit(1);
  }
}

setupAdminUser()
  .then(() => {
    console.log("Setup completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Setup failed:", error);
    process.exit(1);
  });