"use client";

import {
  useRef,
  useState,
  type ChangeEvent,
  type ReactNode,
} from "react";

import { useRouter } from "next/navigation";

import { useLanguage } from "@/components/providers/language-provider";

/* =========================================================
   TYPES
   ========================================================= */

type Step = 1 | 2 | 3 | 4;

type FileField =
  | "idFront"
  | "idBack";

type ApplicationData = {
  fullName: string;
  fatherName: string;

  email: string;
  phone: string;

  city: string;
  address: string;

  telegram: string;
  whatsapp: string;

  motivation: string;

  idType: string;

  idFront: File | null;
  idBack: File | null;

  acceptedRules: boolean;
};

type Errors =
  Record<string, string>;

type LocalizedOption = {
  value: string;
  en: string;
  am: string;
};

/* =========================================================
   CONSTANTS
   ========================================================= */

const MAX_FILE_SIZE =
  8 * 1024 * 1024;

const cityOptions: LocalizedOption[] = [
  {
    value: "Addis Ababa",
    en: "Addis Ababa",
    am: "አዲስ አበባ",
  },
  {
    value: "Adama (Nazret)",
    en: "Adama (Nazret)",
    am: "አዳማ (ናዝሬት)",
  },
  {
    value: "Dire Dawa",
    en: "Dire Dawa",
    am: "ድሬዳዋ",
  },
  {
    value: "Hawassa",
    en: "Hawassa",
    am: "ሀዋሳ",
  },
  {
    value: "Bahir Dar",
    en: "Bahir Dar",
    am: "ባሕር ዳር",
  },
  {
    value: "Gondar",
    en: "Gondar",
    am: "ጎንደር",
  },
  {
    value: "Mekelle",
    en: "Mekelle",
    am: "መቀሌ",
  },
  {
    value: "Dessie",
    en: "Dessie",
    am: "ደሴ",
  },
  {
    value: "Jimma",
    en: "Jimma",
    am: "ጅማ",
  },
  {
    value: "Bishoftu (Debre Zeyit)",
    en: "Bishoftu (Debre Zeyit)",
    am: "ቢሾፍቱ (ደብረ ዘይት)",
  },
  {
    value: "Jigjiga",
    en: "Jigjiga",
    am: "ጅግጅጋ",
  },
  {
    value: "Harar",
    en: "Harar",
    am: "ሐረር",
  },
  {
    value: "Shashamane",
    en: "Shashamane",
    am: "ሻሸመኔ",
  },
  {
    value: "Arba Minch",
    en: "Arba Minch",
    am: "አርባ ምንጭ",
  },
  {
    value: "Debre Birhan",
    en: "Debre Birhan",
    am: "ደብረ ብርሃን",
  },
  {
    value: "Nekemte",
    en: "Nekemte",
    am: "ነቀምት",
  },
  {
    value: "Debre Markos",
    en: "Debre Markos",
    am: "ደብረ ማርቆስ",
  },
  {
    value: "Dilla",
    en: "Dilla",
    am: "ዲላ",
  },
  {
    value: "Wolaita Sodo",
    en: "Wolaita Sodo",
    am: "ወላይታ ሶዶ",
  },
  {
    value: "Hosaena",
    en: "Hosaena",
    am: "ሆሳዕና",
  },
  {
    value: "Other",
    en: "Other",
    am: "ሌላ",
  },
];

const idTypeOptions: LocalizedOption[] = [
  {
    value: "Fayda ID",
    en: "Fayda ID",
    am: "ፋይዳ መታወቂያ",
  },
  {
    value: "Passport",
    en: "Passport",
    am: "ፓስፖርት",
  },
  {
    value: "Driver's License",
    en: "Driver's License",
    am: "የመንጃ ፈቃድ",
  },
  {
    value: "Kebele / Government ID",
    en: "Kebele / Government ID",
    am: "የቀበሌ / የመንግስት መታወቂያ",
  },
  {
    value: "Other Government-Issued ID",
    en: "Other Government-Issued ID",
    am: "ሌላ በመንግስት የተሰጠ መታወቂያ",
  },
];

/* =========================================================
   ENGLISH COPY
   ========================================================= */

