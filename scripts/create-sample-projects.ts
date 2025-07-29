import { storage } from "../server/storage";

async function createSampleProjects() {
  try {
    // Get admin user
    const admin = await storage.getUserByEmail("admin@gamedev.com");
    if (!admin) {
      console.error("Admin user not found");
      return;
    }

    // Create sample projects
    const projects = [
      {
        name: "PixelForge Adventure",
        description: "Epic fantasy RPG with stunning pixel art graphics and engaging storyline",
        status: "active" as const,
        createdBy: admin.id,
        projectLeadId: admin.id,
        deadline: new Date("2025-12-31"),
      },
      {
        name: "Neon Runner",
        description: "Fast-paced cyberpunk racing game with neon aesthetics",
        status: "active" as const,
        createdBy: admin.id,
        projectLeadId: admin.id,
        deadline: new Date("2025-09-15"),
      },
      {
        name: "Puzzle Master",
        description: "Mind-bending puzzle game with unique mechanics",
        status: "completed" as const,
        createdBy: admin.id,
        projectLeadId: admin.id,
        deadline: new Date("2025-06-30"),
      },
    ];

    for (const projectData of projects) {
      const project = await storage.createProject(projectData);
      console.log(`Created project: ${project.name}`);
    }

    console.log("Sample projects created successfully!");
  } catch (error) {
    console.error("Failed to create sample projects:", error);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  createSampleProjects().then(() => {
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { createSampleProjects };