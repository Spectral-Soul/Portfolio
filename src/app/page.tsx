"use client";

import React, { useState, useEffect, useRef, useLayoutEffect } from "react";
import Image from "next/image";
import VoiceCallDemo from "@/components/VoiceCallDemo";

// Accordion Item Interface
interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

const glass = "panel";
const glassHover = "panel-hover";

// Log lines the hero runtime panel cycles through. These describe real
// components in Sujith's stack — this is a UI animation, not a claim
// about a live client system.
const runtimeLog = [
  { label: "voice-agent", detail: "ElevenLabs stream connected", state: "ok" },
  { label: "orchestrator", detail: "LangGraph StateGraph compiled", state: "ok" },
  { label: "booking-tool", detail: "Google Calendar API — synced", state: "ok" },
  { label: "db", detail: "Supabase row-level policies active", state: "ok" },
  { label: "notifier", detail: "Twilio + Resend channels ready", state: "ok" },
  { label: "api", detail: "FastAPI service — 200 OK", state: "ok" },
];

function RuntimePanel() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % (runtimeLog.length + 1));
    }, 900);
    return () => clearInterval(interval);
  }, []);

  const visibleCount = Math.max(tick, 1);

  return (
    <div className={`w-full rounded-2xl ${glass} p-5 sm:p-6 shadow-2xl`}>
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--online)] opacity-70"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--online)]"></span>
          </span>
          <span className="font-technical text-[11px] tracking-widest uppercase text-[var(--muted)]">
            agent runtime
          </span>
        </div>
        <span className="font-technical text-[11px] text-[var(--muted)]">
          {Math.min(visibleCount, runtimeLog.length)}/{runtimeLog.length} online
        </span>
      </div>

      <div className="space-y-2.5 min-h-[168px]">
        {runtimeLog.slice(0, visibleCount).map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-lg border border-[var(--border-hairline)] bg-white/[0.02] px-3 py-2.5"
            style={{ animation: "fadeIn 0.4s ease-out" }}
          >
            <div className="flex items-center gap-2.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--online)]" />
              <span className="font-technical text-xs text-[var(--foreground)]">{row.label}</span>
            </div>
            <span className="font-technical text-[11px] text-[var(--muted)]">{row.detail}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 pt-4 border-t border-[var(--border-hairline)] flex items-center justify-between">
        <span className="font-technical text-[11px] text-[var(--muted)]">stack</span>
        <span className="font-technical text-[11px] text-[var(--accent-strong,var(--accent))]">
          LangGraph · FastAPI · Supabase
        </span>
      </div>
    </div>
  );
}

// Generic node + edge model for orchestration flow diagrams. Coordinates
// are plain pixels matching a fixed-size SVG viewBox; on screens under the
// md breakpoint we swap to a simple vertical stepper instead of scaling
// text down to illegibility, and on md+ we scale the whole diagram to fit
// the available width via a ResizeObserver so nothing overflows or requires
// a horizontal scrollbar on tablet-sized viewports.
type FlowNode = {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  sub: string;
  variant: "entry" | "voice" | "hub" | "agent" | "tool" | "store";
};

type FlowEdge = { from: string; to: string; curve?: boolean; dashed?: boolean; dur: number };
type RawPath = { id: string; d: string; dashed?: boolean; dur: number };

function buildEdgePaths(nodes: FlowNode[], edges: FlowEdge[]): RawPath[] {
  const find = (id: string) => nodes.find((n) => n.id === id)!;
  return edges.map((e) => {
    const a = find(e.from);
    const b = find(e.to);
    const ax = a.x + a.w / 2;
    const ay = a.y + a.h;
    const bx = b.x + b.w / 2;
    const by = b.y;
    const d = e.curve
      ? `M${ax},${ay} C${ax},${ay + 28} ${bx},${by - 28} ${bx},${by}`
      : `M${ax},${ay} L${bx},${by}`;
    return { id: `${e.from}-${e.to}`, d, dashed: e.dashed, dur: e.dur };
  });
}

const variantClass: Record<FlowNode["variant"], string> = {
  entry: "panel text-center",
  voice: "panel text-center border-[var(--accent)]/25",
  hub: "text-center bg-[var(--accent-soft)] border border-[var(--accent)]/40",
  agent: "panel text-center",
  tool: "panel text-center opacity-80",
  store: "panel text-center bg-white/[0.03] border-[var(--border-strong)]",
};

function FlowCard({ node }: { node: FlowNode }) {
  const showDot = node.variant === "voice" || node.variant === "agent" || node.variant === "hub";
  return (
    <div
      className={`absolute rounded-xl flex flex-col items-center justify-center px-3 ${variantClass[node.variant]}`}
      style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
    >
      <div className="flex items-center gap-1.5">
        {showDot && (
          <span className={`h-1.5 w-1.5 rounded-full ${node.variant === "hub" ? "bg-[var(--accent)]" : "bg-[var(--online)]"}`} />
        )}
        <span className={`font-technical ${node.variant === "hub" ? "text-sm text-white" : "text-xs text-white"} font-semibold tracking-tight`}>
          {node.title}
        </span>
      </div>
      <span className="text-[10.5px] text-[var(--muted)] mt-1 leading-snug max-w-[240px]">
        {node.sub}
      </span>
    </div>
  );
}