const englishCopy = {
  eyebrow:
    "SALES OPPORTUNITY",

  titleStart:
    "Website Sales",

  titleAccent:
    "Representative",

  intro:
    "Find qualified website buyers, professionally introduce the product, and connect serious prospects directly with me. Earn commission when your qualified sale is successfully completed.",

  commissionOnly:
    "Commission-based opportunity — no fixed salary.",

  commission:
    "COMMISSION",

  tierOne:
    "ETB 35K – 50K",

  tierOneValue:
    "20%",

  tierTwo:
    "Above ETB 50K",

  tierTwoValue:
    "25%",

  paymentNote:
    "Commission is calculated after the client's payment is received, cleared and the qualifying sale is confirmed.",

  step1:
    "Personal",

  step2:
    "Contact",

  step3:
    "Identity",

  step4:
    "Review",

  step1Title:
    "Personal Information",

  step1Description:
    "Enter your real legal information. Your details should match the identification document you provide.",

  fullName:
    "Full Legal Name",

  fullNamePlaceholder:
    "Enter your real full name",

  fatherName:
    "Father's Name",

  fatherPlaceholder:
    "Enter your father's name",

  email:
    "Valid Email",

  emailPlaceholder:
    "you@example.com",

  phone:
    "Phone Number",

  phonePlaceholder:
    "+251...",

  city:
    "City",

  cityPlaceholder:
    "Select your city",

  address:
    "Address",

  addressPlaceholder:
    "Sub-city, area or neighborhood",

  step2Title:
    "Contact & Motivation",

  step2Description:
    "Tell me how I can reach you and why you believe you would be a strong fit for this sales opportunity.",

  telegram:
    "Telegram",

  telegramPlaceholder:
    "@username or Telegram link",

  whatsapp:
    "WhatsApp",

  whatsappPlaceholder:
    "+251... or WhatsApp number",

  socialRequired:
    "At least one contact method — Telegram or WhatsApp — is required.",

  motivation:
    "Why are you a good fit?",

  motivationPlaceholder:
    "Briefly explain why you can professionally find, communicate with and qualify potential website buyers...",

  characters:
    "characters",

  step3Title:
    "Identity Verification",

  step3Description:
    "Upload clear images of the front and back of one valid government-issued identification document.",

  idType:
    "Identification Type",

  idTypePlaceholder:
    "Select identification type",

  frontOfId:
    "Front of ID",

  frontHelp:
    "Clear JPG, PNG or WEBP • maximum 8 MB",

  backOfId:
    "Back of ID",

  backHelp:
    "Clear JPG, PNG or WEBP • maximum 8 MB",

  chooseFile:
    "Choose file",

  replaceFile:
    "Replace",

  privacyTitle:
    "Prototype privacy notice",

  privacy:
    "The application backend is not connected yet. The selected files remain inside your browser and are not uploaded or stored anywhere.",

  step4Title:
    "Rules & Final Review",

  step4Description:
    "Review your information and read every rule carefully before submitting your application.",

  rulesTitle:
    "Sales Representative Rules",

  reviewTitle:
    "Application Summary",

  reviewName:
    "Name",

  reviewFatherName:
    "Father's Name",

  reviewPhone:
    "Phone",

  reviewEmail:
    "Email",

  reviewLocation:
    "Location",

  reviewContact:
    "Contact",

  reviewIdType:
    "ID Type",

  reviewIdFront:
    "ID Front",

  reviewIdBack:
    "ID Back",

  uploaded:
    "Uploaded",

  accept:
    "I confirm that I have read, understood and agree to follow all of the sales representative rules.",

  previous:
    "Previous",

  next:
    "Continue",

  submit:
    "Submit Application",

  backToPortfolio:
    "Back to Portfolio",

  successEyebrow:
    "APPLICATION COMPLETE",

  successTitle:
    "Application Ready",

  successDescription:
    "The application interface is complete, but the backend is not connected yet. No personal information or identification documents were actually sent or stored.",

  successButton:
    "Return to Portfolio",

  required:
    "This field is required.",

  invalidEmail:
    "Enter a valid email address.",

  invalidPhone:
    "Enter a valid phone number.",

  motivationLength:
    "Your answer must contain between 20 and 200 characters.",

  invalidFile:
    "Upload a JPG, PNG or WEBP file smaller than 8 MB.",

  rulesRequired:
    "You must accept the rules before submitting.",

  roleOverview:
    "ROLE OVERVIEW",

  roleTitle:
    "Find the right client.",

  roleTitleAccent:
    "Earn from the sale.",

  roleDescription:
    "Your role is focused on finding and communicating with qualified potential buyers. Technical discussions, final pricing and project confirmation are handled directly with me.",

  roleSteps: [
    "Find a business, organization or individual who needs a professional website.",

    "Professionally present the product and explain its real capabilities accurately.",

    "When the prospect is seriously interested, connect them directly with me.",

    "Receive your commission after the qualifying sale and customer payment are confirmed.",
  ],

  warning:
    "Never collect or receive customer money on my behalf.",

  rules: [
    {
      title:
        "Commission Structure",

      text:
        "Standard commission is 20% for successfully completed sales between ETB 35,000 and ETB 50,000, and 25% for successfully completed sales above ETB 50,000. Sales below ETB 35,000 require separate approval.",
    },

    {
      title:
        "No Unauthorized Discounts",

      text:
        "Your commission cannot be used as an unauthorized discount to convince a customer to buy. Any price reduction or special offer must be approved before it is presented to the customer.",
    },

    {
      title:
        "Never Collect Customer Money",

      text:
        "You are not authorized to receive deposits, cash, transfers or any other customer payment on my behalf. All customer payments must be sent directly using the payment method I provide.",
    },

    {
      title:
        "Represent Your Role Correctly",

      text:
        "When communicating with potential customers, introduce yourself as a sales representative or seller. Do not claim to be the developer, owner or technical engineer responsible for building the product.",
    },

    {
      title:
        "Professional Communication",

      text:
        "Calls, messages and meetings must be handled professionally. Speak clearly, respectfully and confidently. Avoid aggressive sales tactics, arguments or inappropriate communication.",
    },

    {
      title:
        "Professional Meetings",

      text:
        "For in-person meetings, arrive on time, dress appropriately and represent the business professionally. Your behavior directly affects the reputation of the service you are selling.",
    },

    {
      title:
        "Understand the Product",

      text:
        "Before approaching a customer, understand what the website or service actually provides, what it can do and what it cannot do. Ask for clarification if you are unsure about a feature.",
    },

    {
      title:
        "No False Information",

      text:
        "Never invent features, guarantees, technical capabilities, customer results or other information simply to complete a sale.",
    },

    {
      title:
        "Client Handoff",

      text:
        "Once a prospect becomes seriously interested, connect them directly with me through phone, Telegram or WhatsApp so requirements, pricing, customization and delivery can be confirmed.",
    },

    {
      title:
        "Pricing & Delivery",

      text:
        "Do not promise custom prices, discounts, delivery dates, extra features, maintenance periods or support terms unless they have already been approved.",
    },

    {
      title:
        "Lead Attribution",

      text:
        "A potential customer should be reported before the final sale so the lead can be correctly attributed to you. Duplicate leads or customers who were already in active discussion may not qualify for commission.",
    },

    {
      title:
        "Customer Privacy",

      text:
        "Customer phone numbers, emails, business information, project requirements and private conversations must be treated confidentially and must not be shared with unauthorized people.",
    },

    {
      title:
        "No Spam, Fraud or Harassment",

      text:
        "Do not use fake identities, misleading advertisements, false testimonials, mass spam, harassment, impersonation or fraudulent methods to obtain customers.",
    },

    {
      title:
        "Commission Eligibility",

      text:
        "Commission becomes payable only after the customer's qualifying payment has successfully cleared and the sale has been confirmed. Cancelled, refunded or reversed transactions do not generate commission.",
    },

    {
      title:
        "Rule Violations",

      text:
        "Serious or repeated violations may result in termination of the sales relationship. Unauthorized actions may also make the affected transaction ineligible for commission.",
    },
  ],
};

/* =========================================================
   AMHARIC COPY
   ========================================================= */

