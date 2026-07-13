
import React, { useEffect, useRef } from 'react';
import { ContextMenuItem } from '../types';

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLButtonElement>('button:not([disabled])')?.focus();
    });
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };
    const handleEscapeKey = (event: KeyboardEvent) => {
        if (event.key === 'Escape') {
            onClose();
        }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      previousFocusRef.current?.focus();
    };
  }, [onClose]);

  // Adjust position if menu would go off-screen
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    top: y,
    left: x,
    zIndex: 1000,
  };

  // Use a state for adjusted position to allow ref to update DOM for measurements
  const [adjustedPosition, setAdjustedPosition] = React.useState({ top: y, left: x });

  useEffect(() => {
    if (menuRef.current) {
      const menuWidth = menuRef.current.offsetWidth;
      const menuHeight = menuRef.current.offsetHeight;
      let newTop = y;
      let newLeft = x;

      if (x + menuWidth > window.innerWidth) {
        newLeft = window.innerWidth - menuWidth - 5; // 5px buffer
      }
      if (y + menuHeight > window.innerHeight) {
        newTop = window.innerHeight - menuHeight - 5; // 5px buffer
      }
      // Ensure position is not negative if menu is larger than viewport (less common)
      if (newLeft < 0) newLeft = 0;
      if (newTop < 0) newTop = 0;
      
      setAdjustedPosition({ top: newTop, left: newLeft });
    }
  }, [x, y, items]); // Re-calculate if x, y, or items (which might change height) change


  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="Actions"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose();
          return;
        }
        const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not([disabled])') ?? []);
        const currentIndex = buttons.indexOf(document.activeElement as HTMLButtonElement);
        let nextIndex: number | null = null;
        if (event.key === 'ArrowDown') nextIndex = (currentIndex + 1) % buttons.length;
        else if (event.key === 'ArrowUp') nextIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = buttons.length - 1;
        if (nextIndex === null || buttons.length === 0) return;
        event.preventDefault();
        buttons[nextIndex]?.focus();
      }}
      className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-lg py-1 min-w-max animate-fadeIn"
      style={{ ...menuStyle, top: adjustedPosition.top, left: adjustedPosition.left }}
    >
      {items.map((item, index) => {
        // Check if item is a separator by testing for the `isSeparator: true` property.
        // This distinguishes SeparatorContextItem from ActionContextItem.
        if (item.isSeparator === true) {
          // item is SeparatorContextItem
          return <div key={`sep-${index}`} role="separator" className="h-px bg-neutral-200 dark:bg-neutral-700 my-1 mx-1"></div>;
        } else {
          // item is ActionContextItem because isSeparator is not true (it's false or undefined).
          // TypeScript should correctly infer 'item' as ActionContextItem here.
          return (
            <button
              key={`${item.label}-${index}`} // item.label is safe
              type="button"
              role="menuitem"
              onClick={() => {
                item.action(); // item.action is safe
                onClose(); 
              }}
              disabled={item.disabled} // item.disabled is safe
              className="w-full px-2.5 py-1.5 text-left text-sm text-neutral-700 transition-colors hover:bg-primary/20 focus-visible:bg-primary/20 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-200 dark:hover:bg-primary-dark/30 dark:focus-visible:bg-primary-dark/30"
            >
              {item.label} {/* item.label is safe */}
            </button>
          );
        }
      })}
    </div>
  );
};
