export function MindMap({ topic }: { topic: string }) {
  return (
    <div className="mindmap">
      <div className="mindmap-node mindmap-center">{topic}</div>
      <div className="mindmap-node node-one">Shape</div>
      <div className="mindmap-node node-two">Operations</div>
      <div className="mindmap-node node-three">Trade-offs</div>
    </div>
  );
}
