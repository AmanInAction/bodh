import { cookies } from "next/headers";
import { ArticleViewer } from "@/components/learning/ArticleViewer";
import { Navbar } from "@/components/ui/Navbar";
import { ButtonLink } from "@/components/ui/Button";
import { getLessonContent } from "@/lib/learning/content";
import {
  readSession,
  DEMO_SESSION,
  sessionCookie,
  DEMO_STUDENT_ID,
} from "@/lib/auth/session";
import { getStudentRecord } from "@/lib/aws/dynamodb";
import type { LanguageCode } from "@/config/languages";
import { LANGUAGE_COOKIE, resolveLanguage, UI_STRINGS } from "@/lib/i18n";

export default async function ArticlePage({
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

  const selectedLanguage: LanguageCode = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
    record?.language,
  );
  const strings = UI_STRINGS[selectedLanguage];
  const isHindi = selectedLanguage === "hi";

  const content = await getLessonContent(topic, selectedLanguage);

  return (
    <main className="site-shell">
      <Navbar
        language={selectedLanguage}
        backHref={`/learn/${topic}?language=${selectedLanguage}`}
        backLabel={strings.articlePage.backToPath}
      />
      <div className="article-layout">
        <ArticleViewer
          title={content.title}
          lead={content.lead}
          sections={content.sections}
          tryThis={content.tryThis}
          practiceHref={`/learn/${topic}/quiz?language=${selectedLanguage}`}
          language={selectedLanguage}
        />
        <aside className="article-sidebar">
          <div className="card">
            <span className="eyebrow">
              {isHindi ? "सीखने के उद्देश्य" : "What you will learn"}
            </span>
            <ul
              style={{
                margin: "12px 0 0",
                paddingLeft: "18px",
                display: "grid",
                gap: "8px",
                fontSize: "0.9375rem",
                color: "var(--text-secondary)",
                lineHeight: 1.55,
              }}
            >
              {(content.learningObjectives ?? []).map((obj) => (
                <li key={obj}>{obj}</li>
              ))}
            </ul>
          </div>
          <ButtonLink
            variant="primary"
            size="lg"
            fullWidth
            href={`/learn/${topic}/quiz?language=${selectedLanguage}`}
          >
            {strings.articlePage.checkUnderstanding}
          </ButtonLink>
        </aside>
      </div>
    </main>
  );
}
