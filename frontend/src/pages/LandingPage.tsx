import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import IntroAnimation from "../components/IntroAnimation";
import { Code2, Shield, Terminal, Trophy, ArrowRight, Users, Zap, Calendar, MapPin, GraduationCap } from "lucide-react";
import { KareAcmwBadge } from "../components/KareAcmwBadge";
import { HerizonBrand } from "../components/HerizonBrand";


export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [introComplete, setIntroComplete] = useState(false);
  const [heroVisible, setHeroVisible] = useState(false);

  const handleIntroComplete = () => {
    setIntroComplete(true);
    setTimeout(() => setHeroVisible(true), 50);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* GSAP Animated Intro Sequence */}
      {!introComplete && <IntroAnimation onComplete={handleIntroComplete} />}

      <div
        className="transition-opacity duration-500"
        style={{ opacity: heroVisible ? 1 : 0 }}
      >
        {/* Top Navbar */}
        <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-3 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <HerizonBrand size="sm" badgeSize={40} showSubline sublineText="Assessment Platform" />
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/login")}
              className="btn-primary"
            >
              Start Assessment <ArrowRight size={15} />
            </button>
          </div>
        </nav>

        {/* HERO SECTION */}
        <section className="relative flex min-h-screen flex-col items-center justify-center px-4 pt-24 pb-16 text-center">
          <div className="max-w-3xl mx-auto flex flex-col items-center">
            
            {/* 1. PRESENTS */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 text-xs sm:text-sm font-extrabold uppercase tracking-widest mb-4 shadow-2xs">
              KARE ACM-W PRESENTS
            </div>

            {/* 2. HERIZON 2026 */}
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight leading-none mb-3">
              <span className="text-blue-600">HER</span>
              <span className="text-pink-500">IZON</span>{" "}
              <span className="text-slate-900 font-bold">2026</span>
            </h1>

            {/* 3. LEARN. CODE. DEBUG. PITCH. IMPACT. */}
            <p className="text-lg sm:text-2xl font-black text-pink-600 uppercase tracking-wider mb-6">
              LEARN. CODE. DEBUG. PITCH. IMPACT.
            </p>


            <p className="max-w-xl text-base text-slate-600 font-medium leading-relaxed mb-8">
              The official coding &amp; debugging assessment platform for ACM-W members.
              Solve structured challenges, execute code in real-time, and get instant evaluation.
            </p>

            {/* Action Button */}
            <div className="flex items-center justify-center">
              <button
                onClick={() => navigate("/login")}
                className="btn-primary text-base px-8 py-3.5 shadow-sm"
              >
                Start Assessment <ArrowRight size={18} />
              </button>
            </div>

            {/* Stats Row */}
            <div className="mt-16 grid grid-cols-3 gap-4 sm:gap-8 max-w-lg w-full">
              {[
                { icon: Users, val: "150+", label: "Members" },
                { icon: Code2, val: "4", label: "Languages" },
                { icon: Trophy, val: "Live", label: "Proctoring" },
              ].map(({ icon: Icon, val, label }) => (
                <div
                  key={label}
                  className="bg-white border border-slate-200 rounded-xl p-4 text-center shadow-xs"
                >
                  <Icon size={20} className="mx-auto mb-1.5 text-orange-500" />
                  <div className="text-xl sm:text-2xl font-extrabold text-slate-900">{val}</div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    {label}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* EVENT FLYER DETAILS SECTION */}
        <section className="py-16 px-4 max-w-5xl mx-auto border-t border-slate-200/60 space-y-12">
          <div className="text-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-700 text-xs font-black uppercase tracking-widest mb-2">
              Event Details
            </span>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              HERIZON Hackathon Overview
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Learn. Code. Debug. Pitch. Impact.
            </p>
          </div>

          {/* Quick info cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <Calendar size={22} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Date &amp; Time</h3>
                <p className="text-sm font-black text-white mt-1">August 28th, 5:00 PM</p>
                <p className="text-sm font-black text-white">&amp; August 29th, 9:00 AM - 4:00 PM</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Users size={22} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Team Composition</h3>
                <p className="text-sm font-black text-white mt-1">4 Members per Team</p>
                <p className="text-xs font-bold text-pink-400 mt-1">Minimum 2 Female Candidates Mandatory</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-md space-y-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <MapPin size={22} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Location &amp; Venue</h3>
                <p className="text-sm font-black text-white mt-1">8th Block</p>
                <p className="text-sm font-black text-white">8601 LAB</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Prize and benefits */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Trophy size={16} className="text-orange-500" /> Rewards &amp; Details
              </h3>
              
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="p-3.5 rounded-xl bg-orange-50/50 border border-orange-100">
                  <p className="text-[10px] font-extrabold text-orange-600 uppercase tracking-wider">Prize Pool</p>
                  <p className="text-base font-black text-slate-950 mt-1">₹6,000</p>
                </div>
                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                  <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">Benefit</p>
                  <p className="text-base font-black text-slate-950 mt-1">1 EE Credit</p>
                </div>
                <div className="p-3.5 rounded-xl bg-pink-50/50 border border-pink-100">
                  <p className="text-[10px] font-extrabold text-pink-600 uppercase tracking-wider">Fee</p>
                  <p className="text-base font-black text-slate-950 mt-1">₹200 / Person</p>
                </div>
              </div>

              {/* Chief Guest */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Honored Chief Guest</p>
                <div>
                  <p className="text-xs font-black text-slate-950">Dr. HASEENA S</p>
                  <p className="text-[11px] font-semibold text-slate-600">Associate Lead, Frameworks &amp; Cloud</p>
                  <p className="text-[11px] font-bold text-blue-600 mt-0.5">MulticoreWare Inc.</p>
                </div>
              </div>
            </div>

            {/* Leadership & Contacts */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <GraduationCap size={16} className="text-orange-500" /> Event Leadership
              </h3>

              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Convenors</p>
                  <p className="text-slate-800 font-bold">Dr. P. Deepalakshmi <span className="text-[10px] font-medium text-slate-500">(Dean/SoC)</span></p>
                  <p className="text-slate-800 font-bold mt-1">Dr. R. Raja Subramanian <span className="text-[10px] font-medium text-slate-500">(HoD/CSE)</span></p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Faculty Sponsor</p>
                  <p className="text-slate-800 font-bold">Dr. N. C. Brintha <span className="text-[10px] font-medium text-slate-500">(HoD/IT)</span></p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Student Coordinators</p>
                <div className="flex justify-between text-xs text-slate-700 font-bold">
                  <span>M. Jahnavi Sree: <span className="font-mono text-slate-500">8074643008</span></span>
                  <span>T. Dharani: <span className="font-mono text-slate-500">8297613546</span></span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-16 px-4 max-w-5xl mx-auto border-t border-slate-200/60">
          <div className="text-center mb-12">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest">
              Platform Features
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Why Debug &amp; Decode?
            </h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">
              Built for students by KARE ACM-W.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Terminal,
                title: "Code Execution",
                desc: "Run code in Python, C++, Java, and C with custom test inputs.",
              },
              {
                icon: Shield,
                title: "Proctored Security",
                desc: "Fullscreen mode enforcement with 3-attempt violation limit system.",
              },
              {
                icon: Zap,
                title: "Instant Feedback",
                desc: "Automated test case execution with clear pass/fail results.",
              },
              {
                icon: Code2,
                title: "Multi-Language Code",
                desc: "Switch languages smoothly with preserved code buffers per language.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-orange-50 text-orange-600 border border-orange-100">
                  <Icon size={20} />
                </div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">{title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* BOTTOM CTA STRIP */}
        <section className="py-12 px-4 text-center border-t border-slate-200/60">
          <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl p-8 sm:p-10 shadow-xs">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-2">
              Ready to test your skills?
            </h2>
            <p className="text-sm text-slate-600 mb-6 font-medium">
              Enter the HERIZON 2026 assessment workspace now.
            </p>
            <button
              onClick={() => navigate("/login")}
              className="btn-primary text-base px-8 py-3 mx-auto"
            >
              Enter Assessment Platform <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white py-6 px-4 text-center text-xs font-medium text-slate-500">
          © 2026 KARE ACM-W Student Chapter · Kalasalingam Academy of Research and Education
        </footer>
      </div>
    </div>
  );
};
