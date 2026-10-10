import bcrypt from "bcrypt";
import {
  User,
  Employee,
  Attendance,
  Leave,
  Announcement,
  Training,
  Notification,
  Audit,
} from "./models/index.js";
import { day } from "./services/core.js";
export async function seed() {
  if (await User.exists({})) return;
  const passwordHash = await bcrypt.hash(
    process.env.DEMO_PASSWORD || "StaffSync@2026",
    12,
  );
  const people = [
    ["Aisha", "Mehta", "People", "Head of People", "hr", "hr@staffsync.demo"],
    [
      "Arjun",
      "Rao",
      "Engineering",
      "Engineering Manager",
      "manager",
      "manager@staffsync.demo",
    ],
    [
      "Maya",
      "Shah",
      "Design",
      "Product Designer",
      "employee",
      "employee@staffsync.demo",
    ],
    [
      "Kabir",
      "Singh",
      "Engineering",
      "Frontend Engineer",
      "employee",
      "kabir@staffsync.demo",
    ],
    [
      "Neha",
      "Iyer",
      "Engineering",
      "Backend Engineer",
      "employee",
      "neha@staffsync.demo",
    ],
    [
      "Rohan",
      "Das",
      "Design",
      "Design Lead",
      "manager",
      "rohan@staffsync.demo",
    ],
    [
      "Zoya",
      "Khan",
      "Marketing",
      "Growth Strategist",
      "employee",
      "zoya@staffsync.demo",
    ],
    [
      "Dev",
      "Patel",
      "Engineering",
      "Full Stack Engineer",
      "employee",
      "dev@staffsync.demo",
    ],
    [
      "Ishita",
      "Roy",
      "People",
      "People Partner",
      "employee",
      "ishita@staffsync.demo",
    ],
    [
      "Aarav",
      "Joshi",
      "Marketing",
      "Content Designer",
      "employee",
      "aarav@staffsync.demo",
    ],
    [
      "Sana",
      "Ali",
      "Design",
      "UX Researcher",
      "employee",
      "sana@staffsync.demo",
    ],
    [
      "Vikram",
      "Nair",
      "Operations",
      "Operations Lead",
      "employee",
      "vikram@staffsync.demo",
    ],
  ];
  const users = [];
  const employees = [];
  for (let i = 0; i < people.length; i++) {
    const [firstName, lastName, department, jobTitle, role, email] = people[i];
    const user = await User.create({ email, passwordHash, role });
    users.push(user);
    employees.push(
      await Employee.create({
        user: user._id,
        employeeId: "SS-" + String(1001 + i),
        firstName,
        lastName,
        email,
        department,
        jobTitle,
        phone: "+91 98765 " + String(43000 + i),
        location: i % 3 === 0 ? "Bengaluru" : "Remote",
        joiningDate: "2025-" + String(1 + (i % 9)).padStart(2, "0") + "-12",
        bio: "Building thoughtful work with the team.",
      }),
    );
  }
  for (let i = 2; i < employees.length; i++) {
    if (i === 5) continue;
    employees[i].manager = i === 10 ? users[5]._id : users[1]._id;
    await employees[i].save();
  }
  const today = day();
  for (let d = 0; d < 24; d++) {
    const date = day(new Date(Date.now() - d * 86400000));
    if ([0, 6].includes(new Date(date + "T12:00:00Z").getUTCDay())) continue;
    for (let i = 0; i < employees.length; i++) {
      if (d === 0 && [2, 6, 10, 11].includes(i)) continue;
      if ((i + d) % 17 === 0) continue;
      const checkIn = new Date(date + "T03:30:00Z");
      checkIn.setMinutes(checkIn.getMinutes() + i * 4);
      const checkOut =
        d === 0
          ? undefined
          : new Date(checkIn.getTime() + 8 * 3600000 + (i % 3) * 900000);
      await Attendance.create({
        employee: employees[i]._id,
        date,
        checkIn,
        checkOut,
        status: i % 5 === 0 ? "late" : "present",
      });
    }
  }
  const plus = (n) => day(new Date(Date.now() + n * 86400000));
  await Leave.insertMany([
    {
      employee: employees[3]._id,
      type: "Annual",
      startDate: plus(3),
      endDate: plus(5),
      days: 3,
      reason: "Family celebration and travel.",
      status: "pending",
    },
    {
      employee: employees[4]._id,
      type: "Personal",
      startDate: plus(2),
      endDate: plus(2),
      days: 1,
      reason: "Personal appointment.",
      status: "pending",
    },
    {
      employee: employees[6]._id,
      type: "Annual",
      startDate: plus(7),
      endDate: plus(10),
      days: 4,
      reason: "A short break with family.",
      status: "pending",
    },
    {
      employee: employees[10]._id,
      type: "Sick",
      startDate: today,
      endDate: today,
      days: 1,
      reason: "Rest and recovery.",
      status: "approved",
      reviewedBy: users[0]._id,
      reviewedAt: new Date(),
    },
    {
      employee: employees[2]._id,
      type: "Annual",
      startDate: plus(14),
      endDate: plus(15),
      days: 2,
      reason: "Planned personal time.",
      status: "approved",
      reviewedBy: users[1]._id,
      reviewedAt: new Date(),
    },
  ]);
  await Announcement.insertMany([
    {
      title: "A little time to reconnect",
      content:
        "Our quarterly team gathering is coming up on Friday. Join your colleagues for an afternoon of shared ideas, good conversations, and a look at what we are building next. Your manager will share the schedule with your team.",
      category: "Events",
      pinned: true,
      author: users[0]._id,
    },
    {
      title: "Your wellbeing, on your terms",
      content:
        "Our updated wellbeing policy includes flexible focus hours and additional support resources. Please review the policy with your team and speak with People if you have any questions.",
      category: "Policy",
      author: users[0]._id,
    },
    {
      title: "Welcome to our newest teammates",
      content:
        "Please join us in welcoming the newest members of Engineering and Design. Take a moment to say hello and help them feel at home.",
      category: "People",
      author: users[1]._id,
    },
  ]);
  await Training.insertMany([
    {
      title: "Clear communication at work",
      description:
        "Build better feedback habits, communicate decisions clearly, and make collaboration easier for everyone.",
      category: "People skills",
      dueDate: plus(12),
      duration: "2 hours",
      owner: users[1]._id,
      assignments: [
        { employee: employees[2]._id, status: "in-progress" },
        {
          employee: employees[3]._id,
          status: "completed",
          completedAt: new Date(),
        },
        { employee: employees[4]._id, status: "assigned" },
      ],
    },
    {
      title: "Secure engineering essentials",
      description:
        "A practical introduction to authentication, access control, and protecting customer data.",
      category: "Technical skills",
      dueDate: plus(18),
      duration: "3 hours",
      owner: users[1]._id,
      assignments: [
        { employee: employees[3]._id, status: "assigned" },
        { employee: employees[4]._id, status: "in-progress" },
        { employee: employees[7]._id, status: "assigned" },
      ],
    },
    {
      title: "Designing with accessibility",
      description:
        "Explore inclusive patterns, accessible interactions, and testing experiences with assistive technology.",
      category: "Design",
      dueDate: plus(9),
      duration: "90 minutes",
      owner: users[5]._id,
      assignments: [{ employee: employees[10]._id, status: "assigned" }],
    },
  ]);
  await Notification.insertMany(
    users.map((u) => ({
      recipient: u._id,
      title: "Welcome to StaffSync",
      message:
        "Your people workspace is ready. Explore your dashboard to get started.",
      link: "/dashboard",
    })),
  );
  await Audit.create({
    actor: users[0]._id,
    action: "Workspace initialized",
    detail: "Demo workspace with fictional people and sample records.",
    target: "workspace",
  });
  console.log("Demo workspace initialized with fictional data.");
}
