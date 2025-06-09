
import React from 'react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode; // Changed from string to React.ReactNode
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  footer,
}) => {
  if (!isOpen) return null;

  let sizeClasses = '';
  switch (size) {
    case 'sm': sizeClasses = 'max-w-sm'; break;
    case 'md': sizeClasses = 'max-w-md'; break;
    case 'lg': sizeClasses = 'max-w-lg'; break;
    case 'xl': sizeClasses = 'max-w-xl'; break;
    case 'full': sizeClasses = 'max-w-full w-11/12'; break;
    default: sizeClasses = 'max-w-md';
  }

  return (
    <div
      className="fixed inset-0 bg-neutral-800 bg-opacity-75 flex items-center justify-center z-50 p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className={`bg-neutral-50 dark:bg-neutral-800 rounded-lg shadow-xl p-6 ${sizeClasses} w-full animate-slideUp flex flex-col max-h-[90vh]`}
        onClick={(e) => e.stopPropagation()} // Prevent click inside modal from closing it
      >
        <div className="flex items-center justify-between mb-4">
          {typeof title === 'string' ? (
            <h2 className="text-xl font-semibold text-neutral-800 dark:text-neutral-100 flex-grow">{title}</h2>
          ) : (
            <div className="flex-grow">{title}</div> // Render ReactNode directly
          )}
          <button
            onClick={onClose}
            className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200 transition-colors ml-2 flex-shrink-0" // Added ml-2 and flex-shrink-0
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="flex-grow overflow-y-auto mb-4">
          {children}
        </div>
        {footer && (
          <div className="mt-auto pt-4 border-t border-neutral-200 dark:border-neutral-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
