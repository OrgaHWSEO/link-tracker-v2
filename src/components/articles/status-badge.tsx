import { Badge } from "@/components/ui/badge";

const statusConfig: Record<
  string,
  { label: string; className: string }
> = {
  PENDING: { label: "En attente", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  SENT: { label: "Envoye", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  CONFIRMED: { label: "Confirme", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  DELETED: { label: "Supprime", className: "bg-red-100 text-red-800 hover:bg-red-100" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
