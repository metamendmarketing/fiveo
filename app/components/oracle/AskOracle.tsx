"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Send, Loader2, ChevronDown, Sparkles, CheckCircle2 } from "lucide-react";
import type { BuildProfile } from "@/app/lib/constants";

interface AskOracleProps {
  productId: number;
  productName: string;
  buildProfile: BuildProfile;
}

/**
 * AskOracle — Collapsible AI Q&A module for the product detail popout.
 * 
 * Allows customers to ask free-form questions about the product they're viewing,
 * grounded in the full FiveO catalog and their build profile.
 */
export default function AskOracle({ productId, productName, buildProfile }: AskOracleProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ answer: string; citedSpecs?: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isExpanded]);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    setLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch("/api/oracle/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, productId, buildProfile }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || "Failed to connect");
      }

      const data = await res.json();
      setResponse(data);
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : "I'm having trouble connecting right now. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAsk = (q: string) => {
    setQuestion(q);
    // Auto-submit after setting the question
    setTimeout(() => {
      const form = document.getElementById("ask-oracle-form") as HTMLFormElement;
      form?.requestSubmit();
    }, 50);
  };

  // Dynamic quick-ask chips based on available product data and build profile
  const vehicleLabel = [buildProfile.year, buildProfile.make, buildProfile.model].filter(Boolean).join(" ");
  const quickQuestions = [
    vehicleLabel ? `Will this fit my ${vehicleLabel}?` : "Will this fit my vehicle?",
    "Is this compatible with E85?",
    "What HP can this support?",
    "Do I need adapters to install this?",
  ];

  return (
    <div className="mt-2">
      {/* ─── Collapsed Trigger Bar ─── */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl transition-all duration-300 group ${
          isExpanded
            ? "bg-[#00AEEF]/10 border border-[#00AEEF]/30"
            : "bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20"
        }`}
      >
        <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? "bg-[#00AEEF]/20" : "bg-white/10 group-hover:bg-[#00AEEF]/10"}`}>
          <MessageCircle className={`w-4 h-4 transition-colors ${isExpanded ? "text-[#00AEEF]" : "text-white/50 group-hover:text-[#00AEEF]"}`} />
        </div>
        <span className={`text-[10px] font-black uppercase tracking-[0.15em] flex-1 text-left transition-colors ${
          isExpanded ? "text-[#00AEEF]" : "text-white/50 group-hover:text-white/70"
        }`}>
          {response ? "Oracle Answered" : "Have a question? Ask the Oracle"}
        </span>
        <ChevronDown className={`w-4 h-4 transition-all duration-300 ${
          isExpanded ? "rotate-180 text-[#00AEEF]" : "text-white/30 group-hover:text-white/50"
        }`} />
      </button>

      {/* ─── Expanded Panel ─── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="pt-4 space-y-4">

              {/* Input Form */}
              <form id="ask-oracle-form" onSubmit={handleAsk} className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder={`Ask about ${productName.slice(0, 30)}...`}
                  className="w-full bg-white/5 border border-white/15 rounded-xl py-3.5 pl-4 pr-14 text-sm font-medium text-white placeholder:text-white/30 focus:outline-none focus:border-[#00AEEF]/50 focus:bg-white/8 transition-all"
                />
                <button
                  type="submit"
                  disabled={!question.trim() || loading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-[#00AEEF] text-white rounded-lg hover:bg-[#00AEEF]/80 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>

              {/* Quick-Ask Chips */}
              {!response && !loading && (
                <div className="flex flex-wrap gap-1.5">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleQuickAsk(q)}
                      className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-[9px] font-bold text-white/40 hover:text-white/70 uppercase tracking-wider transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading Skeleton */}
              {loading && (
                <div className="space-y-2.5 py-2">
                  <div className="h-3 bg-white/5 rounded-full w-full animate-pulse" />
                  <div className="h-3 bg-white/5 rounded-full w-5/6 animate-pulse" />
                  <div className="h-3 bg-white/5 rounded-full w-3/5 animate-pulse" />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-xs text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* Response */}
              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Oracle Response</span>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <p className="text-sm text-white/90 leading-relaxed font-medium">
                      {response.answer}
                    </p>
                  </div>

                  {/* Cited Specs */}
                  {response.citedSpecs && response.citedSpecs.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {response.citedSpecs.map((spec, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#00AEEF]/10 border border-[#00AEEF]/20 rounded-md text-[8px] font-black uppercase tracking-wider text-[#00AEEF]/70"
                        >
                          <Sparkles className="w-2.5 h-2.5" />
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Ask Another */}
                  <button
                    type="button"
                    onClick={() => { setResponse(null); setQuestion(""); }}
                    className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/60 transition-colors"
                  >
                    Ask another question →
                  </button>
                </motion.div>
              )}

              {/* Footer */}
              <div className="flex justify-center pt-1 pb-1">
                <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">
                  FiveO Engineering · Fact-Based Precision
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
