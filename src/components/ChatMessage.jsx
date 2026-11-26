import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatMessage({ role, text }) {
  if (role === "user") {
    return (
      <div className="msg user">
        <div className="label">You</div>
        <pre className="user-text">{text}</pre>
      </div>
    );
  }
  return (
    <div className="msg ai">
      <div className="label">AI</div>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{text}</ReactMarkdown>
    </div>
  );
}