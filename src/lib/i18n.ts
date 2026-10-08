import { getTopic } from "@/config/topics";

export type SupportedLanguage = "en" | "hi";

export const LANGUAGE_COOKIE = "bodh_lang";

export function setClientLanguage(code: string) {
  if (typeof document !== "undefined") {
    document.cookie = `${LANGUAGE_COOKIE}=${code}; path=/; max-age=31536000; SameSite=Lax`;
  }
}

/**
 * Resolves active language preference following precedence:
 * 1. Explicit search param (?language=hi)
 * 2. Stored cookie (bodh_lang)
 * 3. User profile setting in DynamoDB
 * 4. Default: "en"
 */
export function resolveLanguage(
  searchParamLang?: string | null,
  cookieLang?: string | null,
  studentLang?: string | null,
): SupportedLanguage {
  if (searchParamLang === "hi" || searchParamLang === "en") return searchParamLang;
  if (cookieLang === "hi" || cookieLang === "en") return cookieLang;
  if (studentLang === "hi" || studentLang === "en") return studentLang;
  return "en";
}

export function getTopicTitle(slug: string, language: string = "en"): string {
  const topic = getTopic(slug);
  if (!topic) return slug;
  if (language === "hi") {
    return topic.titleHi ?? topic.title;
  }
  return topic.title;
}

export function getTopicDescription(slug: string, language: string = "en"): string {
  const topic = getTopic(slug);
  if (!topic) return "";
  if (language === "hi") {
    return topic.descriptionHi ?? topic.description;
  }
  return topic.description;
}

export function getLevelLabel(level: string, language: string = "en"): string {
  if (language === "hi") {
    if (level === "Beginner") return "शुरुआती";
    if (level === "Intermediate") return "मध्यवर्ती";
    if (level === "Advanced") return "उन्नत";
  }
  return level;
}

export function formatLessons(count: number, language: string = "en"): string {
  return language === "hi" ? `${count} पाठ` : `${count} lesson${count === 1 ? "" : "s"}`;
}

export function formatMastery(pct: number, language: string = "en"): string {
  return language === "hi" ? `${pct}% समझ` : `${pct}% understood`;
}

