export type LocalizedText = {
  en: string;
  am: string;
};

export type ProjectStep = {
  title: LocalizedText;
  description: LocalizedText;
};

export type Project = {
  slug: string;

  title: string;

  category: LocalizedText;

  shortDescription: LocalizedText;

  description: LocalizedText;

  thumbnail: string;

  technologies: string[];

  year: string;

  status: LocalizedText;

  role: LocalizedText;

  overview: LocalizedText;

  challenge: LocalizedText;

  solution: LocalizedText;

  howItWorks: ProjectStep[];

  features: LocalizedText[];

  liveUrl?: string;

  githubUrl?: string;

  featured: boolean;
};

export const projects: Project[] = [
  {
    slug: "gym-house-website",

    title: "Gym House",

    category: {
      en: "Full-Stack Gym Platform",
      am: "ፉል-ስታክ የጂም ፕላትፎርም",
    },

    shortDescription: {
      en: "A modern gym management platform with customer accounts, membership tracking and a complete admin system.",
      am: "የደንበኛ አካውንት፣ የአባልነት ክትትል እና የአስተዳዳሪ ስርዓት ያለው ዘመናዊ የጂም ማስተዳደሪያ ፕላትፎርም።",
    },

    description: {
      en: "Gym House is a full-stack gym and membership management system built to give customers a polished digital experience while providing administrators with powerful tools for managing members, accounts and memberships.",
      am: "Gym House ለደንበኞች ዘመናዊ ዲጂታል ተሞክሮ እና ለአስተዳዳሪዎች የአባላት፣ አካውንቶች እና አባልነቶች ማስተዳደሪያ መሳሪያዎችን የሚሰጥ ፉል-ስታክ ስርዓት ነው።",
    },

    thumbnail:
      "/images/projects/gym-house-thumbnail.png",

    technologies: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Express",
      "PostgreSQL",
      "Cloudinary",
    ],

    year: "2026",

    status: {
      en: "Production Project",
      am: "የProduction ፕሮጀክት",
    },

    role: {
      en: "Full-Stack Development & UI/UX",
      am: "ፉል-ስታክ ዴቨሎፕመንት እና UI/UX",
    },

    overview: {
      en: "The platform connects the public-facing gym website, customer accounts and an administrator dashboard into one system. Customers can securely access their membership information while administrators can manage customer accounts, membership plans and account status.",
      am: "ፕላትፎርሙ የጂሙን ዋና ድረ-ገጽ፣ የደንበኛ አካውንቶች እና የአስተዳዳሪ ዳሽቦርድን በአንድ ስርዓት ያገናኛል።",
    },

    challenge: {
      en: "The challenge was to create something that feels like a premium fitness website on the frontend while still supporting real account management, secure authentication and membership operations behind the scenes.",
      am: "ዋናው ፈተና በFrontend ላይ ዘመናዊ እና premium የሚመስል፣ በBackend ላይ ደግሞ እውነተኛ የአካውንት፣ authentication እና የአባልነት አስተዳደር ያለው ስርዓት መገንባት ነበር።",
    },

    solution: {
      en: "I separated the public experience, authentication system and administrator operations into clear layers. The backend owns authorization and membership rules while the frontend focuses on a fast, responsive and polished experience.",
      am: "የህዝብ ድረ-ገጹን፣ authentication ስርዓቱን እና የadmin ስራዎችን በግልጽ ክፍሎች ከፍዬ ገንብቻለሁ። Backend የauthorization እና membership ህጎችን ይቆጣጠራል።",
    },

    howItWorks: [
      {
        title: {
          en: "Secure Authentication",
          am: "ደህንነቱ የተጠበቀ Authentication",
        },

        description: {
          en: "Customers and administrators authenticate through protected backend sessions with role-based access.",
          am: "ደንበኞች እና admins በprotected backend sessions እና role-based access ይገባሉ።",
        },
      },

      {
        title: {
          en: "Customer Management",
          am: "የደንበኛ አስተዳደር",
        },

        description: {
          en: "Administrators can create and manage customer accounts, profile images and account status.",
          am: "Admins የደንበኛ አካውንቶችን፣ profile image እና account status ማስተዳደር ይችላሉ።",
        },
      },

      {
        title: {
          en: "Membership Tracking",
          am: "የአባልነት ክትትል",
        },

        description: {
          en: "Membership start dates, expiration dates and current status are calculated and tracked by the system.",
          am: "የአባልነት መጀመሪያ፣ ማብቂያ ቀን እና status በስርዓቱ ይከታተላሉ።",
        },
      },

      {
        title: {
          en: "Customer Experience",
          am: "የደንበኛ ተሞክሮ",
        },

        description: {
          en: "Customers receive a responsive account experience designed for both mobile and desktop.",
          am: "ደንበኞች ለmobile እና desktop የተዘጋጀ responsive account experience ያገኛሉ።",
        },
      },
    ],

    features: [
      {
        en: "Role-based authentication",
        am: "Role-based authentication",
      },
      {
        en: "Admin customer management",
        am: "የAdmin ደንበኛ አስተዳደር",
      },
      {
        en: "Membership expiration tracking",
        am: "የMembership ማብቂያ ክትትል",
      },
      {
        en: "Cloud profile image management",
        am: "Cloud profile image አስተዳደር",
      },
      {
        en: "English and Amharic support",
        am: "እንግሊዝኛ እና አማርኛ support",
      },
      {
        en: "Responsive mobile and desktop UI",
        am: "Responsive mobile እና desktop UI",
      },
    ],

    liveUrl:
      "https://gym-house-nu.vercel.app/",

    featured: true,
  },

  {
    slug: "maya-burger-website",

    title: "Maya Burger",

    category: {
      en: "Restaurant & Digital Menu Platform",
      am: "የሬስቶራንት እና ዲጂታል ሜኑ ፕላትፎርም",
    },

    shortDescription: {
      en: "A modern restaurant experience with a responsive menu, QR access and an admin-managed backend.",
      am: "Responsive menu፣ QR access እና admin-managed backend ያለው ዘመናዊ የሬስቶራንት ድረ-ገጽ።",
    },

    description: {
      en: "Maya Burger is a full-stack restaurant platform designed to make browsing food and accessing restaurant information fast, simple and visually engaging across mobile and desktop.",
      am: "Maya Burger የምግብ ሜኑ ማየትን እና የሬስቶራንቱን መረጃ ማግኘትን ፈጣን፣ ቀላል እና ለmobile እና desktop የተመቻቸ የሚያደርግ ፉል-ስታክ ፕላትፎርም ነው።",
    },

    /*
     * If you saved the burger thumbnail with a different
     * filename, this is the ONLY line you need to change.
     */
    thumbnail:
      "/images/projects/quickbite-thumbnail.png",

    technologies: [
      "Next.js",
      "TypeScript",
      "Tailwind CSS",
      "Express",
      "PostgreSQL",
      "Cloudinary",
    ],

    year: "2026",

    status: {
      en: "Production Project",
      am: "የProduction ፕሮጀክት",
    },

    role: {
      en: "Full-Stack Development & UI/UX",
      am: "ፉል-ስታክ ዴቨሎፕመንት እና UI/UX",
    },

    overview: {
      en: "The project combines a customer-facing restaurant website with backend-powered content and administrative functionality. The interface focuses heavily on food presentation, responsive design and making navigation easy from a phone.",
      am: "ፕሮጀክቱ customer-facing restaurant websiteን ከbackend content እና admin functionality ጋር ያገናኛል። UIው በfood presentation፣ responsive design እና mobile usability ላይ ያተኮረ ነው።",
    },

    challenge: {
      en: "Restaurant interfaces need to communicate products visually without becoming cluttered. The system also needed to remain easy to manage and fast on mobile devices where most customers interact with it.",
      am: "የሬስቶራንት UI ምግቦችን በግልጽ ማሳየት ሲኖርበት cluttered መሆን የለበትም። በተለይ mobile ላይ ፈጣን እና ቀላል መሆንም ነበረበት።",
    },

    solution: {
      en: "I created a clean visual hierarchy for the customer side and separated manageable restaurant data from the presentation layer, allowing the experience to stay polished while the underlying information remains easy to maintain.",
      am: "ለcustomer side ግልጽ visual hierarchy ፈጥሬ የrestaurant dataን ከpresentation layer ለይቼ ገንብቻለሁ።",
    },

    howItWorks: [
      {
        title: {
          en: "Open the Experience",
          am: "ድረ-ገጹን መክፈት",
        },

        description: {
          en: "Customers can reach the restaurant experience directly or through its QR entry point.",
          am: "ደንበኞች ድረ-ገጹን directly ወይም QR entry point በመጠቀም ማግኘት ይችላሉ።",
        },
      },

      {
        title: {
          en: "Browse the Menu",
          am: "ሜኑን ማየት",
        },

        description: {
          en: "The responsive interface organizes products so customers can quickly discover available food.",
          am: "Responsive UIው ምግቦችን በግልጽ በማደራጀት ደንበኞች በፍጥነት እንዲያገኙ ያደርጋል።",
        },
      },

      {
        title: {
          en: "Backend Content",
          am: "Backend Content",
        },

        description: {
          en: "Restaurant data is connected to backend systems instead of being treated as a purely static presentation.",
          am: "የrestaurant data ከbackend systems ጋር የተገናኘ ነው።",
        },
      },

      {
        title: {
          en: "Admin Management",
          am: "የAdmin አስተዳደር",
        },

        description: {
          en: "Administrative functionality provides a structured way to manage the platform behind the customer experience.",
          am: "Admin functionality ፕላትፎርሙን ከcustomer experience በስተጀርባ ለማስተዳደር ያገለግላል።",
        },
      },
    ],

    features: [
      {
        en: "Responsive restaurant interface",
        am: "Responsive restaurant interface",
      },
      {
        en: "QR-based access",
        am: "QR-based access",
      },
      {
        en: "Backend-powered content",
        am: "Backend-powered content",
      },
      {
        en: "Administrative management",
        am: "የAdmin አስተዳደር",
      },
      {
        en: "Cloud image handling",
        am: "Cloud image handling",
      },
      {
        en: "Mobile-first experience",
        am: "Mobile-first experience",
      },
    ],

    liveUrl:
      "https://maya-burger.vercel.app/",

    featured: true,
  },
];

export function getProjectBySlug(
  slug: string,
) {
  return projects.find(
    (project) =>
      project.slug === slug,
  );
}

export function getFeaturedProjects() {
  return projects.filter(
    (project) =>
      project.featured,
  );
}