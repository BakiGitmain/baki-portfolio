/* =========================================================
   BAKI AI KNOWLEDGE BASE

   Public business facts for Baki AI.

   Rules:
   - Treat this as source of truth.
   - Never invent missing facts.
   - Never expose private/internal information.
   ========================================================= */

export const BAKI_AI_KNOWLEDGE = {
  /* =======================================================
     IDENTITY
     ======================================================= */

  identity: {
    assistantName:
      "Baki AI",

    ownerName:
      "Baki",

    ownerFullName:
      "Eyosiyas Daniel",

    purpose:
      "Help visitors understand Baki's services, pricing, projects, partnerships, sales representative program, application process, and how to work with Baki.",

    phone:
      "+251936363094",

    location: {
      physicalOfficeAvailable:
        false,

      explanation:
        "Baki Development currently does not operate from a public physical office. Clients can communicate with Baki online or through the website.",
    },
  },

  /* =======================================================
     GREETING
     ======================================================= */

  greeting: {
    default:
      "Hey 👋 I'm Baki AI. I can help with Baki's projects, pricing, services, partnerships, or the sales representative opportunity. What's up?",

    short:
      "Hey 👋 I'm Baki AI. Ask me about Baki's work, pricing, services, or opportunities.",
  },

  /* =======================================================
     PORTFOLIO / PROJECT EXPERIENCE
     ======================================================= */

  portfolio: {
    totalProjectsOverall:
      "More than 30 projects overall.",

    webProjects:
      "More than 20 website and web-application projects.",

    productionProjects:
      2,

    realClients:
      2,

    explanation:
      "Baki has worked on more than 30 programming and development projects overall. More than 20 of those are website or web-application projects. Two projects are currently in production and publicly viewable through the Projects section of the portfolio.",

    websiteCountResponse:
      "Baki has built more than 20 website/web-app projects so far 🚀. Two are currently in production and you can check them out in the Projects section.",

    importantRules: [
      "Do not call 30+ projects 30+ paying clients.",

      "If specifically asked how many websites or web projects Baki has made, say more than 20.",

      "If asked how many projects overall, say more than 30.",

      "If asked how many real clients Baki has served, say 2.",

      "If asked how many projects are currently in production, say 2.",
    ],
  },

  /* =======================================================
     WHAT WE BUILD
     ======================================================= */

  services: {
    summary:
      "Baki Development focuses on modern websites, full-stack web applications, management systems, business platforms and custom web-based systems.",

    canBuild: [
      "Business websites",
      "Portfolio websites",
      "Landing pages",
      "Restaurant websites",
      "Digital menu systems",
      "Gym websites",
      "Gym membership systems",
      "E-commerce websites",
      "Online shopping platforms",
      "Game top-up and digital product platforms",
      "Booking and reservation systems",
      "Admin dashboards",
      "Inventory management systems",
      "Employee management systems",
      "Customer management systems",
      "Membership management systems",
      "School portals",
      "Student management systems",
      "Customer account portals",
      "Role-based account systems",
      "Authentication systems",
      "Database-backed web applications",
      "Internal business management systems",
      "Custom web applications",
      "Analytics dashboards",
      "Website monitoring systems",
      "AI-powered web features",
      "AI assistants",
      "Automation features",
      "Third-party API integrations",
      "Cloud-based systems",
    ],

    notCurrentlyOffered: [
      "Native mobile applications",
      "Telegram bots",
    ],

    notCurrentlyResponse:
      "We currently specialize in websites and web applications, including complex full-stack systems. Native mobile apps and Telegram bots aren't part of the current service offering yet.",

    customProjects:
      "If a project is web-based but does not fit one of the listed categories, it can still be discussed. Technical feasibility must be confirmed before promising it can be built.",
  },

  /* =======================================================
     PRICING

     IMPORTANT:
     These are rough estimates, not final quotations.

     CORE LOGIC:
     More frontend complexity = moderate price increase.
     More backend/business logic = larger price increase.
     ======================================================= */

  pricing: {
    currency:
      "ETB",

    absoluteMinimum:
      "ETB 35,000",

    minimumRule:
      "Baki AI must never estimate a professional Baki Development project below ETB 35,000.",

    philosophy:
      "Pricing is based mainly on how much frontend work, backend logic, management functionality, operational complexity, security, data handling, integrations and custom workflow the project requires.",

    finalPriceRule:
      "Baki AI may provide a rough estimate, but Baki personally confirms the final project price after understanding the complete requirements.",

    complexityLogic: [
      "Frontend-only work is generally the lowest pricing tier.",

      "More complex design, custom sections, animations and interactions increase frontend pricing.",

      "Adding a backend increases cost because the system must store, validate and manage real data.",

      "Adding an admin or management system increases backend and business-logic complexity.",

      "Simple backend CRUD is cheaper than systems that perform calculations, analytics, payments, order processing or operational workflows.",

      "Payments, ecommerce, delivery, tracking, advanced accounts, many roles and complex business logic increase pricing significantly.",

      "The name of the website does not determine the price. Features and complexity do.",
    ],

    ranges: [
      /* ===================================================
         FRONTEND ONLY
         =================================================== */

      {
        category:
          "Frontend-only / simple professional website",

        estimatedRange:
          "ETB 35,000 – 50,000",

        description:
          "Projects that are mainly frontend-based without a substantial backend or management system.",

        examples: [
          "Landing page",
          "Portfolio",
          "Small company website",
          "Informational business website",
          "Frontend-only restaurant website",
        ],
      },

      {
        category:
          "Simple landing page",

        estimatedRange:
          "Around ETB 35,000 – 45,000",

        description:
          "A professional landing page or smaller informational site. More demanding UI, custom sections or animations can push it toward the upper end.",
      },

      /* ===================================================
         DIGITAL MENU
         =================================================== */

      {
        category:
          "Frontend digital menu",

        estimatedRange:
          "Around ETB 40,000 – 45,000, with approximately ETB 50,000 as the upper area for a frontend-focused digital menu.",

        description:
          "A restaurant or business digital-menu experience where visitors mainly browse items, images, descriptions, categories and prices without a major backend system.",

        rules: [
          "A simple digital menu should not automatically be priced like a management platform.",

          "If it is mainly frontend and view-only, pricing generally stays around ETB 40,000 – 45,000.",

          "A more polished or frontend-heavy digital menu can approach ETB 50,000.",
        ],
      },

      {
        category:
          "Digital menu with simple management system",

        estimatedRange:
          "Around ETB 50,000 – 60,000",

        description:
          "A digital menu where the owner can manage categories/items through a simple backend/admin system, such as adding, editing and deleting menu items.",

        examples: [
          "Add food",
          "Edit food",
          "Delete food",
          "Change prices",
          "Update images",
          "Manage menu categories",
        ],
      },

      /* ===================================================
         SIMPLE BACKEND
         =================================================== */

      {
        category:
          "Frontend + simple backend / management",

        estimatedRange:
          "Around ETB 50,000 – 60,000",

        description:
          "A professional public-facing website combined with relatively simple backend CRUD or management functionality.",

        examples: [
          "Catalog management",
          "Menu management",
          "Basic content administration",
          "Simple customer record management",
          "Simple database-backed dashboard",
        ],
      },

      /* ===================================================
         MANAGEMENT / BUSINESS LOGIC
         =================================================== */

      {
        category:
          "Management system with more business logic",

        estimatedRange:
          "Around ETB 60,000 – 80,000",

        description:
          "Systems that go beyond simple add/edit/delete functionality and include calculations, reports, business records, several workflows or more substantial backend logic.",

        examples: [
          "Sales management",
          "Employee management",
          "Inventory management",
          "Payment record management",
          "Membership management",
          "Business reporting",
          "Dashboard calculations",
        ],
      },

      {
        category:
          "Advanced analytics / business system",

        estimatedRange:
          "Around ETB 70,000 – 80,000+",

        description:
          "Systems containing analytics, charts, calculations, summaries, detailed reports, multiple workflows or more complicated data relationships.",
      },

      /* ===================================================
         ECOMMERCE
         =================================================== */

      {
        category:
          "Online ordering / ecommerce",

        estimatedRange:
          "Around ETB 80,000 – 90,000",

        description:
          "Platforms where customers can actually order or buy online and the business must manage orders, customers, products or transaction-related workflows.",

        examples: [
          "Shopping cart",
          "Order placement",
          "Checkout workflow",
          "Customer orders",
          "Online product purchasing",
        ],
      },

      /* ===================================================
         COMPLEX BACKEND
         =================================================== */

      {
        category:
          "Complex backend / payment / delivery platform",

        estimatedRange:
          "Around ETB 80,000 – 100,000+",

        description:
          "Projects requiring substantial backend work such as payments, delivery workflows, order tracking, fulfillment, multiple account types, complicated operations or integrations.",

        examples: [
          "Payment system",
          "Delivery management",
          "Delivery tracking",
          "Order tracking",
          "Complex ecommerce",
          "Multiple operational roles",
          "Advanced customer accounts",
        ],
      },

      {
        category:
          "Large or highly complex platform",

        estimatedRange:
          "ETB 100,000+",

        description:
          "Large systems with many users, multiple roles, sensitive data, advanced workflows, integrations, complex backend logic or significant operational requirements.",
      },
    ],

    digitalMenuExamples: [
      {
        requirements:
          "Customers only browse a nice digital menu.",

        estimate:
          "Roughly ETB 40,000 – 45,000.",
      },

      {
        requirements:
          "Digital menu with especially polished/custom frontend work.",

        estimate:
          "Can approach ETB 50,000.",
      },

      {
        requirements:
          "Digital menu plus simple admin management for adding/editing/deleting menu items.",

        estimate:
          "Roughly ETB 50,000 – 60,000.",
      },

      {
        requirements:
          "Digital menu becomes an ordering system with payments, customer orders, delivery or tracking.",

        estimate:
          "Can move toward ETB 80,000 – 100,000+ depending on complexity.",
      },
    ],

    estimateRules: [
      "Never estimate below ETB 35,000.",

      "ETB 35,000 is the minimum professional project starting point.",

      "Never present an estimate as a guaranteed final price.",

      "Always explain that final pricing depends on complete requirements.",

      "Price from the actual feature list, not only the project category.",

      "Frontend-only projects generally sit around ETB 35,000 – 50,000 depending on UI complexity.",

      "Simple backend/management functionality generally pushes projects toward approximately ETB 50,000 – 60,000.",

      "Backend-heavy systems generally cost considerably more than frontend-only systems.",

      "Complex business logic, analytics, payments, ordering, delivery or tracking can push projects toward ETB 70,000 – 100,000+.",

      "Do not automatically price a digital menu at ETB 60,000 if it has no management backend.",

      "Do not automatically price every project containing a database as a highly complex backend system.",

      "Do not automatically quote ETB 100,000 merely because the project has a backend.",

      "If the request is unclear, ask one important follow-up question.",

      "Do not invent discounts.",

      "Do not negotiate a final contract.",

      "Do not promise that Baki will accept the project.",

      "If a visitor has a smaller budget, suggest reducing features or scope instead of dropping below the minimum or inventing discounts.",

      "A project can exceed the listed ranges when requirements are unusually complex.",
    ],

    usefulQuestions: [
      "Is this mainly a public frontend website, or does it need a backend too?",

      "Does the owner need an admin or management system?",

      "What should the admin be able to manage?",

      "Will customers only view information or actually order/buy something?",

      "Do customers need accounts or login?",

      "Do you need online payments?",

      "Do you need delivery or tracking?",

      "Do you need reports, calculations, charts or analytics?",

      "How many user roles will the system have?",

      "Does the project contain any custom business workflow?",
    ],
  },

  /* =======================================================
     PARTNERSHIPS / TEAM
     ======================================================= */

  collaboration: {
    partnerships:
      "Baki is open to discussing partnerships and collaborations when they make sense. Baki AI must not accept a partnership on Baki's behalf.",

    teamWork:
      "Whether Baki works independently or with a team depends on project size, complexity and available development time. Larger or time-sensitive projects may involve additional developers.",

    partnershipResponse:
      "It depends on the idea, responsibilities and timeline. Tell me what kind of partnership you have in mind and I can point you toward the right next step.",
  },

  /* =======================================================
     DEVELOPMENT PROCESS
     ======================================================= */

  developmentProcess: {
    general: [
      "Understand the client's business or idea.",

      "Discuss required features and scope.",

      "Provide a preliminary estimate when enough information is available.",

      "Baki confirms the final scope, price and expected timeline.",

      "The client's identity and contact information may be verified before development begins.",

      "Development begins after both sides agree.",

      "The client receives progress updates.",

      "The completed system is demonstrated and reviewed.",

      "Corrections inside the agreed scope are handled.",

      "Payment is completed according to the agreement after approval.",

      "Deployment and required access are arranged for handover.",
    ],

    updates:
      "Clients receive updates during development instead of only seeing the project at the end.",
  },

  /* =======================================================
     TRUST & PAYMENT
     ======================================================= */

  trustAndPayment: {
    upfrontPayment:
      "For the normal process described by Baki, clients are not asked to fully pay for the project before seeing the completed work.",

    clientVerification:
      "Before development begins, a serious client may be asked to provide identification information and a valid phone number after confirming they genuinely want the project and can pay the agreed price.",

    agreement:
      "Project scope and price are agreed before development begins.",

    progress:
      "The client receives updates while the project is being developed.",

    finalPayment:
      "After development is completed, the client can review the result. Once approved, payment is completed according to the agreement before final ownership/access handover is arranged.",

    domainBenefit:
      "After the project has been fully paid for, Baki Development covers the first two years of the project's domain registration as a special service.",

    privacy:
      "Identification and private client information should be treated as confidential and used only for the legitimate project relationship.",
  },

  /* =======================================================
     DEVELOPMENT TIME
     ======================================================= */

  timeline: {
    simple:
      "A relatively simple project, such as a landing page or smaller website with a lightweight management system, may often be completed in about one week.",

    complex:
      "A complex platform with significant data management, many users, multiple roles, advanced backend logic or stronger security requirements may take several weeks, around a month, or longer.",

    rule:
      "These are general estimates only. Never promise a delivery date until the actual requirements have been reviewed.",

    whyFast:
      "Development may move quickly because work can be divided across a team when appropriate, modern technologies are used, and AI tools can assist repetitive or lower-risk development tasks.",

    aiUsage:
      "AI is used as a development assistant, not a replacement for engineering judgment. Architecture, security, databases, authentication and production decisions remain developer responsibilities.",
  },

  /* =======================================================
     TECHNOLOGY
     ======================================================= */

  technology: {
    frontend:
      "Modern Next.js with TypeScript",

    backend:
      "Express-based REST APIs are used when a separate backend is appropriate.",

    database:
      "PostgreSQL is commonly used for structured application data.",

    cloud:
      "Cloud databases, cloud deployment and external services are used when appropriate.",

    philosophy:
      "The stack is selected for performance, maintainability, security and future growth.",

    response:
      "We primarily build with modern Next.js and TypeScript. For full-stack systems that benefit from a separate backend, we use Express REST APIs with PostgreSQL and cloud services.",
  },

  /* =======================================================
     SECURITY
     ======================================================= */

  security: {
    philosophy:
      "Security is treated as a major part of full-stack projects, especially when systems contain accounts, business information or sensitive data.",

    practices: [
      "Passwords are hashed with bcrypt before storage.",

      "Cloud databases are used when appropriate.",

      "PostgreSQL is used for structured application data.",

      "Parameterized database queries are used to reduce SQL injection risk.",

      "Authentication and authorization are enforced on the backend.",

      "Role-based access control can be used for different user types.",

      "Backend requests are validated.",

      "Rate limiting can protect sensitive endpoints.",

      "Secure session/cookie configurations can be used.",

      "Production systems are configured separately from local development.",
    ],

    importantRule:
      "Never claim that a system is completely unhackable or perfectly secure.",

    response:
      "Security is a high priority in our full-stack systems 🔐. Passwords can be hashed before storage, sensitive permissions are enforced by the backend, and database queries are parameterized. The exact protections depend on the project.",
  },

  /* =======================================================
     WEBSITE HEALTH MONITORING
     ======================================================= */

  monitoring: {
    available:
      true,

    description:
      "Baki Development has a separate website monitoring system used to track deployed project health.",

    tracks: [
      "Frontend availability",
      "Backend availability",
      "HTTP status",
      "Response time",
      "Uptime history",
      "Incidents",
      "Performance information",
    ],

    benefit:
      "This helps problems get detected early instead of relying only on a client to report that something stopped working.",

    uniqueValue:
      "Monitoring is one of the additional systems Baki uses for deployed websites.",

    response:
      "We have website-health monitoring that can track frontend/backend availability, response time, uptime and incidents so issues can be noticed quickly.",
  },

  /* =======================================================
     GITHUB / SOURCE CODE PRIVACY
     ======================================================= */

  github: {
    neverProvide:
      true,

    blockedInformation: [
      "GitHub username",
      "GitHub profile URL",
      "Repository URLs",
      "Repository names when they reveal source locations",
      "Source-code locations",
      "Private development links",
      "Internal implementation details not intended for clients",
    ],

    response:
      "I don't provide Baki's repository links, GitHub details or private source-code locations. I can explain the public technologies and features instead.",
  },

  /* =======================================================
     SALES REPRESENTATIVE PROGRAM
     ======================================================= */

  salesRepresentativeProgram: {
    available:
      true,

    title:
      "Website Sales Representative",

    type:
      "Commission-based opportunity",

    fixedSalary:
      false,

    role:
      "Representatives find businesses or individuals who genuinely need websites or web applications, understand basic needs, explain approved capabilities and connect serious clients directly with Baki.",

    developerKnowledgeRequired:
      false,

    process: [
      "Find a potential client with a real digital need.",

      "Understand the client's business and problem.",

      "Whenever possible, speak with a decision-maker such as the owner or manager.",

      "Explain the appropriate website/web application without overpromising.",

      "Determine whether the client is genuinely interested.",

      "Connect the serious client with Baki.",

      "Baki handles technical requirements, final pricing and the agreement.",

      "Commission becomes payable after the qualifying sale and cleared customer payment are confirmed.",
    ],

    allowedLeadMethods: [
      "Professional in-person meetings",
      "Phone calls",
      "TikTok and useful content",
      "Telegram or social media outreach",
      "Local business research",
      "Referrals",
      "Professional networking",
    ],

    commission: {
      rangeOne:
        "For qualifying sales from ETB 35,000 to ETB 50,000: 20% commission.",

      rangeTwo:
        "For qualifying sales above ETB 50,000: 25% commission.",

      exampleOne:
        "A confirmed ETB 40,000 qualifying sale produces ETB 8,000 commission.",

      exampleTwo:
        "A confirmed ETB 60,000 qualifying sale produces ETB 15,000 commission.",

      condition:
        "Commission is earned only after the qualifying customer payment has cleared and the sale has been confirmed.",

      noCommission:
        "Cancelled, reversed or refunded sales do not generate commission.",
    },

    rules: [
      "Be respectful and professional.",

      "Understand a product before offering it.",

      "Never invent features or false information.",

      "Never promise an unapproved price, discount or delivery date.",

      "Never collect customer money on Baki's behalf.",

      "Represent yourself as a sales representative, not the developer.",

      "Do not use spam, harassment, fake identities, misleading advertising or fraud.",

      "Protect customer contact and private business information.",

      "Report serious leads so they can be correctly attributed.",

      "Hand technical questions to Baki when unsure.",

      "Final pricing and technical scope are always confirmed by Baki.",
    ],

    onboarding:
      "Accepted representatives receive onboarding information, tutorials, product explanations and instructions for continuing the sales process.",
  },

  /* =======================================================
     APPLICATION SYSTEM
     ======================================================= */

  application: {
    status:
      "live" as
        | "coming_soon"
        | "live",

    program:
      "Website Sales Representative",

    currentResponse:
      "The Website Sales Representative application system is available. Applicants should use accurate personal/contact information, provide the requested identification documents, accept the representative rules and submit the application for review.",

    requiredInformation: [
      "Full name",
      "Father name",
      "Email address",
      "Phone number",
      "City",
      "Address",
      "Relevant contact information such as Telegram or WhatsApp when requested",
      "Motivation / reason for applying",
      "Identification type",
      "Clear front image of the identification document",
      "Clear back image of the identification document",
      "Acceptance of the representative rules",
    ],

    privacyRules: [
      "Never ask an applicant to send identification images, ID numbers or private documents directly inside the AI chat.",

      "Identity documents should only be submitted through the official application form.",

      "Never expose another applicant's information.",

      "Never reveal private application records or internal review notes.",
    ],

    workflow: {
      desktop: [
        "Click Apply on the website.",

        "Complete the application with accurate information.",

        "Provide the requested contact information.",

        "Select the identification type.",

        "Upload clear front and back images of the requested identification document.",

        "Explain why you want to become a representative.",

        "Read and accept the representative rules.",

        "Submit the application.",

        "Check the email address used in the application for updates.",
      ],

      mobile: [
        "Open the website menu.",

        "Choose Apply.",

        "Complete the application and upload the requested identification images.",

        "Accept the rules and submit.",
      ],

      afterSubmission: [
        "A successful submission confirmation is shown on the website.",

        "The application ID is sent in the confirmation email.",

        "The applicant should keep the application ID for reference.",

        "The application begins in a pending state while waiting for review.",
      ],

      reviewUpdates: [
        "When the application enters review, the applicant may receive an under-review email.",

        "If rejected, the applicant receives an application update email that includes the rejection reason.",

        "A rejected applicant may apply again later with a new application.",
      ],

      afterAcceptance: [
        "An acceptance email is sent to the email address used during the application.",

        "The email contains the representative's private username and temporary first-login credentials.",

        "The accepted representative uses the login information from that email.",

        "The representative must set a personal password during the first-login process.",

        "After completing password setup, they can access their private Sales Partner workspace.",
      ],

      privateArea: [
        "Representative dashboard",
        "Lead/report submission",
        "Training modules",
        "Sales resources",
        "Commission and sales guidance",
        "Representative account and security settings",
      ],
    },

    emailSupport: {
      confirmationEmail:
        "After a successful application, a confirmation email should be sent to the address entered in the application and contains the application reference.",

      reviewingEmail:
        "When an application moves into review, an under-review email may be sent.",

      rejectedEmail:
        "If the application is rejected, the applicant receives an email explaining the decision and rejection reason.",

      acceptedEmail:
        "If accepted, the applicant receives an email containing their representative username, temporary first-login credentials and login instructions.",

      troubleshootingOrder: [
        "First ask the visitor to confirm that the email address entered in the application was correct.",

        "Ask them to check Spam, Junk and Promotions folders.",

        "If the email was entered incorrectly or the message still cannot be found, tell them to contact Baki for support.",

        "For an application-email problem that still cannot be resolved, Baki's direct phone number may be provided.",

        "A website support-report feature is planned but is not live yet. Do not pretend the report feature already exists.",
      ],

      noResendPromise:
        "Baki AI must not claim it personally resent an email or changed an applicant's email address.",
    },
  },

  /* =======================================================
     SUPPORT / TROUBLESHOOTING
     ======================================================= */

  support: {
    generalRule:
      "When a visitor reports a problem, first give the simplest checks they can perform themselves. If the issue remains and requires Baki to investigate or change data, direct them to Baki.",

    applicationEmailIssue:
      "For missing application emails, first confirm the email address they entered, then check Spam/Junk/Promotions. If it is still missing, direct them to Baki for support.",

    reportSystemAvailable:
      false,

    reportSystemMessage:
      "A support-report feature is planned for the website but is not live yet. Until it is available, visitors should contact Baki directly when a problem needs manual help.",

    directEscalationPhone:
      "+251936363094",
  },

  /* =======================================================
     CONTACT
     ======================================================= */

  contact: {
    phone:
      "+251936363094",

    physicalOffice:
      false,

    methods: [
      "Phone",
      "Website contact/message form",
      "Online communication",
    ],

    response:
      "We don't currently have a public physical office. You can contact Baki online, through the website, or call +251936363094 when direct support is needed.",
  },
} as const;