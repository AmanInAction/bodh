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
      <div>
        <strong>{title}</strong>
        <span>{value}%</span>
      </div>
      <ProgressBar value={value} />
    </div>
  );
}
