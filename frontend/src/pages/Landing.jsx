import React from 'react'
import { Link } from 'react-router-dom'
import {
  Leaf, ScanLine, Flame, Sparkles, CloudSun, Wallet, MessageCircle, Bell,
  ArrowRight, ShieldCheck
} from 'lucide-react'

const FEATURES = [
  { icon: ScanLine, title: 'AI Disease Detection', desc: 'Upload a leaf photo and get an instant, real analysis of disease signals, confidence, and affected area.' },
  { icon: Flame, title: 'Dynamic Priority Engine', desc: 'Every active issue across your farm is scored and ranked by XGBoost ML so you always know what to fix first.' },
  { icon: Sparkles, title: 'AI Rescue Planner', desc: 'Get a tailored action plan with organic and chemical options, prescription dosages, and recovery timelines.' },
  { icon: CloudSun, title: 'Weather Intelligence', desc: 'Live weather tied directly into treatment timing and disease-risk scoring for your farm location.' },
  { icon: Wallet, title: 'Economic Prediction', desc: 'See the real financial cost of waiting, calculated from your crop price and predicted yield loss.' },
  { icon: MessageCircle, title: 'AI Farm Assistant', desc: 'Ask questions about your specific crop, field, and current conditions — answered in context.' },
]

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#f8faf8]">
      <header className="max-w-7xl mx-auto flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-emerald-900 text-lg leading-tight block">AI Farm Guardian</span>
            <span className="text-[11px] text-emerald-700 font-medium">Dynamic Intervention Prioritization System</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-emerald-700 transition">Log in</Link>
          <Link to="/login" className="px-4 py-2 text-sm font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm transition">Start Monitoring 🌾</Link>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto text-center px-6 pt-14 pb-16">
        <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-1.5 rounded-full mb-6 shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> Dynamic Intervention Prioritization System
        </div>
        <h1 className="text-4xl sm:text-6xl font-black text-gray-900 leading-tight tracking-tight">
          Protect Every Crop.<br />
          <span className="text-emerald-700">Prioritize Every Threat.</span>
        </h1>
        <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
          AI-powered crop disease detection, dynamic multi-issue prioritization via XGBoost, weather-aware
          recommendations, and economic risk prediction — all in one platform.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link to="/login" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold text-base hover:bg-emerald-700 shadow-md transition">
            Enter Platform & Demo <ArrowRight className="w-5 h-5" />
          </Link>
          <a href="#features" className="px-6 py-3 rounded-xl border border-gray-300 bg-white text-gray-700 font-semibold text-base hover:bg-gray-50 transition">
            Explore AI Features
          </a>
        </div>
        <p className="mt-5 text-sm font-semibold text-emerald-800 italic">
          "Don't just detect the problem. Know what to fix first."
        </p>
      </section>

      {/* Problem / Solution */}
      <section className="max-w-6xl mx-auto px-6 py-8 grid md:grid-cols-2 gap-6">
        <div className="bg-white border border-red-100 rounded-2xl p-6 shadow-sm">
          <div className="inline-block px-2.5 py-1 rounded-md bg-red-50 text-red-700 text-xs font-bold uppercase tracking-wide mb-3">
            The Problem
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">Multi-Threat Confusion</h3>
          <p className="text-gray-600 leading-relaxed text-sm">
            Farmers face multiple crop problems at once — fungal diseases, water stress, pest pressure, and nutrient deficiencies.
            Standard scanners only identify a single disease without indicating which issue demands urgent intervention first.
          </p>
        </div>
        <div className="bg-white border border-emerald-100 rounded-2xl p-6 shadow-sm">
          <div className="inline-block px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wide mb-3">
            The Innovation & Solution
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-2">Dynamic Intervention Prioritization</h3>
          <p className="text-gray-600 leading-relaxed text-sm">
            AI Farm Guardian evaluates all concurrent threats simultaneously. A trained XGBoost Regressor factors in pathogen spread velocity,
            microclimate weather, crop stage, and potential yield loss to calculate a dynamic priority score (0–100) and rank actions by true urgency.
          </p>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-8">How It Works</h2>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm font-bold">
          {[
            { step: '1. SCAN', desc: 'Leaf Photo Upload' },
            { step: '2. DETECT', desc: 'Multi-Problem Analysis' },
            { step: '3. PRIORITIZE', desc: 'XGBoost Urgency Ranking' },
            { step: '4. PLAN', desc: 'Tailored Rescue Action' },
            { step: '5. PROTECT', desc: 'Track & Recover Yield' }
          ].map((item, i) => (
            <React.Fragment key={item.step}>
              <div className="px-4 py-2.5 rounded-xl bg-white border border-emerald-200 text-emerald-900 shadow-sm flex flex-col items-center">
                <span className="text-xs text-emerald-600 font-extrabold">{item.step}</span>
                <span className="text-[11px] text-gray-500 font-normal">{item.desc}</span>
              </div>
              {i < 4 && <ArrowRight className="w-4 h-4 text-emerald-400 hidden sm:block" />}
            </React.Fragment>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-10">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Core AI System Modules</h2>
        <p className="text-sm text-gray-500 text-center mb-10 max-w-xl mx-auto">
          Built for smart agronomy and decision support with explainable machine learning.
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center mb-4">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">{title}</h3>
              <p className="text-sm text-gray-600 mt-2 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-6 py-14 text-center">
        <div className="rounded-3xl bg-emerald-800 text-white py-12 px-8 shadow-lg">
          <h2 className="text-2xl sm:text-3xl font-extrabold">Start Protecting Your Crops with AI</h2>
          <p className="mt-2 text-emerald-100 max-w-xl mx-auto text-sm">
            Experience real-time disease detection, dynamic intervention prioritization, and automated rescue planning.
          </p>
          <Link to="/login" className="inline-flex mt-6 bg-white text-emerald-900 font-bold px-7 py-3.5 rounded-xl hover:bg-emerald-50 transition shadow">
            Sign In to Farm Dashboard 🌾
          </Link>
        </div>
      </section>

      <footer className="text-center text-xs text-gray-500 py-8 border-t border-gray-100 bg-white">
        AI Farm Guardian — Smart Crop Health Monitoring & Dynamic Intervention Prioritization System
      </footer>
    </div>
  )
}
