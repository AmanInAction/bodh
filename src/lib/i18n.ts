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
  return language === "hi" ? `${pct}% महारत` : `${pct}% mastered`;
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
      learn: "Learn",
      about: "About",
      signIn: "Sign in",
      startLearning: "Start learning",
      allTopics: "All topics",
      backToPath: "Back to path",
      backToTopic: "Back to topic",
      exitPractice: "Exit practice",
      logOut: "Log out",
      loggingOut: "Logging out…",
      switchToOther: "हिन्दी में पढ़ें",
    },
    learnPage: {
      eyebrow: "Your DSA Journey",
      title: "Follow your curiosity.",
      subtitle: "Short lessons, visual thinking, and a patient AI coach.",
      learnCard: "📖 Learn",
      mindmapCard: "🧠 Mind Map",
      quizCard: "📝 Quiz",
    },
    topicPage: {
      pathSuffix: "path",
      actionEyebrow: "What would you like to do?",
      actionHeading: "Choose your path",
      learnTitle: "Learn",
      learnDesc: "Read the article & AI explanation",
      mindmapTitle: "Mind Map",
      mindmapDesc: "See the concept visually",
      quizTitle: "Practice",
      quizDesc: "Take a 5-question quiz",
    },
    articlePage: {
      eyebrow: "Lesson note",
      tryThis: "Try this:",
      checkUnderstanding: "Check your understanding →",
      backToPath: "← Back to path",
    },
    mindmapPage: {
      eyebrow: "Visual map",
      title: "See how it fits together.",
      backToTopic: "← Back to topic",
      hint: "Scroll to zoom · Drag to pan",
      root: "Root",
      branch: "Branch",
      leaf: "Leaf",
    },
    dashboardPage: {
      spaceEyebrow: "Your learning space",
      keepGoing: "Keep the thread going. You are building something durable.",
      session: "session",
      streak: "streak",
      start: "start",
      lessonsCompleted: "Lessons completed",
      totalAttempts: "Total quiz attempts",
      timeLearning: "Time learning",
      estimated: "Estimated",
      averageMastery: "Average mastery",
      acrossTopics: (n: number) => `Across ${n} topic${n === 1 ? "" : "s"}`,
      noQuizzes: "No quizzes yet",
      yourProgress: "Your progress",
      seeLibrary: "See library →",
      focusArea: "Focus area",
      startLesson: "Start lesson →",
      recommendedNext: "Recommended next",
      notAttemptedDesc: "You haven't tried this topic yet — it's your next frontier.",
      inProgressDesc: (pct: number) => `You're at ${pct}% mastery. One focused session will make a real difference.`,
      welcomeCardDesc: "Start your journey — take your first quiz to see personalised recommendations.",
    },
  },
  hi: {
    nav: {
      dashboard: "डैशबोर्ड",
      learn: "सीखें",
      about: "के बारे में",
      signIn: "साइन इन",
      startLearning: "सीखना शुरू करें",
      allTopics: "← सभी विषय",
      backToPath: "← वापस जाएं",
      backToTopic: "← विषय पर वापस जाएं",
      exitPractice: "अभ्यास छोड़ें",
      logOut: "लॉग आउट",
      loggingOut: "लॉग आउट हो रहे हैं…",
      switchToOther: "Switch to English",
    },
    learnPage: {
      eyebrow: "डीएसए यात्रा",
      title: "अपना विषय चुनें।",
      subtitle: "छोटे-छोटे पाठ, दृश्य सोच, और एक धैर्यवान AI शिक्षक।",
      learnCard: "📖 पढ़ें",
      mindmapCard: "🧠 माइंड मैप",
      quizCard: "📝 क्विज़",
    },
    topicPage: {
      pathSuffix: "पथ",
      actionEyebrow: "आज क्या करना है?",
      actionHeading: "अपना रास्ता चुनें",
      learnTitle: "पढ़ें",
      learnDesc: "लेख और AI व्याख्या पढ़ें",
      mindmapTitle: "माइंड मैप",
      mindmapDesc: "अवधारणा को दृश्य रूप में देखें",
      quizTitle: "अभ्यास करें",
      quizDesc: "5-प्रश्न क्विज़ लें",
    },
    articlePage: {
      eyebrow: "पाठ नोट",
      tryThis: "यह आज़माएं:",
      checkUnderstanding: "अपनी समझ परखें →",
      backToPath: "← वापस जाएं",
    },
    mindmapPage: {
      eyebrow: "दृश्य मानचित्र",
      title: "देखें कि सब कुछ कैसे जुड़ता है।",
      backToTopic: "← विषय पर वापस जाएं",
      hint: "ज़ूम करने के लिए स्क्रॉल करें · आगे-पीछे करने के लिए ड्रैग करें",
      root: "मुख्य",
      branch: "शाखा",
      leaf: "उप-शाखा",
    },
    dashboardPage: {
      spaceEyebrow: "आपका अध्ययन स्थल",
      keepGoing: "सीखने का सिलसिला जारी रखें। आप कुछ स्थायी बना रहे हैं।",
      session: "सत्र",
      streak: "क्रम",
      start: "शुरुआत",
      lessonsCompleted: "पूर्ण किए गए पाठ",
      totalAttempts: "कुल क्विज़ प्रयास",
      timeLearning: "सीखने का समय",
      estimated: "अनुमानित",
      averageMastery: "औसत महारत",
      acrossTopics: (n: number) => `${n} विषयों में`,
      noQuizzes: "अभी तक कोई क्विज़ नहीं",
      yourProgress: "आपकी प्रगति",
      seeLibrary: "लाइब्रेरी देखें →",
      focusArea: "केंद्रित क्षेत्र",
      startLesson: "पाठ शुरू करें →",
      recommendedNext: "आगे अनुशंसित",
      notAttemptedDesc: "आपने अभी तक यह विषय नहीं आज़माया है — यह आपका अगला लक्ष्य है।",
      inProgressDesc: (pct: number) => `आप ${pct}% महारत पर हैं। एक केंद्रित सत्र वास्तविक अंतर लाएगा।`,
      welcomeCardDesc: "अपनी यात्रा शुरू करें — व्यक्तिगत सुझाव देखने के लिए अपनी पहली क्विज़ लें।",
    },
  },
} as const;
