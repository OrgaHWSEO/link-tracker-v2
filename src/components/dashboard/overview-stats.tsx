import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OverviewStatsProps {
  total: number;
  actifs: number;
  ceMois: number;
  ceMoisGrowth: number;
}

function CircleStat({
  value,
  color,
  filled = false,
}: {
  value: string | number;
  color: string;
  filled?: boolean;
}) {
  if (filled) {
    return (
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full shadow-md"
        style={{ backgroundColor: color }}
      >
        <span className="text-2xl font-bold text-white">{value}</span>
      </div>
    );
  }

  return (
    <div className="relative flex h-20 w-20 items-center justify-center">
      <svg
        className="absolute inset-0"
        width="80"
        height="80"
        viewBox="0 0 80 80"
        style={{ transform: "rotate(-90deg)" }}
      >
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="#E5E7EB"
          strokeWidth="5"
        />
      </svg>
      <span className="relative text-xl font-bold" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

export function OverviewStats({
  total,
  actifs,
  ceMois,
  ceMoisGrowth,
}: OverviewStatsProps) {
  const actifsPercent = total > 0 ? Math.round((actifs / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-indigo-50">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="7" width="3" height="8" rx="1" fill="#EC4899" />
              <rect x="6" y="4" width="3" height="11" rx="1" fill="#8B5CF6" />
              <rect x="11" y="1" width="3" height="14" rx="1" fill="#3B82F6" />
            </svg>
          </div>
          Vue d&apos;ensemble
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-start gap-8 overflow-x-auto pb-2">

          {/* Total */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <CircleStat value={total} color="#4F63E7" filled />
            <div className="text-center">
              <p className="text-sm font-semibold">Total</p>
              <p className="text-xs text-gray-400">backlinks</p>
            </div>
          </div>

          {/* Actifs */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <CircleStat value={actifs} color="#22C55E" />
            <div className="text-center">
              <p className="text-sm font-semibold">Actifs</p>
              <p className="text-xs text-gray-400">{actifsPercent}%</p>
            </div>
          </div>

          {/* Dofollow */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <CircleStat value={0} color="#3B82F6" />
            <div className="text-center">
              <p className="text-sm font-semibold">Dofollow</p>
              <p className="text-xs text-gray-400">0%</p>
            </div>
          </div>

          {/* Nofollow */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <CircleStat value={0} color="#F97316" />
            <div className="text-center">
              <p className="text-sm font-semibold">Nofollow</p>
              <p className="text-xs text-gray-400">0%</p>
            </div>
          </div>

          {/* Ce mois */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <CircleStat value={`+${ceMois}`} color="#EC4899" />
            <div className="text-center">
              <p className="text-sm font-semibold">Ce mois</p>
              <p className="text-xs text-green-500">↑{ceMoisGrowth}%</p>
            </div>
          </div>

          {/* DR Moyen */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <CircleStat value="0" color="#8B5CF6" />
            <div className="text-center">
              <p className="text-sm font-semibold">DR Moyen</p>
              <p className="text-xs text-gray-400">0 - 0</p>
            </div>
          </div>

          {/* Indexés */}
          <div className="flex shrink-0 flex-col items-center gap-2">
            <CircleStat value="-" color="#9CA3AF" />
            <div className="text-center">
              <p className="text-sm font-semibold text-gray-400">Indexés</p>
              <p className="text-xs text-cyan-500">Configurer</p>
            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
}
