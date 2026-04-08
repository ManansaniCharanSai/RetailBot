import { useState, useCallback, useRef } from "react";

export interface InsightData {
  chartType: "bar" | "line" | "pie" | "doughnut";
  title: string;
  labels: string[];
  datasets: { label: string; data: number[]; backgroundColor: string[] }[];
  summary: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  insightData?: InsightData | null;
  timestamp: Date;
}

function parseInsightData(text: string): { cleanText: string; insightData: InsightData | null } {
  const match = text.match(/INSIGHT_DATA:([\s\S]*?):END_INSIGHT/);
  if (!match) return { cleanText: text, insightData: null };

  let insightData: InsightData | null = null;
  try {
    insightData = JSON.parse(match[1].trim());
  } catch {
    return { cleanText: text, insightData: null };
  }

  const cleanText = text.replace(/INSIGHT_DATA:[\s\S]*?:END_INSIGHT/, "").trim();
  return { cleanText, insightData };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/retail-chat`;

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! 👋 I'm **RetailBot**, your intelligent retail assistant for ShopSmart Store.\n\nI can help you with:\n- 📦 **Inventory** — stock levels, pricing, low stock alerts\n- 📊 **Sales insights** — trends, summaries, and dashboard KPIs\n- 🔮 **Forecasting** — demand predictions and restocking projections\n- 💡 **Advanced recommendations** — bundles, promotions, and slow-mover actions\n- 🛍️ **Customer service** — returns, store info, FAQs\n\nI use **Indian Rupees (₹)** for currency responses.\n\nTry asking me something like *\"Do we have running shoes in stock?\"*, *\"Show sales summary\"*, or *\"Forecast next month demand\"*!",
      timestamp: new Date(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const history = messages
      .filter((m) => m.id !== "welcome")
      .map((m) => ({ role: m.role, content: m.content }));
    history.push({ role: "user", content: text });

    let assistantSoFar = "";
    const assistantId = crypto.randomUUID();

    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.id === assistantId) {
          return prev.map((m) => (m.id === assistantId ? { ...m, content: assistantSoFar } : m));
        }
        return [
          ...prev,
          { id: assistantId, role: "assistant" as const, content: assistantSoFar, timestamp: new Date() },
        ];
      });
    };

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: history }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }

      // Parse insight data from final content
      const { cleanText, insightData } = parseInsightData(assistantSoFar);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: cleanText, insightData } : m
        )
      );
    } catch (e: any) {
      if (e.name === "AbortError") return;
      const errorMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: `Sorry, I encountered an error: ${e.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== assistantId);
        return [...filtered, errorMsg];
      });
    } finally {
      setIsLoading(false);
      abortRef.current = null;
    }
  }, [messages]);

  const clearChat = useCallback(() => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Chat cleared! How can I help you?",
        timestamp: new Date(),
      },
    ]);
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}
