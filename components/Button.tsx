import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xs';
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  isLoading,
  disabled,
  ...props
}, ref) => {
  const baseStyle = "font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-neutral-800 inline-flex items-center justify-center transition-colors duration-150";

  let variantStyle = '';
  switch (variant) {
    case 'primary':
      variantStyle = 'bg-primary hover:bg-primary-dark text-white focus:ring-primary-dark';
      break;
    case 'secondary':
      variantStyle = 'bg-secondary hover:bg-secondary-dark text-neutral-800 focus:ring-secondary-dark';
      break;
    case 'danger':
      variantStyle = 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-700';
      break;
    case 'ghost':
      variantStyle = 'bg-transparent hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 focus:ring-primary';
      break;
    case 'outline':
      variantStyle = 'border border-primary text-primary hover:bg-primary/10 focus:ring-primary';
      break;
  }

  let sizeStyle = '';
  switch (size) {
    case 'sm':
      sizeStyle = 'px-3 py-1.5 text-sm';
      break;
    case 'md':
      sizeStyle = 'px-4 py-2 text-base';
      break;
    case 'lg':
      sizeStyle = 'px-6 py-3 text-lg';
      break;
    case 'xs':
      sizeStyle = 'px-2 py-1 text-xs';
      break;
  }

  const loadingStyle = isLoading ? 'opacity-75 cursor-not-allowed' : '';
  const disabledStyle = disabled ? 'opacity-50 cursor-not-allowed' : '';

  return (
    <button
      ref={ref}
      className={`${baseStyle} ${variantStyle} ${sizeStyle} ${loadingStyle} ${disabledStyle} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
});

Button.displayName = 'Button';
