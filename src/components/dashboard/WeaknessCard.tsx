import { Card } from "@/components/ui/Card";
<<<<<<< HEAD
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
=======
export function WeaknessCard() {
  return (
    <Card>
      <span className="eyebrow">Focus next</span>
      <h3>Binary Search</h3>
      <p>Your last two answers suggest revisiting the stopping condition.</p>
>>>>>>> a131f76c845f6d6475dcd2fc563db117b9a9ae5a
    </Card>
  );
}
