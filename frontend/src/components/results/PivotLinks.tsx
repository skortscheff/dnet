"use client";

interface Props {
  pivots: string[];
  onSearch: (q: string) => void;
}

interface ParsedPivot {
  label: string;
  query: string;
}

function parsePivot(pivot: string): ParsedPivot | null {
  // Match /api/v1/{type}/{value}
  const match = pivot.match(/^\/api\/v1\/(dns|ip|asn|prefix|mail)\/(.+)$/);
  if (!match) return null;

  const [, type, value] = match;

  const labelMap: Record<string, string> = {
    dns: "DNS",
    ip: "IP",
    asn: "ASN",
    prefix: "prefix",
    mail: "mail",
  };

  return {
    label: `${labelMap[type] ?? type} · ${value}`,
    query: value,
  };
}

export default function PivotLinks({ pivots, onSearch }: Props) {
  const parsed = pivots
    .map(parsePivot)
    .filter((p): p is ParsedPivot => p !== null);

  if (parsed.length === 0) return null;

  return (
    <div className="card p-4">
      <div className="section-title mb-3">Related lookups</div>
      <div className="flex flex-wrap gap-2">
        {parsed.map(({ label, query }) => (
          <button
            key={label}
            onClick={() => onSearch(query)}
            className="inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-mono text-mono-cyan border border-mono-cyan/30 bg-mono-cyan/5 hover:bg-mono-cyan/15 transition-colors cursor-pointer"
          >
            <span className="text-mono-cyan/60">→</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
