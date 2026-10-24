/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ChatOrb, OrbAvatar } from '@/components/ui/ChatOrb';
import { DEFAULT_CHAT_SCRIPT } from './utils/orbPhysics';
import {
  Copy,
  Check,
  Sun,
  Moon,
  RotateCcw,
  Eye,
  MessageSquare,
} from 'lucide-react';

const PROPS_SPEC = [
  {
    prop: 'position',
    type: '"bottom-right" | "bottom-left" | "inline"',
    defaultVal: '"bottom-right"',
    description:
      'Fixed to a page corner, or inline to fill a container you position yourself.',
  },
  {
    prop: 'teaser',
    type: 'string',
    defaultVal: '"Hi there! Need a hand?"',
    description:
      'Speech bubble that pops in next to the orb until it is opened. Pass an empty string to disable.',
  },
  {
    prop: 'teaserDelay',
    type: 'number',
    defaultVal: '1400',
    description: 'Milliseconds before the teaser appears.',
  },
  {
    prop: 'defaultOpen',
    type: 'boolean',
    defaultVal: 'false',
    description: 'Start with the chat panel open.',
  },
  {
    prop: 'chat',
    type: 'AIChatProps',
    defaultVal: '—',
    description:
      'Props forwarded to the AIChat rendered inside the panel: title, subtitle, greeting, script.',
  },
  {
    prop: 'panelClassName',
    type: 'string',
    defaultVal: '—',
    description: 'Tailwind classes on the expanded panel, for size overrides.',
  },
  {
    prop: 'className',
    type: 'string',
    defaultVal: '—',
    description: 'Tailwind classes on the root container.',
  },
];

