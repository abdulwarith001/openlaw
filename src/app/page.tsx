"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scale,
  ShieldCheck,
  FileText,
  ArrowRight,
  Gavel,
  CheckCircle2,
  Lock,
  Send,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ParticleBackground } from "@/components/ui/ParticleBackground";
import { AuroraBackground } from "@/components/ui/AuroraBackground";
import { BorderBeam } from "@/components/ui/BorderBeam";
import { Logo } from "@/components/ui/Logo";

const Badge = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary text-black text-[10px] font-bold uppercase tracking-wider">
    <span className="w-1.5 h-1.5 rounded-full bg-black/20" />
    {children}
  </div>
);

const FeatureCard = ({
  icon: Icon,
  title,
  description,
  badge,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  badge?: string;
}) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    }}
  >
    <Card className="flex flex-col gap-5 border-border/60 hover:border-primary/40 bg-surface/50 backdrop-blur-sm group shadow-sm transition-all hover:shadow-md h-full">
      <div className="flex items-center justify-between mb-2">
        <Badge>{badge || "Constitution"}</Badge>
        <div className="text-muted/40 group-hover:text-primary transition-colors">
          <Icon size={20} />
        </div>
      </div>
      <div>
        <h3 className="text-xl font-bold font-heading mb-3 leading-tight text-foreground">
          {title}
        </h3>
        <p className="text-muted text-sm leading-relaxed line-clamp-3">
          {description}
        </p>
      </div>
      <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between pb-1">
        <span className="text-[10px] text-muted font-heading uppercase tracking-widest font-bold">
          1999 Constitution
        </span>
        <ArrowRight
          size={14}
          className="text-primary opacity-0 group-hover:opacity-100 transition-all translate-x-[-4px] group-hover:translate-x-0"
        />
      </div>
    </Card>
  </motion.div>
);

