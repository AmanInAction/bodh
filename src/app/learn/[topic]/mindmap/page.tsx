import { cookies } from "next/headers";
import { MindMap } from "@/components/learning/MindMap";
import { Navbar } from "@/components/ui/Navbar";
import { getOrGenerateMindmap } from "@/lib/learning/content";
import {
  readSession,
  DEMO_SESSION,
  sessionCookie,
  DEMO_STUDENT_ID,
} from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import { LANGUAGE_COOKIE, resolveLanguage, UI_STRINGS } from "@/lib/i18n";

export default async function MindMapPage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const { topic } = await params;
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookie)?.value;
  const userSession = await readSession(token);
  const session = userSession ?? DEMO_SESSION;
  const studentId =
    session.email === "student_001@bodh.demo" ? DEMO_STUDENT_ID : session.email;
  const record = await getStudentRecord(studentId);

  const language = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
    record?.language,
  );
  const strings = UI_STRINGS[language];
  const mindmap = await getOrGenerateMindmap(topic, language);

  return (
    <main className="site-shell">
      <Navbar
        language={language}
        backHref={`/learn/${topic}?language=${language}`}
        backLabel={strings.mindmapPage.backToTopic}
      />
      <section className="center-page">
        <span className="eyebrow">{strings.mindmapPage.eyebrow}</span>
        <h1>{strings.mindmapPage.title}</h1>
        <MindMap mindmap={mindmap} language={language} />
      </section>
    </main>
  );
}
