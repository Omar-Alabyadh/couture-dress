"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
} from "react";

export type LuxuryListboxOption = {
  value: string;
  label: string;
};

type LuxuryListboxProps = {
  /** Matches `<label htmlFor>` */
  id: string;
  value: string;
  options: LuxuryListboxOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  /** When `value` is missing from `options` */
  emptyLabel?: string;
};

export function LuxuryListbox({
  id,
  value,
  options,
  onChange,
  disabled = false,
  emptyLabel = "—",
}: LuxuryListboxProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selectedLabel =
    selectedIndex >= 0 ? options[selectedIndex]!.label : emptyLabel;

  const close = useCallback((opts?: { restoreFocus?: boolean }) => {
    setOpen(false);
    if (opts?.restoreFocus) {
      requestAnimationFrame(() => btnRef.current?.focus());
    }
  }, []);

  const openMenu = useCallback(() => {
    if (disabled) return;
    const idx = options.findIndex((o) => o.value === value);
    setHighlightedIndex(idx >= 0 ? idx : 0);
    setOpen(true);
  }, [disabled, options, value]);

  const selectIndex = useCallback(
    (index: number) => {
      const opt = options[index];
      if (!opt) return;
      onChange(opt.value);
      close({ restoreFocus: true });
    },
    [close, onChange, options],
  );

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open, close]);

  useEffect(() => {
    if (!open) return;
    listRef.current?.focus();
  }, [open]);

  const safeHighlightedIndex =
    options.length === 0
      ? 0
      : Math.min(Math.max(0, highlightedIndex), options.length - 1);

  const onButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return;
    if (e.key === "Escape" && open) {
      e.preventDefault();
      close({ restoreFocus: true });
      return;
    }
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
      e.preventDefault();
      openMenu();
      return;
    }
    if (!open && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      openMenu();
    }
  };

  const onListKeyDown = (e: KeyboardEvent<HTMLUListElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close({ restoreFocus: true });
      return;
    }
    const len = options.length;
    if (len === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((i) => {
        const c =
          len === 0 ? 0 : Math.min(Math.max(0, i), len - 1);
        return (c + 1) % len;
      });
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((i) => {
        const c =
          len === 0 ? 0 : Math.min(Math.max(0, i), len - 1);
        return (c - 1 + len) % len;
      });
      return;
    }
    if (e.key === "Home") {
      e.preventDefault();
      setHighlightedIndex(0);
      return;
    }
    if (e.key === "End") {
      e.preventDefault();
      setHighlightedIndex(len - 1);
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      selectIndex(safeHighlightedIndex);
    }
  };

  const onBlurCapture = (e: FocusEvent<HTMLDivElement>) => {
    const next = e.relatedTarget as Node | null;
    if (!next || !rootRef.current?.contains(next)) setOpen(false);
  };

  const activeOptionId =
    open && options.length > 0
      ? `${listId}-opt-${safeHighlightedIndex}`
      : undefined;

  return (
    <div
      className="luxury-dd"
      ref={rootRef}
      onBlurCapture={onBlurCapture}
    >
      <button
        ref={btnRef}
        type="button"
        id={id}
        className="luxury-dd__btn"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => (open ? close() : openMenu())}
        onKeyDown={onButtonKeyDown}
      >
        <span className="luxury-dd__value">{selectedLabel}</span>
        <span className="luxury-dd__chevron" aria-hidden="true">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M6 9l6 6 6-6"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      <ul
        ref={listRef}
        id={listId}
        role="listbox"
        tabIndex={open ? 0 : -1}
        hidden={!open}
        className="luxury-dd__list"
        aria-activedescendant={activeOptionId}
        onKeyDown={onListKeyDown}
      >
        {options.map((opt, i) => {
          const selected = opt.value === value;
          const highlighted = i === safeHighlightedIndex;
          return (
            <li
              key={opt.value === "" ? "__empty__" : opt.value}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={selected}
              className={`luxury-dd__option${highlighted ? " luxury-dd__option--highlight" : ""}${selected ? " luxury-dd__option--selected" : ""}`}
              onMouseEnter={() => setHighlightedIndex(i)}
              onMouseDown={(ev) => ev.preventDefault()}
              onClick={() => selectIndex(i)}
            >
              {opt.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
