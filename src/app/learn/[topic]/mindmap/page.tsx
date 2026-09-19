import Link from "next/link";
import { MindMap } from "@/components/learning/MindMap";
import { getOrGenerateMindmap } from "@/lib/learning/content";
<<<<<<< HEAD
<<<<<<< HEAD
import { getTopic } from "@/config/topics";
import { notFound } from "next/navigation";
=======

>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
=======

>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
export default async function MindMapPage({
  params,
}: {
  params: Promise<{ topic: string }>;
}) {
  const { topic } = await params;
<<<<<<< HEAD
  if (!getTopic(topic)) notFound();
=======
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
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