const amharicCopy = {
  eyebrow:
    "የሽያጭ የስራ ዕድል",

  titleStart:
    "የድረ ገጽ ሽያጭ",

  titleAccent:
    "ወኪል",

  intro:
    "ድረ ገጽ የሚፈልጉ ትክክለኛ ደንበኞችን ያግኙ፣ ምርቱን በሙያዊ መንገድ ያስተዋውቁ እና በእውነት ፍላጎት ያላቸውን ደንበኞች በቀጥታ ከእኔ ጋር ያገናኙ። በእርስዎ የመጣው ሽያጭ በተሳካ ሁኔታ ሲጠናቀቅ ኮሚሽን ያገኛሉ።",

  commissionOnly:
    "ይህ በኮሚሽን ላይ የተመሰረተ የስራ ዕድል ነው — ቋሚ ደመወዝ የለውም።",

  commission:
    "ኮሚሽን",

  tierOne:
    "35,000 – 50,000 ብር",

  tierOneValue:
    "20%",

  tierTwo:
    "ከ50,000 ብር በላይ",

  tierTwoValue:
    "25%",

  paymentNote:
    "ኮሚሽኑ የሚሰላው የደንበኛው ክፍያ ከደረሰ፣ ከተረጋገጠ እና ሽያጩ በተሳካ ሁኔታ ከተጠናቀቀ በኋላ ነው።",

  step1:
    "የግል መረጃ",

  step2:
    "መገናኛ",

  step3:
    "መታወቂያ",

  step4:
    "ማረጋገጫ",

  step1Title:
    "የግል መረጃ",

  step1Description:
    "ትክክለኛ ህጋዊ መረጃዎን ያስገቡ። የሚያስገቡት መረጃ ከሚያቀርቡት መታወቂያ ጋር መመሳሰል አለበት።",

  fullName:
    "ሙሉ ህጋዊ ስም",

  fullNamePlaceholder:
    "ሙሉ ስምዎን ያስገቡ",

  fatherName:
    "የአባት ስም",

  fatherPlaceholder:
    "የአባትዎን ስም ያስገቡ",

  email:
    "ትክክለኛ ኢሜይል",

  emailPlaceholder:
    "you@example.com",

  phone:
    "ስልክ ቁጥር",

  phonePlaceholder:
    "+251...",

  city:
    "ከተማ",

  cityPlaceholder:
    "ከተማዎን ይምረጡ",

  address:
    "አድራሻ",

  addressPlaceholder:
    "ክፍለ ከተማ፣ አካባቢ ወይም ሰፈር",

  step2Title:
    "መገናኛ እና የስራ ፍላጎት",

  step2Description:
    "እንዴት ልገናኝዎ እንደምችል እና ለዚህ የሽያጭ ስራ ብቁ እንደሆኑ የሚያሳይ አጭር ማብራሪያ ይስጡ።",

  telegram:
    "ቴሌግራም",

  telegramPlaceholder:
    "@username ወይም የቴሌግራም ማስፈንጠሪያ",

  whatsapp:
    "ዋትስአፕ",

  whatsappPlaceholder:
    "+251... ወይም የዋትስአፕ ቁጥር",

  socialRequired:
    "ቢያንስ ከቴሌግራም ወይም ከዋትስአፕ አንዱን መሙላት ያስፈልጋል።",

  motivation:
    "ለዚህ ስራ ብቁ የሚያደርግዎት ምንድን ነው?",

  motivationPlaceholder:
    "ድረ ገጽ የሚፈልጉ ደንበኞችን ለማግኘት፣ በሙያዊ መንገድ ለማነጋገር እና ፍላጎታቸውን ለመለየት ለምን ብቁ እንደሆኑ በአጭሩ ያብራሩ...",

  characters:
    "ፊደላት",

  step3Title:
    "የማንነት ማረጋገጫ",

  step3Description:
    "አንድ ትክክለኛ በመንግስት የተሰጠ መታወቂያ ፊትና ጀርባ ግልጽ ምስሎችን ያስገቡ።",

  idType:
    "የመታወቂያ ዓይነት",

  idTypePlaceholder:
    "የመታወቂያ ዓይነት ይምረጡ",

  frontOfId:
    "የመታወቂያው ፊት",

  frontHelp:
    "ግልጽ JPG፣ PNG ወይም WEBP • ከ8 MB በታች",

  backOfId:
    "የመታወቂያው ጀርባ",

  backHelp:
    "ግልጽ JPG፣ PNG ወይም WEBP • ከ8 MB በታች",

  chooseFile:
    "ፋይል ይምረጡ",

  replaceFile:
    "ቀይር",

  privacyTitle:
    "የግላዊነት ማስታወቂያ",

  privacy:
    "የማመልከቻው የኋላ ስርዓት ገና አልተገናኘም። የመረጡት ፋይሎች በአሳሽዎ ውስጥ ብቻ ይቆያሉ፤ ወደ ምንም ቦታ አይላኩም ወይም አይቀመጡም።",

  step4Title:
    "ደንቦች እና የመጨረሻ ማረጋገጫ",

  step4Description:
    "ማመልከቻዎን ከማስገባትዎ በፊት መረጃዎን ያረጋግጡ እና ሁሉንም ደንቦች በጥንቃቄ ያንብቡ።",

  rulesTitle:
    "የሽያጭ ወኪል ደንቦች",

  reviewTitle:
    "የማመልከቻ ማጠቃለያ",

  reviewName:
    "ስም",

  reviewFatherName:
    "የአባት ስም",

  reviewPhone:
    "ስልክ",

  reviewEmail:
    "ኢሜይል",

  reviewLocation:
    "አካባቢ",

  reviewContact:
    "መገናኛ",

  reviewIdType:
    "የመታወቂያ ዓይነት",

  reviewIdFront:
    "የመታወቂያ ፊት",

  reviewIdBack:
    "የመታወቂያ ጀርባ",

  uploaded:
    "ተመርጧል",

  accept:
    "ሁሉንም የሽያጭ ወኪል ደንቦች እንዳነበብኩ፣ እንደተረዳሁ እና እነሱን ለመከተል እንደተስማማሁ አረጋግጣለሁ።",

  previous:
    "ወደ ኋላ",

  next:
    "ቀጥል",

  submit:
    "ማመልከቻውን አስገባ",

  backToPortfolio:
    "ወደ ፖርትፎሊዮ ተመለስ",

  successEyebrow:
    "ማመልከቻው ተጠናቋል",

  successTitle:
    "ማመልከቻዎ ዝግጁ ነው",

  successDescription:
    "የማመልከቻ ገጹ ተጠናቋል፣ ነገር ግን የኋላ ስርዓቱ ገና አልተገናኘም። ምንም የግል መረጃ ወይም የመታወቂያ ሰነድ አልተላከም ወይም አልተቀመጠም።",

  successButton:
    "ወደ ፖርትፎሊዮ ተመለስ",

  required:
    "ይህን መረጃ መሙላት ያስፈልጋል።",

  invalidEmail:
    "ትክክለኛ የኢሜይል አድራሻ ያስገቡ።",

  invalidPhone:
    "ትክክለኛ የስልክ ቁጥር ያስገቡ።",

  motivationLength:
    "መልስዎ ከ20 እስከ 200 ፊደላት መካከል መሆን አለበት።",

  invalidFile:
    "ከ8 MB በታች የሆነ JPG፣ PNG ወይም WEBP ፋይል ያስገቡ።",

  rulesRequired:
    "ማመልከቻዎን ከማስገባትዎ በፊት ደንቦቹን መቀበል አለብዎት።",

  roleOverview:
    "የስራው አጭር መግለጫ",

  roleTitle:
    "ትክክለኛውን ደንበኛ ያግኙ።",

  roleTitleAccent:
    "ከሽያጩ ኮሚሽን ያግኙ።",

  roleDescription:
    "ዋና ሚናዎ ድረ ገጽ የሚፈልጉ ብቁ ደንበኞችን ማግኘትና በሙያዊ መንገድ ማነጋገር ነው። ቴክኒካዊ ውይይት፣ የመጨረሻ ዋጋ እና የፕሮጀክት ማረጋገጫ በቀጥታ ከእኔ ጋር ይካሄዳል።",

  roleSteps: [
    "ሙያዊ ድረ ገጽ የሚፈልግ ድርጅት፣ ንግድ ወይም ግለሰብ ያግኙ።",

    "ምርቱን በሙያዊ መንገድ ያቅርቡ እና እውነተኛ አቅሙን በትክክል ያብራሩ።",

    "ደንበኛው በእውነት ፍላጎት ሲያሳይ በቀጥታ ከእኔ ጋር ያገናኙት።",

    "ብቁ የሆነው ሽያጭ እና የደንበኛው ክፍያ ከተረጋገጠ በኋላ ኮሚሽንዎን ይቀበሉ።",
  ],

  warning:
    "በእኔ ስም ከደንበኛ ገንዘብ መቀበል ወይም መሰብሰብ አይፈቀድም።",

  rules: [
    {
      title:
        "የኮሚሽን አወቃቀር",

      text:
        "ከ35,000 እስከ 50,000 ብር በተሳካ ሁኔታ ለተጠናቀቀ ሽያጭ 20% ኮሚሽን ይከፈላል። ከ50,000 ብር በላይ ለሆነ የተሳካ ሽያጭ 25% ኮሚሽን ይከፈላል። ከ35,000 ብር በታች ያለ ሽያጭ በቅድሚያ ልዩ ፈቃድ ይፈልጋል።",
    },

    {
      title:
        "ያልተፈቀደ ቅናሽ አይሰጥም",

      text:
        "ደንበኛን ለማሳመን የራስዎን ኮሚሽን እንደ ቅናሽ መጠቀም አይፈቀድም። ማንኛውም የዋጋ ቅናሽ ወይም ልዩ አቅርቦት ለደንበኛ ከመነገሩ በፊት መፈቀድ አለበት።",
    },

    {
      title:
        "ከደንበኛ ገንዘብ አይቀበሉ",

      text:
        "በእኔ ስም ቅድመ ክፍያ፣ ጥሬ ገንዘብ፣ የባንክ ዝውውር ወይም ሌላ የደንበኛ ክፍያ ለመቀበል ፈቃድ የለዎትም። ሁሉም ክፍያዎች በእኔ በተሰጠው የክፍያ መንገድ በቀጥታ መከፈል አለባቸው።",
    },

    {
      title:
        "ሚናዎን በትክክል ያስተዋውቁ",

      text:
        "ደንበኞችን ሲያነጋግሩ እራስዎን እንደ ሽያጭ ወኪል ወይም ሻጭ ያስተዋውቁ። እራስዎን የስርዓቱ ገንቢ፣ ባለቤት ወይም ቴክኒካዊ ባለሙያ አድርገው ማቅረብ አይፈቀድም።",
    },

    {
      title:
        "ሙያዊ ግንኙነት",

      text:
        "የስልክ ጥሪዎች፣ መልዕክቶች እና ስብሰባዎች ሁሉ በሙያዊ መንገድ መካሄድ አለባቸው። በግልጽ፣ በአክብሮት እና በእርግጠኝነት ይናገሩ። ጫና የሚፈጥር ሽያጭ፣ ክርክር ወይም ተገቢ ያልሆነ ንግግር አይፈቀድም።",
    },

    {
      title:
        "ሙያዊ ስብሰባ",

      text:
        "በአካል የሚደረግ ስብሰባ ከሆነ በሰዓቱ ይገኙ፣ ተገቢ እና ንጹህ አለባበስ ይኑርዎት፣ እንዲሁም ንግዱን በሙያዊ መንገድ ይወክሉ።",
    },

    {
      title:
        "ምርቱን በደንብ ይረዱ",

      text:
        "ደንበኛን ከማነጋገርዎ በፊት ድረ ገጹ ወይም አገልግሎቱ ምን እንደሚሰራ፣ ምን እንደማይሰራ እና ያሉትን ባህሪያት በግልጽ ይረዱ። ስለ አንድ ባህሪ እርግጠኛ ካልሆኑ በቅድሚያ ይጠይቁ።",
    },

    {
      title:
        "የሐሰት መረጃ አይስጡ",

      text:
        "ሽያጭን ለማጠናቀቅ ብቻ የሌሉ ባህሪያት፣ ዋስትናዎች፣ ቴክኒካዊ አቅሞች ወይም ሌሎች የሐሰት መረጃዎችን መናገር አይፈቀድም።",
    },

    {
      title:
        "ደንበኛን ማስተላለፍ",

      text:
        "ደንበኛው በእውነት ፍላጎት ካሳየ፣ ፍላጎቶቹ፣ ዋጋ፣ ማሻሻያ እና የማስረከቢያ ጊዜ እንዲረጋገጡ በስልክ፣ በቴሌግራም ወይም በዋትስአፕ በቀጥታ ከእኔ ጋር ያገናኙት።",
    },

    {
      title:
        "ዋጋ እና ማስረከቢያ",

      text:
        "በቅድሚያ ያልተፈቀደ ልዩ ዋጋ፣ ቅናሽ፣ የማስረከቢያ ቀን፣ ተጨማሪ ባህሪ፣ የጥገና ጊዜ ወይም የድጋፍ ሁኔታ ለደንበኛ ቃል መግባት አይፈቀድም።",
    },

    {
      title:
        "የደንበኛ ምዝገባ",

      text:
        "ሊገዛ የሚችል ደንበኛ ወደ መጨረሻ ሽያጭ ከመድረሱ በፊት ለእኔ ማሳወቅ አለብዎት። ይህም ደንበኛው በእርስዎ እንደተገኘ በትክክል እንዲመዘገብ ያደርጋል። ቀድሞ ከእኔ ጋር በውይይት ላይ የነበረ ደንበኛ ለኮሚሽን ላይቆጠር ይችላል።",
    },

    {
      title:
        "የደንበኛ ግላዊነት",

      text:
        "የደንበኛ ስልክ ቁጥር፣ ኢሜይል፣ የንግድ መረጃ፣ የፕሮጀክት ፍላጎቶች እና የግል ውይይቶች በሚስጥር መጠበቅ አለባቸው።",
    },

    {
      title:
        "ስፓም፣ ማጭበርበር እና ትንኮሳ አይፈቀድም",

      text:
        "የሐሰት ማንነት፣ አሳሳች ማስታወቂያ፣ የሐሰት ምስክርነት፣ የጅምላ ስፓም፣ ትንኮሳ፣ ሌላ ሰው መምሰል ወይም ማጭበርበር በመጠቀም ደንበኛ ማግኘት በጥብቅ የተከለከለ ነው።",
    },

    {
      title:
        "ለኮሚሽን ብቁ የሚሆን ሽያጭ",

      text:
        "ኮሚሽን የሚከፈለው የደንበኛው ብቁ ክፍያ በተሳካ ሁኔታ ከደረሰ እና ሽያጩ ከተረጋገጠ በኋላ ብቻ ነው። የተሰረዘ፣ ገንዘቡ የተመለሰበት ወይም ክፍያው የተመለሰ ሽያጭ ኮሚሽን አያስገኝም።",
    },

    {
      title:
        "የደንብ ጥሰት",

      text:
        "ከባድ ወይም ተደጋጋሚ የደንብ ጥሰት የሽያጭ ግንኙነቱ እንዲቋረጥ ሊያደርግ ይችላል። ያልተፈቀደ ተግባር ያለበት ሽያጭም ለኮሚሽን ብቁ ላይሆን ይችላል።",
    },
  ],
};

