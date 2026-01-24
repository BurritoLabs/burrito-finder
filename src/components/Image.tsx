import { useEffect, useMemo, useState } from "react";

interface Props {
  url?: string;
  urls?: string[];
  className?: string;
  size?: number;
}

const Image = ({ url, urls, className, size }: Props) => {
  const fallback =
    "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64'><rect width='64' height='64' rx='32' fill='%23304036'/><path d='M32 18a14 14 0 100 28 14 14 0 000-28z' fill='%235a6b65'/></svg>";
  const isFailed = (src: string) => {
    if (src.startsWith("data:")) return false;
    if (typeof window === "undefined") return false;
    const raw = window.localStorage.getItem(`imgfail:${src}`);
    if (!raw) return false;
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) return false;
    return Date.now() - parsed < 5 * 60 * 1000;
  };

  const sources = useMemo(() => {
    const base = urls?.length ? urls : url ? [url] : [];
    const filtered = base.filter(src => !isFailed(src));
    return [...filtered, fallback];
  }, [url, urls, fallback]);
  const sourcesKey = useMemo(() => sources.join("|"), [sources]);
  const [index, setIndex] = useState(0);
  const src = sources[index];
  const iconSize = { width: size, height: size };
  useEffect(() => {
    setIndex(0);
  }, [sourcesKey]);
  return src ? (
    <img
      src={src}
      alt="img"
      className={className}
      onError={() => {
        if (src && !src.startsWith("data:") && typeof window !== "undefined") {
          window.localStorage.setItem(`imgfail:${src}`, String(Date.now()));
        }
        if (index + 1 < sources.length) {
          setIndex(index + 1);
        } else {
          setIndex(sources.length);
        }
      }}
      {...iconSize}
    />
  ) : null;
};

export default Image;
