import Link from "next/link";
import { ArticleViewer } from "@/components/learning/ArticleViewer";
import { MindMap } from "@/components/learning/MindMap";
import { getLessonContent, getOrGenerateMindmap } from "@/lib/learning/content";
import type { LanguageCode } from "@/config/languages";
import { getTopic } from "@/config/topics";
import { notFound } from "next/navigation";
export default async function ArticlePage({
  params,
  searchParams,
}: {
  params: Promise<{ topic: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const { topic } = await params;
  if (!getTopic(topic)) notFound();
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
<<<<<<< HEAD
        <aside
          style={{ display: "flex", flexDirection: "column", gap: "18px" }}
        >
=======
        <aside>
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
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
