import Link from "next/link";
import { ArticleViewer } from "@/components/learning/ArticleViewer";
import { MindMap } from "@/components/learning/MindMap";
export default async function ArticlePage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const label = topic.replaceAll("-", " ");
  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <Link href={`/learn/${topic}`}>Back to path</Link>
      </nav>
      <div className="article-layout">
        <ArticleViewer title={`Thinking about ${label}`} />
        <aside>
          <MindMap topic={label} />
          <Link
            className="button button-primary full-button"
            href={`/learn/${topic}/quiz`}
          >
            Check your understanding →
          </Link>
        </aside>
      </div>
    </main>
  );
}
