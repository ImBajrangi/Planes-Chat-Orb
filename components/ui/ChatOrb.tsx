import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  RotateCcw,
  X,
  MessageSquareDashed,
  Paperclip,
  ChevronDown,
  ArrowUp,
  Brain,
  Copy,
  Check,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import {
  computeOrbGeometry,
  computeEyeLookOffset,
  DEFAULT_CHAT_SCRIPT,
  getNextScriptTurn,
  type ChatTurnScript,
} from '@/src/utils/orbPhysics';

export interface AIChatProps {
  title?: string;
  subtitle?: string;
  greeting?: string;
  script?: ChatTurnScript[];
}

export interface ChatOrbProps {
  position?: 'bottom-right' | 'bottom-left' | 'inline';
  teaser?: string;
  teaserDelay?: number;
  defaultOpen?: boolean;
  chat?: AIChatProps;
  panelClassName?: string;
  className?: string;
  onOpenChange?: (open: boolean) => void;
}

interface OrbAvatarProps {
  size: number;
  isTracking?: boolean;
  isThinking?: boolean;
  tintColor?: string;
}

export function OrbAvatar({
  size,
  isTracking = true,
  isThinking = false,
  tintColor,
}: OrbAvatarProps) {
  const orbRef = useRef<HTMLDivElement>(null);
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [isBlinking, setIsBlinking] = useState(false);

  const geo = computeOrbGeometry(size);

  // Cursor / pointer tracking + gentle idle drift
  useEffect(() => {
    if (!isTracking) return;

    let rafId: number | null = null;
    let lastPointer = { x: -1, y: -1, active: false };

    const handlePointerMove = (e: MouseEvent) => {
      lastPointer = { x: e.clientX, y: e.clientY, active: true };
      if (rafId !== null) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = null;
        if (!orbRef.current) return;
        const rect = orbRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const offset = computeEyeLookOffset({
          pointerX: lastPointer.x,
          pointerY: lastPointer.y,
          orbCenterX: centerX,
          orbCenterY: centerY,
          orbSize: size,
        });
        setEyeOffset({ x: offset.x, y: offset.y });
      });
    };

    const handlePointerLeave = () => {
      setEyeOffset({ x: 0, y: 0 });
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('mouseleave', handlePointerLeave);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('mouseleave', handlePointerLeave);
      if (rafId !== null) window.cancelAnimationFrame(rafId);
    };
  }, [isTracking, size]);

  // Natural blinking loop ( matches scaleY(0.08) from Planes preview )
  useEffect(() => {
    let timeoutId: number;
    let blinkCloseId: number;

    const scheduleBlink = () => {
      const nextDelay = 2400 + Math.random() * 2800;
      timeoutId = window.setTimeout(() => {
        setIsBlinking(true);
        blinkCloseId = window.setTimeout(() => {
          setIsBlinking(false);
          scheduleBlink();
        }, 140);
      }, nextDelay);
    };

    scheduleBlink();
    return () => {
      window.clearTimeout(timeoutId);
      window.clearTimeout(blinkCloseId);
    };
  }, []);

  const baseGradient = tintColor
    ? `radial-gradient(circle at 38% 32%, rgb(255, 255, 255) 0%, rgb(244, 244, 245) 26%, ${tintColor} 78%, rgb(24, 24, 27) 100%)`
    : 'radial-gradient(circle at 38% 32%, rgb(255, 255, 255) 0%, rgb(244, 244, 245) 28%, rgb(212, 212, 216) 62%, rgb(161, 161, 170) 100%)';

  const activeX = isThinking ? 0 : eyeOffset.x;
  const activeY = isThinking ? -geo.size * 0.05 : eyeOffset.y;

  return (
    <motion.div
      ref={orbRef}
      aria-hidden="true"
      animate={
        isThinking
          ? { scale: [1, 1.05, 1], rotate: [0, 3, -3, 0] }
          : { y: [0, -1.5, 0] }
      }
      transition={
        isThinking
          ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 3.4, repeat: Infinity, ease: 'easeInOut' }
      }
      className="relative shrink-0 rounded-full select-none"
      style={{
        width: `${geo.size}px`,
        height: `${geo.size}px`,
        background: baseGradient,
        boxShadow: `${geo.insetShadowDark}, ${geo.insetShadowLight}`,
      }}
    >
      <motion.div
        className="absolute inset-0"
        animate={{ x: activeX, y: activeY }}
        transition={{ type: 'spring', stiffness: 320, damping: 24, mass: 0.5 }}
      >
        <span
          className="absolute block bg-zinc-950 transition-transform duration-100"
          style={{
            width: `${geo.eyeSize}px`,
            height: `${geo.eyeSize}px`,
            borderRadius: `${geo.size}px`,
            left: `${geo.leftEyeLeft}px`,
            top: `${geo.eyeTop}px`,
            transform: isBlinking ? 'scaleY(0.08)' : 'scaleY(1)',
          }}
        />
        <span
          className="absolute block bg-zinc-950 transition-transform duration-100"
          style={{
            width: `${geo.eyeSize}px`,
            height: `${geo.eyeSize}px`,
            borderRadius: `${geo.size}px`,
            left: `${geo.rightEyeLeft}px`,
            top: `${geo.eyeTop}px`,
            transform: isBlinking ? 'scaleY(0.08)' : 'scaleY(1)',
          }}
        />
      </motion.div>
    </motion.div>
  );
}