/* =========================================================
   ICONS
   ========================================================= */

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
        r="4"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M4.5 20C5.4 16.4 8.1 14.5 12 14.5C15.9 14.5 18.6 16.4 19.5 20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 18L3.5 21L7.5 19.3C8.8 19.8 10.3 20 12 20C17 20 21 16.6 21 12.5C21 8.4 17 5 12 5C7 5 3 8.4 3 12.5C3 14.6 3.8 16.5 5 18Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IdentityIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="14"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <circle
        cx="8"
        cy="11"
        r="2"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      <path
        d="M5.5 16C6 14.4 6.8 13.5 8 13.5C9.2 13.5 10 14.4 10.5 16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      <path
        d="M13 9H18M13 12H18M13 15H16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ReviewIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M5 4H19V20H5V4Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />

      <path
        d="M8 9L10 11L14 7"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M8 15H16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M12 16V5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />

      <path
        d="M8 9L12 5L16 9"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <path
        d="M5 14V19H19V14"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
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
        d="M12 3L19 6V11C19 15.5 16.2 19.3 12 21C7.8 19.3 5 15.5 5 11V6L12 3Z"
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
        r="9"
        stroke="currentColor"
        strokeWidth="1.7"
      />

      <path
        d="M15 9.2C14.2 8.4 13.2 8 12 8C10.5 8 9.5 8.7 9.5 9.8C9.5 12.5 15 10.7 15 14C15 15.2 13.9 16 12.2 16C10.8 16 9.6 15.5 8.8 14.7"
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

