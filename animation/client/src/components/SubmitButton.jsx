export default function SubmitButton({
  isLoading = false,
  loadingText = "Processing...",
  children,
  type = "submit",
}) {
  return (
    <button
      type={type}
      disabled={isLoading}
      className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors shadow-lg mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? loadingText : children}
    </button>
  );
}
