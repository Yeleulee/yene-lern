import React, { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className = '',
  children,
  disabled,
  ...props
}) => {
  const baseClasses = 'btn';
  const variantClasses = {
    primary: 'bg-gray-900/90 backdrop-blur-md text-white border border-gray-700/50 shadow-lg hover:bg-gray-800 hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all duration-300',
    secondary: 'bg-indigo-600/90 backdrop-blur-md text-white hover:bg-indigo-700 hover:shadow-lg hover:scale-[1.02] active:scale-95 transition-all duration-300',
    outline: 'bg-white/80 backdrop-blur-md border border-gray-200 text-gray-900 shadow-sm hover:bg-white hover:scale-[1.02] active:scale-95 transition-all duration-300',
    ghost: 'text-gray-700 hover:bg-gray-100/50 hover:backdrop-blur-sm transition-all duration-200',
    success: 'bg-green-600/90 backdrop-blur-md text-white hover:bg-green-700 hover:shadow-lg transition-all duration-300',
  };

  const sizeClasses = {
    sm: 'text-xs px-3 py-1',
    md: 'text-sm px-4 py-2',
    lg: 'text-base px-6 py-3',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <span>Loading...</span>
        </div>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;