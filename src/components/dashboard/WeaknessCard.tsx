import { Card } from "@/components/ui/Card";
export function WeaknessCard({
  title,
  reason,
}: {
  title: string;
  reason: string;
}) {
  return (
    <Card>
      <span className="eyebrow">Focus next</span>
      <h3>{title}</h3>
      <p>{reason}</p>
    </Card>
  );
}
