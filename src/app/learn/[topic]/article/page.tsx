import { cookies } from "next/headers";
import { ArticleViewer } from "@/components/learning/ArticleViewer";
import { MindMap } from "@/components/learning/MindMap";
import { Navbar } from "@/components/ui/Navbar";
import { ButtonLink } from "@/components/ui/Button";
import { getLessonContent, getOrGenerateMindmap } from "@/lib/learning/content";
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
  const selectedLanguage: LanguageCode = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
  );
  const strings = UI_STRINGS[selectedLanguage];

  const [content, mindmap] = await Promise.all([
    getLessonContent(topic, selectedLanguage),
    getOrGenerateMindmap(topic, selectedLanguage),
  ]);

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
          <MindMap mindmap={mindmap} language={selectedLanguage} />
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
