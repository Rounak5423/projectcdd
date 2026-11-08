import React from 'react';
import { motion } from 'framer-motion';
import {
  Coins,
  Shield,
  Sparkles,
  Award,
  Scroll,
  ArrowRight,
  FlaskConical,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { CivoraEmblem } from '../brand/CivoraLogo';

export default function ResearchEconomy() {
  const progressionSteps = [
    { step: '01', title: 'BUILD', desc: 'Erect timber mills, aqueducts, foundries and research academies.' },
    { step: '02', title: 'DEVELOP', desc: 'Expand citizen literacy, boost tax revenue and maintain social harmony.' },
    { step: '03', title: 'DISCOVER', desc: 'Formulate technological breakthroughs in physics, medicine and ethics.' },
    { step: '04', title: 'EARN', desc: 'Mint Civora Research Credits (CRC) from verified municipal milestones.' },
    { step: '05', title: 'EXPERIMENT', desc: 'Fund high-consequence social hypotheses in the Research Observatory.' },
    { step: '06', title: 'EVOLVE', desc: 'Transition your civilisation into uncharted historical and cognitive epochs.' },
  ];

  const ledgerEntries = [
    {
      ref: 'LEX-401',
      achievement: 'Hydro-Mechanical Mastery',
      category: 'Infrastructure Milestone',
      credits: '+350 CRC',
      date: 'Epoch Year 142',
      seal: 'Imperial Seal of Engineering',
    },
    {
      ref: 'LEX-402',
      achievement: 'The Great Scholastic Concord',
      category: 'Education Charter',
      credits: '+500 CRC',
      date: 'Epoch Year 180',
      seal: 'Philosophical Curia Gold Seal',
    },
    {
      ref: 'LEX-403',
      achievement: 'Zero-Infant Mortality Sanatoriums',
      category: 'Public Health Breakthrough',
      credits: '+400 CRC',
      date: 'Epoch Year 215',
      seal: 'Asclepian Order Seal',
    },
  ];

  return (
    <section
      id="research"
      className="relative py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto select-none"
    >
      {/* Historical Ledger Header */}
      <div className="text-center space-y-3 mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#16221a] border border-[#c5a66a]/40 text-[#c5a66a] text-[10px] font-mono tracking-widest uppercase">
          <CivoraEmblem size={16} />
          <span>CIVORA RESEARCH ECONOMY (CRC)</span>
        </div>

        <h2
          className="text-3xl sm:text-4xl lg:text-5xl font-serif font-black tracking-[0.16em] uppercase text-transparent bg-clip-text bg-gradient-to-b from-[#faecd0] via-[#c5a66a] to-[#8c6e33]"
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          KNOWLEDGE MUST BE EARNED.
        </h2>

        <p
          className="text-base sm:text-lg font-serif italic text-[#d8cbaa] max-w-2xl mx-auto"
          style={{ fontFamily: "'Cormorant Garamond', serif" }}
        >
          No technology is gifted by chance. In CIVORA, Civora Research Credits are forged through genuine municipal
          achievement, economic resilience, and societal enlightenment.
        </p>

        <div className="w-24 h-0.5 mx-auto bg-gradient-to-r from-transparent via-[#c5a66a] to-transparent mt-4" />
      </div>

      {/* Progression Loop Diagram */}
      <div className="mb-16">
        <span className="text-[10px] font-mono uppercase tracking-widest text-[#c5a66a] block text-center mb-6">
          THE CONTINUOUS DISCOVERY PARADIGM
        </span>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {progressionSteps.map((s, idx) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="p-4 rounded-xl bg-[#131d16] border border-[#c5a66a]/30 relative overflow-hidden flex flex-col justify-between"
            >
              <span className="text-xs font-mono font-bold text-[#8c6e33]">{s.step}</span>
              <div className="my-2">
                <h4
                  className="text-sm font-serif font-bold text-[#faecd0] tracking-wider uppercase"
                  style={{ fontFamily: "'Cinzel', serif" }}
                >
                  {s.title}
                </h4>
                <p
                  className="text-[11px] font-serif text-[#d8cbaa] leading-snug mt-1"
                  style={{ fontFamily: "'Cormorant Garamond', serif" }}
                >
                  {s.desc}
                </p>
              </div>
              <div className="w-full h-0.5 bg-gradient-to-r from-[#c5a66a]/40 to-transparent mt-2" />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Historical Parchment Research Ledger */}
      <div className="p-6 sm:p-10 lg:p-12 rounded-3xl bg-gradient-to-br from-[#18231c] via-[#121c16] to-[#0c140f] border-2 border-[#c5a66a]/40 shadow-2xl relative overflow-hidden">
        {/* Background Archival Seal */}
        <div className="absolute top-6 right-6 opacity-5 pointer-events-none">
          <CivoraEmblem size={240} />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-8 border-b border-[#2d3a2e] relative z-10">
          <div>
            <div className="flex items-center gap-2 text-[#dfb74a]">
              <Scroll size={20} />
              <span
                className="text-xs font-serif font-bold tracking-widest uppercase"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                IMPERIAL RESEARCH LEDGER & AUDIT
              </span>
            </div>
            <h3
              className="text-2xl sm:text-3xl font-serif font-bold text-[#faecd0] mt-1"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Authenticated Civora Research Credits (CRC)
            </h3>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#0a110c]/80 border border-[#8c6e33] backdrop-blur-md">
            <Coins size={28} className="text-[#dfb74a]" />
            <div>
              <span className="text-[10px] font-mono text-[#77786d] uppercase block">
                TOTAL EMPIRE BALANCE
              </span>
              <span className="text-2xl font-mono font-black text-[#faecd0]">
                1,250 <span className="text-sm text-[#c5a66a]">CRC</span>
              </span>
            </div>
          </div>
        </div>

        {/* Ledger Rows */}
        <div className="space-y-4 pt-8 relative z-10">
          {ledgerEntries.map((entry) => (
            <div
              key={entry.ref}
              className="p-4 sm:p-5 rounded-xl bg-[#0e1611]/85 border border-[#2d3b2e] hover:border-[#c5a66a]/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-start sm:items-center gap-4">
                <span className="text-xs font-mono font-bold text-[#8c6e33] px-2 py-1 rounded bg-black/40 border border-[#2d3a2e]">
                  {entry.ref}
                </span>

                <div>
                  <h4
                    className="text-sm sm:text-base font-serif font-bold text-[#faecd0]"
                    style={{ fontFamily: "'Cinzel', serif" }}
                  >
                    {entry.achievement}
                  </h4>
                  <p className="text-xs text-[#77786d] font-mono mt-0.5">
                    {entry.category} • {entry.date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 self-end sm:self-auto">
                <span className="text-[10px] font-serif text-[#d8cbaa] hidden md:inline">
                  {entry.seal}
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-[#223023] border border-[#dfb74a] text-sm font-mono font-bold text-[#faecd0] shadow-sm">
                  {entry.credits}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

