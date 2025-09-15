interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}

export default function Checkbox({ checked, onChange, disabled = false, className = '', id }: CheckboxProps) {
  const baseStyles = "h-5 w-5 rounded border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500";
  
  const checkedStyles = checked 
    ? "bg-indigo-600 border-indigo-600 text-white" 
    : "bg-white border-gray-300 hover:border-gray-400";
    
  const disabledStyles = disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer";

  return (
    <div className="relative">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className={`${baseStyles} ${checkedStyles} ${disabledStyles} ${className}`}
      />
      {checked && (
        <svg
          className="absolute inset-0 w-5 h-5 text-white pointer-events-none"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            clipRule="evenodd"
          />
        </svg>
      )}
    </div>
  );
}