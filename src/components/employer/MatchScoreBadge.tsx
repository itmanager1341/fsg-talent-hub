interface MatchScoreBadgeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

function getScoreConfig(score: number | null): {
  label: string;
  color: string;
  bgColor: string;
} {
  if (score === null) {
    return {
      label: 'Not Ranked',
      color: 'text-gray-500',
      bgColor: 'bg-gray-100',
    };
  }

  if (score >= 80) {
    return {
      label: 'Strong Match',
      color: 'text-green-700',
      bgColor: 'bg-green-100',
    };
  }

  if (score >= 60) {
    return {
      label: 'Good Match',
      color: 'text-yellow-700',
      bgColor: 'bg-yellow-100',
    };
  }

  if (score >= 40) {
    return {
      label: 'Partial Match',
      color: 'text-orange-700',
      bgColor: 'bg-orange-100',
    };
  }

  return {
    label: 'Weak Match',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
  };
}

export function MatchScoreBadge({
  score,
  size = 'md',
  showLabel = false,
}: MatchScoreBadgeProps) {
  const config = getScoreConfig(score);

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ${config.bgColor} ${config.color} ${sizeClasses[size]}`}
    >
      {score !== null && (
        <span className="font-bold">{Math.round(score)}</span>
      )}
      {showLabel && <span>{config.label}</span>}
      {score === null && <span>Not Ranked</span>}
    </span>
  );
}

// Circular progress version for larger displays
export function MatchScoreCircle({
  score,
  size = 64,
}: {
  score: number | null;
  size?: number;
}) {
  const config = getScoreConfig(score);
  const circumference = 2 * Math.PI * 28; // radius of 28
  const strokeDashoffset = score !== null
    ? circumference - (score / 100) * circumference
    : circumference;

  const strokeColor = score === null ? '#d1d5db' :
    score >= 80 ? '#22c55e' :
    score >= 60 ? '#eab308' :
    score >= 40 ? '#f97316' : '#9ca3af';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={28}
          stroke="#e5e7eb"
          strokeWidth="6"
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={28}
          stroke={strokeColor}
          strokeWidth="6"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`font-bold text-lg ${config.color}`}>
          {score !== null ? Math.round(score) : '—'}
        </span>
      </div>
    </div>
  );
}
