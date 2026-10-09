import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Navbar } from "@/components/ui/Navbar";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { getBlogPost } from "@/lib/learning/content";
import { LANGUAGE_COOKIE, resolveLanguage, getTopicTitle, UI_STRINGS } from "@/lib/i18n";

export default async function BlogDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ language?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const cookieStore = await cookies();
  const language = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
  );
  const strings = UI_STRINGS[language];

  const post = await getBlogPost(slug, language);
  if (!post) {
    notFound();
  }

  return (
    <main className="site-shell">
      <Navbar
        language={language}
        backHref={`/blogs?language=${language}`}
        backLabel={strings.blogsPage.backToBlogs}
      />

      <article className="simple-page" style={{ maxWidth: "760px", margin: "0 auto", paddingBottom: "4rem" }}>
        {/* ── Article Header ────────────────────────────────────────── */}
        <header style={{ marginBottom: "2rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem", flexWrap: "wrap" }}>
            <Badge variant="primary">{post.category}</Badge>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              {strings.blogsPage.readingTime(post.readingTime)}
            </span>
            <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>·</span>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              {post.authorName}
            </span>
          </div>

          <h1 style={{ fontSize: "2.25rem", lineHeight: 1.25, marginBottom: "1.25rem" }}>
            {post.title}
          </h1>

          <p className="lead" style={{ fontSize: "1.125rem", lineHeight: 1.6, color: "var(--text)" }}>
            {post.lead}
          </p>

          <hr style={{ border: 0, borderTop: "1px solid var(--border)", margin: "2rem 0" }} />
        </header>

        {/* ── Sections ──────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
          {post.sections.map((section, idx) => (
            <section key={idx} style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
              {section.heading && (
                <h2 style={{ fontSize: "1.375rem", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text)" }}>
                  {section.heading}
                </h2>
              )}

              <p style={{ fontSize: "1rem", lineHeight: 1.7, color: "var(--text)" }}>
                {section.body}
              </p>

              {section.codeSnippet && (
                <div
                  style={{
                    margin: "0.75rem 0",
                    background: "#0f172a",
                    color: "#f8fafc",
                    padding: "1.25rem",
                    borderRadius: "var(--radius-md, 8px)",
                    overflowX: "auto",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {section.codeSnippet.caption && (
                    <div
                      style={{
                        fontSize: "0.75rem",
                        color: "#94a3b8",
                        marginBottom: "0.625rem",
                        fontFamily: "var(--font-sans)",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      {section.codeSnippet.caption}
                    </div>
                  )}
                  <pre style={{ margin: 0, fontFamily: "var(--font-mono)", fontSize: "0.875rem", lineHeight: 1.5 }}>
                    <code>{section.codeSnippet.code}</code>
                  </pre>
                </div>
              )}

              {section.callout && (
                <div
                  style={{
                    margin: "0.5rem 0",
                    padding: "1rem 1.25rem",
                    background: "rgba(37, 99, 235, 0.05)",
                    borderLeft: "3px solid var(--color-primary, #2563eb)",
                    borderRadius: "0 8px 8px 0",
                    fontSize: "0.9375rem",
                    color: "var(--text)",
                    lineHeight: 1.5,
                  }}
                >
                  {section.callout}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* ── Related Topics Footer ─────────────────────────────────── */}
        {post.relatedTopics && post.relatedTopics.length > 0 && (
          <footer
            style={{
              marginTop: "3.5rem",
              padding: "1.75rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg, 12px)",
            }}
          >
            <span className="eyebrow">{strings.blogsPage.relatedTopics}</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginTop: "1rem" }}>
              {post.relatedTopics.map((topicSlug) => {
                const topicTitle = getTopicTitle(topicSlug, language);
                return (
                  <ButtonLink
                    key={topicSlug}
                    variant="secondary"
                    size="sm"
                    href={`/learn/${topicSlug}?language=${language}`}
                  >
                    {topicTitle} →
                  </ButtonLink>
                );
              })}
            </div>
          </footer>
        )}
      </article>
    </main>
  );
}