function FlowCardMobile({ node }: { node: FlowNode }) {
  const showDot = node.variant === "voice" || node.variant === "agent" || node.variant === "hub";
  return (
    <div className={`w-full rounded-xl flex flex-col items-center justify-center px-4 py-3 ${variantClass[node.variant]}`}>
      <div className="flex items-center gap-1.5">
        {showDot && (
          <span className={`h-1.5 w-1.5 rounded-full ${node.variant === "hub" ? "bg-[var(--accent)]" : "bg-[var(--online)]"}`} />
        )}
        <span className={`font-technical ${node.variant === "hub" ? "text-sm" : "text-xs"} text-white font-semibold tracking-tight`}>
          {node.title}
        </span>
      </div>
      <span className="text-[11px] text-[var(--muted)] mt-1 text-center leading-snug">{node.sub}</span>
    </div>
  );
}

function useReducedMotionOk() {
  const [motionOk, setMotionOk] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  });

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handler = () => setMotionOk(!mq.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  return motionOk;
}

// Desktop/tablet: fixed-pixel diagram scaled down to fit its container via
// a ResizeObserver, so lines, nodes, and text shrink together instead of
// reflowing or clipping.
function OrchestrationDiagramDesktop({
  nodes,
  edges,
  extraPaths = [],
  vbW,
  vbH,
}: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  extraPaths?: RawPath[];
  vbW: number;
  vbH: number;
}) {
  const motionOk = useReducedMotionOk();
  const outerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const compute = () => setScale(Math.min(1, el.clientWidth / vbW));
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    return () => ro.disconnect();
  }, [vbW]);

  const allPaths = [...buildEdgePaths(nodes, edges), ...extraPaths];

  return (
    <div ref={outerRef} style={{ width: "100%", height: vbH * scale }}>
      <div className="relative" style={{ width: vbW, height: vbH, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <svg width={vbW} height={vbH} viewBox={`0 0 ${vbW} ${vbH}`} className="absolute inset-0" aria-hidden="true">
          {allPaths.map((p) => (
            <path
              key={p.id}
              id={`path-${p.id}`}
              d={p.d}
              stroke={p.dashed ? "var(--border-hairline)" : "var(--border-strong)"}
              strokeWidth="1.5"
              strokeDasharray={p.dashed ? "3 5" : undefined}
              fill="none"
            />
          ))}
          {motionOk &&
            allPaths.map((p, i) => (
              <circle key={`pulse-${p.id}`} r="3.5" fill="var(--accent)">
                <animateMotion dur={`${p.dur}s`} begin={`${(i % 5) * 0.2}s`} repeatCount="indefinite">
                  <mpath href={`#path-${p.id}`} />
                </animateMotion>
              </circle>
            ))}
        </svg>

        {nodes.map((n) => (
          <FlowCard key={n.id} node={n} />
        ))}
      </div>
    </div>
  );
}

// Mobile: a simple vertical stepper covering the same nodes in reading
// order, with short group labels where the desktop diagram fans out or
// converges. Full-size, legible text at any phone width — no shrinking.
type MobileStep = { id: string; note?: string };

function OrchestrationFlowMobile({ nodes, order }: { nodes: FlowNode[]; order: MobileStep[] }) {
  const find = (id: string) => nodes.find((n) => n.id === id)!;
  return (
    <div className="flex flex-col items-stretch">
      {order.map((step, i) => (
        <div key={step.id}>
          {i > 0 && (
            <div className="flex justify-center py-1">
              <span className="relative h-6 w-px bg-[var(--border-strong)] block">
                <span className="absolute -left-[3.5px] top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-[var(--accent)] animate-blip" />
              </span>
            </div>
          )}
          {step.note && (
            <div className="text-center font-technical text-[10px] text-[var(--muted)] uppercase tracking-widest mb-2">
              {step.note}
            </div>
          )}
          <FlowCardMobile node={find(step.id)} />
        </div>
      ))}
    </div>
  );
}

// Combined responsive wrapper: scaled diagram on md+, stepper list below it.
function OrchestrationFlow({
  nodes,
  edges,
  extraPaths,
  mobileOrder,
  vbW,
  vbH,
}: {
  nodes: FlowNode[];
  edges: FlowEdge[];
  extraPaths?: RawPath[];
  mobileOrder: MobileStep[];
  vbW: number;
  vbH: number;
}) {
  return (
    <>
      <div className="hidden md:block">
        <OrchestrationDiagramDesktop nodes={nodes} edges={edges} extraPaths={extraPaths} vbW={vbW} vbH={vbH} />
      </div>
      <div className="md:hidden">
        <OrchestrationFlowMobile nodes={nodes} order={mobileOrder} />
      </div>
    </>
  );
}

// ---- Home renovation voice + multi-agent system (the real production stack) ----
const HR_VB_W = 1000;
const HR_VB_H = 650;

const homeRenoNodes: FlowNode[] = [
  { id: "entry", x: 360, y: 14, w: 280, h: 56, title: "Homeowner calls", sub: "Inbound phone line", variant: "entry" },
  { id: "voice", x: 320, y: 108, w: 360, h: 60, title: "Voice Agent", sub: "ElevenLabs · live conversation", variant: "voice" },
  { id: "hub", x: 260, y: 212, w: 480, h: 68, title: "LangGraph Orchestrator", sub: "StateGraph · routes by intent", variant: "hub" },
  { id: "lead", x: 30, y: 324, w: 280, h: 64, title: "Lead Qualifier", sub: "Job type · budget · timeline", variant: "agent" },
  { id: "sched", x: 360, y: 324, w: 280, h: 64, title: "Scheduler", sub: "Checks availability, books visit", variant: "agent" },
  { id: "follow", x: 690, y: 324, w: 280, h: 64, title: "Follow-up", sub: "Confirms & reminds", variant: "agent" },
  { id: "kb", x: 30, y: 432, w: 280, h: 54, title: "Knowledge Base", sub: "RAG · service catalog", variant: "tool" },
  { id: "cal", x: 360, y: 432, w: 280, h: 54, title: "Google Calendar", sub: "Calendar API", variant: "tool" },
  { id: "sms", x: 690, y: 432, w: 280, h: 54, title: "Twilio + Resend", sub: "SMS & email", variant: "tool" },
  { id: "db", x: 260, y: 552, w: 480, h: 64, title: "Supabase", sub: "Shared source of truth — every agent reads & writes here", variant: "store" },
];

const homeRenoEdges: FlowEdge[] = [
  { from: "entry", to: "voice", dur: 1.1 },
  { from: "voice", to: "hub", dur: 1.1 },
  { from: "hub", to: "lead", curve: true, dur: 1.3 },
  { from: "hub", to: "sched", dur: 1.1 },
  { from: "hub", to: "follow", curve: true, dur: 1.3 },
  { from: "lead", to: "kb", dur: 1 },
  { from: "sched", to: "cal", dur: 1 },
  { from: "follow", to: "sms", dur: 1 },
  { from: "kb", to: "db", curve: true, dashed: true, dur: 1.6 },
  { from: "cal", to: "db", dashed: true, dur: 1.4 },
  { from: "sms", to: "db", curve: true, dashed: true, dur: 1.6 },
];

const homeRenoExtraPaths: RawPath[] = [
  { id: "db-hub-loop", d: "M300,560 C12,560 12,246 260,246", dashed: true, dur: 3.2 },
];

const homeRenoMobileOrder: MobileStep[] = [
  { id: "entry" },
  { id: "voice" },
  { id: "hub" },
  { id: "lead", note: "then, in parallel" },
  { id: "sched" },
  { id: "follow" },
  { id: "kb", note: "each syncs its own tool" },
  { id: "cal" },
  { id: "sms" },
  { id: "db", note: "all synced to" },
];

// ---- Core orchestration pattern reused across projects (LangChain / LangGraph / Pydantic / Supabase) ----
const STACK_VB_W = 1000;
const STACK_VB_H = 430;

const stackNodes: FlowNode[] = [
  { id: "entry", x: 360, y: 14, w: 280, h: 56, title: "Incoming request", sub: "API call · chat · webhook", variant: "entry" },
  { id: "hub", x: 260, y: 108, w: 480, h: 68, title: "LangGraph Orchestrator", sub: "StateGraph · coordinates every agent", variant: "hub" },
  { id: "langchain", x: 30, y: 210, w: 280, h: 64, title: "LangChain Agent", sub: "Tool calling & reasoning", variant: "agent" },
  { id: "pydantic", x: 360, y: 210, w: 280, h: 64, title: "Pydantic Schemas", sub: "Validates every input & output", variant: "agent" },
  { id: "memory", x: 690, y: 210, w: 280, h: 64, title: "Context Memory", sub: "Tracks state across turns", variant: "agent" },
  { id: "db", x: 260, y: 330, w: 480, h: 64, title: "Supabase", sub: "Shared source of truth — every agent reads & writes here", variant: "store" },
];

const stackEdges: FlowEdge[] = [
  { from: "entry", to: "hub", dur: 1.1 },
  { from: "hub", to: "langchain", curve: true, dur: 1.3 },
  { from: "hub", to: "pydantic", dur: 1.1 },
  { from: "hub", to: "memory", curve: true, dur: 1.3 },
  { from: "langchain", to: "db", curve: true, dashed: true, dur: 1.6 },
  { from: "pydantic", to: "db", dashed: true, dur: 1.4 },
  { from: "memory", to: "db", curve: true, dashed: true, dur: 1.6 },
];

const stackExtraPaths: RawPath[] = [
  { id: "db-hub-loop", d: "M300,340 C12,340 12,142 260,142", dashed: true, dur: 3.2 },
];

const stackMobileOrder: MobileStep[] = [
  { id: "entry" },
  { id: "hub" },
  { id: "langchain", note: "then, in parallel" },
  { id: "pydantic" },
  { id: "memory" },
  { id: "db", note: "all synced to" },
];

export default function Home() {
  // State for About Q&A Accordion
  const [activeAboutId, setActiveAboutId] = useState<string | null>("about-1");

  // State for FAQ Accordion
  const [activeFaqId, setActiveFaqId] = useState<string | null>(null);

  // Form State
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  type FormStatus = "idle" | "submitting" | "success" | "error";
  const [formStatus, setFormStatus] = useState<FormStatus>("idle");
  const [formError, setFormError] = useState<string | null>(null);

  // Mobile nav menu open/closed
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Agent ID for ElevenLabs widget
  const elevenLabsAgentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || "";
  const hasElevenLabsAgent = elevenLabsAgentId.trim().length > 0;

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const href = target.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        setMobileMenuOpen(false);
        const element = document.querySelector(href);
        if (element) {
          const offset = 76;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth",
          });
        }
      }
    };

    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach((link) => {
      link.addEventListener("click", handleAnchorClick as EventListener);
    });

    return () => {
      links.forEach((link) => {
        link.removeEventListener("click", handleAnchorClick as EventListener);
      });
    };
  }, []);

  const handleFormChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus("submitting");
    setFormError(null);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formState),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setFormStatus("success");
      setFormState({ name: "", email: "", subject: "", message: "" });

      setTimeout(() => setFormStatus("idle"), 4000);
    } catch (err) {
      setFormStatus("error");
      setFormError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    }
  };

  // Content Arrays
  const stack = [
    "LangGraph", "FastAPI", "Supabase", "ElevenLabs", "Twilio",
    "Resend", "PostgreSQL", "Railway", "Vercel", "Pydantic",
  ];

  const services = [
    {
      title: "AI Voice Receptionists",
      description: "Custom conversational ElevenLabs voice agents that handle inbound calls, qualify leads, book appointments, and sync data straight to your CRM.",
    },
    {
      title: "Multi-Agent Orchestration",
      description: "Complex business workflows managed using LangGraph StateGraph orchestration. Agents coordinate, share context, and run process loops with human-in-the-loop validation.",
    },
    {
      title: "Backend & API Systems",
      description: "Production-ready FastAPI microservices integrated with Supabase for real-time database, authentication, and secure row-level data security.",
    },
    {
      title: "Business Process Automation",
      description: "End-to-end background processes that run autonomously — reading emails, parsing PDFs, generating reports, and notifying Slack or WhatsApp channels.",
    },
    {
      title: "Lead Generation Systems",
      description: "Autonomous scrapers and qualifier agents that target prospects, score them using LLMs, draft highly-personalized reaches, and update dashboards.",
    },
  ];

  const experiences = [
    {
      num: "01",
      title: "Customer Support AI Agent",
      desc: "Developed a LangChain SQL database agent deployed on Railway, backed by Supabase, featuring a Vercel-hosted dashboard. Automates 75% of routine order status and customer service queries.",
    },
    {
      num: "02",
      title: "Institute Multi-Agent System",
      desc: "Built a collaborative LangGraph system orchestrating distinct sub-agents: Email Agent (communications), Attendance Agent (processing check-ins), and Fees Agent (automated invoicing).",
      link: "https://github.com/Spectral-Soul/graph",
      linkLabel: "github.com/Spectral-Soul/graph",
    },
    {
      num: "03",
      title: "E-Commerce Operations Agent",
      desc: "Designed a LangGraph architecture implementing parallel-write operations to simultaneously synchronize inventory status and dynamic pricing engines based on demand signals.",
    },
    {
      num: "04",
      title: "EV Parking System",
      desc: "Engineered an IoT-friendly Python system for managing electric vehicle parking logistics, sensor integrations, and charge timing coordination.",
      link: "https://github.com/Spectral-Soul/EVN-Parking",
      linkLabel: "github.com/Spectral-Soul/EVN-Parking",
    },
    {
      num: "NOW",
      title: "AI Receptionist Business — Current Focus",
      desc: "Architecting, tuning, and deploying production ElevenLabs Conversational Voice Agents. Helping local businesses and healthcare clinics scale calls without overhead.",
    },
  ];

  const aboutQAs: AccordionItem[] = [
    {
      id: "about-1",
      question: "Where are you based?",
      answer: "I am based in Puducherry, India. I operate fully remotely and coordinate seamlessly across multiple timezones including US, UK, and EU.",
    },
    {
      id: "about-2",
      question: "What's your stack?",
      answer: "I build robust systems using LangGraph, LangChain, FastAPI, Supabase, ElevenLabs, Railway, and Vercel. I write structured Python and TypeScript code designed to scale.",
    },
    {
      id: "about-3",
      question: "What are you building right now?",
      answer: "I am focusing on building an AI Receptionist Business. I deploy custom voice agents that answer calls, handle scheduling, and process customer inquiries live for busy service providers.",
    },
  ];

  const faqQAs: AccordionItem[] = [
    {
      id: "faq-1",
      question: "Do you build custom agents or use no-code tools?",
      answer: "I construct custom, code-first architectures. By utilizing LangGraph StateGraph orchestration instead of Zapier/n8n glue, I build highly reliable agents that handle memory, branching logic, and complex state loops without brittle failures.",
    },
    {
      id: "faq-2",
      question: "Can you build a voice agent for my business?",
      answer: "Yes, absolutely. I design custom conversational scripts, connect webhook APIs for real-time actions (like booking a calendar or querying a DB), and wire up SIP trunks. You can test a demo system live in the Voice Demo section below.",
    },
    {
      id: "faq-3",
      question: "Do you work with international clients?",
      answer: "Yes. I coordinate remote work for clients worldwide. I accommodate team calls and check-ins by aligning my availability with US East/West, UK, and European business hours.",
    },
  ];

  return (
    <>
      {/* Background: quiet, single soft glow instead of three competing blobs */}
      <div className="fixed inset-0 bg-grid-pattern pointer-events-none opacity-[0.35] z-0"></div>
      <div className="fixed top-[-10%] left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-[var(--accent)]/[0.06] rounded-full blur-[160px] pointer-events-none z-0"></div>

      {/* Navigation Header */}
      <header className={`sticky top-0 z-50 ${glass} border-x-0 border-t-0`}>
        <div className="max-w-6xl mx-auto px-6 h-18 py-4 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5 group">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--accent-soft)] text-[var(--accent)] font-display font-bold text-sm">
              t
            </span>
            <span className="font-display font-semibold tracking-tight text-[15px] text-white">tickers.ai</span>
          </a>

          <nav className="hidden md:flex items-center gap-8 font-technical text-[13px] text-[var(--muted)]">
            <a href="#services" className="hover:text-white transition-colors">What I build</a>
            <a href="#orchestration" className="hover:text-white transition-colors">System</a>
            <a href="#experience" className="hover:text-white transition-colors">Work</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
            <a href="#demo" className="hover:text-white transition-colors flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--online)]"></span>
              Live demo
            </a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
          </nav>

          <a
            href="#contact"
            className="hidden md:inline-flex items-center justify-center px-4 py-2 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white text-[13px] font-semibold tracking-tight transition-all rounded-lg"
          >
            Get in touch
          </a>

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-nav-panel"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            className={`md:hidden flex items-center justify-center w-9 h-9 rounded-lg ${glass} ${glassHover} text-gray-200 transition-all`}
          >
            {mobileMenuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        <div
          id="mobile-nav-panel"
          className={`md:hidden overflow-hidden transition-all duration-300 border-t ${
            mobileMenuOpen ? "max-h-80 opacity-100 border-[var(--border-hairline)]" : "max-h-0 opacity-0 border-transparent"
          }`}
        >
          <nav className="flex flex-col px-6 py-4 gap-1 font-technical text-sm text-[var(--muted)] bg-white/[0.02]">
            <a href="#services" className="py-3 border-b border-[var(--border-hairline)] hover:text-white transition-colors">What I build</a>
            <a href="#orchestration" className="py-3 border-b border-[var(--border-hairline)] hover:text-white transition-colors">System</a>
            <a href="#experience" className="py-3 border-b border-[var(--border-hairline)] hover:text-white transition-colors">Work</a>
            <a href="#about" className="py-3 border-b border-[var(--border-hairline)] hover:text-white transition-colors">About</a>
            <a href="#demo" className="py-3 border-b border-[var(--border-hairline)] hover:text-white transition-colors flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--online)]"></span>
              Live demo
            </a>
            <a href="#contact" className="py-3 hover:text-white transition-colors">Contact</a>
          </nav>
        </div>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto px-6">

        {/* HERO SECTION */}
        <section id="hero" className="pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${glass} text-[var(--muted)] text-xs font-technical mb-6 w-fit`}>
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--online)] opacity-70"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--online)]"></span>
                </span>
                Open for freelance projects
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.4rem] font-semibold tracking-tight text-white leading-[1.08] mb-6">
                AI agents that run parts of your business —{" "}
                <span className="text-[var(--accent)]">
                  not tools you have to learn.
                </span>
              </h1>

              <p className="text-lg text-[var(--muted)] max-w-xl mb-8 leading-relaxed">
                I design and deploy voice receptionists, multi-agent backends, and process automation for small businesses and clinics — built with LangGraph and FastAPI, wired into the tools you already use.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <a
                  href="#contact"
                  className="px-7 py-3.5 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white font-semibold text-center transition-all rounded-xl"
                >
                  Let&apos;s talk
                </a>
                <a
                  href="#demo"
                  className={`px-7 py-3.5 ${glass} ${glassHover} text-gray-100 font-medium text-center transition-all rounded-xl`}
                >
                  Try the voice demo
                </a>
              </div>
            </div>

            <div className="lg:col-span-5">
              <RuntimePanel />
            </div>

          </div>

          {/* STACK STRIP — real tools, not fake client logos */}
          <div className="mt-16 pt-8 border-t border-[var(--border-hairline)]">
            <p className="font-technical text-[11px] tracking-widest uppercase text-[var(--muted)] mb-4">
              Built with
            </p>
            <div className="relative overflow-hidden">
              <div className="flex gap-3 w-max marquee-track">
                {[...stack, ...stack].map((item, i) => (
                  <span
                    key={i}
                    className={`px-4 py-2 rounded-lg ${glass} font-technical text-xs text-[var(--muted)] whitespace-nowrap`}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SERVICES SECTION — connected system cards, no fake sequence numbers */}
        <section id="services" className="py-20 md:py-24 border-t border-[var(--border-hairline)]">
          <div className="max-w-2xl mb-12">
            <span className="font-technical text-xs text-[var(--accent)] tracking-widest uppercase block mb-3">
              What I build
            </span>
            <h2 className="font-display text-3xl font-semibold text-white tracking-tight">
              Five kinds of systems, built to work together
            </h2>
            <p className="text-[var(--muted)] mt-4 leading-relaxed">
              Each one solves a specific bottleneck. Most clients start with one and let it prove itself before adding the next.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {services.map((service, index) => (
              <div
                key={index}
                className={`p-6 sm:p-7 rounded-2xl ${glass} ${glassHover} transition-all duration-300 group ${
                  index === services.length - 1 ? "md:col-span-2" : ""
                }`}
              >
                <h3 className="text-lg font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                  {service.title}
                </h3>
                <p className="text-[var(--muted)] mt-2.5 text-sm leading-relaxed">
                  {service.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ORCHESTRATION SECTION — real architecture of the home renovation system */}
        <section id="orchestration" className="py-20 md:py-24 border-t border-[var(--border-hairline)]">
          <div className="max-w-2xl mb-10">
            <span className="font-technical text-xs text-[var(--accent)] tracking-widest uppercase block mb-3">
              How it&apos;s built
            </span>
            <h2 className="font-display text-3xl font-semibold text-white tracking-tight">
              Inside the home renovation agent
            </h2>
            <p className="text-[var(--muted)] mt-4 leading-relaxed">
              This is the real orchestration behind my production system for home renovation contractors — a voice agent handles the call, a LangGraph orchestrator routes it, and three sub-agents do the work in parallel, all synced through one shared database.
            </p>
          </div>

          <div className={`rounded-2xl ${glass} p-4 sm:p-6`}>
            <OrchestrationFlow
              nodes={homeRenoNodes}
              edges={homeRenoEdges}
              extraPaths={homeRenoExtraPaths}
              mobileOrder={homeRenoMobileOrder}
              vbW={HR_VB_W}
              vbH={HR_VB_H}
            />
          </div>

          <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-xs text-[var(--muted)] font-technical">
              Deployed on Railway · production system, not a mockup.
            </p>
            <a
              href="https://github.com/Spectral-Soul/Home_renovation_backend"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-technical text-[var(--accent)] hover:text-[var(--accent-strong)] hover:underline"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              github.com/Spectral-Soul/Home_renovation_backend
            </a>
          </div>
        </section>

        {/* CORE STACK SECTION — the reusable orchestration pattern behind every project, independent of the voice layer */}
        <section id="stack-orchestration" className="py-20 md:py-24 border-t border-[var(--border-hairline)]">
          <div className="max-w-2xl mb-10">
            <span className="font-technical text-xs text-[var(--accent)] tracking-widest uppercase block mb-3">
              The pattern underneath
            </span>
            <h2 className="font-display text-3xl font-semibold text-white tracking-tight">
              My core orchestration stack
            </h2>
            <p className="text-[var(--muted)] mt-4 leading-relaxed">
              Strip away the voice layer and this is what every project is actually built on — a LangGraph orchestrator coordinating a LangChain tool-calling agent, Pydantic validating every input and output, and Supabase holding the shared state. Same pattern, different front door.
            </p>
          </div>

          <div className={`rounded-2xl ${glass} p-4 sm:p-6`}>
            <OrchestrationFlow
              nodes={stackNodes}
              edges={stackEdges}
              extraPaths={stackExtraPaths}
              mobileOrder={stackMobileOrder}
              vbW={STACK_VB_W}
              vbH={STACK_VB_H}
            />
          </div>

          <p className="mt-6 text-xs text-[var(--muted)] font-technical">
            Same orchestrator, different agents — this is the pattern behind every system on this page.
          </p>
        </section>

        {/* LIVE VOICE DEMO SECTION */}
        <section id="demo" className="py-20 md:py-24 border-t border-[var(--border-hairline)]">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-3">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${glass} text-[var(--muted)] text-xs font-technical`}>
                <span className="w-2 h-2 rounded-full bg-[var(--online)] animate-blip"></span>
                Live interactive agent
              </div>
              <h2 className="font-display text-3xl font-semibold text-white tracking-tight">
                Talk to my voice receptionist
              </h2>
              <p className="text-[var(--muted)] text-sm max-w-lg mx-auto">
                A live ElevenLabs agent, running the same architecture I ship to clients. Test latency, tone, and how it handles a real request.
              </p>
            </div>

            <div className={`relative rounded-2xl ${glass} p-6 sm:p-8 overflow-visible shadow-2xl`}>
              <div className="relative z-10 flex flex-col items-center text-center space-y-6 overflow-visible">
                <div className={`w-14 h-14 rounded-full ${glass} flex items-center justify-center text-[var(--accent)]`}>
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                </div>

                <div className="space-y-2 max-w-md">
                  <h3 className="text-base font-semibold text-white">How it works</h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed font-technical">
                    Make sure your mic is on, click the widget below, and speak naturally. The agent qualifies mock leads and books simulated appointments.
                  </p>
                </div>

                {hasElevenLabsAgent ? (
                  <VoiceCallDemo agentId={elevenLabsAgentId} glassClass="panel" />
                ) : (
                  <div className="w-full max-w-md rounded-xl border border-dashed border-[var(--border-strong)] bg-white/[0.02] px-6 py-8 text-center">
                    <p className="text-sm font-semibold text-white">Voice demo is not connected yet.</p>
                    <p className="mt-2 text-xs text-[var(--muted)] leading-relaxed">
                      Add `NEXT_PUBLIC_ELEVENLABS_AGENT_ID` in your environment variables to show the live agent here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* EXPERIENCE TIMELINE SECTION */}
        <section id="experience" className="py-20 md:py-24 border-t border-[var(--border-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            <div className="lg:col-span-4 lg:sticky lg:top-24 h-fit">
              <span className="font-technical text-xs text-[var(--accent)] tracking-widest uppercase block mb-3">
                Track record
              </span>
              <h2 className="font-display text-3xl font-semibold text-white tracking-tight">
                Work & projects
              </h2>
              <p className="text-[var(--muted)] mt-4 max-w-sm leading-relaxed">
                Systems I&apos;ve shipped, in the order I built them — from data integrations to production agent loops.
              </p>
            </div>

            <div className="lg:col-span-8 relative pl-6 border-l border-[var(--border-hairline)] space-y-5">
              {experiences.map((exp, index) => (
                <div key={index} className="relative group">
                  <span className={`absolute -left-[29px] top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ${glass} group-hover:border-[var(--accent)]/60 transition-colors`}>
                    <span className="h-1.5 w-1.5 rounded-full bg-gray-500 group-hover:bg-[var(--accent)] transition-colors"></span>
                  </span>

                  <div className={`p-5 sm:p-6 rounded-2xl ${glass} ${glassHover} transition-all duration-300`}>
                    <div className="flex gap-4 sm:gap-6 items-start">
                      <span className="font-technical text-sm text-[var(--accent)]/80 font-semibold mt-1">
                        {exp.num}
                      </span>

                      <div className="space-y-2">
                        <h3 className="text-lg font-semibold text-white group-hover:text-[var(--accent)] transition-colors">
                          {exp.title}
                        </h3>

                        <p className="text-[var(--muted)] text-sm leading-relaxed max-w-2xl">
                          {exp.desc}
                        </p>

                        {exp.link && (
                          <div className="pt-2">
                            <a
                              href={exp.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-technical text-[var(--accent)] hover:text-[var(--accent-strong)] hover:underline"
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                              </svg>
                              {exp.linkLabel}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* ABOUT & Q&A ACCORDION SECTION */}
        <section id="about" className="py-20 md:py-24 border-t border-[var(--border-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            <div className="lg:col-span-5 space-y-6">
              <div className={`h-16 w-16 overflow-hidden rounded-2xl relative ${glass}`}>
                <Image
                  src="/profile-photo.jpeg"
                  alt="Sujith profile photo"
                  fill
                  sizes="64px"
                  className="object-cover object-center"
                />
              </div>
              <span className="font-technical text-xs text-[var(--accent)] tracking-widest uppercase block">
                About
              </span>
              <h2 className="font-display text-3xl font-semibold text-white tracking-tight">
                Systems that handle tasks, not just talk.
              </h2>
              <p className="text-[var(--muted)] leading-relaxed text-sm">
                I specialize in production-grade AI applications — LangGraph state machines and ElevenLabs voice streams that automate repetitive business processes. I operate out of Puducherry, India, building software that replaces manual steps for small businesses and clinics.
              </p>
              <div className="pt-2">
                <a
                  href="#contact"
                  className="inline-flex items-center gap-2 text-sm font-technical text-[var(--accent)] hover:text-[var(--accent-strong)] group/link"
                >
                  Start a project
                  <svg className="w-4 h-4 transform group-hover/link:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </a>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              {aboutQAs.map((qa) => {
                const isOpen = activeAboutId === qa.id;
                return (
                  <div
                    key={qa.id}
                    className={`rounded-2xl overflow-hidden ${glass} ${glassHover} transition-colors`}
                  >
                    <button
                      onClick={() => setActiveAboutId(isOpen ? null : qa.id)}
                      className="w-full flex items-center justify-between p-5 text-left font-semibold text-white transition-all group"
                      aria-expanded={isOpen}
                    >
                      <span className="group-hover:text-[var(--accent)] transition-colors pr-4">{qa.question}</span>
                      <span className={`text-[var(--accent)] transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </span>
                    </button>

                    <div
                      className="accordion-content overflow-hidden transition-all duration-300"
                      style={{ maxHeight: isOpen ? "200px" : "0", opacity: isOpen ? 1 : 0 }}
                    >
                      <div className="p-5 pt-0 text-sm text-[var(--muted)] border-t border-[var(--border-hairline)] leading-relaxed">
                        {qa.answer}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* FAQ SECTION */}
        <section id="faq" className="py-20 md:py-24 border-t border-[var(--border-hairline)]">
          <div className="max-w-3xl mx-auto space-y-10">

            <div className="text-center space-y-3">
              <span className="font-technical text-xs text-[var(--accent)] tracking-widest uppercase block">
                FAQ
              </span>
              <h2 className="font-display text-3xl font-semibold text-white tracking-tight">
                Questions worth answering upfront
              </h2>
              <p className="text-[var(--muted)] text-sm max-w-lg mx-auto">
                Direct answers. No fluff, just what you actually need to know.
              </p>
            </div>

            <div className="space-y-3">
              {faqQAs.map((faq) => {
                const isOpen = activeFaqId === faq.id;
                return (
                  <div
                    key={faq.id}
                    className={`rounded-2xl overflow-hidden ${glass} ${glassHover} transition-colors`}
                  >
                    <button
                      onClick={() => setActiveFaqId(isOpen ? null : faq.id)}
                      className="w-full flex items-center justify-between p-5 text-left font-semibold text-white transition-all group"
                      aria-expanded={isOpen}
                    >
                      <span className="group-hover:text-[var(--accent)] transition-colors pr-4">{faq.question}</span>
                      <span className={`text-[var(--accent)] transition-transform duration-300 ${isOpen ? "rotate-45" : ""}`}>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                        </svg>
                      </span>
                    </button>

                    <div
                      className="accordion-content overflow-hidden transition-all duration-300"
                      style={{ maxHeight: isOpen ? "200px" : "0", opacity: isOpen ? 1 : 0 }}
                    >
                      <div className="p-5 pt-0 text-sm text-[var(--muted)] border-t border-[var(--border-hairline)] leading-relaxed">
                        {faq.answer}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </section>

        {/* CONTACT SECTION */}
        <section id="contact" className="py-20 md:py-24 border-t border-[var(--border-hairline)]">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

            <div className="lg:col-span-5 space-y-8">
              <div>
                <span className="font-technical text-xs text-[var(--accent)] tracking-widest uppercase block mb-3">
                  Get in touch
                </span>
                <h2 className="font-display text-3xl font-semibold text-white tracking-tight">
                  Let&apos;s talk about what to automate first.
                </h2>
                <p className="text-[var(--muted)] mt-4 leading-relaxed text-sm">
                  Tell me about the repetitive parts of your operation. I&apos;ll tell you honestly whether an agent is the right fix — and what it would take to build.
                </p>
              </div>

              <div className="space-y-3 pt-2">

                <a
                  href="mailto:vsujithbusiness@gmail.com"
                  className={`flex items-center gap-4 p-4 rounded-2xl ${glass} ${glassHover} transition-all group`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] text-[var(--accent)]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <div>
                    <span className="text-xs text-[var(--muted)] font-technical block">Email</span>
                    <span className="text-sm font-semibold text-white group-hover:text-[var(--accent)] transition-colors">vsujithbusiness@gmail.com</span>
                  </div>
                </a>

                <a
                  href="https://wa.me/916382284896"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-4 p-4 rounded-2xl ${glass} ${glassHover} transition-all group`}
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/[0.04] text-[var(--online)]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.377 3.469 2.235 2.236 3.466 5.212 3.466 8.381 0 6.533-5.324 11.858-11.855 11.858-2.004-.001-3.974-.51-5.729-1.48L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.556 0 10.076-4.522 10.079-10.082.001-2.693-1.045-5.224-2.946-7.127C16.6-2.508 14.072-3.551 11.86-3.55c-5.561 0-10.082 4.524-10.085 10.086 0 1.782.489 3.52 1.417 5.058L2.164 19.92l4.483-1.176-.001.01z" transform="translate(1 1)"/>
                    </svg>
                  </span>
                  <div>
                    <span className="text-xs text-[var(--muted)] font-technical block">WhatsApp</span>
                    <span className="text-sm font-semibold text-white group-hover:text-[var(--online)] transition-colors">Chat on WhatsApp</span>
                  </div>
                </a>

              </div>
            </div>

            <div className="lg:col-span-7">
              <div className={`rounded-2xl ${glass} p-6 sm:p-8`}>
                <form onSubmit={handleFormSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-xs font-technical text-[var(--muted)] block">Your name</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        disabled={formStatus === "submitting"}
                        value={formState.name}
                        onChange={handleFormChange}
                        placeholder="e.g. John Doe"
                        className="w-full bg-white/[0.03] border border-[var(--border-hairline)] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/60 transition-all disabled:opacity-50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-xs font-technical text-[var(--muted)] block">Email address</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        disabled={formStatus === "submitting"}
                        value={formState.email}
                        onChange={handleFormChange}
                        placeholder="e.g. name@company.com"
                        className="w-full bg-white/[0.03] border border-[var(--border-hairline)] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/60 transition-all disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-xs font-technical text-[var(--muted)] block">Subject</label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      required
                      disabled={formStatus === "submitting"}
                      value={formState.subject}
                      onChange={handleFormChange}
                      placeholder="e.g. Voice agent for my clinic"
                      className="w-full bg-white/[0.03] border border-[var(--border-hairline)] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/60 transition-all disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-xs font-technical text-[var(--muted)] block">What needs automating?</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      disabled={formStatus === "submitting"}
                      value={formState.message}
                      onChange={handleFormChange}
                      placeholder="Describe the repetitive tasks eating up your time..."
                      className="w-full bg-white/[0.03] border border-[var(--border-hairline)] rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[var(--accent)]/60 focus:ring-1 focus:ring-[var(--accent)]/60 transition-all resize-none disabled:opacity-50"
                    ></textarea>
                  </div>

                  {formStatus === "error" && formError && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                      {formError}
                    </div>
                  )}

                  {formStatus === "success" && (
                    <div className="rounded-lg border border-[var(--online)]/30 bg-[var(--online)]/10 px-4 py-3 text-sm text-emerald-300">
                      Message sent — I&apos;ll get back to you shortly.
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full py-4 bg-[var(--accent)] hover:bg-[var(--accent-strong)] text-white font-semibold transition-all text-center rounded-lg select-none disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={formStatus === "submitting"}
                  >
                    {formStatus === "submitting" ? "Sending..." : "Send message"}
                  </button>
                </form>
              </div>
            </div>

          </div>
        </section>

      </main>

      <footer className={`mt-8 py-10 relative z-10 border-t border-[var(--border-hairline)] bg-white/[0.01]`}>
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="text-xs font-technical text-[var(--muted)]">
            &copy; {new Date().getFullYear()} Sujith. Puducherry, India.
          </div>
          <div className="flex items-center gap-6 font-technical text-xs text-[var(--muted)]">
            <a href="https://github.com/Spectral-Soul" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors">GitHub</a>
            <a href="https://wa.me/916382284896" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--online)] transition-colors">WhatsApp</a>
          </div>
        </div>
      </footer>
    </>
  );
}
