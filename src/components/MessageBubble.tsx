import { Bot, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ChatMessage } from "@/hooks/useChat";
import InsightChart from "./InsightChart";

interface Props {
  message: ChatMessage;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";
  const time = message.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <div className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"} mb-4`}>
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-chat-user" : "bg-primary"
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-chat-user-foreground" />
        ) : (
          <Bot className="w-4 h-4 text-primary-foreground" />
        )}
      </div>

      <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} gap-1 min-w-0`}>
        <div className={isUser ? "chat-bubble-user" : "chat-bubble-bot"}>
          <div className="markdown-scroll prose prose-sm max-w-none [&_p]:m-0 [&_ul]:my-1 [&_li]:my-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        </div>

        {message.insightData && (
          <div className="w-full max-w-md mt-2">
            <InsightChart data={message.insightData} />
          </div>
        )}

        <span className="text-xs text-muted-foreground px-1">{time}</span>
      </div>
    </div>
  );
}