export default function App() {
  const [darkMode, setDarkMode] = useState(true);
  const [position, setPosition] = useState<
    'inline' | 'bottom-right' | 'bottom-left'
  >('inline');
  const [teaserText, setTeaserText] = useState('Hi there! Need a hand?');
  const [teaserDelay, setTeaserDelay] = useState(400);
  const [chatTitle, setChatTitle] = useState('Assistant');
  const [chatSubtitle, setChatSubtitle] = useState(
    'Typically replies instantly'
  );
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [orbKey, setOrbKey] = useState(0);
  const [activeDocTab, setActiveDocTab] = useState<'usage' | 'props'>('usage');
  const [copiedUsage, setCopiedUsage] = useState(false);

  const usageSnippet = `import { ChatOrb } from "@/components/ui/ChatOrb";

export function AssistantLauncher() {
  return (
    <ChatOrb
      position="${position === 'inline' ? 'bottom-right' : position}"
      teaser="${teaserText}"
      teaserDelay={${teaserDelay}}
      chat={{
        title: "${chatTitle}",
        subtitle: "${chatSubtitle}",
        script: myScript,
      }}
    />
  );
}`;

  const handleCopySnippet = () => {
    navigator.clipboard?.writeText(usageSnippet).catch(() => {});
    setCopiedUsage(true);
    window.setTimeout(() => setCopiedUsage(false), 1600);
  };

  const handleRemountOrb = () => {
    setOrbKey((k) => k + 1);
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen bg-zinc-50 text-zinc-900 transition-colors duration-200 dark:bg-zinc-950 dark:text-zinc-100">
        {/* Top Bar Contract: Zone 1 Brand | Zone 2 Nav | Zone 3 Primary Action */}
        <header className="flex items-center justify-between gap-8 border-b border-zinc-200 px-6 py-4 dark:border-zinc-800/80">
          <a
            href="#preview"
            className="text-base font-bold tracking-tight text-zinc-900 whitespace-nowrap shrink-0 dark:text-zinc-100"
          >
            Planes Chat Orb
          </a>

          <nav
            aria-label="Primary"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400"
          >
            <a
              href="#preview"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              Interactive Stage
            </a>
            <a
              href="#eye-physics"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              Orb Anatomy
            </a>
            <a
              href="#documentation"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              Usage & Props
            </a>
            <a
              href="#use-cases"
              className="hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors whitespace-nowrap shrink-0"
            >
              Use Cases
            </a>
          </nav>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                setDefaultOpen((prev) => !prev);
                setOrbKey((k) => k + 1);
              }}
              className="px-4 py-2 text-xs font-semibold text-white bg-zinc-900 rounded-lg hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              {defaultOpen ? 'Show Orb Launcher' : 'Inspect Expanded Chat'}
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-[1280px] px-6 py-10 space-y-16">
          {/* Section 1: Hero & Interactive Stage */}
          <section id="preview" className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500 dark:text-zinc-400">
                  <span className="whitespace-nowrap">Component Registry</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono whitespace-nowrap">@useplanes/chat-orb</span>
                  <span aria-hidden="true">·</span>
                  <span className="whitespace-nowrap">Interactive AI Mascot &amp; Dialog</span>
                </div>
                <h1
                  className="text-3xl sm:text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100"
                  style={{ textWrap: 'balance' }}
                >
                  Animated AI Chat Orb with Live Cursor Eye-Tracking
                </h1>
                <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">
                  Move your cursor across the stage to watch the 3D shaded orb
                  track your pointer and blink naturally. Click the orb or
                  speech bubble to expand the full streaming AI assistant panel.
                </p>
              </div>

              {/* Stage Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Orb placement mode"
                  className="flex items-center gap-1 rounded-lg bg-zinc-200/70 p-1 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800"
                >
                  {(['inline', 'bottom-right', 'bottom-left'] as const).map(
                    (pos) => (
                      <button
                        key={pos}
                        type="button"
                        onClick={() => {
                          setPosition(pos);
                          setOrbKey((k) => k + 1);
                        }}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          position === pos
                            ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                            : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                        }`}
                      >
                        {pos}
                      </button>
                    )
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleRemountOrb}
                  aria-label="Replay teaser animation"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  <span>Replay Teaser</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDarkMode((d) => !d)}
                  aria-label="Toggle color theme"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800/80 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                >
                  {darkMode ? (
                    <>
                      <Sun className="size-3.5" aria-hidden="true" />
                      <span>Light Surface</span>
                    </>
                  ) : (
                    <>
                      <Moon className="size-3.5" aria-hidden="true" />
                      <span>Dark Surface</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Main 2-Column Interactive Stage + Live Configurator */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              {/* Left 8 Cols: Live Preview Canvas */}
              <div className="lg:col-span-8 relative flex min-h-[620px] flex-col items-center justify-center overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-[#09090b]">
                <div className="pointer-events-none absolute top-4 left-5 flex items-center gap-2 text-xs text-zinc-400 dark:text-zinc-500">
                  <span>Live Component Preview</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    position=&quot;{position}&quot;
                  </span>
                </div>

                {position === 'inline' ? (
                  <div className="flex h-full w-full items-center justify-center py-8">
                    <ChatOrb
                      key={`inline-${orbKey}`}
                      position="inline"
                      teaser={teaserText}
                      teaserDelay={teaserDelay}
                      defaultOpen={defaultOpen}
                      chat={{
                        title: chatTitle,
                        subtitle: chatSubtitle,
                        script: DEFAULT_CHAT_SCRIPT,
                      }}
                    />
                  </div>
                ) : (
                  <div className="max-w-md text-center space-y-3 px-4">
                    <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      Floating Corner Mode Active ({position})
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      The Chat Orb is currently pinned to the{' '}
                      <code className="font-mono text-zinc-800 dark:text-zinc-200">
                        {position}
                      </code>{' '}
                      corner of your viewport. Click it in the corner or switch
                      back to{' '}
                      <code className="font-mono text-zinc-800 dark:text-zinc-200">
                        inline
                      </code>{' '}
                      mode above to center it inside this stage.
                    </p>
                  </div>
                )}
              </div>

              {/* Right 4 Cols: Live Props Control Panel */}
              <div className="lg:col-span-4 flex flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-6">
                <div className="space-y-5">
                  <div className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
                    <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      Live Props Inspector
                    </h2>
                    <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                      Customize props in real time and test the orb behavior.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="teaser-input"
                        className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                      >
                        Teaser Speech Bubble (<code>teaser</code>)
                      </label>
                      <input
                        id="teaser-input"
                        type="text"
                        value={teaserText}
                        onChange={(e) => {
                          setTeaserText(e.target.value);
                          setOrbKey((k) => k + 1);
                        }}
                        placeholder="Hi there! Need a hand?"
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                        <label htmlFor="teaser-delay-range">
                          Teaser Delay (<code>teaserDelay</code>)
                        </label>
                        <span className="font-mono tabular-nums text-zinc-500">
                          {teaserDelay}ms
                        </span>
                      </div>
                      <input
                        id="teaser-delay-range"
                        type="range"
                        min={0}
                        max={3000}
                        step={200}
                        value={teaserDelay}
                        onChange={(e) => {
                          setTeaserDelay(Number(e.target.value));
                          setOrbKey((k) => k + 1);
                        }}
                        className="w-full accent-zinc-900 dark:accent-zinc-100 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="chat-title-input"
                        className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                      >
                        Assistant Title (<code>chat.title</code>)
                      </label>
                      <input
                        id="chat-title-input"
                        type="text"
                        value={chatTitle}
                        onChange={(e) => setChatTitle(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="chat-subtitle-input"
                        className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5"
                      >
                        Assistant Subtitle (<code>chat.subtitle</code>)
                      </label>
                      <input
                        id="chat-subtitle-input"
                        type="text"
                        value={chatSubtitle}
                        onChange={(e) => setChatSubtitle(e.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Component Path</span>
                    <code className="font-mono text-zinc-800 dark:text-zinc-200">
                      @/components/ui/ChatOrb
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                    <span>Scripted Turns Loaded</span>
                    <span className="font-mono tabular-nums text-zinc-800 dark:text-zinc-200">
                      {DEFAULT_CHAT_SCRIPT.length} interactive turns
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: Orb Scale & Eye-Tracking Anatomy */}
          <section
            id="eye-physics"
            className="space-y-6 border-t border-zinc-200 pt-12 dark:border-zinc-800/80"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                01. Multi-Scale Orb &amp; Eye-Tracking Calibration
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Built from a multi-stop radial luminance sphere with dual inset
                specular highlights and spring-damped pupil vectors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="w-full flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Header Avatar Scale</span>
                  <span className="font-mono tabular-nums">36px · 6.12px eyes</span>
                </div>
                <div className="my-8 flex items-center justify-center">
                  <OrbAvatar size={36} isTracking={true} />
                </div>
                <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                  Embedded inside the dialog header to provide living visual
                  feedback while streaming responses.
                </p>
              </div>

              <div className="flex flex-col items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="w-full flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Standard Launcher Scale</span>
                  <span className="font-mono tabular-nums">64px · 10.88px eyes</span>
                </div>
                <div className="my-8 flex items-center justify-center">
                  <OrbAvatar size={64} isTracking={true} />
                </div>
                <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                  Default corner launcher scale with outer ring elevation and
                  synchronized blink intervals.
                </p>
              </div>

              <div className="flex flex-col items-center justify-between rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
                <div className="w-full flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>Hero Mascot Scale</span>
                  <span className="font-mono tabular-nums">96px · 16.32px eyes</span>
                </div>
                <div className="my-6 flex items-center justify-center">
                  <OrbAvatar size={96} isTracking={true} />
                </div>
                <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
                  High-presence onboarding scale with proportional radial
                  shading and spring physics.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Official Usage & Props Reference */}
          <section
            id="documentation"
            className="space-y-6 border-t border-zinc-200 pt-12 dark:border-zinc-800/80"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                  02. Component Integration &amp; Props API
                </h2>
                <p className="text-sm text-zinc-600 dark:text-zinc-400">
                  Drop-in compatible with the official{' '}
                  <code className="font-mono">@useplanes/chat-orb</code>{' '}
                  interface.
                </p>
              </div>

              <div
                role="tablist"
                aria-label="Documentation tabs"
                className="flex items-center gap-1 rounded-lg bg-zinc-200/70 p-1 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 self-start"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeDocTab === 'usage'}
                  onClick={() => setActiveDocTab('usage')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeDocTab === 'usage'
                      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Usage
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeDocTab === 'props'}
                  onClick={() => setActiveDocTab('props')}
                  className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeDocTab === 'props'
                      ? 'bg-white text-zinc-900 shadow-xs dark:bg-zinc-800 dark:text-zinc-100'
                      : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  Props
                </button>
              </div>
            </div>

            {activeDocTab === 'usage' ? (
              <div className="relative rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/50">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    src/App.tsx
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySnippet}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedUsage ? (
                      <>
                        <Check
                          className="size-3.5 text-emerald-500"
                          aria-hidden="true"
                        />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3.5" aria-hidden="true" />
                        <span>Copy Snippet</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="overflow-x-auto text-xs sm:text-sm leading-relaxed text-zinc-800 dark:text-zinc-200">
                  <code>{usageSnippet}</code>
                </pre>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/40">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-200 text-xs font-semibold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      <th className="py-3.5 px-5">Prop</th>
                      <th className="py-3.5 px-5">Type</th>
                      <th className="py-3.5 px-5">Default</th>
                      <th className="py-3.5 px-5">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 text-sm dark:divide-zinc-800">
                    {PROPS_SPEC.map((row) => (
                      <tr
                        key={row.prop}
                        className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/30 transition-colors"
                      >
                        <td className="py-3.5 px-5 font-mono text-xs font-medium text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
                          {row.prop}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs text-zinc-600 dark:text-zinc-400 whitespace-nowrap">
                          {row.type}
                        </td>
                        <td className="py-3.5 px-5 font-mono text-xs tabular-nums text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                          {row.defaultVal}
                        </td>
                        <td className="py-3.5 px-5 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300">
                          {row.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* Section 4: Production Use Cases */}
          <section
            id="use-cases"
            className="space-y-6 border-t border-zinc-200 pt-12 pb-8 dark:border-zinc-800/80"
          >
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
                03. Production Deployment Patterns
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Where teams wire the Chat Orb across web applications and
                documentation portals.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>01 · Global Support</span>
                  <Eye className="size-4" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Site-wide support bot
                </h3>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Drop it in the root layout with{' '}
                  <code className="font-mono">position=&quot;bottom-right&quot;</code>{' '}
                  and every page gets a launcher that feels alive.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>02 · Technical Docs</span>
                  <MessageSquare className="size-4" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Docs assistant
                </h3>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  An always-there helper that opens into a scripted walkthrough
                  or live documentation chat with reasoning traces.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>03 · Activation</span>
                  <Eye className="size-4" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Product onboarding
                </h3>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  The delayed speech bubble nudges new users while the orb
                  watches their cursor movement until they click.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/40 space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>04 · Interactive Hero</span>
                  <MessageSquare className="size-4" aria-hidden="true" />
                </div>
                <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                  Marketing demo
                </h3>
                <p className="text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">
                  Showcase your AI product with an expressive 3D mascot instead
                  of a static chat icon.
                </p>
              </div>
            </div>
          </section>
        </main>

        {/* Render floating corner instance when user selects bottom-right or bottom-left */}
        {position !== 'inline' && (
          <ChatOrb
            key={`floating-${position}-${orbKey}`}
            position={position}
            teaser={teaserText}
            teaserDelay={teaserDelay}
            defaultOpen={defaultOpen}
            chat={{
              title: chatTitle,
              subtitle: chatSubtitle,
              script: DEFAULT_CHAT_SCRIPT,
            }}
          />
        )}
      </div>
    </div>
  );
}
