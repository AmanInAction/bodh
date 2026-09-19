import Link from "next/link";
import { cookies } from "next/headers";
import { ArticleViewer } from "@/components/learning/ArticleViewer";
import { MindMap } from "@/components/learning/MindMap";
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
    getOrGenerateMindmap(topic),
  ]);

  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href={`/?language=${selectedLanguage}`}>
          bodh<span>.</span>
        </Link>
        <Link href={`/learn/${topic}?language=${selectedLanguage}`}>
          {strings.articlePage.backToPath}
        </Link>
      </nav>
      <div className="article-layout">
        <ArticleViewer
          title={content.title}
          lead={content.lead}
          sections={content.sections}
          tryThis={content.tryThis}
          practiceHref={`/learn/${topic}/quiz?language=${selectedLanguage}`}
          language={selectedLanguage}
        />
        <aside>
          <MindMap mindmap={mindmap} language={selectedLanguage} />
          <Link
            className="button button-primary full-button"
            href={`/learn/${topic}/quiz?language=${selectedLanguage}`}
          >
            {strings.articlePage.checkUnderstanding}
          </Link>
        </aside>
      </div>
    </main>
  );
}
