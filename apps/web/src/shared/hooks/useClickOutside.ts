import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Hook that triggers a callback when clicking outside of the specified element(s).
 * Optionally accepts an array of refs to exclude from triggering the callback.
 */
export function useClickOutside(
  ref: RefObject<HTMLElement | null> | RefObject<HTMLElement | null>[],
  callback: (event: MouseEvent | TouchEvent) => void,
  excludeRefs?: RefObject<HTMLElement | null>[],
) {
  useEffect(() => {
    const handler = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!target) return;

      const checkInside = (r: RefObject<HTMLElement | null>) => {
        return r.current !== null && r.current.contains(target);
      };

      const isInsideMain = Array.isArray(ref)
        ? ref.some(checkInside)
        : checkInside(ref);

      const isInsideExcluded = excludeRefs?.some(checkInside) ?? false;

      if (!isInsideMain && !isInsideExcluded) {
        callback(event);
      }
    };

    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);

    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [ref, callback, excludeRefs]);
}
