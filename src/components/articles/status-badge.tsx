const statusConfig: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  PENDING:   { label: "En attente", dot: "bg-amber-400",  bg: "bg-amber-50",  text: "text-amber-700" },
  SENT:      { label: "Envoyé",     dot: "bg-blue-400",   bg: "bg-blue-50",   text: "text-blue-700" },
  CONFIRMED: { label: "Confirmé",   dot: "bg-emerald-400",bg: "bg-emerald-50",text: "text-emerald-700" },
  DELETED:   { label: "Supprimé",   dot: "bg-red-400",    bg: "bg-red-50",    text: "text-red-700" },
  FOUND:         { label: "Trouvé",     dot: "bg-emerald-400",bg: "bg-emerald-50",text: "text-emerald-700" },
  NOT_FOUND:     { label: "Introuvable",dot: "bg-red-400",    bg: "bg-red-50",    text: "text-red-700" },
  ERROR:         { label: "Erreur",     dot: "bg-orange-400", bg: "bg-orange-50", text: "text-orange-700" },
  REDIRECTED:    { label: "Redirigé",   dot: "bg-purple-400", bg: "bg-purple-50", text: "text-purple-700" },
};

export function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${config.bg} ${config.text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
