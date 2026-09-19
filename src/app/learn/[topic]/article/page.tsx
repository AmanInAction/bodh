import Link from "next/link";
import { ArticleViewer } from "@/components/learning/ArticleViewer";
import { MindMap } from "@/components/learning/MindMap";
import { getLessonContent, getOrGenerateMindmap } from "@/lib/learning/content";
import type { LanguageCode } from "@/config/languages";
export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const { topic } = await params;
  const { language = "en" } = await searchParams;
  const selectedLanguage: LanguageCode = language === "hi" ? "hi" : "en";
  const [content, mindmap] = await Promise.all([
    getLessonContent(topic, selectedLanguage),
    getOrGenerateMindmap(topic),
  ]);
  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <Link href={`/learn/${topic}`}>Back to path</Link>
      </nav>
      <div className="article-layout">
        <ArticleViewer
          title={content.title}
          lead={content.lead}
          sections={content.sections}
          tryThis={content.tryThis}
          practiceHref={`/learn/${topic}/quiz?language=${selectedLanguage}`}
        />
        <aside>
          <MindMap mindmap={mindmap} />
          <Link
            className="button button-primary full-button"
            href={`/learn/${topic}/quiz?language=${selectedLanguage}`}
          >
            Check your understanding →
          </Link>
        </aside>
      </div>
    </main>
  );
}
