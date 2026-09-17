export function ArticleViewer({ title }: { title: string }) {
  return (
    <article className="article">
      <span className="eyebrow">Lesson note</span>
      <h1>{title}</h1>
      <p className="lead">
        Great data structures become easier when you can picture the problem
        before you write the code.
      </p>
      <h2>Start with the shape</h2>
      <p>
        Ask what information needs to stay together, what changes often, and
        which operation should be fastest. That small pause turns a vague
        problem into a useful model.
      </p>
      <div className="callout">
        <strong>Try this:</strong> explain the idea to a friend using only one
        everyday object.
      </div>
      <h2>Make one decision at a time</h2>
      <p>
        Use a tiny example, trace it by hand, and then generalize. Bodh keeps
        each lesson short so you can practice the reasoning, not just the
        answer.
      </p>
    </article>
  );
}