interface ChatMessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string[];
  thinkingSeconds?: number;
  isThinking?: boolean;
  isStreaming?: boolean;
  feedback?: 'up' | 'down' | null;
}

const MODELS = ['Claude Opus 4.8', 'Gemini 2.5 Pro', 'GPT-4.5 Turbo'] as const;

export function ChatOrb({
  position = 'bottom-right',
  teaser = 'Hi there! Need a hand?',
  teaserDelay = 1400,
  defaultOpen = false,
  chat,
  panelClassName = '',
  className = '',
  onOpenChange,
}: ChatOrbProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showTeaser, setShowTeaser] = useState(false);
  const [hasOpenedOnce, setHasOpenedOnce] = useState(defaultOpen);

  const script =
    chat?.script && chat.script.length > 0 ? chat.script : DEFAULT_CHAT_SCRIPT;
  const title = chat?.title ?? 'Assistant';
  const subtitle = chat?.subtitle ?? 'Typically replies instantly';
  const greeting = chat?.greeting ?? "Let's build something.";

  const [turnIndex, setTurnIndex] = useState(0);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [inputValue, setInputValue] = useState(
    () => getNextScriptTurn(script, 0).prompt
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedReasoningIds, setExpandedReasoningIds] = useState<
    Record<string, boolean>
  >({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0]);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [attachmentNote, setAttachmentNote] = useState<string | null>(null);

  const logRef = useRef<HTMLDivElement>(null);
  const triggerBtnRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Sync when defaultOpen prop changes from external controls
  useEffect(() => {
    setIsOpen(defaultOpen);
    if (defaultOpen) setHasOpenedOnce(true);
  }, [defaultOpen]);

  // Teaser timer
  useEffect(() => {
    if (isOpen || hasOpenedOnce || !teaser || teaser.trim() === '') {
      setShowTeaser(false);
      return;
    }
    const timer = window.setTimeout(() => {
      setShowTeaser(true);
    }, Math.max(0, teaserDelay));

    return () => window.clearTimeout(timer);
  }, [isOpen, hasOpenedOnce, teaser, teaserDelay]);

  // Auto-scroll chat log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [messages, isGenerating]);

  // Handle Escape key inside dialog
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    setHasOpenedOnce(true);
    setShowTeaser(false);
    onOpenChange?.(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    setShowModelMenu(false);
    onOpenChange?.(false);
    window.setTimeout(() => {
      triggerBtnRef.current?.focus();
    }, 50);
  };

  const handleResetChat = () => {
    setMessages([]);
    setTurnIndex(0);
    setIsGenerating(false);
    setExpandedReasoningIds({});
    setInputValue(getNextScriptTurn(script, 0).prompt);
  };

  const triggerResponseForPrompt = (
    userText: string,
    currentTurnIdx: number
  ) => {
    const matchedScript =
      script.find(
        (s) => s.prompt.trim().toLowerCase() === userText.trim().toLowerCase()
      ) ?? getNextScriptTurn(script, currentTurnIdx);

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now() + 1}`;

    const nextTurnIdx = currentTurnIdx + 1;
    const nextScript = getNextScriptTurn(script, nextTurnIdx);

    setMessages((prev) => [
      ...prev,
      {
        id: userMsgId,
        role: 'user',
        content: userText,
      },
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        reasoning: matchedScript.reasoning ?? [
          'Analyzing user request context and interface latency constraints.',
          'Formulating actionable implementation pattern.',
        ],
        thinkingSeconds: matchedScript.thinkingSeconds ?? 2,
        isThinking: true,
        isStreaming: true,
        feedback: null,
      },
    ]);

    setTurnIndex(nextTurnIdx);
    setInputValue(nextScript.prompt);
    setIsGenerating(true);

    // Phase 1: Thinking trace completes after 550ms, then stream words
    const fullText = matchedScript.response;
    const words = fullText.split(' ');

    window.setTimeout(() => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId ? { ...m, isThinking: false } : m
        )
      );

      let wordCursor = 0;
      const interval = window.setInterval(() => {
        wordCursor += 3;
        const slice = words.slice(0, wordCursor).join(' ');
        const done = wordCursor >= words.length;

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMsgId
              ? {
                  ...m,
                  content: done ? fullText : slice,
                  isStreaming: !done,
                }
              : m
          )
        );

        if (done) {
          window.clearInterval(interval);
          setIsGenerating(false);
        }
      }, 45);
    }, 500);
  };

  const handleSend = () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isGenerating) return;
    setAttachmentNote(null);
    triggerResponseForPrompt(trimmed, turnIndex);
  };

  const handleRegenerate = (msgId: string) => {
    if (isGenerating) return;
    const targetMsg = messages.find((m) => m.id === msgId);
    if (!targetMsg) return;

    const currentScript = getNextScriptTurn(
      script,
      Math.max(0, turnIndex - 1)
    );
    const fullText = currentScript.response;
    const words = fullText.split(' ');

    setIsGenerating(true);
    setMessages((prev) =>
      prev.map((m) =>
        m.id === msgId ? { ...m, content: '', isStreaming: true } : m
      )
    );

    let wordCursor = 0;
    const interval = window.setInterval(() => {
      wordCursor += 4;
      const done = wordCursor >= words.length;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? {
                ...m,
                content: done ? fullText : words.slice(0, wordCursor).join(' '),
                isStreaming: !done,
              }
            : m
        )
      );
      if (done) {
        window.clearInterval(interval);
        setIsGenerating(false);
      }
    }, 40);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {});
    setCopiedId(id);
    window.setTimeout(() => {
      setCopiedId((prev) => (prev === id ? null : prev));
    }, 1500);
  };

  const toggleFeedback = (id: string, type: 'up' | 'down') => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, feedback: m.feedback === type ? null : type }
          : m
      )
    );
  };

  const toggleReasoning = (id: string) => {
    setExpandedReasoningIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const positionClasses =
    position === 'bottom-right'
      ? 'fixed bottom-6 right-6 z-50'
      : position === 'bottom-left'
      ? 'fixed bottom-6 left-6 z-50'
      : 'relative inline-flex';

  const alignClasses =
    position === 'bottom-left' ? 'items-start' : 'items-end';

  const teaserPositionClasses =
    position === 'bottom-left'
      ? 'left-full -ml-3 rounded-bl-md origin-bottom-left'
      : 'right-full -mr-3 rounded-br-md origin-bottom-right';

  return (
    <div
      className={`pointer-events-auto flex flex-col-reverse ${alignClasses} ${positionClasses} ${className}`}
    >
      <AnimatePresence mode="wait">
        {!isOpen ? (
          <motion.div
            key="orb-launcher"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className={`relative flex flex-col-reverse ${alignClasses}`}
          >
            <button
              ref={triggerBtnRef}
              type="button"
              aria-label="Open chat"
              aria-haspopup="dialog"
              aria-expanded={isOpen}
              onClick={handleOpen}
              className="group relative flex size-16 shrink-0 items-center justify-center rounded-full outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 dark:focus-visible:ring-zinc-600 dark:focus-visible:ring-offset-zinc-950"
            >
              <div
                className="absolute inset-[2px] border border-zinc-200 bg-white shadow-[0_14px_34px_-12px_rgba(0,0,0,0.5)] transition-transform duration-200 group-hover:scale-105 dark:border-zinc-800 dark:bg-zinc-950"
                style={{ borderRadius: '999px' }}
              />
              <div className="relative transition-transform duration-200 group-hover:scale-[1.03]">
                <OrbAvatar size={64} isTracking={true} />
              </div>
            </button>

            <AnimatePresence>
              {showTeaser && teaser && (
                <motion.button
                  key="orb-teaser"
                  type="button"
                  initial={{ opacity: 0, y: 8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.94 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  onClick={handleOpen}
                  className={`absolute bottom-full z-10 -mb-2 w-max max-w-[220px] cursor-pointer rounded-2xl border border-zinc-200 bg-white px-4 py-2.5 text-left text-sm leading-5 text-zinc-900 shadow-[0_12px_30px_-14px_rgba(0,0,0,0.35)] transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800/90 ${teaserPositionClasses}`}
                >
                  {teaser}
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        ) : (
          <motion.div
            key="orb-panel"
            ref={dialogRef}
            tabIndex={-1}
            role="dialog"
            aria-modal="false"
            aria-label={title}
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className={`relative h-[560px] w-[380px] max-w-[92vw] max-h-[82svh] outline-none ${panelClassName}`}
          >
            {/* Outer rounded-28px shell */}
            <div
              className="absolute inset-0 border border-zinc-200 bg-white shadow-[0_24px_60px_-20px_rgba(0,0,0,0.35)] dark:border-zinc-800 dark:bg-zinc-950"
              style={{ borderRadius: '28px' }}
            />

            <div
              className="relative flex h-full flex-col overflow-hidden"
              style={{ borderRadius: '28px' }}
            >
              {/* Header with 36px live tracking Orb */}
              <div className="flex items-center justify-between gap-3 border-b border-zinc-200/70 px-5 py-4 dark:border-zinc-800/70">
                <div className="flex min-w-0 items-center gap-3">
                  <OrbAvatar
                    size={36}
                    isTracking={true}
                    isThinking={isGenerating}
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
                      {title}
                    </h3>
                    <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">
                      {isGenerating ? 'Thinking...' : subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label="New chat"
                    onClick={handleResetChat}
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-100/5 dark:hover:text-zinc-100"
                  >
                    <RotateCcw className="size-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Close chat"
                    onClick={handleClose}
                    className="inline-flex size-8 cursor-pointer items-center justify-center rounded-full border border-zinc-200 text-zinc-500 transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-100/5 dark:hover:text-zinc-100"
                  >
                    <X className="size-4" aria-hidden="true" />
                  </button>
                </div>
              </div>

              {/* Conversation Log / Empty State */}
              <div className="relative min-h-0 flex-1">
                <div
                  ref={logRef}
                  role="log"
                  aria-live="polite"
                  aria-relevant="additions"
                  className="h-full overflow-y-auto overscroll-contain px-5 py-5"
                >
                  {messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                      <span className="flex size-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                        <MessageSquareDashed
                          className="size-6"
                          aria-hidden="true"
                        />
                      </span>
                      <h4 className="mt-4 text-xl font-semibold tracking-[-0.01em] text-zinc-900 dark:text-zinc-100">
                        {greeting}
                      </h4>
                      <p className="mt-1.5 max-w-[18rem] text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                        Press send to start the conversation.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {messages.map((msg) => {
                        if (msg.role === 'user') {
                          return (
                            <motion.div
                              key={msg.id}
                              initial={{ opacity: 0, y: 6 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="flex justify-end"
                            >
                              <p className="max-w-[85%] rounded-2xl rounded-br-md bg-zinc-100 px-4 py-2.5 text-[15px] leading-6 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                                {msg.content}
                              </p>
                            </motion.div>
                          );
                        }

                        const isReasoningOpen = !!expandedReasoningIds[msg.id];

                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-2.5"
                          >
                            {/* Reasoning Trace Accordion */}
                            {msg.reasoning && msg.reasoning.length > 0 && (
                              <div className="w-full max-w-none">
                                <button
                                  type="button"
                                  aria-expanded={isReasoningOpen}
                                  onClick={() => toggleReasoning(msg.id)}
                                  className="flex cursor-pointer items-center gap-2 py-1 text-left text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                                >
                                  <Brain
                                    className={`size-4 shrink-0 ${
                                      msg.isThinking ? 'animate-pulse' : ''
                                    }`}
                                    aria-hidden="true"
                                  />
                                  <span className="text-[13px] font-medium">
                                    {msg.isThinking
                                      ? 'Thinking...'
                                      : `Thought for ${
                                          msg.thinkingSeconds ?? 2
                                        }s`}
                                  </span>
                                  <span
                                    className="transition-transform duration-150"
                                    style={{
                                      transform: isReasoningOpen
                                        ? 'rotate(0deg)'
                                        : 'rotate(-90deg)',
                                    }}
                                  >
                                    <ChevronDown
                                      className="size-3.5"
                                      aria-hidden="true"
                                    />
                                  </span>
                                </button>

                                <AnimatePresence initial={false}>
                                  {isReasoningOpen && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.18 }}
                                      className="overflow-hidden"
                                    >
                                      <ol className="space-y-1 pb-1 pl-6 pt-1.5">
                                        {msg.reasoning.map((step, i) => (
                                          <li
                                            key={i}
                                            className="flex gap-2.5 text-[13px] leading-6 text-zinc-500 dark:text-zinc-400"
                                          >
                                            <span className="mt-[9px] size-1.5 shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-700" />
                                            <span>{step}</span>
                                          </li>
                                        ))}
                                      </ol>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}

                            {/* Streamed Assistant Text + Action Bar */}
                            {msg.content && (
                              <div className="flex w-full max-w-none gap-3">
                                <div className="min-w-0 flex-1">
                                  <div className="relative">
                                    <p className="text-[15px] leading-7 text-zinc-900 dark:text-zinc-100">
                                      {msg.content}
                                    </p>
                                  </div>

                                  {!msg.isStreaming && (
                                    <div className="mt-3 flex items-center gap-1 text-zinc-500 dark:text-zinc-400">
                                      <button
                                        type="button"
                                        aria-label="Copy"
                                        onClick={() =>
                                          handleCopy(msg.id, msg.content)
                                        }
                                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:hover:bg-zinc-100/5 dark:hover:text-zinc-100"
                                      >
                                        {copiedId === msg.id ? (
                                          <Check
                                            className="size-4 text-emerald-500"
                                            aria-hidden="true"
                                          />
                                        ) : (
                                          <Copy
                                            className="size-4"
                                            aria-hidden="true"
                                          />
                                        )}
                                      </button>
                                      <button
                                        type="button"
                                        aria-label="Regenerate"
                                        onClick={() => handleRegenerate(msg.id)}
                                        className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:hover:bg-zinc-100/5 dark:hover:text-zinc-100"
                                      >
                                        <RefreshCw
                                          className="size-4"
                                          aria-hidden="true"
                                        />
                                      </button>
                                      <span className="mx-1 h-4 w-px bg-zinc-200/70 dark:bg-zinc-800/70" />
                                      <button
                                        type="button"
                                        aria-label="Good response"
                                        aria-pressed={msg.feedback === 'up'}
                                        onClick={() =>
                                          toggleFeedback(msg.id, 'up')
                                        }
                                        className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:hover:bg-zinc-100/5 dark:hover:text-zinc-100 ${
                                          msg.feedback === 'up'
                                            ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-900/5 dark:bg-zinc-100/10'
                                            : ''
                                        }`}
                                      >
                                        <ThumbsUp
                                          className="size-4"
                                          aria-hidden="true"
                                        />
                                      </button>
                                      <button
                                        type="button"
                                        aria-label="Bad response"
                                        aria-pressed={msg.feedback === 'down'}
                                        onClick={() =>
                                          toggleFeedback(msg.id, 'down')
                                        }
                                        className={`inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:hover:bg-zinc-100/5 dark:hover:text-zinc-100 ${
                                          msg.feedback === 'down'
                                            ? 'text-zinc-900 dark:text-zinc-100 bg-zinc-900/5 dark:bg-zinc-100/10'
                                            : ''
                                        }`}
                                      >
                                        <ThumbsDown
                                          className="size-4"
                                          aria-hidden="true"
                                        />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Prompt Composer */}
              <div className="relative z-30 px-3 pb-3 pt-1">
                <div className="relative w-full max-w-none">
                  {attachmentNote && (
                    <div className="mb-1.5 flex items-center justify-between rounded-lg bg-zinc-100 px-3 py-1 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
                      <span>{attachmentNote}</span>
                      <button
                        type="button"
                        onClick={() => setAttachmentNote(null)}
                        className="ml-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                        aria-label="Dismiss attachment notice"
                      >
                        ×
                      </button>
                    </div>
                  )}

                  <div className="relative rounded-[19px] border border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
                    <textarea
                      rows={3}
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="Message the assistant..."
                      aria-label="Message"
                      enterKeyHint="send"
                      className="block max-h-[160px] w-full resize-none overflow-y-auto bg-transparent px-4 pb-2 pt-3.5 text-[15px] leading-6 text-zinc-900 outline-none placeholder:text-zinc-500/60 dark:text-zinc-100 dark:placeholder:text-zinc-400/60"
                    />

                    <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1">
                      <div className="flex min-w-0 flex-1 items-center gap-1">
                        <div className="relative shrink-0">
                          <button
                            type="button"
                            aria-label="Add attachments and tools"
                            onClick={() =>
                              setAttachmentNote(
                                'Context snippet attached: settings-mutation.ts'
                              )
                            }
                            className="inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/5 dark:hover:text-zinc-100"
                          >
                            <Paperclip
                              className="size-[18px]"
                              aria-hidden="true"
                            />
                          </button>
                        </div>

                        <div className="relative min-w-0">
                          <button
                            type="button"
                            aria-haspopup="listbox"
                            aria-expanded={showModelMenu}
                            onClick={() => setShowModelMenu((prev) => !prev)}
                            className="inline-flex h-8 min-w-0 max-w-full cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-zinc-900/5 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-100/5 dark:hover:text-zinc-100"
                          >
                            <span className="truncate">{selectedModel}</span>
                            <ChevronDown
                              className="size-3.5 shrink-0"
                              aria-hidden="true"
                            />
                          </button>

                          {showModelMenu && (
                            <div
                              role="listbox"
                              aria-label="Select model"
                              className="absolute bottom-full left-0 mb-1.5 w-44 rounded-xl border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                            >
                              {MODELS.map((m) => (
                                <button
                                  key={m}
                                  type="button"
                                  role="option"
                                  aria-selected={selectedModel === m}
                                  onClick={() => {
                                    setSelectedModel(m);
                                    setShowModelMenu(false);
                                  }}
                                  className={`flex w-full cursor-pointer items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs font-medium transition-colors ${
                                    selectedModel === m
                                      ? 'bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100'
                                      : 'text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/50'
                                  }`}
                                >
                                  <span>{m}</span>
                                  {selectedModel === m && (
                                    <Check className="size-3.5" />
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          aria-label="Send message"
                          disabled={!inputValue.trim() || isGenerating}
                          onClick={handleSend}
                          className="relative inline-flex size-8 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-zinc-900 text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"
                        >
                          <ArrowUp
                            className="size-[18px]"
                            aria-hidden="true"
                          />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
