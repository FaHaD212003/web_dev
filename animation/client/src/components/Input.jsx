export default function InputField({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  required = false 
}) {
  return (
    <div>
      
      {label && (
        <label className="block text-sm font-semibold text-zinc-300 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        required={required}
        value={value}
        onChange={onChange}
        className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-600 transition-all text-white placeholder-zinc-600"
        placeholder={placeholder}
      />
    </div>
  );
}