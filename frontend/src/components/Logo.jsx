export function LogoMark({ className = "h-9 w-9" }) {
  return (
    <svg viewBox="0 0 48 48" fill="none" className={className} aria-hidden="true">
      <circle cx="24" cy="24" r="20" stroke="#CFA858" strokeWidth="2" />
      <path
        d="M17.5 7.2C11.9 11 8.8 17.2 8.8 24s3.1 13 8.7 16.8"
        stroke="#CFA858"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M13.5 15.5h6M12 24h6M13.5 32.5h6" stroke="#CFA858" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ compact = false }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark />
      {!compact && (
        <span className="leading-none">
          <span className="block text-[9px] tracking-[0.38em] text-ivory/55 font-medium uppercase">
            Cricket Association
          </span>
          <span className="block font-display text-xl tracking-[0.22em] text-ivory mt-1">PATHANKOT</span>
        </span>
      )}
    </span>
  );
}
