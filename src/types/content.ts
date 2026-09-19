export type ArticleSection = {
  heading: string;
  body: string;
};

export type Article = {
  topicSlug: string;
  language: "en" | "hi";
  title: string;
  lead: string;
  sections: ArticleSection[];
  tryThis: string;
};

export type MindmapNode = {
  id: string;
  label: string;
  level: number; // 0 = root, 1 = branch, 2 = leaf
};

export type MindmapEdge = {
  from: string;
  to: string;
};

export type Mindmap = {
  topicSlug: string;
  nodes: MindmapNode[];
  edges: MindmapEdge[];
};
