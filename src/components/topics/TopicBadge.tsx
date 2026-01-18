import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface TopicBadgeProps {
  topic: string;
  count?: number;
  size?: "sm" | "md" | "lg";
  clickable?: boolean;
}

export function TopicBadge({
  topic,
  count,
  size = "md",
  clickable = true,
}: TopicBadgeProps) {
  const slug = topic.toLowerCase().replace(/\s+/g, "-");

  const sizeClasses = {
    sm: "text-xs px-2 py-0.5",
    md: "text-sm px-3 py-1",
    lg: "text-base px-4 py-1.5",
  };

  const badge = (
    <Badge
      variant="secondary"
      className={`${sizeClasses[size]} ${
        clickable ? "hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors" : ""
      }`}
    >
      {topic}
      {count !== undefined && (
        <span className="ml-1 opacity-60">({count})</span>
      )}
    </Badge>
  );

  if (clickable) {
    return <Link href={`/topic/${slug}`}>{badge}</Link>;
  }

  return badge;
}
