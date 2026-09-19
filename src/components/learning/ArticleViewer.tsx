type ArticleViewerProps = {
  title: string;
  lead: string;
  sections?: { heading: string; body: string }[];
  tryThis: string;
  practiceHref: string;
  language?: "en" | "hi";
};

export function ArticleViewer({
  title,
  lead,
  sections,
  tryThis,
  practiceHref,
  language = "en",
}: ArticleViewerProps) {
  const isHindi = language === "hi";

  return (
    <article className="article">
      <span className="eyebrow">{isHindi ? "पाठ नोट" : "Lesson note"}</span>
      <h1>{title}</h1>
      <p className="lead">{lead}</p>
      {(sections ?? []).map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}
      <div className="callout">
        <strong>{isHindi ? "यह आज़माएं:" : "Try this:"}</strong> {tryThis}
      </div>
      <a className="button button-primary article-practice" href={practiceHref}>
        {isHindi ? "अपनी समझ परखें" : "Check your understanding"} <span>→</span>
      </a>
    </article>
  );
}
