"use client";

import React, { useCallback, useState } from "react";
import { useConversation, ConversationProvider } from "@elevenlabs/react";

interface VoiceCallDemoProps {
  agentId: string;
  glassClass: string;
}

function VoiceCallDemoInner({ agentId, glassClass }: VoiceCallDemoProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const conversation = useConversation({
    onConnect: () => setErrorMessage(null),
    onDisconnect: () => {},
    onMessage: () => {},
    onError: (error) => {
      setErrorMessage(
        typeof error === "string" ? error : "The call couldn't connect. Please try again."
      );
    },
  });

  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting";

  const startCall = useCallback(async () => {
    setErrorMessage(null);
    try {
      // Request microphone permission explicitly before starting the session —
      // this surfaces a clear browser prompt instead of failing silently, and
      // is the only part of this block that actually throws. startSession
      // itself is synchronous/void in this SDK version; session-level
      // failures surface through the onError callback registered above.
      await navigator.mediaDevices.getUserMedia({ audio: true });
      conversation.startSession({ agentId });
    } catch (err) {
      const isPermissionError =
        err instanceof DOMException &&
        (err.name === "NotAllowedError" || err.name === "PermissionDeniedError");
      setErrorMessage(
        isPermissionError
          ? "Microphone access was denied. Allow mic access in your browser to try the demo."
          : "Couldn't start the call. Please try again."
      );
    }
  }, [conversation, agentId]);

  const stopCall = useCallback(() => {
    conversation.endSession();
  }, [conversation]);

  return (
    <div className={`w-full max-w-md rounded-xl ${glassClass} px-6 py-8 text-center flex flex-col items-center gap-4`}>
      <div className="flex items-center gap-2 text-xs font-mono">
        <span
          className={`w-2 h-2 rounded-full ${
            isConnected ? "bg-emerald-500 animate-pulse" : isConnecting ? "bg-amber-400 animate-pulse" : "bg-gray-600"
          }`}
        ></span>
        <span className="text-gray-400">
          {isConnected
            ? conversation.isSpeaking
              ? "Agent speaking"
              : "Listening"
            : isConnecting
            ? "Connecting..."
            : "Not connected"}
        </span>
      </div>

      {errorMessage && (
        <div className="w-full rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-xs text-red-300">
          {errorMessage}
        </div>
      )}

      <div className="flex gap-3 w-full">
        <button
          type="button"
          onClick={startCall}
          disabled={isConnected || isConnecting}
          className="flex-1 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-gray-950 font-bold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isConnecting ? "Connecting..." : "Start call"}
        </button>
        <button
          type="button"
          onClick={stopCall}
          disabled={!isConnected}
          className="flex-1 py-3 rounded-lg border border-white/10 text-gray-300 hover:text-white hover:border-white/20 font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          End call
        </button>
      </div>

      <p className="text-[11px] text-gray-500 font-mono">
        Requires microphone access. Runs directly in this page.
      </p>
    </div>
  );
}

export default function VoiceCallDemo(props: VoiceCallDemoProps) {
  return (
    <ConversationProvider>
      <VoiceCallDemoInner {...props} />
    </ConversationProvider>
  );
}
