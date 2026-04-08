import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  isListening: boolean;
  isSupported: boolean;
  onToggle: () => void;
}

export default function VoiceButton({ isListening, isSupported, onToggle }: Props) {
  if (!isSupported) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" disabled className="opacity-40">
            <MicOff className="w-5 h-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Voice not supported in this browser</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggle}
          className={`rounded-full transition-all ${isListening ? "mic-active bg-destructive text-destructive-foreground" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Mic className="w-5 h-5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>{isListening ? "Stop listening" : "Voice input"}</TooltipContent>
    </Tooltip>
  );
}
