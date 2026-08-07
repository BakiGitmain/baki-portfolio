"use client";

import {
  useRouter,
} from "next/navigation";

import { useLanguage } from "@/components/providers/language-provider";

/* =========================================================
   ICONS
   ========================================================= */

function ArrowIcon({
  left = false,
}: {
  left?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`h-4 w-4 ${
        left
          ? "rotate-180"
          : ""
      }`}
    >
      <path
        d="M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M14 7L19 12L14 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="8"
        r="3.6"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M5 20C5.8 16.5 8.2 14.5 12 14.5C15.8 14.5 18.2 16.5 19 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="10.5"
        cy="10.5"
        r="6"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M15 15L20 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 4L10 8L8 10C9.3 12.8 11.2 14.7 14 16L16 14L20 17C20.5 17.4 20.6 18.1 20.2 18.7C19.3 20 17.8 20.8 16.2 20.5C9.5 19.3 4.7 14.5 3.5 7.8C3.2 6.2 4 4.7 5.3 3.8C5.9 3.4 6.6 3.5 7 4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MeetingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="3"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <circle
        cx="17"
        cy="9"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M3 20C3.6 16.7 5.4 15 8 15C10.6 15 12.4 16.7 13 20"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M14 16C14.8 14.8 15.8 14.2 17.2 14.2C19.2 14.2 20.6 15.5 21 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SocialIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="6"
        cy="12"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <circle
        cx="18"
        cy="6"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <circle
        cx="18"
        cy="18"
        r="2.5"
        stroke="currentColor"
        strokeWidth="1.6"
      />

      <path
        d="M8.2 10.9L15.7 7.1M8.2 13.1L15.7 16.9"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BusinessIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 21V5H15V21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M15 10H20V21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 8H11M8 12H11M8 16H11M17 13H18M17 17H18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M3 21H21"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CodeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 7L3 12L8 17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M16 7L21 12L16 17"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M14 4L10 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function TrainingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="4"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M10 8L16 11L10 14V8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />

      <path
        d="M8 21H16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />

      <path
        d="M12 18V21"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function MoneyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M15 9.2C14.1 8.4 13.1 8 12 8C10.5 8 9.5 8.7 9.5 9.8C9.5 12.5 15 10.7 15 14C15 15.3 13.8 16 12.2 16C10.8 16 9.6 15.5 8.8 14.7"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      <path
        d="M12 6.5V8M12 16V17.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 3L19 6V11C19 15.4 16.3 19.1 12 21C7.7 19.1 5 15.4 5 11V6L12 3Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M9 12L11 14L15 10"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 12L10 17L19 7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =========================================================
   COPY
   ========================================================= */

const englishCopy = {
  back:
    "Go Back",

  eyebrow:
    "SALES REPRESENTATIVE PROGRAM",

  titleStart:
    "Turn Conversations Into",

  titleAccent:
    "Real Opportunities.",

  description:
    "This opportunity is for people who can confidently find businesses or individuals who need websites, understand what they need, introduce the right solution and connect serious buyers directly with me.",

  noSalary:
    "Commission-based role • No fixed salary",

  apply:
    "Apply Now",

  overviewLabel:
    "THE ROLE",

  overviewTitle:
    "You Find the Opportunity. I Handle the Technical Side.",

  overviewText:
    "You do not need to be a developer. Your job is to identify businesses that could benefit from a website or web application, start the conversation professionally, understand their needs and qualify their interest. When the client becomes serious, you introduce them directly to me and I handle the technical discussion, exact requirements, pricing and final agreement.",

  rolePoints: [
    "Find potential customers who genuinely need a website or web application.",
    "Start professional conversations and understand the customer's business.",
    "Explain only the products and capabilities you have been trained on.",
    "Connect qualified interested customers directly with me.",
    "Earn commission after your qualifying sale is successfully completed.",
  ],

  processLabel:
    "HOW IT WORKS",

  processTitle:
    "A Simple Sales Process",

  process: [
    {
      number: "01",
      title:
        "Find a Potential Client",

      description:
        "Look for a business, organization or individual that has a real digital need. Focus on quality prospects rather than contacting random people.",
    },

    {
      number: "02",
      title:
        "Understand Their Business",

      description:
        "Before pitching anything, understand what the business does, how customers currently interact with it and what problems a website or system could solve.",
    },

    {
      number: "03",
      title:
        "Speak With a Decision-Maker",

      description:
        "Whenever possible, speak with the owner, manager or another person who can actually make purchasing decisions. This saves time and makes the conversation more productive.",
    },

    {
      number: "04",
      title:
        "Present the Right Solution",

      description:
        "Explain the type of website or system that fits their situation. Do not overwhelm them with technical details and never promise something you are unsure about.",
    },

    {
      number: "05",
      title:
        "Qualify Their Interest",

      description:
        "Find out whether they genuinely want the product, what problem they want solved and whether they are ready to discuss requirements and budget.",
    },

    {
      number: "06",
      title:
        "Connect Them With Me",

      description:
        "Once the customer is seriously interested, connect them directly with me through phone, Telegram or WhatsApp. I take over the technical discussion, requirements and final pricing.",
    },

    {
      number: "07",
      title:
        "Sale Is Completed",

      description:
        "The customer pays through the approved payment method and the project officially begins.",
    },

    {
      number: "08",
      title:
        "Receive Your Commission",

      description:
        "After the qualifying customer payment is received and the sale is confirmed, your commission becomes payable according to the agreed commission structure.",
    },
  ],

  methodsLabel:
    "FINDING CLIENTS",

  methodsTitle:
    "Use the Method That Works Best for You",

  methodsDescription:
    "There is no single required method. You can use different professional approaches depending on your communication skills and the type of customer you are targeting.",

  methods: [
    {
      type: "social",
      title:
        "TikTok & Content",

      description:
        "Create useful content that attracts business owners, show examples of modern websites and explain how digital systems can improve a business. Interested viewers can become leads.",
    },

    {
      type: "phone",
      title:
        "Phone Calls",

      description:
        "Call businesses professionally, introduce yourself briefly and ask whether you can speak with the owner or manager about improving their online presence or business systems.",
    },

    {
      type: "meeting",
      title:
        "In-Person Meetings",

      description:
        "For local businesses, a professional face-to-face meeting can be extremely effective. When appropriate, this is one of the strongest methods because the customer can ask questions directly and trust can develop faster.",
    },

    {
      type: "social",
      title:
        "Telegram / Social DMs",

      description:
        "Reach out through Telegram, Instagram or other platforms when appropriate. Personalize the message and avoid mass spam.",
    },

    {
      type: "business",
      title:
        "Local Business Research",

      description:
        "Search for restaurants, gyms, shops, service businesses, schools and other organizations that have no website or have an outdated system.",
    },

    {
      type: "user",
      title:
        "Referrals & Networking",

      description:
        "Talk with people you already know and ask for introductions to business owners who may need websites, systems or other digital solutions.",
    },
  ],

  meetingTipTitle:
    "Meeting is often the strongest option.",

  meetingTipText:
    "When possible and appropriate, meeting a serious business owner or manager face-to-face can help you understand their needs better and build trust faster. Dress professionally, arrive on time, listen carefully and keep the conversation focused on the customer's business problem — not on trying to impress them with technical words.",

  approachLabel:
    "PROFESSIONAL APPROACH",

  approachTitle:
    "How to Start the Conversation",

  approachSteps: [
    {
      title:
        "Research First",

      text:
        "Spend a few minutes understanding the business before contacting them. Look at their current website, social media, services and customer experience.",
    },

    {
      title:
        "Ask for the Right Person",

      text:
        "If you are speaking with an employee, politely ask whether you can speak with the manager, owner or person responsible for business decisions.",
    },

    {
      title:
        "Start With Their Problem",

      text:
        "Do not immediately say 'I sell websites.' Ask about how they currently receive customers, bookings, orders, memberships or enquiries.",
    },

    {
      title:
        "Explain the Benefit",

      text:
        "Show how the right website or web application could save time, improve customer experience, organize information or help them sell more effectively.",
    },

    {
      title:
        "Do Not Overpromise",

      text:
        "If a customer asks about a feature, price or delivery time you do not know, tell them you will confirm it with the developer instead of guessing.",
    },

    {
      title:
        "Make the Introduction",

      text:
        "When they become interested, tell them you can connect them directly with the developer for a proper technical discussion and quotation.",
    },
  ],

  productsLabel:
    "WHAT WE CAN BUILD",

  productsTitle:
    "You Are Not Limited to Simple Websites",

  productsDescription:
    "The service can include normal websites, advanced web applications and custom systems. Your training will explain the products you are currently allowed to sell and what each one can do.",

  products: [
    {
      title:
        "Business Websites",

      description:
        "Professional websites for companies, organizations, agencies and service businesses.",
    },

    {
      title:
        "Restaurant & Digital Menu Systems",

      description:
        "Restaurant websites, QR menus, menu management, ordering interfaces and administrative dashboards.",
    },

    {
      title:
        "Gym & Membership Systems",

      description:
        "Membership accounts, expiration tracking, customer management, dashboards and gym websites.",
    },

    {
      title:
        "Booking Systems",

      description:
        "Appointment, reservation, service booking and scheduling systems for businesses.",
    },

    {
      title:
        "Admin Dashboards",

      description:
        "Secure dashboards for managing customers, content, products, accounts and business operations.",
    },

    {
      title:
        "Inventory Systems",

      description:
        "Tools for tracking products, stock quantities, sales and internal business information.",
    },

    {
      title:
        "Customer Management Systems",

      description:
        "Systems for organizing customers, enquiries, memberships, status information and communication.",
    },

    {
      title:
        "E-Commerce Websites",

      description:
        "Online product catalogs, shopping experiences and custom commerce interfaces where appropriate.",
    },

    {
      title:
        "Portals & Account Systems",

      description:
        "Customer portals, protected accounts, membership areas and role-based web applications.",
    },

    {
      title:
        "Landing Pages",

      description:
        "High-quality marketing pages for businesses, products, campaigns and services.",
    },

    {
      title:
        "Internal Business Systems",

      description:
        "Custom tools that help teams manage operations, records, workflows and information.",
    },

    {
      title:
        "AI & Automation Features",

      description:
        "AI-powered or automated features can be integrated when they fit the project and are technically appropriate.",
    },

    {
      title:
        "Custom Web Applications",

      description:
        "If a business needs something unique, a custom solution can be discussed and evaluated.",
    },
  ],

  qualificationTitle:
    "Important: Never sell a feature before confirming it.",

  qualificationText:
    "You will receive information about what each current product can and cannot do. If a customer requests something outside that information, bring the request to me. The technical feasibility, final scope and final price are always confirmed before the customer makes a decision.",

  trainingLabel:
    "TRAINING & ONBOARDING",

  trainingTitle:
    "You Will Not Be Sent Out Unprepared.",

  trainingDescription:
    "Accepted representatives will receive onboarding information through email. The email will explain the next steps and provide instructions for accessing the private Telegram training channel.",

  trainingItems: [
    "Video tutorials explaining how the sales process works.",
    "Walkthroughs of websites and systems currently available for sale.",
    "Explanations of what each product can and cannot do.",
    "Examples of how to approach businesses professionally.",
    "Suggested talking points and conversation structures.",
    "How to identify a serious customer.",
    "How to respond to common customer questions and objections.",
    "How and when to hand the customer over to me.",
    "Updates when new products, systems or selling information become available.",
  ],

  trainingNotice:
    "Telegram channel access is provided only after an application is accepted. Instructions will be sent to the valid email address provided in the application.",

  commissionLabel:
    "COMMISSION",

  commissionTitle:
    "You Earn When the Sale Succeeds.",

  commissionDescription:
    "This is not a fixed-salary position. The income comes from successful qualifying sales that you bring.",

  commissionOneRange:
    "ETB 35,000 – 50,000",

  commissionOne:
    "20%",

  commissionTwoRange:
    "Above ETB 50,000",

  commissionTwo:
    "25%",

  exampleLabel:
    "EXAMPLE",

  exampleOne:
    "A confirmed ETB 40,000 sale = ETB 8,000 commission.",

  exampleTwo:
    "A confirmed ETB 60,000 sale = ETB 15,000 commission.",

  commissionNote:
    "Commission applies after the qualifying customer payment has cleared and the sale has been confirmed. Cancelled, reversed or refunded sales do not generate commission.",

  expectationsLabel:
    "WHAT I EXPECT",

  expectationsTitle:
    "Professionalism Matters.",

  expectations: [
    "Be respectful and professional with every potential customer.",
    "Understand the product before offering it.",
    "Never provide false information just to complete a sale.",
    "Do not promise prices, discounts or delivery dates without approval.",
    "Never collect customer money on my behalf.",
    "Do not use spam, harassment, fake accounts or misleading advertising.",
    "Protect customer contact information and private business information.",
    "Present yourself as a sales representative, not as the developer.",
    "Report genuine leads so they can be correctly attributed to you.",
    "Connect serious customers with me instead of trying to answer technical questions you are unsure about.",
  ],

  sampleLabel:
    "REALISTIC EXAMPLE",

  sampleTitle:
    "What a Good Sale Could Look Like",

  sampleSteps: [
    {
      person:
        "You",

      text:
        "You notice a local gym is managing members manually and does not have a proper website.",
    },

    {
      person:
        "You",

      text:
        "You research the gym, visit or call them and ask whether you can speak with the manager.",
    },

    {
      person:
        "Manager",

      text:
        "The manager explains that customers constantly ask about membership information and staff manually track expiration dates.",
    },

    {
      person:
        "You",

      text:
        "You explain that a gym website and membership management system could provide customer accounts, membership information and an administrative dashboard.",
    },

    {
      person:
        "Manager",

      text:
        "The manager becomes interested and asks about exact features, cost and delivery time.",
    },

    {
      person:
        "You",

      text:
        "Instead of guessing, you tell the manager you will connect them directly with the developer.",
    },

    {
      person:
        "Baki",

      text:
        "I discuss requirements with the manager, confirm what can be built, provide the final price and handle the project agreement.",
    },

    {
      person:
        "Result",

      text:
        "If the qualifying sale is completed and payment is confirmed, the lead is credited to you and your commission is calculated.",
    },
  ],

  faqLabel:
    "FAQ",

  faqTitle:
    "Common Questions",

  faq: [
    {
      question:
        "Do I need coding knowledge?",

      answer:
        "No. You are applying as a sales representative, not a developer. You need to understand the products well enough to explain their business value, while technical discussions are handled by me.",
    },

    {
      question:
        "Do I need previous sales experience?",

      answer:
        "Previous sales experience can help, but it is not the only thing considered. Communication, professionalism, reliability, willingness to learn and the ability to approach customers properly are also important.",
    },

    {
      question:
        "Can I use TikTok to find customers?",

      answer:
        "Yes. TikTok, social media content, direct outreach, referrals, phone calls and professional meetings can all be used as long as the method is honest, respectful and not spammy.",
    },

    {
      question:
        "Can I meet customers in person?",

      answer:
        "Yes. In-person meetings can be very effective, particularly for local businesses. When meeting a customer, dress appropriately, arrive on time and behave professionally.",
    },

    {
      question:
        "Who should I speak with at a business?",

      answer:
        "Whenever possible, speak with the owner, manager or another person who has authority to make decisions about the business.",
    },

    {
      question:
        "Do I negotiate the final project price?",

      answer:
        "No. You can explain the opportunity and qualify the customer, but final pricing, custom features, delivery dates and technical scope are confirmed directly with me.",
    },

    {
      question:
        "Can I receive the customer's payment?",

      answer:
        "No. Representatives are never authorized to collect customer money on my behalf. The customer receives an approved payment method directly.",
    },

    {
      question:
        "How will I learn about the websites?",

      answer:
        "If accepted, onboarding instructions will be sent by email. You will receive access instructions for a Telegram training channel containing tutorials and product walkthroughs.",
    },

    {
      question:
        "Can I sell any kind of web application?",

      answer:
        "You can bring customers with different web needs, but you should never guarantee a feature before it has been technically confirmed. Custom projects are evaluated individually.",
    },

    {
      question:
        "When do I receive commission?",

      answer:
        "Commission becomes payable after the customer's qualifying payment has cleared and the sale has been confirmed.",
    },
  ],

  finalLabel:
    "READY TO START?",

  finalTitle:
    "Think You Can Find the Right Clients?",

  finalDescription:
    "If you communicate professionally, can confidently approach businesses and are willing to learn the products properly, submit an application. Accepted applicants will receive the next steps by email.",

  finalApply:
    "Apply as a Sales Representative",

  finalBack:
    "Back to Portfolio",
};

/* =========================================================
   AMHARIC
   ========================================================= */

const amharicCopy = {
  back:
    "ወደ ኋላ",

  eyebrow:
    "የሽያጭ ወኪል ፕሮግራም",

  titleStart:
    "ውይይቶችን ወደ",

  titleAccent:
    "እውነተኛ የሽያጭ ዕድል ይቀይሩ።",

  description:
    "ይህ የስራ ዕድል ድረ ገጽ ወይም የድር ስርዓት የሚፈልጉ ንግዶችን ወይም ግለሰቦችን ማግኘት፣ ፍላጎታቸውን መረዳት፣ ተገቢውን መፍትሄ ማቅረብ እና በእውነት ፍላጎት ያላቸውን ደንበኞች በቀጥታ ከእኔ ጋር ማገናኘት ለሚችሉ ሰዎች ነው።",

  noSalary:
    "በኮሚሽን ላይ የተመሰረተ ስራ • ቋሚ ደመወዝ የለውም",

  apply:
    "አሁን ያመልክቱ",

  overviewLabel:
    "የስራው ሚና",

  overviewTitle:
    "እርስዎ የሽያጭ ዕድሉን ያገኛሉ። እኔ ቴክኒካዊውን ክፍል እይዛለሁ።",

  overviewText:
    "Developer መሆን አያስፈልግዎትም። ዋና ስራዎ ድረ ገጽ ወይም web application የሚጠቅማቸውን ንግዶች መለየት፣ በሙያዊ መንገድ ውይይት መጀመር፣ ፍላጎታቸውን መረዳት እና በእውነት ፍላጎት እንዳላቸው ማረጋገጥ ነው። ደንበኛው ከተፈለገው ደረጃ ሲደርስ በቀጥታ ከእኔ ጋር ያገናኙታል። ቴክኒካዊ ውይይት፣ ትክክለኛ ፍላጎቶች፣ የመጨረሻ ዋጋ እና ስምምነትን እኔ እይዛለሁ።",

  rolePoints: [
    "ድረ ገጽ ወይም web application በእውነት የሚፈልጉ ደንበኞችን ያግኙ።",
    "በሙያዊ መንገድ ውይይት ይጀምሩ እና የደንበኛውን ንግድ ይረዱ።",
    "የተማሩትን ምርቶች እና እውነተኛ አቅማቸውን ብቻ ያብራሩ።",
    "በእውነት ፍላጎት ያላቸውን ደንበኞች በቀጥታ ከእኔ ጋር ያገናኙ።",
    "ብቁ የሆነው ሽያጭ በተሳካ ሁኔታ ሲጠናቀቅ ኮሚሽን ያግኙ።",
  ],

  processLabel:
    "እንዴት ይሰራል",

  processTitle:
    "ቀላል የሽያጭ ሂደት",

  process: [
    {
      number: "01",
      title:
        "ደንበኛ ያግኙ",

      description:
        "እውነተኛ የዲጂታል ፍላጎት ያለውን ንግድ፣ ድርጅት ወይም ግለሰብ ይፈልጉ። በዘፈቀደ ሰዎችን ከማነጋገር ይልቅ ጥራት ያላቸው ደንበኞች ላይ ያተኩሩ።",
    },

    {
      number: "02",
      title:
        "ንግዱን ይረዱ",

      description:
        "ምንም ነገር ከማቅረብዎ በፊት ንግዱ ምን እንደሚሰራ፣ ደንበኞችን እንዴት እንደሚያስተናግድ እና ድረ ገጽ ወይም ስርዓት የትኛውን ችግር ሊፈታለት እንደሚችል ይረዱ።",
    },

    {
      number: "03",
      title:
        "ከውሳኔ ሰጪው ጋር ይነጋገሩ",

      description:
        "ከተቻለ ከባለቤቱ፣ ከማናጀሩ ወይም የግዢ ውሳኔ መስጠት ከሚችል ሰው ጋር ይነጋገሩ። ይህ ጊዜ ይቆጥባል እና ውይይቱን የበለጠ ጠቃሚ ያደርገዋል።",
    },

    {
      number: "04",
      title:
        "ተገቢውን መፍትሄ ያቅርቡ",

      description:
        "ለንግዱ የሚስማማውን የድረ ገጽ ወይም የስርዓት ዓይነት ያብራሩ። በቴክኒካዊ ቃላት አታወሳስቡት እና እርግጠኛ ያልሆኑበትን ነገር ቃል አትግቡ።",
    },

    {
      number: "05",
      title:
        "ፍላጎቱን ያረጋግጡ",

      description:
        "ደንበኛው በእውነት ምርቱን እንደሚፈልግ፣ ምን ችግር መፍታት እንደሚፈልግ እና ስለ requirements እና budget ለመወያየት ዝግጁ እንደሆነ ይረዱ።",
    },

    {
      number: "06",
      title:
        "ከእኔ ጋር ያገናኙት",

      description:
        "ደንበኛው በእውነት ፍላጎት ካሳየ በስልክ፣ Telegram ወይም WhatsApp በቀጥታ ከእኔ ጋር ያገናኙት። ከዚያ በኋላ ቴክኒካዊ ውይይት፣ requirements እና የመጨረሻ ዋጋን እኔ እይዛለሁ።",
    },

    {
      number: "07",
      title:
        "ሽያጩ ይጠናቀቃል",

      description:
        "ደንበኛው በተፈቀደው የክፍያ መንገድ ክፍያውን ይፈጽማል እና ፕሮጀክቱ በይፋ ይጀምራል።",
    },

    {
      number: "08",
      title:
        "ኮሚሽንዎን ያግኙ",

      description:
        "የደንበኛው ብቁ ክፍያ ከደረሰ እና ሽያጩ ከተረጋገጠ በኋላ በተወሰነው የኮሚሽን መዋቅር መሰረት ኮሚሽንዎ ይከፈላል።",
    },
  ],

  methodsLabel:
    "ደንበኛ ማግኛ መንገዶች",

  methodsTitle:
    "ለእርስዎ የሚሰራውን መንገድ ይጠቀሙ",

  methodsDescription:
    "አንድ ብቻ የተወሰነ ዘዴ የለም። እንደ የመግባቢያ ችሎታዎ እና እንደሚፈልጉት ደንበኛ ዓይነት የተለያዩ ሙያዊ መንገዶችን መጠቀም ይችላሉ።",

  methods: [
    {
      type: "social",
      title:
        "TikTok እና Content",

      description:
        "የንግድ ባለቤቶችን የሚስብ ጠቃሚ content ይፍጠሩ፣ modern websites ምሳሌዎችን ያሳዩ እና digital systems ንግድን እንዴት ሊያሻሽሉ እንደሚችሉ ያብራሩ።",
    },

    {
      type: "phone",
      title:
        "የስልክ ጥሪ",

      description:
        "ለንግዶች በሙያዊ መንገድ ይደውሉ፣ ራስዎን በአጭሩ ያስተዋውቁ እና ስለ online presence ወይም business system ከባለቤቱ ወይም ከmanagerው ጋር መነጋገር እንደሚችሉ ይጠይቁ።",
    },

    {
      type: "meeting",
      title:
        "በአካል Meeting",

      description:
        "ለአካባቢ ንግዶች በአካል መገናኘት በጣም ውጤታማ ሊሆን ይችላል። ተገቢ ሲሆን ደንበኛው በቀጥታ ጥያቄ ማቅረብ ስለሚችል እና እምነት ፈጣን ስለሚፈጠር ከጠንካራዎቹ መንገዶች አንዱ ነው።",
    },

    {
      type: "social",
      title:
        "Telegram / Social Media",

      description:
        "ተገቢ ሲሆን Telegram፣ Instagram ወይም ሌሎች platforms በመጠቀም ይገናኙ። መልዕክቱን ለእያንዳንዱ ንግድ ያስተካክሉ እና mass spam አያድርጉ።",
    },

    {
      type: "business",
      title:
        "የአካባቢ ንግድ ጥናት",

      description:
        "ድረ ገጽ የሌላቸው ወይም ያረጀ system ያላቸውን restaurants፣ gyms፣ shops፣ service businesses፣ schools እና ሌሎች organizations ይፈልጉ።",
    },

    {
      type: "user",
      title:
        "Referral እና Networking",

      description:
        "የምታውቋቸውን ሰዎች ያነጋግሩ እና website፣ system ወይም digital solution ሊፈልጉ የሚችሉ የንግድ ባለቤቶችን እንዲያስተዋውቋችሁ ይጠይቁ።",
    },
  ],

  meetingTipTitle:
    "Meeting ብዙ ጊዜ ከጠንካራዎቹ መንገዶች አንዱ ነው።",

  meetingTipText:
    "ተገቢ ሲሆን በእውነት ፍላጎት ካለው የንግድ ባለቤት ወይም manager ጋር በአካል መገናኘት ፍላጎታቸውን በተሻለ ለመረዳት እና እምነት በፍጥነት ለመገንባት ይረዳል። ተገቢ ልብስ ይልበሱ፣ በሰዓቱ ይገኙ፣ በጥንቃቄ ያዳምጡ እና ውይይቱን በደንበኛው የንግድ ችግር ላይ ያተኩሩ።",

  approachLabel:
    "ሙያዊ አቀራረብ",

  approachTitle:
    "ውይይቱን እንዴት መጀመር እንዳለብዎ",

  approachSteps: [
    {
      title:
        "በቅድሚያ ጥናት ያድርጉ",

      text:
        "ደንበኛውን ከማነጋገርዎ በፊት ጥቂት ደቂቃ ወስደው ንግዱን ይረዱ። አሁን ያለውን website፣ social media፣ services እና customer experience ይመልከቱ።",
    },

    {
      title:
        "ትክክለኛውን ሰው ይጠይቁ",

      text:
        "ከemployee ጋር ከሆኑ በአክብሮት manager፣ owner ወይም business decision ከሚሰጥ ሰው ጋር መነጋገር እንደሚችሉ ይጠይቁ።",
    },

    {
      title:
        "በችግራቸው ይጀምሩ",

      text:
        "ወዲያውኑ 'website እሸጣለሁ' አይበሉ። አሁን customers፣ bookings፣ orders፣ memberships ወይም enquiries እንዴት እንደሚያስተዳድሩ ይጠይቁ።",
    },

    {
      title:
        "ጥቅሙን ያብራሩ",

      text:
        "ትክክለኛው website ወይም web application ጊዜ እንዴት ሊቆጥብ፣ customer experience ሊያሻሽል፣ information ሊያደራጅ ወይም salesን ሊያሻሽል እንደሚችል ያብራሩ።",
    },

    {
      title:
        "የማታውቁትን ቃል አትግቡ",

      text:
        "ደንበኛው ስለማታውቁት feature፣ price ወይም delivery time ከጠየቀ ከdeveloperው እንደምታረጋግጡ ይንገሩት። አትገምቱ።",
    },

    {
      title:
        "በቀጥታ ያገናኙ",

      text:
        "ደንበኛው ፍላጎት ሲያሳይ ለትክክለኛ technical discussion እና quotation በቀጥታ ከdeveloperው ጋር ማገናኘት እንደሚችሉ ይንገሩት።",
    },
  ],

  productsLabel:
    "ምን መገንባት እንችላለን",

  productsTitle:
    "በቀላል Website ብቻ የተገደበ አይደለም",

  productsDescription:
    "Serviceው normal websites፣ advanced web applications እና custom systems ሊያካትት ይችላል። Trainingዎ በአሁኑ ጊዜ የትኞቹን products መሸጥ እንደሚችሉ እና እያንዳንዱ ምን እንደሚሰራ ያብራራል።",

  products: [
    {
      title:
        "የንግድ Websites",

      description:
        "ለcompanies፣ organizations፣ agencies እና service businesses የሚሆኑ professional websites።",
    },

    {
      title:
        "Restaurant & Digital Menu Systems",

      description:
        "Restaurant websites፣ QR menu፣ menu management፣ ordering interfaces እና admin dashboards።",
    },

    {
      title:
        "Gym & Membership Systems",

      description:
        "Membership accounts፣ expiration tracking፣ customer management፣ dashboards እና gym websites።",
    },

    {
      title:
        "Booking Systems",

      description:
        "Appointment፣ reservation፣ service booking እና scheduling systems።",
    },

    {
      title:
        "Admin Dashboards",

      description:
        "Customers፣ content፣ products፣ accounts እና business operations ለማስተዳደር secure dashboards።",
    },

    {
      title:
        "Inventory Systems",

      description:
        "Products፣ stock quantities፣ sales እና internal business information ለመከታተል systems።",
    },

    {
      title:
        "Customer Management Systems",

      description:
        "Customers፣ enquiries፣ memberships፣ status information እና communication ለማደራጀት systems።",
    },

    {
      title:
        "E-Commerce Websites",

      description:
        "Online product catalogs፣ shopping experiences እና custom commerce interfaces።",
    },

    {
      title:
        "Portals & Account Systems",

      description:
        "Customer portals፣ protected accounts፣ membership areas እና role-based applications።",
    },

    {
      title:
        "Landing Pages",

      description:
        "ለbusinesses፣ products፣ campaigns እና services ጥራት ያላቸው marketing pages።",
    },

    {
      title:
        "Internal Business Systems",

      description:
        "Teams operations፣ records፣ workflows እና information እንዲያስተዳድሩ የሚረዱ custom tools።",
    },

    {
      title:
        "AI & Automation",

      description:
        "ለprojectው ተገቢ ሲሆን AI-powered ወይም automated features ሊጨመሩ ይችላሉ።",
    },

    {
      title:
        "Custom Web Applications",

      description:
        "Businessው ልዩ solution ከፈለገ custom system ሊወያይበት እና ሊገመገም ይችላል።",
    },
  ],

  qualificationTitle:
    "አስፈላጊ፦ አንድ feature ከመሸጥዎ በፊት ያረጋግጡ።",

  qualificationText:
    "እያንዳንዱ current product ምን እንደሚሰራ እና ምን እንደማይሰራ መረጃ ይሰጥዎታል። Customerው ከዚህ ውጭ የሆነ feature ከጠየቀ ጥያቄውን ወደ እኔ ያምጡ። Technical feasibility፣ final scope እና final price ሁልጊዜ በቅድሚያ ይረጋገጣሉ።",

  trainingLabel:
    "TRAINING & ONBOARDING",

  trainingTitle:
    "ያለ ዝግጅት ወደ ደንበኞች አትላኩም።",

  trainingDescription:
    "የተቀበሉ የሽያጭ ወኪሎች onboarding information በemail ያገኛሉ። Emailው ቀጣይ ደረጃዎችን እና private Telegram training channel እንዴት መግባት እንደሚችሉ ያብራራል።",

  trainingItems: [
    "የሽያጭ ሂደቱ እንዴት እንደሚሰራ video tutorials።",
    "በአሁኑ ጊዜ ለሽያጭ ዝግጁ የሆኑ websites እና systems walkthroughs።",
    "እያንዳንዱ product ምን እንደሚሰራ እና ምን እንደማይሰራ ማብራሪያ።",
    "Businessesን በሙያዊ መንገድ እንዴት ማነጋገር እንደሚቻል ምሳሌዎች።",
    "Suggested talking points እና conversation structures።",
    "Serious customer እንዴት መለየት እንደሚቻል።",
    "Common customer questions እና objections እንዴት መመለስ እንደሚቻል።",
    "Customerውን መቼ እና እንዴት ወደ እኔ ማስተላለፍ እንዳለብዎ።",
    "አዳዲስ products፣ systems ወይም sales information ሲጨመሩ updates።",
  ],

  trainingNotice:
    "Telegram channel access የሚሰጠው applicationዎ ከተቀበለ በኋላ ብቻ ነው። መመሪያው በapplicationዎ ላይ ያስገቡት ትክክለኛ email ይላካል።",

  commissionLabel:
    "ኮሚሽን",

  commissionTitle:
    "ሽያጩ ሲሳካ ገቢ ያገኛሉ።",

  commissionDescription:
    "ይህ ቋሚ ደመወዝ ያለው ስራ አይደለም። ገቢዎ የሚመጣው እርስዎ ባመጡት በተሳካ ሁኔታ ከተጠናቀቀ ብቁ ሽያጭ ነው።",

  commissionOneRange:
    "35,000 – 50,000 ብር",

  commissionOne:
    "20%",

  commissionTwoRange:
    "ከ50,000 ብር በላይ",

  commissionTwo:
    "25%",

  exampleLabel:
    "ምሳሌ",

  exampleOne:
    "40,000 ብር የተረጋገጠ ሽያጭ = 8,000 ብር ኮሚሽን።",

  exampleTwo:
    "60,000 ብር የተረጋገጠ ሽያጭ = 15,000 ብር ኮሚሽን።",

  commissionNote:
    "Commission የሚሰራው customerው ብቁ ክፍያውን ከፈጸመ እና ሽያጩ ከተረጋገጠ በኋላ ነው። Cancelled፣ reversed ወይም refunded sales ኮሚሽን አያስገኙም።",

  expectationsLabel:
    "ከእርስዎ የሚጠበቀው",

  expectationsTitle:
    "ሙያዊነት አስፈላጊ ነው።",

  expectations: [
    "እያንዳንዱን potential customer በአክብሮት እና በሙያዊ መንገድ ያነጋግሩ።",
    "Productውን ከማቅረብዎ በፊት በደንብ ይረዱ።",
    "ሽያጩን ለመጨረስ ብቻ የሐሰት መረጃ አይስጡ።",
    "ያልተፈቀደ price፣ discount ወይም delivery date ቃል አትግቡ።",
    "በእኔ ስም የደንበኛ ገንዘብ በፍጹም አይቀበሉ።",
    "Spam፣ harassment፣ fake account ወይም misleading advertising አይጠቀሙ።",
    "የደንበኛ መገናኛ እና private business information ይጠብቁ።",
    "ራስዎን sales representative እንጂ developer አድርገው አያቅርቡ።",
    "Genuine leads በትክክል እንዲመዘገቡ ሪፖርት ያድርጉ።",
    "እርግጠኛ ያልሆኑባቸውን technical questions ለመመለስ ከመሞከር ይልቅ serious customerውን ከእኔ ጋር ያገናኙ።",
  ],

  sampleLabel:
    "ተግባራዊ ምሳሌ",

  sampleTitle:
    "ጥሩ ሽያጭ እንዴት ሊካሄድ ይችላል",

  sampleSteps: [
    {
      person:
        "እርስዎ",

      text:
        "አንድ local gym membersን በmanual እያስተዳደረ እና proper website እንደሌለው ያስተውላሉ።",
    },

    {
      person:
        "እርስዎ",

      text:
        "Gymውን ይመረምራሉ፣ በአካል ይሄዳሉ ወይም ይደውላሉ እና managerውን ማነጋገር እንደሚችሉ ይጠይቃሉ።",
    },

    {
      person:
        "Manager",

      text:
        "Customers membership information ብዙ ጊዜ እንደሚጠይቁ እና staffዎቹ expiration datesን manually እንደሚከታተሉ ይነግርዎታል።",
    },

    {
      person:
        "እርስዎ",

      text:
        "Gym website እና membership management system customer accounts፣ membership information እና admin dashboard ሊሰጣቸው እንደሚችል ያብራራሉ።",
    },

    {
      person:
        "Manager",

      text:
        "Managerው ፍላጎት ያሳያል እና exact features፣ cost እና delivery time ይጠይቃል።",
    },

    {
      person:
        "እርስዎ",

      text:
        "ከመገመት ይልቅ managerውን በቀጥታ ከdeveloperው ጋር እንደምታገናኙት ይነግሩታል።",
    },

    {
      person:
        "Baki",

      text:
        "እኔ managerውን requirements እነጋገራለሁ፣ ምን መገንባት እንደሚቻል አረጋግጣለሁ፣ final price እሰጣለሁ እና project agreementን እይዛለሁ።",
    },

    {
      person:
        "ውጤት",

      text:
        "ብቁ የሆነው ሽያጭ ከተጠናቀቀ እና payment ከተረጋገጠ leadው ለእርስዎ ይመዘገባል እና commissionዎ ይሰላል።",
    },
  ],

  faqLabel:
    "FAQ",

  faqTitle:
    "ብዙ ጊዜ የሚጠየቁ ጥያቄዎች",

  faq: [
    {
      question:
        "Coding ማወቅ ያስፈልገኛል?",

      answer:
        "አይ። የሚያመለክቱት sales representative ለመሆን እንጂ developer ለመሆን አይደለም። Productው ለbusiness ያለውን ጥቅም ለማብራራት በቂ መረዳት ያስፈልግዎታል፣ technical discussion ግን እኔ እይዛለሁ።",
    },

    {
      question:
        "የቀድሞ sales experience ያስፈልጋል?",

      answer:
        "Previous sales experience ጠቃሚ ነው፣ ግን ብቸኛው መስፈርት አይደለም። Communication፣ professionalism፣ reliability፣ willingness to learn እና customersን በትክክል ማነጋገርም አስፈላጊ ናቸው።",
    },

    {
      question:
        "TikTok በመጠቀም customer ማግኘት እችላለሁ?",

      answer:
        "አዎ። TikTok፣ social media content፣ direct outreach፣ referrals፣ phone calls እና professional meetings ሁሉም ሊጠቀሙባቸው ይችላሉ። ዘዴው ግን honest፣ respectful እና spam ያልሆነ መሆን አለበት።",
    },

    {
      question:
        "Customerን በአካል ማግኘት እችላለሁ?",

      answer:
        "አዎ። In-person meeting በተለይ local businesses ላይ በጣም effective ሊሆን ይችላል። Meeting ሲያደርጉ ተገቢ ልብስ ይልበሱ፣ በሰዓቱ ይገኙ እና professional ይሁኑ።",
    },

    {
      question:
        "በbusiness ውስጥ ከማን ጋር መነጋገር አለብኝ?",

      answer:
        "ከተቻለ owner፣ manager ወይም business decision የመስጠት ስልጣን ካለው ሰው ጋር ይነጋገሩ።",
    },

    {
      question:
        "Final project priceን እኔ እደራደራለሁ?",

      answer:
        "አይ። Opportunityውን ማብራራት እና customerውን qualify ማድረግ ይችላሉ። Final pricing፣ custom features፣ delivery date እና technical scope ግን ከእኔ ጋር ይረጋገጣሉ።",
    },

    {
      question:
        "የCustomerውን ገንዘብ መቀበል እችላለሁ?",

      answer:
        "አይ። Representatives በእኔ ስም customer money መሰብሰብ በፍጹም አይፈቀድላቸውም። Customerው በቀጥታ approved payment method ያገኛል።",
    },

    {
      question:
        "ስለ websites እና systems እንዴት እማራለሁ?",

      answer:
        "Applicationዎ ከተቀበለ onboarding instructions በemail ይላካሉ። Tutorials እና product walkthroughs ያሉበት Telegram training channel ለመግባት መመሪያ ያገኛሉ።",
    },

    {
      question:
        "ማንኛውንም web application መሸጥ እችላለሁ?",

      answer:
        "Different web needs ያላቸውን customers ማምጣት ይችላሉ። ግን technical confirmation ከመደረጉ በፊት feature ቃል መግባት አይፈቀድም። Custom projects በየprojectው ይገመገማሉ።",
    },

    {
      question:
        "Commission መቼ ይከፈላል?",

      answer:
        "Customerው qualifying payment ከፈጸመ እና saleው ከተረጋገጠ በኋላ commission payable ይሆናል።",
    },
  ],

  finalLabel:
    "ለመጀመር ዝግጁ ነዎት?",

  finalTitle:
    "ትክክለኛ ደንበኞችን ማግኘት እንደሚችሉ ያምናሉ?",

  finalDescription:
    "በሙያዊ መንገድ መነጋገር ከቻሉ፣ businessesን በእርግጠኝነት ማነጋገር ከቻሉ እና productsን በደንብ ለመማር ዝግጁ ከሆኑ applicationዎን ያስገቡ። የተቀበሉ  applicants ቀጣይ ደረጃዎችን በemail ያገኛሉ።",

  finalApply:
    "እንደ ሽያጭ ወኪል ያመልክቱ",

  finalBack:
    "ወደ Portfolio ተመለስ",
};

/* =========================================================
   HELPERS
   ========================================================= */

function MethodIcon({
  type,
}: {
  type: string;
}) {
  if (type === "phone") {
    return <PhoneIcon />;
  }

  if (type === "meeting") {
    return <MeetingIcon />;
  }

  if (type === "business") {
    return <BusinessIcon />;
  }

  if (type === "user") {
    return <UserIcon />;
  }

  return <SocialIcon />;
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function HireInfo() {
  const router =
    useRouter();

  const { language } =
    useLanguage();

  const copy =
    language === "am"
      ? amharicCopy
      : englishCopy;

  function goBack() {
    router.back();
  }

  function apply() {
    router.push("/hire");
  }

  function portfolio() {
    router.push("/");
  }

  return (
    <section className="relative overflow-hidden px-4 pb-24 pt-8 sm:px-6 sm:pt-12 lg:px-8 lg:pb-32">
      {/* BACKGROUND */}

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
      >
        <div className="absolute left-1/2 top-[-220px] h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[#b7e67c]/10 blur-[120px]" />

        <div
          className="absolute inset-0 opacity-[0.22]"
          style={{
            backgroundImage:
              "radial-gradient(rgba(66,108,43,0.16) 0.7px, transparent 0.7px)",
            backgroundSize:
              "27px 27px",
            maskImage:
              "linear-gradient(to bottom, black, transparent 70%)",
          }}
        />
      </div>

      <div className="relative mx-auto max-w-[1250px]">
        {/* ============================================
            BACK
           ============================================ */}

        <button
          type="button"
          onClick={goBack}
          className="group inline-flex items-center gap-2 rounded-full border border-black/[0.07] bg-white/80 px-4 py-2.5 text-[12px] font-semibold text-black/55 shadow-sm backdrop-blur-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-[#6e9e4b]/25 hover:text-[#456f2d]"
        >
          <ArrowIcon left />

          {copy.back}
        </button>

        {/* ============================================
            HERO
           ============================================ */}

        <div className="mx-auto max-w-[950px] pb-20 pt-16 text-center sm:pt-20 lg:pb-28 lg:pt-24">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#72a54d]/15 bg-[#f0f7e9] px-4 py-2 text-[9px] font-extrabold tracking-[0.15em] text-[#60913f]">
            <span className="h-2 w-2 rounded-full bg-[#9bdf45] shadow-[0_0_12px_rgba(155,223,69,0.7)]" />

            {copy.eyebrow}
          </div>

          <h1 className="mt-7 text-[46px] font-black leading-[0.94] tracking-[-0.065em] text-[#151914] sm:text-[62px] lg:text-[82px]">
            {copy.titleStart}{" "}

            <span className="text-[#568735]">
              {copy.titleAccent}
            </span>
          </h1>

          <p className="mx-auto mt-7 max-w-[760px] text-[14px] leading-8 text-black/47 sm:text-[16px]">
            {copy.description}
          </p>

          <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white/80 px-4 py-2.5 text-[10px] font-semibold text-black/45 shadow-sm">
            <MoneyIcon />

            <span>
              {copy.noSalary}
            </span>
          </div>

          <div className="mt-8">
            <button
              type="button"
              onClick={apply}
              className="group inline-flex h-13 items-center justify-center gap-3 rounded-2xl bg-[#416f2a] px-7 text-[12px] font-bold text-white shadow-[0_15px_35px_rgba(65,111,42,0.2)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#355d22] hover:shadow-[0_20px_45px_rgba(65,111,42,0.25)]"
            >
              {copy.apply}

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </button>
          </div>
        </div>

        {/* ============================================
            ROLE OVERVIEW
           ============================================ */}

        <div className="grid gap-6 rounded-[28px] border border-black/[0.06] bg-white/80 p-6 shadow-[0_20px_60px_rgba(39,55,29,0.055)] backdrop-blur-xl sm:p-8 lg:grid-cols-[0.75fr_1.25fr] lg:p-10">
          <div>
            <span className="text-[9px] font-extrabold tracking-[0.16em] text-[#6d9d48]">
              {copy.overviewLabel}
            </span>

            <h2 className="mt-4 max-w-[420px] text-[32px] font-extrabold leading-[1.02] tracking-[-0.05em] text-[#171b15] sm:text-[40px]">
              {copy.overviewTitle}
            </h2>

            <p className="mt-5 max-w-[520px] text-[12px] leading-7 text-black/45 sm:text-[13px]">
              {copy.overviewText}
            </p>
          </div>

          <div className="grid gap-3">
            {copy.rolePoints.map(
              (
                item,
                index,
              ) => (
                <div
                  key={item}
                  className="group flex items-start gap-4 rounded-2xl border border-black/[0.055] bg-[#fafbf8] p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#76a951]/20 hover:bg-[#f6faef]"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#edf6e6] text-[#5f8c40]">
                    <CheckIcon />
                  </span>

                  <div>
                    <span className="text-[8px] font-bold tracking-[0.12em] text-[#78a352]">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <p className="mt-1 text-[11px] font-medium leading-6 text-black/60">
                      {item}
                    </p>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>

        {/* ============================================
            PROCESS
           ============================================ */}

        <section className="py-24 lg:py-32">
          <div className="max-w-[680px]">
            <span className="text-[9px] font-extrabold tracking-[0.16em] text-[#6b9948]">
              {copy.processLabel}
            </span>

            <h2 className="mt-3 text-[36px] font-extrabold tracking-[-0.055em] text-[#171b15] sm:text-[48px]">
              {copy.processTitle}
            </h2>
          </div>

          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {copy.process.map(
              (item) => (
                <article
                  key={
                    item.number
                  }
                  className="group relative overflow-hidden rounded-[22px] border border-black/[0.06] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#72a24e]/20 hover:shadow-[0_18px_45px_rgba(45,64,34,0.07)] sm:p-6"
                >
                  <div className="absolute right-4 top-2 text-[52px] font-black tracking-[-0.08em] text-[#4f7d33]/[0.045]">
                    {item.number}
                  </div>

                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf6e7] text-[9px] font-black text-[#5c893c]">
                    {item.number}
                  </span>

                  <h3 className="mt-5 text-[18px] font-bold tracking-[-0.03em] text-[#1b2018]">
                    {item.title}
                  </h3>

                  <p className="mt-3 max-w-[500px] text-[11px] leading-6 text-black/43">
                    {
                      item.description
                    }
                  </p>
                </article>
              ),
            )}
          </div>
        </section>

        {/* ============================================
            CLIENT METHODS
           ============================================ */}

        <section>
          <div className="max-w-[760px]">
            <span className="text-[9px] font-extrabold tracking-[0.16em] text-[#6b9948]">
              {copy.methodsLabel}
            </span>

            <h2 className="mt-3 text-[35px] font-extrabold tracking-[-0.055em] text-[#171b15] sm:text-[46px]">
              {copy.methodsTitle}
            </h2>

            <p className="mt-4 text-[12px] leading-7 text-black/45">
              {
                copy.methodsDescription
              }
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {copy.methods.map(
              (method) => (
                <article
                  key={
                    method.title
                  }
                  className="group rounded-[22px] border border-black/[0.06] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#6c9e48]/20 hover:shadow-[0_18px_42px_rgba(39,56,29,0.07)]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf6e7] text-[#5d8b3e] transition-transform duration-300 group-hover:scale-105">
                    <span className="h-5 w-5">
                      <MethodIcon
                        type={
                          method.type
                        }
                      />
                    </span>
                  </div>

                  <h3 className="mt-5 text-[16px] font-bold tracking-[-0.03em] text-[#1b2018]">
                    {
                      method.title
                    }
                  </h3>

                  <p className="mt-2 text-[10.5px] leading-6 text-black/43">
                    {
                      method.description
                    }
                  </p>
                </article>
              ),
            )}
          </div>

          {/* MEETING TIP */}

          <div className="mt-5 flex flex-col gap-5 rounded-[22px] border border-[#79aa55]/15 bg-[#f1f8eb] p-6 sm:flex-row sm:items-center">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-[#568637] shadow-sm">
              <span className="h-6 w-6">
                <MeetingIcon />
              </span>
            </span>

            <div>
              <h3 className="text-[15px] font-bold text-[#355626]">
                {
                  copy.meetingTipTitle
                }
              </h3>

              <p className="mt-2 text-[10.5px] leading-6 text-[#355626]/60">
                {
                  copy.meetingTipText
                }
              </p>
            </div>
          </div>
        </section>

        {/* ============================================
            APPROACH
           ============================================ */}

        <section className="py-24 lg:py-32">
          <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr]">
            <div>
              <span className="text-[9px] font-extrabold tracking-[0.16em] text-[#6b9948]">
                {copy.approachLabel}
              </span>

              <h2 className="mt-3 text-[35px] font-extrabold leading-[1.02] tracking-[-0.055em] text-[#171b15] sm:text-[46px]">
                {copy.approachTitle}
              </h2>
            </div>

            <div className="grid gap-3">
              {copy.approachSteps.map(
                (
                  item,
                  index,
                ) => (
                  <article
                    key={
                      item.title
                    }
                    className="grid grid-cols-[38px_1fr] gap-4 rounded-2xl border border-black/[0.055] bg-white p-5"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf6e7] text-[8px] font-black text-[#5b873d]">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <div>
                      <h3 className="text-[14px] font-bold text-[#20251d]">
                        {
                          item.title
                        }
                      </h3>

                      <p className="mt-2 text-[10.5px] leading-6 text-black/43">
                        {item.text}
                      </p>
                    </div>
                  </article>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ============================================
            PRODUCTS
           ============================================ */}

        <section>
          <div className="max-w-[780px]">
            <span className="text-[9px] font-extrabold tracking-[0.16em] text-[#6b9948]">
              {copy.productsLabel}
            </span>

            <h2 className="mt-3 text-[35px] font-extrabold leading-[1.03] tracking-[-0.055em] text-[#171b15] sm:text-[47px]">
              {copy.productsTitle}
            </h2>

            <p className="mt-4 text-[12px] leading-7 text-black/44">
              {
                copy.productsDescription
              }
            </p>
          </div>

          <div className="mt-9 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {copy.products.map(
              (
                product,
                index,
              ) => (
                <article
                  key={
                    product.title
                  }
                  className="group rounded-[20px] border border-black/[0.055] bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#73a04e]/20"
                >
                  <div className="flex items-center justify-between">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eff7e9] text-[#59883a]">
                      <span className="h-5 w-5">
                        <CodeIcon />
                      </span>
                    </span>

                    <span className="text-[8px] font-bold text-black/20">
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>
                  </div>

                  <h3 className="mt-5 text-[14px] font-bold text-[#20251d]">
                    {
                      product.title
                    }
                  </h3>

                  <p className="mt-2 text-[10px] leading-6 text-black/42">
                    {
                      product.description
                    }
                  </p>
                </article>
              ),
            )}
          </div>

          <div className="mt-5 rounded-[20px] border border-[#719f4d]/15 bg-[#f4f9ef] p-5">
            <div className="flex gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#5f8d3d]">
                <ShieldIcon />
              </span>

              <div>
                <h3 className="text-[13px] font-bold text-[#3f652c]">
                  {
                    copy.qualificationTitle
                  }
                </h3>

                <p className="mt-2 text-[10px] leading-6 text-[#334c27]/60">
                  {
                    copy.qualificationText
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================
            TRAINING
           ============================================ */}

        <section className="py-24 lg:py-32">
          <div className="overflow-hidden rounded-[28px] border border-[#6e9c4b]/15 bg-[linear-gradient(145deg,#eef7e7,#fbfdf9)] p-6 sm:p-8 lg:p-10">
            <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#558437] shadow-sm">
                  <span className="h-6 w-6">
                    <TrainingIcon />
                  </span>
                </span>

                <div className="mt-6 text-[9px] font-extrabold tracking-[0.16em] text-[#6a9946]">
                  {
                    copy.trainingLabel
                  }
                </div>

                <h2 className="mt-3 text-[34px] font-extrabold leading-[1.03] tracking-[-0.055em] text-[#182016] sm:text-[44px]">
                  {
                    copy.trainingTitle
                  }
                </h2>

                <p className="mt-5 text-[11px] leading-7 text-black/47">
                  {
                    copy.trainingDescription
                  }
                </p>
              </div>

              <div className="grid gap-2">
                {copy.trainingItems.map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-start gap-3 rounded-xl border border-black/[0.045] bg-white/80 px-4 py-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#edf7e5] text-[#5c8c3d]">
                        <CheckIcon />
                      </span>

                      <p className="text-[10px] leading-5 text-black/53">
                        {item}
                      </p>
                    </div>
                  ),
                )}
              </div>
            </div>

            <div className="mt-7 rounded-2xl border border-[#638d44]/10 bg-white/70 p-4 text-[9.5px] leading-6 text-black/45">
              {
                copy.trainingNotice
              }
            </div>
          </div>
        </section>

        {/* ============================================
            COMMISSION
           ============================================ */}

        <section>
          <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
            <div>
              <span className="text-[9px] font-extrabold tracking-[0.16em] text-[#6a9946]">
                {copy.commissionLabel}
              </span>

              <h2 className="mt-3 text-[36px] font-extrabold leading-[1.02] tracking-[-0.055em] text-[#171b15] sm:text-[47px]">
                {copy.commissionTitle}
              </h2>

              <p className="mt-5 text-[11px] leading-7 text-black/44">
                {
                  copy.commissionDescription
                }
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-[0_14px_40px_rgba(42,58,32,0.05)]">
                <span className="text-[9px] font-bold text-black/35">
                  {
                    copy.commissionOneRange
                  }
                </span>

                <div className="mt-3 text-[48px] font-black tracking-[-0.06em] text-[#4e7c31]">
                  {
                    copy.commissionOne
                  }
                </div>

                <div className="mt-5 border-t border-black/[0.06] pt-4">
                  <span className="text-[8px] font-extrabold tracking-[0.14em] text-[#75a451]">
                    {
                      copy.exampleLabel
                    }
                  </span>

                  <p className="mt-2 text-[10px] leading-5 text-black/45">
                    {
                      copy.exampleOne
                    }
                  </p>
                </div>
              </div>

              <div className="rounded-[24px] border border-[#83b45d]/20 bg-[#f2f9eb] p-6 shadow-[0_14px_40px_rgba(63,95,42,0.06)]">
                <span className="text-[9px] font-bold text-[#45682f]/50">
                  {
                    copy.commissionTwoRange
                  }
                </span>

                <div className="mt-3 text-[48px] font-black tracking-[-0.06em] text-[#4e7c31]">
                  {
                    copy.commissionTwo
                  }
                </div>

                <div className="mt-5 border-t border-[#4e7c31]/10 pt-4">
                  <span className="text-[8px] font-extrabold tracking-[0.14em] text-[#6e9f49]">
                    {
                      copy.exampleLabel
                    }
                  </span>

                  <p className="mt-2 text-[10px] leading-5 text-[#355225]/55">
                    {
                      copy.exampleTwo
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <p className="mt-5 text-[9px] leading-6 text-black/38">
            {copy.commissionNote}
          </p>
        </section>

        {/* ============================================
            EXPECTATIONS
           ============================================ */}

        <section className="py-24 lg:py-32">
          <div className="rounded-[28px] border border-black/[0.06] bg-white p-6 sm:p-8 lg:p-10">
            <span className="text-[9px] font-extrabold tracking-[0.16em] text-[#6b9948]">
              {
                copy.expectationsLabel
              }
            </span>

            <h2 className="mt-3 text-[35px] font-extrabold tracking-[-0.055em] text-[#171b15] sm:text-[45px]">
              {
                copy.expectationsTitle
              }
            </h2>

            <div className="mt-8 grid gap-3 md:grid-cols-2">
              {copy.expectations.map(
                (item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-xl bg-[#fafbf8] p-4"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[#ebf5e3] text-[#59863b]">
                      <CheckIcon />
                    </span>

                    <p className="text-[10px] leading-5 text-black/52">
                      {item}
                    </p>
                  </div>
                ),
              )}
            </div>
          </div>
        </section>

        {/* ============================================
            SAMPLE SALE
           ============================================ */}

        <section>
          <div className="max-w-[720px]">
            <span className="text-[9px] font-extrabold tracking-[0.16em] text-[#6b9948]">
              {copy.sampleLabel}
            </span>

            <h2 className="mt-3 text-[35px] font-extrabold tracking-[-0.055em] text-[#171b15] sm:text-[46px]">
              {copy.sampleTitle}
            </h2>
          </div>

          <div className="relative mt-10 grid gap-3">
            {copy.sampleSteps.map(
              (
                item,
                index,
              ) => (
                <article
                  key={`${item.person}-${index}`}
                  className="relative grid gap-3 rounded-2xl border border-black/[0.055] bg-white p-5 sm:grid-cols-[120px_1fr] sm:items-start"
                >
                  <span className="inline-flex w-fit rounded-full bg-[#edf6e7] px-3 py-1.5 text-[8px] font-bold text-[#59863a]">
                    {item.person}
                  </span>

                  <p className="text-[10.5px] leading-6 text-black/48">
                    {item.text}
                  </p>
                </article>
              ),
            )}
          </div>
        </section>

        {/* ============================================
            FAQ
           ============================================ */}

        <section className="py-24 lg:py-32">
          <div className="max-w-[720px]">
            <span className="text-[9px] font-extrabold tracking-[0.16em] text-[#6b9948]">
              {copy.faqLabel}
            </span>

            <h2 className="mt-3 text-[36px] font-extrabold tracking-[-0.055em] text-[#171b15] sm:text-[47px]">
              {copy.faqTitle}
            </h2>
          </div>

          <div className="mt-9 grid gap-3">
            {copy.faq.map(
              (
                item,
                index,
              ) => (
                <details
                  key={
                    item.question
                  }
                  className="group rounded-2xl border border-black/[0.06] bg-white px-5 py-1 open:border-[#76a452]/20"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-5 py-5">
                    <div className="flex items-center gap-4">
                      <span className="text-[8px] font-black text-[#6e9c4a]">
                        {String(
                          index + 1,
                        ).padStart(
                          2,
                          "0",
                        )}
                      </span>

                      <span className="text-[12px] font-bold text-[#22271f]">
                        {
                          item.question
                        }
                      </span>
                    </div>

                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#f0f6eb] text-[#5c873d] transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="max-w-[900px] pb-5 pl-10 text-[10px] leading-6 text-black/45">
                    {item.answer}
                  </p>
                </details>
              ),
            )}
          </div>
        </section>

        {/* ============================================
            FINAL CTA
           ============================================ */}

        <section className="overflow-hidden rounded-[30px] border border-[#78a653]/15 bg-[linear-gradient(135deg,#eff8e8,#fbfdf8)] px-6 py-12 text-center sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <span className="text-[9px] font-extrabold tracking-[0.16em] text-[#6b9948]">
            {copy.finalLabel}
          </span>

          <h2 className="mx-auto mt-4 max-w-[760px] text-[38px] font-black leading-[0.98] tracking-[-0.06em] text-[#171b15] sm:text-[52px]">
            {copy.finalTitle}
          </h2>

          <p className="mx-auto mt-5 max-w-[670px] text-[11px] leading-7 text-black/45">
            {
              copy.finalDescription
            }
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              type="button"
              onClick={apply}
              className="group inline-flex h-13 items-center justify-center gap-3 rounded-2xl bg-[#416f2a] px-6 text-[11px] font-bold text-white shadow-[0_15px_35px_rgba(65,111,42,0.2)] transition-all duration-300 hover:-translate-y-1 hover:bg-[#355d22]"
            >
              {copy.finalApply}

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                <ArrowIcon />
              </span>
            </button>

            <button
              type="button"
              onClick={portfolio}
              className="inline-flex h-13 items-center justify-center gap-3 rounded-2xl border border-black/[0.08] bg-white px-6 text-[11px] font-bold text-black/65 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#6a9749]/25 hover:text-[#456c30]"
            >
              <ArrowIcon left />

              {
                copy.finalBack
              }
            </button>
          </div>
        </section>
      </div>
    </section>
  );
}