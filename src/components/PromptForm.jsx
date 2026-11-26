const LANGUAGES = ["Python", "Java", "C", "C++"];

export default function PromptForm({
  language, setLanguage, input, setInput, onSubmit, loading, isFollowUp,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="prompt-form" onSubmit={handleSubmit}>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
        disabled={isFollowUp || loading}
        title={isFollowUp ? "Start a new chat to change language" : "Select language"}
      >
        {LANGUAGES.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>

      <textarea
        rows={3}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={
          isFollowUp
            ? "Follow-up: e.g. use recursion, add input validation, convert to C++..."
            : "Describe the program: e.g. Find the second largest element in an array"
        }
        disabled={loading}
      />

      <button type="submit" disabled={loading || !input.trim()}>
        {loading ? "Generating..." : isFollowUp ? "Modify Code" : "Generate"}
      </button>
    </form>
  );
}