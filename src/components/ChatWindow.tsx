import { useState, useRef, useEffect, FormEvent } from "react";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import MessageBubble from "./MessageBubble";
import VoiceButton from "./VoiceButton";
import { useChat } from "@/hooks/useChat";
import { useVoice } from "@/hooks/useVoice";

export default function ChatWindow() {
  const { messages, isLoading, sendMessage, clearChat } = useChat();
  const { isListening, isSupported, startListening, stopListening, error: voiceError } = useVoice();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Listen for quick action events from sidebar
  useEffect(() => {
    const handler = (e: Event) => {
      const message = (e as CustomEvent).detail;
      sendMessage(message);
    };
    window.addEventListener("retailbot-quick-action", handler);
    return () => window.removeEventListener("retailbot-quick-action", handler);
  }, [sendMessage]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    sendMessage(text);
  };

  const handleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening((text) => {
        setInput(text);
        sendMessage(text);
      });
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card">
        <div className="flex items-center gap-2.5">
          <img src="/retailbot-logo.svg" alt="RetailBot logo" className="w-9 h-9 rounded-full" />
          <div>
            <h1 className="text-base font-semibold text-card-foreground leading-tight">RetailBot</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs text-muted-foreground">Online</span>
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={clearChat} className="text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-1">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex gap-2.5 mb-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm">🤖</div>
            <div className="chat-bubble-bot">
              <div className="flex gap-1.5 py-1">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Voice error */}
      {voiceError && (
        <div className="px-4 py-1.5 text-xs text-destructive bg-destructive/10">{voiceError}</div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2 p-3 border-t border-border bg-card">
        <VoiceButton isListening={isListening} isSupported={isSupported} onToggle={handleVoice} />
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isListening ? "🎤 Listening..." : "Ask about inventory, sales, or anything..."}
          className="flex-1"
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={!input.trim() || isLoading}>
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </div>
  );
}
