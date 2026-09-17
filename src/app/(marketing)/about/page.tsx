import Link from "next/link";
export default function AboutPage() {
  return (
    <main className="site-shell narrow">
      <nav className="nav">
        <Link className="brand" href="/">
          bodh<span>.</span>
        </Link>
        <Link href="/learn">Explore lessons →</Link>
      </nav>
      <section className="simple-page">
        <span className="eyebrow">About bodh</span>
        <h1>Learning that leaves room for thought.</h1>
        <p className="lead">
          Bodh is a small, focused learning companion for people building their
          foundations in computer science.
        </p>
        <p>
          We believe understanding is more durable than speed. Every lesson
          gives you a useful mental model, a concrete example, and a chance to
          explain the idea in your own words.
        </p>
        <Link className="button button-primary" href="/onboarding">
          Start with a topic
        </Link>
      </section>
    </main>
  );
}
