interface IconButtonProps {
  children: React.ReactNode;
  onClick?: (event?: React.MouseEvent<HTMLButtonElement>) => void;
  variant?: 'default' | 'primary' | 'success' | 'warning';
  size?: 'sm' | 'md';
  disabled?: boolean;
  className?: string;
  title?: string;
}

export default function IconButton({ 
  children, 
  onClick, 
  variant = 'default', 
  size = 'md', 
  disabled = false, 
  className = '',
  title 
}: IconButtonProps) {
  const baseStyles = "inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    default: "text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
    primary: "text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 focus:ring-indigo-500",
    success: "text-green-500 hover:text-green-700 hover:bg-green-50 focus:ring-green-500",
    warning: "text-amber-500 hover:text-amber-700 hover:bg-amber-50 focus:ring-amber-500"
  };

  const sizes = {
    sm: "w-7 h-7 text-sm",
    md: "w-9 h-9 text-base"
  };

  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <button
      onClick={(e) => onClick?.(e)}
      disabled={disabled}
      title={title}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${disabledStyles} ${className}`}
    >
      {children}
    </button>
  );
}