export function getGreeting(language: string = "en"): string {
  const hour = new Date().getHours();
  if (language === "hi") {
    if (hour < 12) return "शुभ प्रभात";
    if (hour < 17) return "शुभ दोपहर";
    return "शुभ संध्या";
  }
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export const UI_STRINGS = {
  en: {
    nav: {
      dashboard: "Dashboard",
      learn: "Topics",
      about: "About",
      signIn: "Sign in",
      startLearning: "Start learning",
      allTopics: "← All topics",
      backToPath: "← Back to topic",
      backToTopic: "← Back to topic",
      exitPractice: "← Exit practice",
      logOut: "Log out",
      loggingOut: "Logging out…",
      switchToOther: "हिन्दी में पढ़ें",
      menu: "Menu",
      closeMenu: "Close menu",
    },
    learnPage: {
      eyebrow: "Your Learning Path",
      title: "Follow your curiosity.",
      subtitle: "Step-by-step lessons, visual concept maps, and a patient learning companion built for Class 10–12 students.",
      learnCard: "Read lesson",
      mindmapCard: "Visual map",
      quizCard: "Practice quiz",
    },
    topicPage: {
      pathSuffix: "topic",
      actionEyebrow: "How would you like to study?",
      actionHeading: "Choose your next step",
      learnTitle: "Understand the concept",
      learnDesc: "Read a clear, example-first lesson note at your own pace.",
      mindmapTitle: "See it visually",
      mindmapDesc: "Explore how the core ideas connect in an interactive map.",
      quizTitle: "Practice & check",
      quizDesc: "Answer 5 quick questions to test your understanding.",
    },
    articlePage: {
      eyebrow: "Lesson note",
      tryThis: "Try this:",
      checkUnderstanding: "Check your understanding →",
      backToPath: "← Back to topic",
    },
    mindmapPage: {
      eyebrow: "Visual concept map",
      title: "See how every part fits together.",
      backToTopic: "← Back to topic",
      hint: "Scroll to zoom · Drag to pan",
      root: "Core Topic",
      branch: "Key Idea",
      leaf: "Detail",
    },
    dashboardPage: {
      spaceEyebrow: "Your learning space",
      keepGoing: "One concept at a time. Steady practice builds lasting understanding.",
      session: "active",
      streak: "sessions",
      start: "session",
      lessonsCompleted: "Practice sessions",
      totalAttempts: "Completed quizzes",
      timeLearning: "Time spent learning",
      estimated: "Estimated study time",
      averageMastery: "Understanding",
      acrossTopics: (n: number) => `Across ${n} topic${n === 1 ? "" : "s"}`,
      noQuizzes: "Take a quiz to begin",
      yourProgress: "Your progress",
      seeLibrary: "Explore all topics →",
      focusArea: "Topics to practice",
      startLesson: "Continue learning →",
      recommendedNext: "What to learn next",
      notAttemptedDesc: "You haven't explored this topic yet — a great place to start today.",
      inProgressDesc: (pct: number) => `You're at ${pct}% understanding. One focused practice session will help solidify this concept.`,
      welcomeCardDesc: "Start with Arrays — read the short lesson or take a quick 5-question check to see what to learn next.",
    },
  },
  hi: {
    nav: {
      dashboard: "डैशबोर्ड",
      learn: "विषय",
      about: "परिचय",
      signIn: "साइन इन",
      startLearning: "सीखना शुरू करें",
      allTopics: "← सभी विषय",
      backToPath: "← विषय पर वापस जाएं",
      backToTopic: "← विषय पर वापस जाएं",
      exitPractice: "← अभ्यास छोड़ें",
      logOut: "लॉग आउट",
      loggingOut: "लॉग आउट हो रहे हैं…",
      switchToOther: "Switch to English",
      menu: "मेनू",
      closeMenu: "मेनू बंद करें",
    },
    learnPage: {
      eyebrow: "आपका सीखने का पथ",
      title: "अपनी जिज्ञासा के साथ आगे बढ़ें।",
      subtitle: "कक्षा 10–12 के विद्यार्थियों के लिए सरल पाठ, विज़ुअल मैप और धैर्यपूर्ण मार्गदर्शन।",
      learnCard: "पाठ पढ़ें",
      mindmapCard: "विज़ुअल मैप",
      quizCard: "अभ्यास क्विज़",
    },
    topicPage: {
      pathSuffix: "विषय",
      actionEyebrow: "आप कैसे पढ़ना चाहेंगे?",
      actionHeading: "अपना अगला कदम चुनें",
      learnTitle: "अवधारणा समझें",
      learnDesc: "आसान उदाहरणों के साथ अपनी गति से पाठ पढ़ें।",
      mindmapTitle: "चित्र रूप में देखें",
      mindmapDesc: "इंटरएक्टिव मैप में देखें कि सभी मुख्य बातें कैसे जुड़ती हैं।",
      quizTitle: "अभ्यास और जाँच",
      quizDesc: "अपनी समझ परखने के लिए 5 छोटे प्रश्नों के उत्तर दें।",
    },
    articlePage: {
      eyebrow: "पाठ नोट",
      tryThis: "यह आज़माएं:",
      checkUnderstanding: "अपनी समझ परखें →",
      backToPath: "← विषय पर वापस जाएं",
    },
    mindmapPage: {
      eyebrow: "विज़ुअल कॉन्सेप्ट मैप",
      title: "देखें कि हर हिस्सा कैसे जुड़ता है।",
      backToTopic: "← विषय पर वापस जाएं",
      hint: "ज़ूम करने के लिए स्क्रॉल करें · आगे-पीछे करने के लिए ड्रैग करें",
      root: "मुख्य विषय",
      branch: "मुख्य विचार",
      leaf: "विवरण",
    },
    dashboardPage: {
      spaceEyebrow: "आपका अध्ययन स्थान",
      keepGoing: "एक समय में एक अवधारणा। नियमित अभ्यास से पक्की समझ बनती है।",
      session: "सक्रिय",
      streak: "सत्र",
      start: "सत्र",
      lessonsCompleted: "अभ्यास सत्र",
      totalAttempts: "पूरे किए गए क्विज़",
      timeLearning: "सीखने का समय",
      estimated: "अनुमानित अध्ययन समय",
      averageMastery: "समझ का स्तर",
      acrossTopics: (n: number) => `${n} विषयों में`,
      noQuizzes: "शुरू करने के लिए एक क्विज़ लें",
      yourProgress: "आपकी प्रगति",
      seeLibrary: "सभी विषय देखें →",
      focusArea: "अभ्यास के लिए विषय",
      startLesson: "सीखना जारी रखें →",
      recommendedNext: "आगे क्या सीखें",
      notAttemptedDesc: "आपने अभी तक यह विषय शुरू नहीं किया है — आज शुरू करने के लिए यह एक बेहतरीन जगह है।",
      inProgressDesc: (pct: number) => `आपकी समझ ${pct}% है। एक छोटा अभ्यास सत्र इस अवधारणा को और मजबूत कर देगा।`,
      welcomeCardDesc: "ऐरे (Arrays) से शुरुआत करें — छोटा पाठ पढ़ें या 5 प्रश्नों का अभ्यास करें।",
    },
  },
} as const;
