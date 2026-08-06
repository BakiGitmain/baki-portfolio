export const siteCopy = {
  en: {
    nav: {
      home: "Home",
      about: "About",
      projects: "Projects",
      skills: "Skills",
      experience: "Experience",
      contact: "Contact",
      letsTalk: "Let's Talk",
      openMenu: "Open navigation menu",
      closeMenu: "Close navigation menu",
    },

    hero: {
      greeting: "Hi, I'm",
      name: "Baki",
      role: "Full-Stack Developer",

      description:
        "I build modern and scalable web applications with polished user experiences, reliable backend systems and clean code.",

      viewProjects: "View My Projects",
      downloadCv: "Download CV",

      aiTitle: "Hi! I'm Baki AI 👋",
      aiDescription:
        "Ask me about my projects, skills or experience.",
      online: "Online",

      statistics: [
        {
          value: "2+",
          label: "Production projects",
        },
        {
          value: "Full-stack",
          label: "Frontend and backend",
        },
        {
          value: "EN / AM",
          label: "Bilingual products",
        },
        {
          value: "AI",
          label: "Current focus",
        },
      ],

      strengths: [
        {
          number: "01",
          title: "Clean Code",
          description: "Maintainable and scalable architecture.",
        },
        {
          number: "02",
          title: "Performance",
          description: "Fast and optimized experiences.",
        },
        {
          number: "03",
          title: "Responsive",
          description: "Designed carefully for every screen.",
        },
        {
          number: "04",
          title: "User Experience",
          description: "Clear, thoughtful and intuitive products.",
        },
      ],
    },
  },

  am: {
    nav: {
      home: "መነሻ",
      about: "ስለ እኔ",
      projects: "ፕሮጀክቶች",
      skills: "ክህሎቶች",
      experience: "ልምድ",
      contact: "አግኙኝ",
      letsTalk: "እንነጋገር",
      openMenu: "የዳሰሳ ምናሌውን ክፈት",
      closeMenu: "የዳሰሳ ምናሌውን ዝጋ",
    },

    hero: {
      greeting: "ሰላም!",
      name: "Baki ነኝ",
      role: "ፉል-ስታክ ዴቨሎፐር",

      description:
        "ዘመናዊ፣ ፈጣን እና በቀላሉ ሊሰፉ የሚችሉ የድር መተግበሪያዎችን፣ የተዋበ የተጠቃሚ ተሞክሮ፣ አስተማማኝ የጀርባ ስርዓት እና ንጹህ ኮድ በመጠቀም እገነባለሁ።",

      viewProjects: "ፕሮጀክቶቼን ይመልከቱ",
      downloadCv: "CV ያውርዱ",

      aiTitle: "ሰላም! የBaki AI ነኝ 👋",
      aiDescription:
        "ስለ ፕሮጀክቶቼ፣ ክህሎቶቼ ወይም ልምዴ ይጠይቁኝ።",
      online: "ኦንላይን",

      statistics: [
        {
          value: "2+",
          label: "የተጠናቀቁ ፕሮጀክቶች",
        },
        {
          value: "ፉል-ስታክ",
          label: "Frontend እና Backend",
        },
        {
          value: "EN / AM",
          label: "ባለሁለት ቋንቋ ምርቶች",
        },
        {
          value: "AI",
          label: "የአሁኑ ትኩረት",
        },
      ],

      strengths: [
        {
          number: "01",
          title: "ንጹህ ኮድ",
          description: "ቀላል ለመጠገን እና ለማስፋት የተዘጋጀ።",
        },
        {
          number: "02",
          title: "ከፍተኛ ፍጥነት",
          description: "ፈጣን እና የተመቻቸ የተጠቃሚ ተሞክሮ።",
        },
        {
          number: "03",
          title: "ለሁሉም ስክሪን",
          description: "በሁሉም መሣሪያ በጥንቃቄ የተነደፈ።",
        },
        {
          number: "04",
          title: "የተጠቃሚ ተሞክሮ",
          description: "ግልጽ፣ ቀላል እና ለመጠቀም ምቹ ምርቶች።",
        },
      ],
    },
  },
} as const;

export type Language = keyof typeof siteCopy;

export type SiteCopy = (typeof siteCopy)[Language];