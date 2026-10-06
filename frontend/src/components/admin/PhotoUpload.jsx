import { useRef, useState } from "react";
import { ImagePlus, Loader2, Trash2 } from "lucide-react";
import { api, formatApiError } from "@/lib/api";

export default function PhotoUpload({ value, onChange, testPrefix, label = "Photo", hint }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const pick = () => inputRef.current?.click();

  const upload = (e) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-picking the same file later
    if (!file) return;
    setError("");
    setBusy(true);
    setProgress(0);
    const fd = new FormData();
    fd.append("file", file);
    api
      .post("/admin/upload", fd, {
        onUploadProgress: (ev) => {
          if (ev.total) setProgress(Math.round((ev.loaded / ev.total) * 100));
        },
      })
      .then(({ data }) => onChange(data.url))
      .catch((err) => setError(formatApiError(err)))
      .finally(() => {
        setBusy(false);
        setProgress(0);
      });
  };

  return (
    <div data-testid={`${testPrefix}-upload-wrap`}>
      <span className="field-label">{label}</span>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        data-testid={`${testPrefix}-input`}
        onChange={upload}
      />
      <div className="flex items-start gap-5 flex-wrap mt-1">
        <div
          className="w-36 h-24 rounded-lg border border-gold/20 bg-pavilion-deep/60 overflow-hidden flex items-center justify-center shrink-0"
          data-testid={`${testPrefix}-preview-box`}
        >
          {value ? (
            <img
              src={value}
              alt="Photo preview"
              data-testid={`${testPrefix}-preview`}
              className="w-full h-full object-cover"
            />
          ) : (
            <ImagePlus size={22} className="text-gold/30" />
          )}
        </div>
        <div className="flex flex-col items-start gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={pick}
              disabled={busy}
              data-testid={`${testPrefix}-upload`}
              className="inline-flex items-center gap-2 text-[0.62rem] tracking-[0.2em] uppercase border border-gold/40 text-gold rounded-full px-5 py-2.5 hover:bg-gold hover:text-pavilion transition-colors disabled:opacity-60"
            >
              {busy ? (
                <>
                  <Loader2 size={13} className="animate-spin" /> Uploading {progress}%
                </>
              ) : (
                <>
                  <ImagePlus size={13} /> {value ? "Replace photo" : "Upload photo"}
                </>
              )}
            </button>
            {value && !busy && (
              <button
                type="button"
                onClick={() => onChange("")}
                data-testid={`${testPrefix}-remove`}
                aria-label="Remove photo"
                title="Remove photo"
                className="text-ivory/40 hover:text-red-300 transition-colors p-2"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
          {busy && progress > 0 && (
            <div
              className="w-44 h-1.5 rounded-full bg-ivory/10 overflow-hidden"
              data-testid={`${testPrefix}-progress`}
            >
              <div className="h-full bg-gold transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
          {error && (
            <p className="text-xs text-red-300" data-testid={`${testPrefix}-error`}>
              {error}
            </p>
          )}
          {hint && !error && <p className="text-[0.62rem] text-ivory/40 leading-relaxed max-w-xs">{hint}</p>}
        </div>
      </div>
    </div>
  );
}
