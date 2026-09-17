import Link from "next/link";
import { MindMap } from "@/components/learning/MindMap";
export default async function MindMapPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
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
        <MindMap topic={topic.replaceAll("-", " ")} />
      </section>
    </main>
  );
}
