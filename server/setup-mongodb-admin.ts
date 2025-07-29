import { storage } from "./storage";
import bcrypt from "bcryptjs";

async function setupAdmin() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@gamedev.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "admin123";
    
    // Check if admin user already exists
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log("Admin user already exists:", adminEmail);
      return;
    }
    
    // Create admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    const adminUser = await storage.createUser({
      email: adminEmail,
      firstName: "Admin",
      lastName: "User",
      passwordHash,
      role: "admin",
    });
    
    console.log("Admin user created successfully:", adminUser.email);
  } catch (error) {
    console.error("Failed to create admin user:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupAdmin().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { setupAdmin };