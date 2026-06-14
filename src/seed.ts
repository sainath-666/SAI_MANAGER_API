import { getAdminClient } from "./lib/supabase.js";
import { getEnv } from "./lib/env.js";

// Make sure env is loaded
const env = getEnv();
const supabase = getAdminClient();

const EMAIL = "demo@sai-manager.com";
const PASSWORD = "Password123!";

async function run() {
  console.log("Starting database seeding process...");

  // 1. Create or retrieve the test user
  let userId: string;
  let accessToken: string;

  console.log(`Checking if user ${EMAIL} exists...`);
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: EMAIL,
    password: PASSWORD,
  });

  if (signInError) {
    console.log(`User not found or credentials mismatch. Creating new user: ${EMAIL}...`);
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });

    if (signUpError || !signUpData.user) {
      console.error("Failed to create demo user:", signUpError?.message);
      process.exit(1);
    }

    userId = signUpData.user.id;
    console.log(`User created successfully with ID: ${userId}`);

    // Create the profile for RLS
    const { error: profileError } = await supabase.from("profiles").upsert({
      id: userId,
      email: EMAIL,
      full_name: "Sai Manager Demo",
    });

    if (profileError) {
      console.warn("Failed to create profile:", profileError.message);
    }

    // Log in to get the token
    const { data: newSignInData, error: newSignInError } = await supabase.auth.signInWithPassword({
      email: EMAIL,
      password: PASSWORD,
    });

    if (newSignInError || !newSignInData.session) {
      console.error("Failed to log in newly created user:", newSignInError?.message);
      process.exit(1);
    }

    accessToken = newSignInData.session.access_token;
  } else {
    userId = signInData.user.id;
    accessToken = signInData.session.access_token;
    console.log(`Logged in successfully as existing user. User ID: ${userId}`);
  }

  // 2. Clear existing data to make seeding idempotent
  console.log("Cleaning up existing user data to prevent duplicates...");
  await supabase.from("tasks").delete().eq("user_id", userId);
  await supabase.from("projects").delete().eq("user_id", userId);
  await supabase.from("transactions").delete().eq("user_id", userId);
  await supabase.from("notes").delete().eq("user_id", userId);
  await supabase.from("habits").delete().eq("user_id", userId);
  await supabase.from("calendar_events").delete().eq("user_id", userId);

  // 3. Seed Projects
  console.log("Seeding projects...");
  const projectsMock = [
    {
      name: "Sai Manager Flutter Web & App",
      description: "Create the dashboard, shell routing, and static in-memory data repositories.",
      category: "Freelance",
      status: "In Progress" as const,
      target_tasks_count: 12,
      completed_tasks_count: 5,
      due_date: "2026-06-15",
    },
    {
      name: "Employer NestJS Refactoring",
      description: "Migrate legacy microservices to NestJS and implement gRPC RPC streams.",
      category: "Office Work",
      status: "Review" as const,
      target_tasks_count: 10,
      completed_tasks_count: 8,
      due_date: "2026-06-10",
    },
    {
      name: "LangChain AI Agent Integration",
      description: "Build local workflow automation using Google Gemini APIs and LangChain SDKs.",
      category: "Learning",
      status: "Planning" as const,
      target_tasks_count: 6,
      completed_tasks_count: 1,
      due_date: "2026-07-01",
    },
    {
      name: "Home Studio Acoustic Layout",
      description: "Install soundproof foam panels and align speakers for media workspace.",
      category: "Personal",
      status: "Completed" as const,
      target_tasks_count: 3,
      completed_tasks_count: 3,
      due_date: "2026-05-20",
    },
  ];

  const projectMap: Record<string, string> = {};

  for (const proj of projectsMock) {
    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: proj.name,
        description: proj.description,
        category: proj.category,
        status: proj.status,
        target_tasks_count: proj.target_tasks_count,
        completed_tasks_count: proj.completed_tasks_count,
        due_date: proj.due_date,
      })
      .select("id, name")
      .single();

    if (error || !data) {
      console.error(`Error inserting project ${proj.name}:`, error?.message);
    } else {
      projectMap[data.name] = data.id;
    }
  }

  // 4. Seed Tasks
  console.log("Seeding tasks...");
  const tasksMock = [
    {
      projectName: "Sai Manager Flutter Web & App",
      title: "Design Dashboard Wireframes",
      description: "Create high-fidelity UX mockups for the Personal Life Manager layout.",
      dueDate: "2026-06-02",
      category: "Freelance",
      priority: "high" as const,
      status: "done" as const,
      orderIndex: 1,
    },
    {
      projectName: "Employer NestJS Refactoring",
      title: "Refactor App Navigation Routing",
      description: "Transition ShellRoute elements in GoRouter to use IndexedStack structures.",
      dueDate: "2026-06-05",
      category: "Office Work",
      priority: "medium" as const,
      status: "todo" as const,
      orderIndex: 2,
    },
    {
      projectName: null,
      title: "Compile Finance Receipts",
      description: "Gather monthly invoices and PDF receipts for tax preparation reporting.",
      dueDate: "2026-06-15",
      category: "Finance",
      priority: "high" as const,
      status: "todo" as const,
      orderIndex: 3,
    },
    {
      projectName: null,
      title: "30-Minute Gym Workout Session",
      description: "Strength training and dynamic stretching for physical conditioning.",
      dueDate: "2026-05-31",
      category: "Goals",
      priority: "low" as const,
      status: "done" as const,
      orderIndex: 4,
    },
    {
      projectName: "LangChain AI Agent Integration",
      title: "Complete Clean Architecture Study",
      description: "Review dependency rules, core entities, and boundary interfaces.",
      dueDate: "2026-06-03",
      category: "Learning",
      priority: "low" as const,
      status: "todo" as const,
      orderIndex: 5,
    },
  ];

  for (const task of tasksMock) {
    const projId = task.projectName ? projectMap[task.projectName] : null;
    const { error } = await supabase.from("tasks").insert({
      user_id: userId,
      project_id: projId,
      title: task.title,
      description: task.description,
      due_date: task.dueDate,
      category: task.category,
      priority: task.priority,
      status: task.status,
      order_index: task.orderIndex,
    });

    if (error) {
      console.error(`Error inserting task ${task.title}:`, error.message);
    }
  }

  // 5. Seed Transactions
  console.log("Seeding transactions...");
  const transactionsMock = [
    {
      title: "Client UI Milestone payout",
      amount: 2500.0,
      type: "income" as const,
      category: "Freelance",
      date: "2026-05-25T10:00:00Z",
    },
    {
      title: "AWS Cloud Hosting Fees",
      amount: 65.0,
      type: "expense" as const,
      category: "Developer",
      date: "2026-05-28T14:30:00Z",
    },
    {
      title: "Ergonomic Developer Chair",
      amount: 350.0,
      type: "expense" as const,
      category: "Office Work",
      date: "2026-05-29T09:15:00Z",
    },
    {
      title: "Freelance Consulting Payment",
      amount: 1200.0,
      type: "income" as const,
      category: "Freelance",
      date: "2026-05-30T08:00:00Z",
    },
    {
      title: "Gym Membership Renewal",
      amount: 50.0,
      type: "expense" as const,
      category: "Goals",
      date: "2026-05-31T09:00:00Z",
    },
  ];

  for (const tx of transactionsMock) {
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      title: tx.title,
      amount: tx.amount,
      type: tx.type,
      category: tx.category,
      date: tx.date,
    });

    if (error) {
      console.error(`Error inserting transaction ${tx.title}:`, error.message);
    }
  }

  // 6. Seed Notes
  console.log("Seeding notes...");
  const notesMock = [
    {
      title: "Node.js Express Backend Spec",
      content: "Phase 2 specifications: Build an Express or NestJS REST API with PostgreSQL. Ensure repositories map identically to Dart classes to swap endpoints quickly.",
      category: "Developer",
      is_pinned: true,
    },
    {
      title: "Sprint Review Objectives",
      content: "1. Finalize static layouts.\n2. Review UI responsiveness on tablet/mobile views.\n3. Verify in-memory CRUD operations with Riverpod.",
      category: "Office Work",
      is_pinned: false,
    },
    {
      title: "Health & Fitness Blueprint",
      content: "Engage in a 30-minute high-intensity workout thrice a week. Prioritize strength conditioning, sleep trackers, and visual streak targets.",
      category: "Goals",
      is_pinned: false,
    },
  ];

  for (const note of notesMock) {
    const { error } = await supabase.from("notes").insert({
      user_id: userId,
      title: note.title,
      content: note.content,
      category: note.category,
      is_pinned: note.is_pinned,
    });

    if (error) {
      console.error(`Error inserting note ${note.title}:`, error.message);
    }
  }

  // 7. Seed Habits
  console.log("Seeding habits...");
  const habitsMock = [
    { title: "30-Minute Gym Conditioning", streak: 12, is_completed: true },
    { title: "Drink 3L Water", streak: 8, is_completed: false },
    { title: "Write Code/API Review", streak: 25, is_completed: true },
    { title: "Read Technical Article", streak: 3, is_completed: false },
  ];

  for (const hab of habitsMock) {
    const { error } = await supabase.from("habits").insert({
      user_id: userId,
      title: hab.title,
      streak: hab.streak,
      is_completed: hab.is_completed,
    });

    if (error) {
      console.error(`Error inserting habit ${hab.title}:`, error.message);
    }
  }

  // 8. Seed Calendar Events
  console.log("Seeding calendar events...");
  const today = new Date();
  const formatYMD = (d: Date) => d.toISOString().split("T")[0];

  const calendarEventsMock = [
    {
      title: "Project Kickoff Meeting",
      description: "Review project specifications, deliverables, and assign tasks to stakeholders.",
      date: formatYMD(today),
      start_time: "10:00",
      end_time: "11:30",
      color_hex: "#0B8043", // Basil (Green)
      category: "Office Work",
    },
    {
      title: "Finance Review & Ledger Sync",
      description: "Sync income ledger with cashbook API and analyze expenses trends.",
      date: formatYMD(today),
      start_time: "14:00",
      end_time: "15:00",
      color_hex: "#D50000", // Tomato (Red)
      category: "Finance",
    },
    {
      title: "Client Demo & Feedback Session",
      description: "Demonstrate active prototypes of Personal Operating System app to the product owner.",
      date: formatYMD(new Date(today.getTime() + 24 * 60 * 60 * 1000)), // Tomorrow
      start_time: "11:00",
      end_time: "12:00",
      color_hex: "#039BE5", // Peacock (Blue)
      category: "Freelance",
    },
    {
      title: "Clean Architecture Study Group",
      description: "Discuss entity isolation, interfaces, and boundary layers in Flutter.",
      date: formatYMD(new Date(today.getTime() - 24 * 60 * 60 * 1000)), // Yesterday
      start_time: "17:00",
      end_time: "18:30",
      color_hex: "#8E24AA", // Grape (Purple)
      category: "Learning",
    },
  ];

  for (const ev of calendarEventsMock) {
    const { error } = await supabase.from("calendar_events").insert({
      user_id: userId,
      title: ev.title,
      description: ev.description,
      date: ev.date,
      start_time: ev.start_time,
      end_time: ev.end_time,
      color_hex: ev.color_hex,
      category: ev.category,
    });

    if (error) {
      console.error(`Error inserting event ${ev.title}:`, error.message);
    }
  }

  console.log("=================================================");
  console.log("Database seeded successfully!");
  console.log("=================================================");
  console.log(`Login Email:    ${EMAIL}`);
  console.log(`Login Password: ${PASSWORD}`);
  console.log(`User ID:        ${userId}`);
  console.log("Access Token / JWT:");
  console.log(accessToken);
  console.log("=================================================");
}

run().catch((err) => {
  console.error("Database seed failed with unexpected error:", err);
  process.exit(1);
});
