import { ProgressBar } from "@/components/ui/ProgressBar";

export function TopicProgress({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div className="topic-progress">
      <div className="topic-progress-head">
        <strong>{title}</strong>
        <span className="tabular-nums">{value}%</span>
      </div>
      <ProgressBar value={value} label={title} />
    </div>
  );
}
