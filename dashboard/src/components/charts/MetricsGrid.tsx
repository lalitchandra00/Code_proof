import MetricCard from "../MetricCard";

type MetricItem = {
  label: string;
  value: string;
  helper?: string;
  tone?: "default" | "warning" | "danger";
};

type MetricsGridProps = {
  items: MetricItem[];
};

export default function MetricsGrid({ items }: MetricsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <MetricCard key={item.label} {...item} />
      ))}
    </div>
  );
}