const WordCycler = () => {
  const words = [
    "Know your rights.",
    "Know the laws.",
    "See legal clarity.",
    "Know the constitution.",
    "Find justice for all.",
    "Follow due process.",
    "Know your duties.",
  ];
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % words.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [words.length]);

  return (
    <div className="inline-block relative h-[1.1em] overflow-hidden">
      {/* Ghost elements to reserve width for ALL possible phrases, preventing any shift */}
      <div
        className="invisible h-0 flex flex-col pointer-events-none text-4xl sm:text-6xl md:text-7xl lg:text-8xl"
        aria-hidden="true"
      >
        {words.map((phrase, pi) => (
          <div key={phrase} className="whitespace-nowrap">
            {phrase.split(" ").map((word, wi) => (
              <span key={wi} className={wi > 0 ? "ml-[0.3em]" : ""}>
                {word}
              </span>
            ))}
          </div>
        ))}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          className="absolute inset-x-0 top-0 flex justify-center items-center whitespace-nowrap"
        >
          {words[index].split(" ").map((word, i) => (
            <motion.span
              key={i}
              initial={
                i === 0
                  ? { opacity: 0.4 }
                  : { y: 80, opacity: 0 }
              }
              animate={{ y: 0, opacity: 1 }}
              exit={
                i === 0
                  ? { opacity: 0.4 }
                  : { y: -80, opacity: 0 }
              }
              transition={{
                duration: i === 0 ? 0.8 : 0.6,
                ease: i === 0 ? "easeInOut" : undefined,
                type: i === 0 ? "tween" : "spring",
                stiffness: 120,
                damping: i === 0 ? undefined : 20,
              }}
              className={i === 0 ? "text-foreground" : "text-primary ml-[0.3em]"}
            >
              {word}
            </motion.span>
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden text-foreground">
      <div className="fixed inset-0 z-0">
        <ParticleBackground />
        <AuroraBackground />
      </div>

      {/* Navigation - Floating Pill Design */}
      <div className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4">
        <nav className="relative bg-transparent backdrop-blur-xl rounded-full px-4 md:px-8 h-12 md:h-14 flex items-center justify-between border-[0.5px] border-white/10 shadow-2xl overflow-hidden">
          <BorderBeam duration={6} borderWidth={1.5} />
          <div className="flex items-center gap-2 md:gap-3 relative z-10 group cursor-pointer shrink-0">
            <Logo size={28} className="md:hidden" />
            <Logo size={36} className="hidden md:block" />
            <span className="text-lg md:text-xl font-black font-heading tracking-tighter text-foreground">
              OpenLaw
            </span>
          </div>
          <div className="flex items-center">
            <Link href="/chat">
              <Button size="sm" className="h-8 md:h-9 px-4 md:px-6 text-xs md:text-sm">
                Ask a question
              </Button>
            </Link>
          </div>
        </nav>
      </div>

      <main className="grow">
        {/* Hero Section */}
        <section className="relative pt-48 pb-24 px-6 text-center">
          <motion.div
            className="max-w-5xl mx-auto relative z-10"
            initial="hidden"
            animate="visible"
            variants={containerVariants}
          >
            {/* <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold uppercase tracking-wider text-foreground mb-10"
            >
              <ShieldCheck size={14} className="text-primary" />
              AI Legal Assistant for Nigeria
            </motion.div> */}

            <motion.h1
              variants={itemVariants}
              className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold mt-6 md:mt-10 font-heading mb-6 md:mb-10 tracking-tighter leading-[1.1] text-foreground flex justify-center"
            >
              <div className="flex items-center gap-x-2 md:gap-x-4 w-fit px-4">
                <WordCycler />
              </div>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-muted max-w-2xl mx-auto mb-12 leading-relaxed"
            >
              The first AI assistant dedicated strictly to the Nigerian
              Constitution. Get accurate explanations and citations in seconds.
            </motion.p>

            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Link href="/chat">
                <Button size="lg" className="group">
                  Ask a question
                  <ArrowRight
                    className="ml-2 group-hover:translate-x-1 transition-transform"
                    size={20}
                  />
                </Button>
              </Link>
            </motion.div>

            {/* Hero Image / Mockup Placeholder */}
            <motion.div variants={itemVariants} className="mt-12 md:mt-20 relative px-2 md:px-4">
              <div className="max-w-5xl mx-auto min-h-[400px] md:aspect-video rounded-3xl overflow-hidden border border-white/10 bg-surface shadow-[0_0_50px_rgba(0,0,0,0.5)] relative">
                {/* Decorative UI elements for the mockup */}
                <div className="absolute top-0 left-0 right-0 h-10 md:h-12 border-b border-border/40 flex items-start px-4 md:px-6 gap-2 bg-[#1E1C17] z-20">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-red-400/20" />
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-yellow-400/20" />
                    <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-green-400/20" />
                  </div>
                </div>

                {/* Example Chat Interface */}
                <div className="absolute inset-0 pt-16 md:pt-20 px-4 md:px-8 flex flex-col gap-4 md:gap-6 overflow-hidden">
                  {/* User Message */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1, duration: 0.5 }}
                    className="self-end max-w-[90%] md:max-w-[80%] flex flex-col items-end gap-2"
                  >
                    <div className="bg-primary/10 border border-primary/20 px-4 md:px-5 py-2 md:py-3 rounded-2xl rounded-tr-sm text-xs md:text-sm text-foreground">
                      What are my rights regarding personal liberty under the
                      Nigerian Constitution?
                    </div>
                  </motion.div>

                  {/* AI Message */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.8, duration: 0.5 }}
                    className="self-start max-w-[95%] md:max-w-[85%] flex items-start gap-2 md:gap-3"
                  >
                    <div className="w-6 h-6 md:w-8 md:h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0 border border-primary/30 shadow-[0_0_10px_rgba(255,214,0,0.1)]">
                      <Sparkles size={14} className="md:size-16 text-primary" />
                    </div>
                    <div className="flex flex-col gap-2 md:gap-3">
                      <div className="bg-surface-raised border border-border/60 px-4 md:px-5 py-3 md:py-4 rounded-2xl rounded-tl-sm text-xs md:text-sm text-muted leading-relaxed shadow-sm">
                        <p className="mb-2 md:mb-3 text-left">
                          According to{" "}
                          <span className="text-foreground font-bold underline decoration-primary/50 underline-offset-2">
                            Section 35
                          </span>{" "}
                          of the 1999 Constitution, every person is entitled to
                          their personal liberty.
                        </p>
                        <p className="text-left">
                          No person shall be deprived of such liberty except in
                          specific cases permitted by law, such as execution of
                          a court sentence...
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="px-2 py-0.5 rounded bg-primary/20 border border-primary/30 text-[9px] md:text-[10px] font-black text-primary uppercase tracking-tighter">
                          Source: Section 35(1)
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 w-[92%] md:w-[600px] h-12 md:h-14 rounded-full bg-[#181612]/80 backdrop-blur-sm border border-border/40 flex items-center px-4 md:px-6 shadow-lg z-20">
                  <span className="text-xs md:text-sm text-muted font-medium truncate">
                    Ask anything about the Nigerian Constitution...
                  </span>
                  <div className="ml-auto p-1.5 md:p-2 rounded-full bg-primary shadow-sm hover:scale-110 transition-transform cursor-pointer">
                    <Send size={14} className="md:size-16 text-black" />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </section>

        {/* Fundamental Rights Section */}
        <section id="rights" className="py-16 md:py-24 bg-surface/30 px-6 md:px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12 md:initial-mb-16">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-heading mb-4">
                Your Fundamental Rights
              </h2>
              <p className="text-muted max-w-2xl mx-auto">
                Chapter IV of the Nigerian Constitution outlines the basic
                rights every citizen is entitled to. Our AI helps you understand
                and exercise them.
              </p>
            </div>

            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={{
                visible: {
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
            >
              <FeatureCard
                icon={Scale}
                title="Right to Personal Liberty"
                badge="Section 35"
                description="Ensuring every person is entitled to their personal liberty, protected from unlawful detention."
              />
              <FeatureCard
                icon={ShieldCheck}
                title="Dignity of Human Person"
                badge="Section 34"
                description="Universal protection against torture, inhuman or degrading treatment by any authority."
              />
              <FeatureCard
                icon={Gavel}
                title="Right to Fair Hearing"
                badge="Section 36"
                description="Guaranteeing every citizen's right to a fair and public trial within a reasonable time."
              />
              <FeatureCard
                icon={Lock}
                title="Right to Privacy"
                badge="Section 37"
                description="Protecting the privacy of citizens, their homes, correspondence, and communications."
              />
              <FeatureCard
                icon={FileText}
                title="Freedom of Expression"
                badge="Section 39"
                description="The right to freedom of expression, including the freedom to hold opinions and impart ideas."
              />
              <FeatureCard
                icon={CheckCircle2}
                title="Freedom of Movement"
                badge="Section 41"
                description="Every citizen is entitled to move freely throughout Nigeria and reside in any part thereof."
              />
            </motion.div>
          </div>
        </section>

        {/* Disclaimer Section */}
        <section className="py-24 px-4 border-t border-muted/10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center text-secondary mx-auto mb-6">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-6 text-foreground">
              Important Disclaimer
            </h2>
            <p className="text-muted leading-relaxed mb-8">
              This AI provides informational guidance based on the Nigerian
              Constitution and the laws of the Federation. It is designed to aid
              your understanding of legal concepts but{" "}
              <strong>
                should not be considered professional legal advice.
              </strong>
            </p>
            <p className="text-sm text-muted/60">
              For specific legal matters, always consult with a qualified Legal
              Practitioner in Nigeria.
            </p>
          </div>
        </section>
      </main>

      <footer className="relative pt-16 md:pt-24 pb-0 px-6 bg-transparent overflow-hidden">
        {/* Background Text with Stippled Effect - Pinned to Bottom */}
        <div className="absolute bottom-[-2%] md:bottom-[-5%] left-1/2 -translate-x-1/2 w-full text-center pointer-events-none select-none z-0">
          <h2
            className="text-[25vw] md:text-[18vw] font-black font-heading leading-none uppercase tracking-tighter text-white/5 md:text-white/10 whitespace-nowrap"
            style={{
              maskImage:
                "radial-gradient(circle at 2px 2px, black 1px, transparent 0)",
              maskSize: "3px 3px",
              WebkitMaskImage:
                "radial-gradient(circle at 2px 2px, black 1px, transparent 0)",
              WebkitMaskSize: "3px 3px",
            }}
          >
            Open Law
          </h2>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          {/* Logo & Credits Row */}
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 mb-4">
            {/* Logo Group */}
            <div className="flex items-center gap-3 group cursor-pointer">
              <Logo size={32} />
              <span className="text-lg font-black font-heading tracking-tighter text-foreground uppercase opacity-80">
                OpenLaw
              </span>
            </div>

            {/* Credits */}
            <p className="text-muted/80 text-sm font-medium tracking-wide">
              Built with ❤️ by{" "}
              <a
                href="https://github.com/abdulwarith001"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground hover:text-primary transition-colors font-bold underline decoration-primary/30 underline-offset-4"
              >
                Abdulwarith
              </a>
            </p>
          </div>

          {/* Copyright Row */}
          <div className="flex flex-col items-center md:items-start pb-8">
            <p className="text-muted/40 text-[10px] font-bold uppercase tracking-[0.2em]">
              © 2026 OpenLaw. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
