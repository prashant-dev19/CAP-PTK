export function LogoMark({ className = "h-11 w-11" }) {
  return (
    <img
      src="/cap-logo.png"
      alt=""
      aria-hidden="true"
      className={`${className} object-contain`}
      draggable="false"
    />
  );
}

export default function Logo({ compact = false }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark className="h-11 w-11" />
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
