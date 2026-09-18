type ArticleViewerProps = {
  title: string;
  lead: string;
  sections: { heading: string; body: string }[];
  tryThis: string;
  practiceHref: string;
};

export function ArticleViewer({
  title,
  lead,
  sections,
  tryThis,
  practiceHref,
}: ArticleViewerProps) {
  return (
    <article className="article">
      <span className="eyebrow">Lesson note</span>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      {sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <div className="callout">
        <strong>Try this:</strong> {tryThis}
      </div>
      <a className="button button-primary article-practice" href={practiceHref}>
        Check your understanding <span>→</span>
      </a>
    </article>
  );
}
