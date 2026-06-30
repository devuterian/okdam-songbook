import { type ReactNode, useEffect, useRef } from "react";
import { X } from "lucide-react";

interface BottomSheetProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
}

export function BottomSheet({ open, title, children, onClose }: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return undefined;
    const previous = document.activeElement as HTMLElement | null;
    document.body.classList.add("scroll-locked");
    panelRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.classList.remove("scroll-locked");
      previous?.focus();
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section
        aria-labelledby="sheet-title"
        className="bottom-sheet"
        onMouseDown={(event) => event.stopPropagation()}
        ref={panelRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="sheet-handle" aria-hidden="true" />
        <header className="sheet-header">
          <h2 id="sheet-title">{title}</h2>
          <button type="button" className="icon-button" aria-label="닫기" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

