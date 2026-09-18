export const languages = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
] as const;

export type LanguageCode = (typeof languages)[number]["code"];
