interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'high' | 'medium' | 'low' | 'today' | 'success';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  const baseStyles = "inline-flex items-center font-semibold rounded-full";
  
  const variants = {
    default: "bg-gray-100 text-gray-700",
    high: "bg-red-100 text-red-700",
    medium: "bg-amber-100 text-amber-700", 
    low: "bg-green-100 text-green-700",
    today: "bg-orange-100 text-orange-700",
    success: "bg-emerald-100 text-emerald-700"
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-sm"
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </span>
  );
}