function ArrowIcon({
  direction = "right",
}: {
  direction?: "left" | "right";
}) {
  return (
    <span
      aria-hidden="true"
      className={
        direction === "left"
          ? "hire-arrow hire-arrow--left"
          : "hire-arrow"
      }
    >
      →
    </span>
  );
}

function StepIcon({
  step,
}: {
  step: Step;
}) {
  if (step === 1) {
    return <UserIcon />;
  }

  if (step === 2) {
    return <ChatIcon />;
  }

  if (step === 3) {
    return <IdentityIcon />;
  }

  return <ReviewIcon />;
}

/* =========================================================
   ERROR
   ========================================================= */

function ErrorMessage({
  children,
}: {
  children?: ReactNode;
}) {
  if (!children) {
    return null;
  }

  return (
    <span className="hire-field-error">
      {children}
    </span>
  );
}

/* =========================================================
   UPLOAD
   ========================================================= */

type UploadFieldProps = {
  title: string;
  description: string;

  file: File | null;

  accept: string;

  chooseLabel: string;
  replaceLabel: string;

  error?: string;

  onChange: (
    event: ChangeEvent<HTMLInputElement>,
  ) => void;
};

function UploadField({
  title,
  description,
  file,
  accept,
  chooseLabel,
  replaceLabel,
  error,
  onChange,
}: UploadFieldProps) {
  return (
    <label
      className={`hire-upload ${
        error
          ? "hire-upload--error"
          : ""
      }`}
    >
      <input
        type="file"
        accept={accept}
        onChange={onChange}
      />

      <span className="hire-upload-icon">
        <UploadIcon />
      </span>

      <span className="hire-upload-content">
        <strong>
          {title}

          <em>*</em>
        </strong>

        <span>
          {file
            ? file.name
            : description}
        </span>
      </span>

      <span className="hire-upload-action">
        {file
          ? replaceLabel
          : chooseLabel}
      </span>

      <ErrorMessage>
        {error}
      </ErrorMessage>
    </label>
  );
}

/* =========================================================
   COMPONENT
   ========================================================= */

