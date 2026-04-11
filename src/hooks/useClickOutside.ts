import { useEffect, useRef } from "react";

/**
 * Closes a dropdown/popover when the user clicks outside its container
 * or presses Escape.
 *
 * @param containerRef - Ref to the element that should remain "inside"
 * @param onOutside    - Callback to run when an outside event fires
 * @param enabled      - Attach listeners only when the element is open
 *
 * @example
 * const ref = useRef<HTMLDivElement>(null);
 * const [open, setOpen] = useState(false);
 * useClickOutside(ref, () => setOpen(false), open);
 */
export function useClickOutside<T extends HTMLElement>(
  containerRef: React.RefObject<T | null>,
  onOutside: () => void,
  enabled: boolean,
) {
  // Keep latest callback in a ref so the effect doesn't re-subscribe
  // every time an inline arrow function is passed as onOutside.
  const callbackRef = useRef(onOutside);
  useEffect(() => {
    callbackRef.current = onOutside;
  });

  useEffect(() => {
    if (!enabled) return;

    function handleMouseDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        callbackRef.current();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        callbackRef.current();
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [containerRef, enabled]);
}
