import Link from "next/link";
import { MindMap } from "@/components/learning/MindMap";
import { getOrGenerateMindmap } from "@/lib/learning/content";

export default async function MindMapPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
  const mindmap = await getOrGenerateMindmap(topic);

  return (
    <main className="site-shell">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <Link href={`/learn/${topic}`}>Back to topic</Link>
      </nav>
      <section className="center-page">
        <span className="eyebrow">Visual map</span>
        <h1>See how it fits together.</h1>
        <MindMap mindmap={mindmap} />
      </section>
    </main>
  );
}
