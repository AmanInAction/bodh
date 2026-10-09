import Link from "next/link";
import { cookies } from "next/headers";
import { Navbar } from "@/components/ui/Navbar";
import { Badge } from "@/components/ui/Badge";
import { ButtonLink } from "@/components/ui/Button";
import { listBlogPosts } from "@/lib/learning/content";
import { LANGUAGE_COOKIE, resolveLanguage, UI_STRINGS } from "@/lib/i18n";

export default async function BlogsPage({
  searchParams,
}: {
  searchParams?: Promise<{ language?: string }>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const cookieStore = await cookies();
  const language = resolveLanguage(
    resolvedSearchParams.language,
    cookieStore.get(LANGUAGE_COOKIE)?.value,
  );
  const strings = UI_STRINGS[language];

  const posts = await listBlogPosts(language);
  const featuredPost = posts.find((p) => p.featured) ?? posts[0];
  const otherPosts = posts.filter((p) => p.slug !== featuredPost?.slug);

  return (
    <main className="site-shell">
      <Navbar
        language={language}
        links={[
          {
            href: `/dashboard?language=${language}`,
            label: strings.nav.dashboard,
            activeMatch: "/dashboard",
          },
          {
            href: `/learn?language=${language}`,
            label: strings.nav.learn,
            activeMatch: "/learn",
          },
          {
            href: `/blogs?language=${language}`,
            label: strings.nav.blogs,
            activeMatch: "/blogs",
          },
          {
            href: `/about?language=${language}`,
            label: strings.nav.about,
            activeMatch: "/about",
          },
        ]}
      />

      <section className="library-header">
        <span className="eyebrow">{strings.blogsPage.eyebrow}</span>
        <h1>{strings.blogsPage.title}</h1>
        <p>{strings.blogsPage.subtitle}</p>
      </section>

      {/* ── Featured Post Hero Card ────────────────────────────────────── */}
      {featuredPost && (
        <section className="section" style={{ paddingTop: 0, paddingBottom: "2rem" }}>
          <div
            className="card"
            style={{
              padding: "2rem",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg, 12px)",
              display: "flex",
              flexDirection: "column",
              gap: "1.25rem",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              <Badge variant="primary">{strings.blogsPage.featured}</Badge>
              <span className="eyebrow" style={{ textTransform: "none" }}>{featuredPost.category}</span>
              <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>·</span>
              <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                {strings.blogsPage.readingTime(featuredPost.readingTime)}
              </span>
            </div>

            <div>
              <h2 style={{ fontSize: "1.75rem", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>
                <Link
                  href={`/blogs/${featuredPost.slug}?language=${language}`}
                  style={{ color: "inherit", textDecoration: "none" }}
                >
                  {featuredPost.title}
                </Link>
              </h2>
              <p style={{ color: "var(--text-muted)", fontSize: "1rem", lineHeight: 1.6, maxWidth: "720px" }}>
                {featuredPost.excerpt}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <span style={{ fontSize: "0.875rem", color: "var(--text)", fontWeight: 500 }}>
                  {featuredPost.authorName}
                </span>
                {featuredPost.authorRole && (
                  <>
                    <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>·</span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {featuredPost.authorRole}
                    </span>
                  </>
                )}
              </div>

              <ButtonLink
                variant="primary"
                size="sm"
                href={`/blogs/${featuredPost.slug}?language=${language}`}
              >
                {strings.blogsPage.readArticle}
              </ButtonLink>
            </div>
          </div>
        </section>
      )}

      {/* ── Articles List / Grid ──────────────────────────────────────── */}
      <section className="section" style={{ paddingTop: 0 }}>
        {otherPosts.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {otherPosts.map((post) => (
              <div
                key={post.slug}
                className="card"
                style={{
                  padding: "1.5rem",
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-lg, 12px)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  gap: "1rem",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", flexWrap: "wrap" }}>
                    <span className="eyebrow" style={{ textTransform: "none" }}>{post.category}</span>
                    <span aria-hidden="true" style={{ color: "var(--text-muted)" }}>·</span>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                      {strings.blogsPage.readingTime(post.readingTime)}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.25rem", fontFamily: "var(--font-display)", fontWeight: 600, color: "var(--text)", marginBottom: "0.5rem" }}>
                    <Link
                      href={`/blogs/${post.slug}?language=${language}`}
                      style={{ color: "inherit", textDecoration: "none" }}
                    >
                      {post.title}
                    </Link>
                  </h3>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.9375rem", lineHeight: 1.55 }}>
                    {post.excerpt}
                  </p>
                </div>

                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "0.75rem", borderTop: "1px solid var(--border)" }}>
                  <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
                    {post.authorName}
                  </span>
                  <Link
                    href={`/blogs/${post.slug}?language=${language}`}
                    className="text-link"
                    style={{ fontSize: "0.875rem", fontWeight: 500 }}
                  >
                    {strings.blogsPage.readArticle}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {posts.length === 0 && (
          <div className="card" style={{ padding: "2.5rem", textAlign: "center", color: "var(--text-muted)" }}>
            <p>{strings.blogsPage.empty}</p>
          </div>
        )}
      </section>
    </main>
  );
}