export default function HireApplication() {
  const router =
    useRouter();

  const { language } =
    useLanguage();

  const copy =
    language === "am"
      ? amharicCopy
      : englishCopy;

  const sectionRef =
    useRef<HTMLElement | null>(
      null,
    );

  const [
    step,
    setStep,
  ] = useState<Step>(1);

  const [
    errors,
    setErrors,
  ] = useState<Errors>({});

  const [
    submitted,
    setSubmitted,
  ] = useState(false);

  const [
    data,
    setData,
  ] =
    useState<ApplicationData>({
      fullName: "",
      fatherName: "",

      email: "",
      phone: "",

      city: "",
      address: "",

      telegram: "",
      whatsapp: "",

      motivation: "",

      idType: "",

      idFront: null,
      idBack: null,

      acceptedRules: false,
    });

  const stepItems = [
    {
      step: 1 as const,
      label: copy.step1,
    },
    {
      step: 2 as const,
      label: copy.step2,
    },
    {
      step: 3 as const,
      label: copy.step3,
    },
    {
      step: 4 as const,
      label: copy.step4,
    },
  ];

  const selectedCity =
    cityOptions.find(
      (city) =>
        city.value === data.city,
    );

  const selectedIdType =
    idTypeOptions.find(
      (type) =>
        type.value === data.idType,
    );

  function updateField(
    field:
      | "fullName"
      | "fatherName"
      | "email"
      | "phone"
      | "city"
      | "address"
      | "telegram"
      | "whatsapp"
      | "motivation"
      | "idType",
    value: string,
  ) {
    setData(
      (current) => ({
        ...current,
        [field]: value,
      }),
    );

    setErrors(
      (current) => ({
        ...current,
        [field]: "",
      }),
    );
  }

  function validEmail(
    email: string,
  ) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
      email,
    );
  }

  function validPhone(
    phone: string,
  ) {
    const compact =
      phone.replace(
        /[\s()-]/g,
        "",
      );

    return /^\+?\d{9,15}$/.test(
      compact,
    );
  }

  function validateStep() {
    const nextErrors: Errors =
      {};

    if (step === 1) {
      if (!data.fullName.trim()) {
        nextErrors.fullName =
          copy.required;
      }

      if (!data.fatherName.trim()) {
        nextErrors.fatherName =
          copy.required;
      }

      if (!data.email.trim()) {
        nextErrors.email =
          copy.required;
      } else if (
        !validEmail(data.email)
      ) {
        nextErrors.email =
          copy.invalidEmail;
      }

      if (!data.phone.trim()) {
        nextErrors.phone =
          copy.required;
      } else if (
        !validPhone(data.phone)
      ) {
        nextErrors.phone =
          copy.invalidPhone;
      }

      if (!data.city) {
        nextErrors.city =
          copy.required;
      }

      if (!data.address.trim()) {
        nextErrors.address =
          copy.required;
      }
    }

    if (step === 2) {
      if (
        !data.telegram.trim() &&
        !data.whatsapp.trim()
      ) {
        nextErrors.social =
          copy.socialRequired;
      }

      const length =
        data.motivation
          .trim()
          .length;

      if (
        length < 20 ||
        length > 200
      ) {
        nextErrors.motivation =
          copy.motivationLength;
      }
    }

    if (step === 3) {
      if (!data.idType) {
        nextErrors.idType =
          copy.required;
      }

      if (!data.idFront) {
        nextErrors.idFront =
          copy.required;
      }

      if (!data.idBack) {
        nextErrors.idBack =
          copy.required;
      }
    }

    if (step === 4) {
      if (!data.acceptedRules) {
        nextErrors.rules =
          copy.rulesRequired;
      }
    }

    setErrors(nextErrors);

    return (
      Object.keys(nextErrors)
        .length === 0
    );
  }

  function moveToStep(
    nextStep: Step,
  ) {
    setStep(nextStep);

    window.requestAnimationFrame(
      () => {
        sectionRef.current?.scrollIntoView(
          {
            behavior: "smooth",
            block: "start",
          },
        );
      },
    );
  }

  function nextStep() {
    if (!validateStep()) {
      return;
    }

    if (step < 4) {
      moveToStep(
        (step + 1) as Step,
      );
    }
  }

  function previousStep() {
    if (step === 1) {
      router.push("/");

      return;
    }

    moveToStep(
      (step - 1) as Step,
    );
  }

  function handleFile(
    field: FileField,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.currentTarget
        .files?.[0];

    if (!file) {
      return;
    }

    const allowedImages = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (
      !allowedImages.includes(
        file.type,
      ) ||
      file.size >
        MAX_FILE_SIZE
    ) {
      setErrors(
        (current) => ({
          ...current,
          [field]:
            copy.invalidFile,
        }),
      );

      event.currentTarget.value =
        "";

      return;
    }

    setData(
      (current) => ({
        ...current,
        [field]: file,
      }),
    );

    setErrors(
      (current) => ({
        ...current,
        [field]: "",
      }),
    );
  }

  function submitApplication() {
    if (!validateStep()) {
      return;
    }

    /*
     * FRONTEND PROTOTYPE ONLY.
     * No data is sent anywhere yet.
     */

    setSubmitted(true);

    window.requestAnimationFrame(
      () => {
        sectionRef.current?.scrollIntoView(
          {
            behavior: "smooth",
            block: "start",
          },
        );
      },
    );
  }

  /* =========================================================
     SUCCESS
     ========================================================= */

  if (submitted) {
    return (
      <section
        ref={sectionRef}
        className="hire-application hire-application--success"
      >
        <div className="hire-success-card">
          <span className="hire-success-icon">
            <ShieldIcon />
          </span>

          <span className="hire-success-eyebrow">
            {copy.successEyebrow}
          </span>

          <h1>
            {copy.successTitle}
          </h1>

          <p>
            {
              copy.successDescription
            }
          </p>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
          >
            {
              copy.successButton
            }

            <ArrowIcon />
          </button>
        </div>
      </section>
    );
  }

  return (
    <section
      ref={sectionRef}
      className="hire-application"
    >
      <div className="hire-page-container">
        {/* =================================================
            HERO
           ================================================= */}

        <div className="hire-page-hero">
          <div className="hire-page-hero-copy">
            <span className="hire-page-eyebrow">
              <i />

              {copy.eyebrow}
            </span>

            <h1>
              {copy.titleStart}{" "}

              <span>
                {
                  copy.titleAccent
                }
              </span>
            </h1>

            <p>
              {copy.intro}
            </p>

            <div className="hire-role-note">
              <span>
                !
              </span>

              {
                copy.commissionOnly
              }
            </div>
          </div>

          <div className="hire-commission-card">
            <div className="hire-commission-head">
              <span className="hire-commission-icon">
                <MoneyIcon />
              </span>

              <span>
                {copy.commission}
              </span>
            </div>

            <div className="hire-commission-tiers">
              <div>
                <span>
                  {copy.tierOne}
                </span>

                <strong>
                  {
                    copy.tierOneValue
                  }
                </strong>
              </div>

              <div>
                <span>
                  {copy.tierTwo}
                </span>

                <strong>
                  {
                    copy.tierTwoValue
                  }
                </strong>
              </div>
            </div>

            <p>
              {copy.paymentNote}
            </p>
          </div>
        </div>

        {/* =================================================
            PROGRESS
           ================================================= */}

        <div className="hire-progress">
          {stepItems.map(
            (
              item,
              index,
            ) => {
              const completed =
                step >
                item.step;

              const active =
                step ===
                item.step;

              return (
                <div
                  key={
                    item.step
                  }
                  className={`hire-progress-item ${
                    completed
                      ? "hire-progress-item--complete"
                      : ""
                  } ${
                    active
                      ? "hire-progress-item--active"
                      : ""
                  }`}
                >
                  <div className="hire-progress-node">
                    {completed ? (
                      "✓"
                    ) : (
                      <StepIcon
                        step={
                          item.step
                        }
                      />
                    )}
                  </div>

                  <span>
                    {item.label}
                  </span>

                  {index <
                    stepItems.length -
                      1 && (
                    <div className="hire-progress-line">
                      <span />
                    </div>
                  )}
                </div>
              );
            },
          )}
        </div>

        {/* =================================================
            CONTENT
           ================================================= */}

        <div className="hire-form-layout">
          <div className="hire-form-card">
            <div
              key={`step-${step}`}
              className="hire-step"
            >
              {/* ===========================================
                  STEP 1
                 =========================================== */}

              {step === 1 && (
                <>
                  <header className="hire-step-header">
                    <span>
                      01
                    </span>

                    <div>
                      <h2>
                        {
                          copy.step1Title
                        }
                      </h2>

                      <p>
                        {
                          copy.step1Description
                        }
                      </p>
                    </div>
                  </header>

                  <div className="hire-fields-grid">
                    <label className="hire-field">
                      <span>
                        {copy.fullName}{" "}

                        <em>*</em>
                      </span>

                      <input
                        value={
                          data.fullName
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            "fullName",
                            event.target
                              .value,
                          )
                        }
                        placeholder={
                          copy.fullNamePlaceholder
                        }
                        autoComplete="name"
                      />

                      <ErrorMessage>
                        {
                          errors.fullName
                        }
                      </ErrorMessage>
                    </label>

                    <label className="hire-field">
                      <span>
                        {
                          copy.fatherName
                        }{" "}

                        <em>*</em>
                      </span>

                      <input
                        value={
                          data.fatherName
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            "fatherName",
                            event.target
                              .value,
                          )
                        }
                        placeholder={
                          copy.fatherPlaceholder
                        }
                      />

                      <ErrorMessage>
                        {
                          errors.fatherName
                        }
                      </ErrorMessage>
                    </label>

                    <label className="hire-field">
                      <span>
                        {copy.email}{" "}

                        <em>*</em>
                      </span>

                      <input
                        type="email"
                        value={
                          data.email
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            "email",
                            event.target
                              .value,
                          )
                        }
                        placeholder={
                          copy.emailPlaceholder
                        }
                        autoComplete="email"
                      />

                      <ErrorMessage>
                        {
                          errors.email
                        }
                      </ErrorMessage>
                    </label>

                    <label className="hire-field">
                      <span>
                        {copy.phone}{" "}

                        <em>*</em>
                      </span>

                      <input
                        type="tel"
                        value={
                          data.phone
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            "phone",
                            event.target
                              .value,
                          )
                        }
                        placeholder={
                          copy.phonePlaceholder
                        }
                        autoComplete="tel"
                      />

                      <ErrorMessage>
                        {
                          errors.phone
                        }
                      </ErrorMessage>
                    </label>

                    <label className="hire-field">
                      <span>
                        {copy.city}{" "}

                        <em>*</em>
                      </span>

                      <select
                        value={
                          data.city
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            "city",
                            event.target
                              .value,
                          )
                        }
                      >
                        <option value="">
                          {
                            copy.cityPlaceholder
                          }
                        </option>

                        {cityOptions.map(
                          (city) => (
                            <option
                              key={
                                city.value
                              }
                              value={
                                city.value
                              }
                            >
                              {
                                language ===
                                "am"
                                  ? city.am
                                  : city.en
                              }
                            </option>
                          ),
                        )}
                      </select>

                      <ErrorMessage>
                        {
                          errors.city
                        }
                      </ErrorMessage>
                    </label>

                    <label className="hire-field">
                      <span>
                        {copy.address}{" "}

                        <em>*</em>
                      </span>

                      <input
                        value={
                          data.address
                        }
                        onChange={(
                          event,
                        ) =>
                          updateField(
                            "address",
                            event.target
                              .value,
                          )
                        }
                        placeholder={
                          copy.addressPlaceholder
                        }
                        autoComplete="street-address"
                      />

                      <ErrorMessage>
                        {
                          errors.address
                        }
                      </ErrorMessage>
                    </label>
                  </div>
                </>
              )}

              {/* ===========================================
                  STEP 2
                 =========================================== */}

              {step === 2 && (
                <>
                  <header className="hire-step-header">
                    <span>
                      02
                    </span>

                    <div>
                      <h2>
                        {
                          copy.step2Title
                        }
                      </h2>

                      <p>
                        {
                          copy.step2Description
                        }
                      </p>
                    </div>
                  </header>

                  <div className="hire-fields-grid">
                    <label className="hire-field">
                      <span>
                        {copy.telegram}
                      </span>

                      <input
                        value={
                          data.telegram
                        }
                        onChange={(
                          event,
                        ) => {
                          updateField(
                            "telegram",
                            event.target
                              .value,
                          );

                          setErrors(
                            (
                              current,
                            ) => ({
                              ...current,
                              social: "",
                            }),
                          );
                        }}
                        placeholder={
                          copy.telegramPlaceholder
                        }
                      />
                    </label>

                    <label className="hire-field">
                      <span>
                        {copy.whatsapp}
                      </span>

                      <input
                        value={
                          data.whatsapp
                        }
                        onChange={(
                          event,
                        ) => {
                          updateField(
                            "whatsapp",
                            event.target
                              .value,
                          );

                          setErrors(
                            (
                              current,
                            ) => ({
                              ...current,
                              social: "",
                            }),
                          );
                        }}
                        placeholder={
                          copy.whatsappPlaceholder
                        }
                      />
                    </label>
                  </div>

                  <ErrorMessage>
                    {errors.social}
                  </ErrorMessage>

                  <label className="hire-field hire-field--textarea">
                    <span>
                      {
                        copy.motivation
                      }{" "}

                      <em>*</em>

                      <small>
                        {
                          data.motivation
                            .length
                        }
                        /200{" "}
                        {
                          copy.characters
                        }
                      </small>
                    </span>

                    <textarea
                      rows={7}
                      maxLength={200}
                      value={
                        data.motivation
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "motivation",
                          event.target
                            .value,
                        )
                      }
                      placeholder={
                        copy.motivationPlaceholder
                      }
                    />

                    <ErrorMessage>
                      {
                        errors.motivation
                      }
                    </ErrorMessage>
                  </label>
                </>
              )}

              {/* ===========================================
                  STEP 3
                 =========================================== */}

              {step === 3 && (
                <>
                  <header className="hire-step-header">
                    <span>
                      03
                    </span>

                    <div>
                      <h2>
                        {
                          copy.step3Title
                        }
                      </h2>

                      <p>
                        {
                          copy.step3Description
                        }
                      </p>
                    </div>
                  </header>

                  <label className="hire-field">
                    <span>
                      {copy.idType}{" "}

                      <em>*</em>
                    </span>

                    <select
                      value={
                        data.idType
                      }
                      onChange={(
                        event,
                      ) =>
                        updateField(
                          "idType",
                          event.target
                            .value,
                        )
                      }
                    >
                      <option value="">
                        {
                          copy.idTypePlaceholder
                        }
                      </option>

                      {idTypeOptions.map(
                        (
                          type,
                        ) => (
                          <option
                            key={
                              type.value
                            }
                            value={
                              type.value
                            }
                          >
                            {
                              language ===
                              "am"
                                ? type.am
                                : type.en
                            }
                          </option>
                        ),
                      )}
                    </select>

                    <ErrorMessage>
                      {
                        errors.idType
                      }
                    </ErrorMessage>
                  </label>

                  <div className="hire-upload-grid">
                    <UploadField
                      title={
                        copy.frontOfId
                      }
                      description={
                        copy.frontHelp
                      }
                      file={
                        data.idFront
                      }
                      accept="image/jpeg,image/png,image/webp"
                      chooseLabel={
                        copy.chooseFile
                      }
                      replaceLabel={
                        copy.replaceFile
                      }
                      error={
                        errors.idFront
                      }
                      onChange={(
                        event,
                      ) =>
                        handleFile(
                          "idFront",
                          event,
                        )
                      }
                    />

                    <UploadField
                      title={
                        copy.backOfId
                      }
                      description={
                        copy.backHelp
                      }
                      file={
                        data.idBack
                      }
                      accept="image/jpeg,image/png,image/webp"
                      chooseLabel={
                        copy.chooseFile
                      }
                      replaceLabel={
                        copy.replaceFile
                      }
                      error={
                        errors.idBack
                      }
                      onChange={(
                        event,
                      ) =>
                        handleFile(
                          "idBack",
                          event,
                        )
                      }
                    />
                  </div>

                  <div className="hire-privacy-note">
                    <span>
                      <ShieldIcon />
                    </span>

                    <div>
                      <strong>
                        {
                          copy.privacyTitle
                        }
                      </strong>

                      <p>
                        {copy.privacy}
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* ===========================================
                  STEP 4
                 =========================================== */}

              {step === 4 && (
                <>
                  <header className="hire-step-header">
                    <span>
                      04
                    </span>

                    <div>
                      <h2>
                        {
                          copy.step4Title
                        }
                      </h2>

                      <p>
                        {
                          copy.step4Description
                        }
                      </p>
                    </div>
                  </header>

                  <div className="hire-review-summary">
                    <h3>
                      {
                        copy.reviewTitle
                      }
                    </h3>

                    <div className="hire-review-grid">
                      <div>
                        <span>
                          {
                            copy.reviewName
                          }
                        </span>

                        <strong>
                          {
                            data.fullName
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            copy.reviewFatherName
                          }
                        </span>

                        <strong>
                          {
                            data.fatherName
                          }
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            copy.reviewPhone
                          }
                        </span>

                        <strong>
                          {data.phone}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            copy.reviewEmail
                          }
                        </span>

                        <strong>
                          {data.email}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            copy.reviewLocation
                          }
                        </span>

                        <strong>
                          {selectedCity
                            ? language ===
                              "am"
                              ? selectedCity.am
                              : selectedCity.en
                            : data.city}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            copy.reviewContact
                          }
                        </span>

                        <strong>
                          {data.telegram ||
                            data.whatsapp}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            copy.reviewIdType
                          }
                        </span>

                        <strong>
                          {selectedIdType
                            ? language ===
                              "am"
                              ? selectedIdType.am
                              : selectedIdType.en
                            : data.idType}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            copy.reviewIdFront
                          }
                        </span>

                        <strong>
                          {data.idFront
                            ?.name ??
                            copy.uploaded}
                        </strong>
                      </div>

                      <div>
                        <span>
                          {
                            copy.reviewIdBack
                          }
                        </span>

                        <strong>
                          {data.idBack
                            ?.name ??
                            copy.uploaded}
                        </strong>
                      </div>
                    </div>
                  </div>

                  <div className="hire-rules">
                    <div className="hire-rules-header">
                      <span>
                        <ShieldIcon />
                      </span>

                      <h3>
                        {
                          copy.rulesTitle
                        }
                      </h3>
                    </div>

                    <div className="hire-rule-list">
                      {copy.rules.map(
                        (
                          rule,
                          index,
                        ) => (
                          <article
                            key={
                              rule.title
                            }
                            className="hire-rule"
                          >
                            <span>
                              {String(
                                index +
                                  1,
                              ).padStart(
                                2,
                                "0",
                              )}
                            </span>

                            <div>
                              <h4>
                                {
                                  rule.title
                                }
                              </h4>

                              <p>
                                {
                                  rule.text
                                }
                              </p>
                            </div>
                          </article>
                        ),
                      )}
                    </div>
                  </div>

                  <label className="hire-agreement">
                    <input
                      type="checkbox"
                      checked={
                        data.acceptedRules
                      }
                      onChange={(
                        event,
                      ) => {
                        setData(
                          (
                            current,
                          ) => ({
                            ...current,
                            acceptedRules:
                              event.target
                                .checked,
                          }),
                        );

                        setErrors(
                          (
                            current,
                          ) => ({
                            ...current,
                            rules: "",
                          }),
                        );
                      }}
                    />

                    <span className="hire-checkbox" />

                    <span>
                      {copy.accept}
                    </span>
                  </label>

                  <ErrorMessage>
                    {errors.rules}
                  </ErrorMessage>
                </>
              )}
            </div>

            {/* =================================================
                NAVIGATION
               ================================================= */}

            <div className="hire-form-navigation">
              <button
                type="button"
                onClick={
                  previousStep
                }
                className="hire-form-back"
              >
                <ArrowIcon direction="left" />

                {step === 1
                  ? copy.backToPortfolio
                  : copy.previous}
              </button>

              {step < 4 ? (
                <button
                  type="button"
                  onClick={
                    nextStep
                  }
                  className="hire-form-next"
                >
                  {copy.next}

                  <ArrowIcon />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={
                    submitApplication
                  }
                  className="hire-form-submit"
                >
                  {copy.submit}

                  <ArrowIcon />
                </button>
              )}
            </div>
          </div>

          {/* =================================================
              ROLE OVERVIEW
             ================================================= */}

          <aside className="hire-side-panel">
            <span className="hire-side-label">
              {copy.roleOverview}
            </span>

            <h3>
              {copy.roleTitle}

              <br />

              <span>
                {
                  copy.roleTitleAccent
                }
              </span>
            </h3>

            <p>
              {
                copy.roleDescription
              }
            </p>

            <div className="hire-side-points">
              {copy.roleSteps.map(
                (
                  text,
                  index,
                ) => (
                  <div
                    key={text}
                  >
                    <span>
                      {String(
                        index + 1,
                      ).padStart(
                        2,
                        "0",
                      )}
                    </span>

                    <p>
                      {text}
                    </p>
                  </div>
                ),
              )}
            </div>

            <div className="hire-side-warning">
              <ShieldIcon />

              <p>
                {copy.warning}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}