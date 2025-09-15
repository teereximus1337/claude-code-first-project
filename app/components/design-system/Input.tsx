interface InputProps {
  type?: 'text' | 'date' | 'email' | 'password';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyPress?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  title?: string;
}

export default function Input({
  type = 'text',
  placeholder,
  value,
  onChange,
  onKeyPress,
  disabled = false,
  className = '',
  id,
  name,
  title
}: InputProps) {
  const baseStyles = "block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200";
  
  const disabledStyles = disabled ? "bg-gray-50 cursor-not-allowed" : "bg-white hover:border-gray-400";

  return (
    <input
      type={type}
      id={id}
      name={name}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onKeyPress={onKeyPress}
      disabled={disabled}
      title={title}
      className={`${baseStyles} ${disabledStyles} ${className}`}
    />
  );
}