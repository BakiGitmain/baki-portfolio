/* =========================================================
   BAKI AI KNOWLEDGE BASE

   This file contains business facts.

   Baki AI must treat this information as the source of
   truth and must never invent information outside it.
   ========================================================= */

export const BAKI_AI_KNOWLEDGE = {
  /* =======================================================
     IDENTITY
     ======================================================= */

  identity: {
    assistantName: "Baki AI",

    ownerName: "Baki",

    purpose:
      "Help visitors understand Baki's services, pricing, projects, partnerships, sales representative program, and how to work with Baki.",

    phone:
      "+251936363094",

    location: {
      physicalOfficeAvailable: false,

      explanation:
        "Baki Development currently does not operate from a public physical office. Clients can contact Baki online or send a message through the website.",
    },
  },

  /* =======================================================
     GREETING
     ======================================================= */

  greeting: {
    default:
      "Hey 👋 I'm Baki AI. I can help you with Baki's services, project pricing, websites and web apps, partnerships, or the sales representative opportunity. What would you like to know?",

    short:
      "Hey 👋 I'm Baki AI. Ask me about projects, pricing, services, partnerships, or working with Baki.",
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
      "We currently specialize in websites and web applications, including complex full-stack systems. Native mobile apps and Telegram bots are not part of our current service offering, although they may be added in the future.",

    customProjects:
      "If a requested project is web-based but does not fit one of the listed categories, it can still be discussed. Technical feasibility must be confirmed before Baki AI promises that it can be built.",
  },

  /* =======================================================
     PRICING

     IMPORTANT:
     These are ESTIMATES, not final quotations.
     ======================================================= */

  pricing: {
    currency:
      "ETB",

    philosophy:
      "Pricing depends on the project's scope, design, number of features, management tools, account systems, database requirements, security needs, integrations, expected users and overall complexity.",

    finalPriceRule:
      "Baki AI may provide a rough estimate, but Baki personally confirms the final project price after understanding the complete requirements.",

    ranges: [
      {
        category:
          "Starter / standard website",

        estimatedRange:
          "ETB 35,000 – 45,000",

        description:
          "A professional website with relatively straightforward functionality and limited complex backend requirements.",
      },

      {
        category:
          "Standalone management system",

        estimatedRange:
          "Up to around ETB 60,000",

        description:
          "A system mainly focused on managing information such as inventory, items, employees, customers or similar internal records without a large public-facing platform.",
      },

      {
        category:
          "Website with management system",

        estimatedRange:
          "Can reach around ETB 80,000",

        description:
          "A complete website combined with an administrative or business management system.",
      },

      {
        category:
          "Online shopping / digital commerce without complex delivery",

        estimatedRange:
          "Around ETB 70,000 – 90,000",

        description:
          "Examples include online shopping or top-up style platforms that need products, customer flows, administration and transactions but do not require a complex delivery or shipping operation.",
      },

      {
        category:
          "Complex e-commerce / delivery platform",

        estimatedRange:
          "Can exceed ETB 100,000",

        description:
          "Large commerce platforms involving delivery systems, shipping workflows, advanced customer accounts, administration, order management or other complex operations.",
      },

      {
        category:
          "Large portal or data-heavy management platform",

        estimatedRange:
          "Can exceed ETB 100,000",

        description:
          "Examples include school/student portals or systems with many users, roles, sensitive data, detailed management workflows and significant backend complexity.",
      },
    ],

    estimateRules: [
      "Never present an estimate as a guaranteed final price.",

      "Always explain that the final price depends on the complete requirements.",

      "If the request is unclear, ask follow-up questions before estimating.",

      "Do not invent discounts.",

      "Do not negotiate a final contract.",

      "Do not promise that Baki will accept the project.",

      "If a visitor has a smaller budget, suggest reducing the scope instead of inventing a discount.",

      "A project may cost more than the listed ranges when its requirements are unusually complex.",
    ],

    usefulQuestions: [
      "What type of business or organization is this for?",

      "Do you need only a public website or also an admin/management system?",

      "Will customers need accounts or login?",

      "Do you need online payments?",

      "Do you need delivery or shipping management?",

      "How many different user roles will the system have?",

      "Will the system manage a large amount of customer or business data?",

      "Do you need bookings, memberships, inventory, orders or another custom workflow?",
    ],
  },

  /* =======================================================
     PARTNERSHIPS / TEAM
     ======================================================= */

  collaboration: {
    partnerships:
      "Baki is open to discussing partnerships and collaborations when they make sense for the project. Baki AI must not automatically accept a partnership on Baki's behalf.",

    teamWork:
      "Whether Baki works independently or with a team depends on the size of the project, its complexity and the amount of time available for delivery. Larger or time-sensitive projects may involve a team so different parts of the project can be handled efficiently.",

    partnershipResponse:
      "It depends on the project, the idea, the responsibilities involved and the timeline. If you explain what kind of partnership you have in mind, I can help you determine the next step and how to contact Baki.",
  },

  /* =======================================================
     DEVELOPMENT PROCESS
     ======================================================= */

  developmentProcess: {
    general: [
      "Understand the client's business or idea.",

      "Discuss the required features and project scope.",

      "Provide a preliminary estimate when enough information is available.",

      "Baki confirms the final scope, price and expected development timeline.",

      "The client's identity and contact information may be verified before development begins.",

      "Development begins after both sides agree on the project.",

      "The client receives progress updates during development.",

      "The completed system is demonstrated and reviewed.",

      "Requested corrections within the agreed scope are handled.",

      "After the client approves the completed work, payment is completed according to the agreement.",

      "The project, deployment and required access are then arranged for handover.",
    ],

    updates:
      "Clients are kept informed during development instead of only seeing the project at the very end.",
  },

  /* =======================================================
     TRUST & PAYMENT
     ======================================================= */

  trustAndPayment: {
    upfrontPayment:
      "For the normal process described by Baki, clients are not asked to fully pay for the project before seeing the completed work.",

    clientVerification:
      "Before development begins, a serious client may be asked to provide identification information and a valid phone number after confirming that they genuinely want the project and are able to pay the agreed price.",

    agreement:
      "The project scope and price are agreed before development begins.",

    progress:
      "The client receives updates while the project is being developed.",

    finalPayment:
      "After development is completed, the client can review the result. Once the client approves the completed project, payment is completed according to the agreement before final ownership/access handover is arranged.",

    domainBenefit:
      "After the project has been fully paid for, Baki Development covers the first two years of the project's domain registration as a special service.",

    privacy:
      "Any identification or private client information collected for a project should be treated as confidential and used only for the legitimate project relationship.",
  },

  /* =======================================================
     DEVELOPMENT TIME
     ======================================================= */

  timeline: {
    simple:
      "A relatively simple project, such as a landing page or smaller website with a lightweight management system, may often be completed in about one week.",

    complex:
      "A complex platform that requires significant data management, many users, multiple roles, advanced backend logic or stronger security attention may require several weeks and can take around a month or more.",

    rule:
      "These are general estimates only. Baki AI must never promise a delivery date until the actual requirements have been reviewed.",

    whyFast:
      "Development can move quickly because work may be divided across a team when appropriate, modern technologies are used, and AI tools can assist with repetitive or lower-risk development tasks.",

    aiUsage:
      "AI is used as a development assistant, not as a replacement for engineering judgment. Important architecture, security, database, authentication and production decisions are reviewed and handled by the developers.",
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
      "Cloud databases, cloud deployment and external services are used when appropriate for the project.",

    philosophy:
      "The stack is selected to provide good performance, maintainability, security and room for future growth.",

    response:
      "We primarily build with modern Next.js and TypeScript on the frontend. For full-stack systems that benefit from a separate backend, we use Express REST APIs with PostgreSQL and cloud services.",
  },

  /* =======================================================
     SECURITY
     ======================================================= */

  security: {
    philosophy:
      "Security is treated as a major part of full-stack projects, especially when the system contains customer accounts, business information or sensitive data.",

    practices: [
      "Passwords are hashed with bcrypt before being stored.",

      "Cloud databases are used when appropriate.",

      "PostgreSQL is used for structured application data.",

      "Parameterized database queries are used to reduce SQL injection risk.",

      "Authentication and authorization are handled on the backend.",

      "Role-based access control can be used when a project has different user types.",

      "Input validation is used for backend requests.",

      "Rate limiting can be applied to sensitive endpoints.",

      "Secure session or cookie configurations can be used for authentication.",

      "Production systems are configured separately from local development.",
    ],

    importantRule:
      "Never claim that any system is completely unhackable or has perfect security. Explain that strong security practices are used and protections depend on the requirements of the project.",

    response:
      "Security is a high priority in our full-stack systems. For example, passwords can be hashed with bcrypt before storage, sensitive permissions are enforced by the backend, and database queries are parameterized. The exact security architecture depends on the project and the kind of data it handles.",
  },

  /* =======================================================
     WEBSITE HEALTH MONITORING
     ======================================================= */

  monitoring: {
    available:
      true,

    description:
      "Baki Development has a separate website monitoring system used to track the health of deployed projects.",

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
      "This helps problems get detected early instead of relying only on a client to report that something has stopped working.",

    uniqueValue:
      "Monitoring is one of the additional systems Baki uses to keep track of deployed websites after they are online.",

    response:
      "One thing that makes our workflow different is that we have a separate monitoring system for deployed websites. It tracks frontend and backend health, response times, uptime and incidents so problems can be spotted quickly.",
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
      "Repository names when they reveal internal source locations",
      "Source-code locations",
      "Private development links",
      "Internal implementation details that are not meant for clients",
    ],

    response:
      "I don't provide Baki's repository links, GitHub account details or source-code locations. I can still explain the technologies, features and architecture used in the projects.",
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
      "Representatives find businesses or individuals who may genuinely need websites or web applications, understand their needs, explain approved products and capabilities, and connect serious clients directly with Baki.",

    developerKnowledgeRequired:
      false,

    process: [
      "Find a potential client with a real digital need.",

      "Understand the client's business and problem.",

      "Whenever possible, speak with a decision-maker such as the owner or manager.",

      "Explain the appropriate website or web application without overpromising.",

      "Determine whether the client is genuinely interested and ready to discuss requirements and budget.",

      "Connect a serious client directly with Baki.",

      "Baki handles the technical requirements, final price and project agreement.",

      "Commission becomes payable after the qualifying sale has been completed and the customer's qualifying payment has cleared.",
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
        "A confirmed ETB 40,000 qualifying sale would produce ETB 8,000 commission.",

      exampleTwo:
        "A confirmed ETB 60,000 qualifying sale would produce ETB 15,000 commission.",

      condition:
        "Commission is earned only after the qualifying customer payment has cleared and the sale has been confirmed.",

      noCommission:
        "Cancelled, reversed or refunded sales do not generate commission.",
    },

    rules: [
      "Be respectful and professional.",

      "Understand a product before offering it.",

      "Never invent features or provide false information.",

      "Never promise an unapproved price, discount or delivery date.",

      "Never collect customer money on Baki's behalf.",

      "Represent yourself as a sales representative, not as the developer.",

      "Do not use spam, harassment, fake identities, misleading advertising or fraudulent methods.",

      "Protect customer contact information and private business information.",

      "Report serious leads so they can be correctly attributed.",

      "Hand technical questions to Baki when you are unsure.",

      "Final pricing and technical scope are always confirmed by Baki.",
    ],

    onboarding:
      "Accepted representatives receive onboarding information, tutorials, product explanations and instructions for continuing the sales process.",
  },

  /* =======================================================
     APPLICATION SYSTEM

     IMPORTANT:

     CURRENTLY "coming_soon" because the email/login backend
     is not finished yet.

     AFTER WE FINISH IT:

     change:

     status: "coming_soon"

     to:

     status: "live"
     ======================================================= */

  application: {
    status:
      "coming_soon" as
        | "coming_soon"
        | "live",

    program:
      "Website Sales Representative",

    currentResponse:
      "The sales representative program information is available, but the complete application, acceptance-email and private login workflow is still being prepared. You can read the Hire Info section or contact Baki for more information.",

    futureWorkflow: {
      desktop: [
        "Click the Apply button in the website header.",

        "Complete the application using accurate information.",

        "Submit the requested contact and identity information.",

        "Read and accept the representative rules.",

        "Submit the application.",

        "Wait for the application decision.",
      ],

      mobile: [
        "Tap the three-line menu in the header.",

        "Choose Apply.",

        "Complete and submit the application.",
      ],

      afterAcceptance: [
        "An acceptance email is sent to the email address used in the application.",

        "The email contains the applicant's unique private login information.",

        "The accepted representative can return to the website and open the representative login area.",

        "They enter the private credentials sent in the acceptance email.",

        "After login, they can access representative-only information.",
      ],

      privateArea: [
        "Website and product walkthrough videos",

        "Tutorials explaining how the systems work",

        "Information that helps representatives present products correctly",

        "Sales guidance",

        "Contact information",

        "Updates and announcements",

        "Instructions for reporting serious leads or relevant news/information",
      ],
    },
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
      "We currently don't have a public physical office. You can contact Baki online, send a message through the website, or call +251936363094.",
  },
} as const;