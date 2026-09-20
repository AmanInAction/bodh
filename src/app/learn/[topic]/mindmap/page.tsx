import Link from "next/link";
import { cookies } from "next/headers";
import { MindMap } from "@/components/learning/MindMap";
import { getOrGenerateMindmap } from "@/lib/learning/content";
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
  const language = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
  );
  const strings = UI_STRINGS[language];
  const mindmap = await getOrGenerateMindmap(topic);

  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href={`/?language=${language}`}>
          bodh<span>.</span>
        </Link>
        <Link href={`/learn/${topic}?language=${language}`}>
          {strings.mindmapPage.backToTopic}
        </Link>
      </nav>
      <section className="center-page">
        <span className="eyebrow">{strings.mindmapPage.eyebrow}</span>
        <h1>{strings.mindmapPage.title}</h1>
        <MindMap mindmap={mindmap} language={language} />
      </section>
    </main>
  );
}
