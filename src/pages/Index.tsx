import { useState } from "react";
import { PackageSearch, TrendingUp, BarChart3, ShoppingBag, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import ChatWindow from "@/components/ChatWindow";

const quickActions = [
  { label: "Sales summary", icon: BarChart3, message: "Give me a sales summary for today, this week, and this month with key KPIs." },
  { label: "Low stock alerts", icon: PackageSearch, message: "Show low stock alerts with urgency levels and suggested reorder quantities." },
  { label: "Sales trend", icon: TrendingUp, message: "What's our sales trend this week?" },
  { label: "Forecast demand", icon: TrendingUp, message: "Forecast product demand for the next 7 and 30 days based on recent sales patterns." },
  { label: "Top products", icon: ShoppingBag, message: "Show top selling products with quantity sold, revenue, and ranking for today, this week, and this month." },
  { label: "Advanced insights", icon: ShoppingBag, message: "Give advanced retail insights: slow movers, restocking priorities, and promotion opportunities." },
];

function emitQuickAction(message: string) {
  window.dispatchEvent(new CustomEvent("retailbot-quick-action", { detail: message }));
}

export default function Index() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="h-dvh flex flex-col md:flex-row overflow-hidden">
      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between px-4 py-2 bg-sidebar border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <img src="/retailbot-logo.svg" alt="RetailBot logo" className="w-5 h-5 rounded-sm" />
          <span className="text-sm font-semibold text-sidebar-foreground">RetailBot</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-sidebar-foreground"
        >
          {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-64 bg-sidebar border-r border-sidebar-border flex-shrink-0`}
      >
        <div className="hidden md:flex items-center gap-3 px-5 py-5 border-b border-sidebar-border">
          <img src="/retailbot-logo.svg" alt="RetailBot logo" className="w-10 h-10 rounded-lg" />
          <div>
            <h2 className="text-base font-bold text-sidebar-foreground leading-tight">RetailBot</h2>
            <p className="text-xs text-sidebar-foreground/60">Retail Intelligence</p>
          </div>
        </div>

        <div className="px-3 py-4 flex-1">
          <p className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider px-2 mb-3">
            Quick Actions
          </p>
          <div className="space-y-1">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  emitQuickAction(action.message);
                  setSidebarOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-left"
              >
                <action.icon className="w-4 h-4 text-sidebar-primary flex-shrink-0" />
                {action.label}
              </button>
            ))}
          </div>
        </div>

        <div className="px-5 py-3 border-t border-sidebar-border">
          <p className="text-xs text-sidebar-foreground/40">Powered by AI</p>
        </div>
      </aside>

      {/* Chat area */}
      <main className="flex-1 min-w-0 min-h-0 flex flex-col">
        <ChatWindow />
      </main>

      {/* Mobile bottom tab bar */}
      <div className="md:hidden flex border-t border-border bg-card">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => emitQuickAction(action.message)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <action.icon className="w-4 h-4" />
            <span className="text-[10px] leading-tight">{action.label.split(" ")[0]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
