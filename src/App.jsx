import { useState, useRef, useEffect } from "react";
import PromptForm from "./components/PromptForm";
import ChatMessage from "./components/ChatMessage";
import { generateResponse } from "./services/gemini";
import "./App.css";

export default function App() {
  const [language, setLanguage] = useState("Python");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]); // [{role, text}]
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const isFollowUp = messages.length > 0;

  const handleSubmit = async () => {
    const text = isFollowUp
      ? input.trim()
      : `Programming language: ${language}\nRequirement: ${input.trim()}`;

    const updated = [...messages, { role: "user", text }];
    setMessages(updated);
    setInput("");
    setError("");
    setLoading(true);

    try {
      const reply = await generateResponse(updated);
      setMessages([...updated, { role: "model", text: reply }]);
    } catch (e) {
      setError(e.message);
      setMessages(messages);   // roll back failed message
      setInput(input);
    } finally {
      setLoading(false);
    }
  };

  const newChat = () => {
    setMessages([]);
    setInput("");
    setError("");
  };

  return (
    <div className="app">
      <header>
        <h1>AI Code Generation & Explanation System</h1>
        {isFollowUp && <button className="secondary" onClick={newChat}>New Chat</button>}
      </header>

      <main className="chat">
        {!isFollowUp && (
          <p className="hint">
            Select a language, describe your requirement in plain English, and get code,
            line-by-line explanation, sample I/O and complexity analysis.
          </p>
        )}
        {messages.map((m, i) => (
          <ChatMessage key={i} role={m.role} text={m.text} />
        ))}
        {loading && <p className="hint">Generating... please wait</p>}
        {error && <p className="error">{error}</p>}
        <div ref={bottomRef} />
      </main>

      <PromptForm
        language={language}
        setLanguage={setLanguage}
        input={input}
        setInput={setInput}
        onSubmit={handleSubmit}
        loading={loading}
        isFollowUp={isFollowUp}
      />
    </div>
  );
}