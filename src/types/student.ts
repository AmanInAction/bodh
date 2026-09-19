import type { TeachingStyle } from "@/lib/agentcore/teaching";

export type Student = {
  id: string;
  name: string;
  email: string;
  language: "en" | "hi";
  preferredStyle: TeachingStyle;
  createdAt: string;
};
