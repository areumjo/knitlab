
import React, { useEffect, useRef } from 'react';
import { ContextMenuItem, StitchSymbolDef } from '../types'; // Assuming StitchSymbolDef might be used elsewhere, keeping for safety. Actual fix only involves ContextMenuItem.

interface ContextMenuProps {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
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
      className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-lg py-1 min-w-max animate-fadeIn"
      style={{ ...menuStyle, top: adjustedPosition.top, left: adjustedPosition.left }}
    >
      {items.map((item, index) => {
        // Check if item is a separator by testing for the `isSeparator: true` property.
        // This distinguishes SeparatorContextItem from ActionContextItem.
        if (item.isSeparator === true) {
          // item is SeparatorContextItem
          return <div key={`sep-${index}`} className="h-px bg-neutral-200 dark:bg-neutral-700 my-1 mx-1"></div>;
        } else {
          // item is ActionContextItem because isSeparator is not true (it's false or undefined).
          // TypeScript should correctly infer 'item' as ActionContextItem here.
          return (
            <button
              key={`${item.label}-${index}`} // item.label is safe
              onClick={() => {
                item.action(); // item.action is safe
                onClose(); 
              }}
              disabled={item.disabled} // item.disabled is safe
              className="w-full text-left px-2.5 py-1.5 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-primary/20 dark:hover:bg-primary-dark/30 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:bg-primary/20 dark:focus:bg-primary-dark/30 transition-colors"
            >
              {item.label} {/* item.label is safe */}
            </button>
          );
        }
      })}
    </div>
  );
};
