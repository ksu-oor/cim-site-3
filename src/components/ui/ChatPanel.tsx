'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, isToolUIPart } from 'ai';
import { useWorldStore } from '@/lib/voxel/world-store';
import { serializeNearby } from '@/lib/voxel/serializer';
import { BlockType } from '@/lib/voxel/types';

function renderText(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((segment, i) => {
    if (segment.startsWith('**') && segment.endsWith('**')) {
      return <strong key={i} className="font-semibold">{segment.slice(2, -2)}</strong>;
    }
    return segment;
  });
}

interface ChatPanelProps {
  open: boolean;
  onToggle: () => void;
  playerPosition: [number, number, number];
}

export function ChatPanel({ open, onToggle, playerPosition }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, status, error, regenerate, clearError } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        worldContext: serializeNearby(playerPosition[0], playerPosition[1], playerPosition[2]),
      },
    }),
  });

  // Apply tool results to the world
  useEffect(() => {
    const store = useWorldStore.getState();
    for (const message of messages) {
      if (message.role !== 'assistant') continue;
      for (const part of message.parts) {
        if (isToolUIPart(part) && part.state === 'output-available' && part.output) {
          const output = part.output as Record<string, unknown>;
          if (output.blocks && Array.isArray(output.blocks)) {
            const blocks = output.blocks as { x: number; y: number; z: number; type?: BlockType }[];
            if (output.removed !== undefined) {
              // remove_blocks tool
              store.setBlocks(blocks.map((b) => ({ ...b, type: BlockType.AIR })));
            } else {
              // place_blocks or generate_structure tool
              store.setBlocks(blocks.filter((b) => b.type !== undefined) as { x: number; y: number; z: number; type: BlockType }[]);
            }
          }
        }
      }
    }
  }, [messages]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || status !== 'ready') return;
      sendMessage({ text: input });
      setInput('');
    },
    [input, status, sendMessage],
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 z-40 transition-transform duration-300 ease-out ${
        open ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="h-full flex flex-col bg-black/60 backdrop-blur-xl border-l border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <h2 className="text-white/90 text-sm font-medium tracking-wide">World Builder AI</h2>
          <button
            onClick={onToggle}
            className="text-white/50 hover:text-white/90 text-lg transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-3 text-sm">
              <p className="text-white/60 font-medium">Welcome to the CIM Voxel World!</p>
              <p className="text-white/40">
                This is the Center for Interactive Media at Kennesaw State University.
                Explore the themed buildings around you — each represents a CIM research cluster.
              </p>
              <div className="space-y-2">
                <p className="text-white/50 font-medium text-xs uppercase tracking-wider">Try these:</p>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Build a house with glass windows',
                    'Make a garden with trees',
                    'Add a tower near the Game Studio',
                    'What are the CIM buildings?',
                  ].map((suggestion) => (
                    <button
                      key={suggestion}
                      onClick={() => { sendMessage({ text: suggestion }); }}
                      className="px-2.5 py-1.5 text-xs text-white/60 hover:text-white/90 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg transition-colors text-left"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-white/25 text-xs">
                You can also place blocks manually — LClick to remove, RClick to place.
              </p>
            </div>
          )}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`text-sm ${
                message.role === 'user' ? 'text-blue-300' : 'text-white/80'
              }`}
            >
              {message.parts.map((part, i) => {
                if (part.type === 'text') {
                  return (
                    <span key={`${message.id}-${i}`} className="whitespace-pre-wrap">
                      {renderText(part.text)}
                    </span>
                  );
                }
                if (isToolUIPart(part)) {
                  return (
                    <div
                      key={`${message.id}-${i}`}
                      className="my-1 px-2 py-1.5 rounded bg-white/5 border border-white/10 text-xs font-mono text-emerald-400/80"
                    >
                      {part.state === 'output-available' ? (
                        <>
                          Building... {(part.output as Record<string, unknown>)?.summary ||
                            `${(part.output as Record<string, unknown>)?.removed || (part.output as Record<string, unknown>)?.built || (part.output as Record<string, unknown>)?.placed} blocks`}
                        </>
                      ) : (
                        <span className="animate-pulse">Working...</span>
                      )}
                    </div>
                  );
                }
                return null;
              })}
            </div>
          ))}
          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              <p className="font-medium">Something went wrong</p>
              <p className="text-red-400/70 text-xs mt-1">{error.message || 'Failed to get a response.'}</p>
              <button
                onClick={() => { clearError(); regenerate(); }}
                className="mt-2 px-2 py-1 text-xs bg-red-400/20 hover:bg-red-400/30 rounded text-red-300 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          {status === 'streaming' && !error && (
            <div className="text-sm text-white/40 animate-pulse">Thinking...</div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-white/10">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={status !== 'ready'}
              placeholder={status === 'ready' ? 'Build a house here...' : 'Thinking...'}
              className="flex-1 bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-white/30 transition-colors"
            />
            <button
              type="submit"
              disabled={status !== 'ready' || !input.trim()}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 disabled:opacity-30 rounded-lg text-white/80 text-sm transition-colors"
            >
              Send
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
