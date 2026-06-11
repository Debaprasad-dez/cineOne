import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { chat } from '@/services/openrouter';
import { usePageContext } from '@/hooks/usePageContext';
import { useUIStore } from '@/stores/uiStore';
import Markdown from './Markdown';
import type { ChatMessage } from '@/types/ai';

const PERSONA =
  'You are a deeply knowledgeable cinema companion with the sensibility of a Criterion Collection curator, the warmth of a lifelong film friend, and the analytical depth of a film school professor. You speak with passion, specificity, and genuine enthusiasm. Never be generic. Reference specific scenes, themes, directors. Use markdown: short bold lead-ins, occasional bullet lists, italics for film titles. Keep responses under 140 words unless asked to elaborate.';

const STARTERS = [
  'What should I watch tonight?',
  'Surprise me with something unexpected',
  'Explain a director I should know',
];

interface UIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AICompanion() {
  const { companionOpen, companionSeed, setCompanionOpen } = useUIStore();
  const open = companionOpen;
  const setOpen = setCompanionOpen;
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const orbRef = useRef<HTMLButtonElement>(null);
  const pageContext = usePageContext();

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  // Click anywhere outside the panel (and not on the orb) closes the companion.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || orbRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, setOpen]);

  // When opened with a seed prompt (e.g. from the hero), prefill the input.
  useEffect(() => {
    if (companionOpen && companionSeed) setInput(companionSeed);
  }, [companionOpen, companionSeed]);

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const next: UIMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const payload: ChatMessage[] = [
        { role: 'system', content: `${PERSONA}\n\n${pageContext}` },
        ...next.map((m) => ({ role: m.role, content: m.content }) as ChatMessage),
      ];
      const reply = await chat(payload, 0.9);
      setMessages([...next, { role: 'assistant', content: reply }]);
    } catch {
      setMessages([...next, { role: 'assistant', content: 'My reel jammed. Ask me again in a moment.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {/* Orb */}
      <motion.button
        ref={orbRef}
        data-hoverable
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        className="group fixed bottom-20 right-5 z-50 h-16 w-16 rounded-full md:bottom-6"
        aria-label="AI companion"
      >
        {/* pulsing aura */}
        <motion.span
          animate={{ scale: [1, 1.35, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-0 rounded-full bg-accent-violet/40 blur-md"
        />
        {/* rotating conic ring */}
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #E8624A, #7B5EA7, #4ECDC4, #C9954C, #E8624A)',
            padding: 2,
            WebkitMask: 'radial-gradient(circle, transparent 60%, #000 61%)',
            mask: 'radial-gradient(circle, transparent 60%, #000 61%)',
          }}
        />
        {/* core */}
        <span className="absolute inset-[3px] flex items-center justify-center rounded-full bg-void-2/90 backdrop-blur-sm">
          <motion.span
            animate={{ scale: [1, 1.12, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-5 w-5 rounded-full bg-gradient-to-br from-accent-crimson to-accent-violet shadow-[0_0_12px_rgba(232,98,74,0.6)]"
          />
        </span>
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 32 }}
            className="fixed bottom-0 right-0 z-50 flex h-full w-full flex-col border-l border-glass bg-void-2/80 backdrop-blur-glass md:w-[380px]"
          >
            {/* header */}
            <div className="flex shrink-0 items-center justify-between border-b border-glass px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="h-7 w-7 rounded-full bg-gradient-to-br from-accent-crimson to-accent-violet shadow-[0_0_10px_rgba(123,94,167,0.6)]" />
                <div>
                  <div className="font-display text-lg italic leading-none">Cinema Companion</div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-accent-teal">
                    context-aware
                  </div>
                </div>
              </div>
              <button
                data-hoverable
                onClick={() => setOpen(false)}
                className="text-text-muted transition-colors hover:text-text-primary"
              >
                ✕
              </button>
            </div>

            {/* scroll area */}
            <div
              ref={scrollRef}
              data-lenis-prevent
              className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-5 py-5"
            >
              {messages.length === 0 && (
                <div className="space-y-3">
                  <p className="font-ui text-sm text-text-secondary">
                    I see what you're looking at. Ask me anything about cinema.
                  </p>
                  <div className="space-y-2">
                    {STARTERS.map((s) => (
                      <button
                        key={s}
                        data-hoverable
                        onClick={() => send(s)}
                        className="block w-full rounded-2xl border border-glass bg-surface/40 px-4 py-3 text-left font-ui text-xs text-text-secondary transition-all hover:border-glass-hover hover:bg-surface-2"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {messages.map((m, i) =>
                m.role === 'user' ? (
                  <div key={i} className="flex justify-end">
                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-gradient-to-br from-accent-violet/40 to-accent-crimson/30 px-4 py-2.5 font-ui text-sm text-text-primary">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5"
                  >
                    <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-accent-crimson to-accent-violet" />
                    <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-surface/60 px-4 py-3">
                      <Markdown content={m.content} />
                    </div>
                  </motion.div>
                ),
              )}

              {busy && (
                <div className="flex gap-2.5">
                  <span className="mt-1 h-5 w-5 shrink-0 rounded-full bg-gradient-to-br from-accent-crimson to-accent-violet" />
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-md bg-surface/60 px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                        className="h-1.5 w-1.5 rounded-full bg-text-muted"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="shrink-0 border-t border-glass p-4"
            >
              <div className="flex items-center gap-2 rounded-full border border-glass bg-void px-2 py-1.5 focus-within:border-glass-hover">
                <input
                  data-hoverable
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about cinema…"
                  className="flex-1 bg-transparent px-3 py-1.5 font-ui text-sm outline-none placeholder:text-text-muted"
                />
                <button
                  data-hoverable
                  type="submit"
                  disabled={!input.trim() || busy}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-crimson to-accent-violet text-white transition-opacity disabled:opacity-40"
                >
                  ↑
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
