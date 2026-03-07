import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Phone, Globe, MapPin, Eye, Star, ArrowUpRight } from 'lucide-react';

const caseStudies = [
  {
    name: "S&S Junk Removal",
    duration: "3 Months",
    metrics: [
      { label: "Phone Calls", before: 64, after: 81, icon: Phone },
      { label: "Website Clicks", before: 24, after: 41, icon: Globe },
      { label: "Direction Requests", before: 29, after: 33, icon: MapPin },
      { label: "Maps Views", before: 1115, after: 1337, icon: Eye }
    ],
    keywords: [
      { term: "Junk Removal Near Me", rank: "2.09", coverage: "100%" },
      { term: "Junk Hauling Service", rank: "2.29", coverage: "100%" },
      { term: "Trash Pickup Company", rank: "1.67", coverage: "100%" }
    ],
    testimonial: "Working with GeeNius Ecosystems has been a game-changer for us. Our phones are ringing more than ever, and we're getting found exactly when people are searching for junk removal.",
    gradient: "from-green-600/15 via-emerald-600/10 to-green-600/15"
  },
  {
    name: "AquaFlush Plumbing",
    duration: "Since Nov 7th",
    metrics: [
      { label: "Phone Calls", before: 112, after: 193, icon: Phone },
      { label: "Website Clicks", before: 13, after: 30, icon: Globe },
      { label: "Direction Requests", before: 47, after: 63, icon: MapPin },
      { label: "Maps Views", before: 3344, after: 3773, icon: Eye }
    ],
    keywords: [
      { term: "Drain Cleaning Service", growth: "+108.83%" },
      { term: "Toilet Repair", growth: "+61.15%" },
      { term: "Plumber Near Me", growth: "+46.85%" }
    ],
    testimonial: "We're getting more calls than ever before — our Google profile is finally working for us. GeeNius Ecosystem didn't just promise results; they delivered in record time.",
    gradient: "from-blue-600/15 via-cyan-600/10 to-blue-600/15"
  },
  {
    name: "The Feel Good Store",
    duration: "Since September",
    metrics: [
      { label: "Phone Calls", before: 121, after: 195, icon: Phone },
      { label: "Website Clicks", before: 366, after: 472, icon: Globe },
      { label: "Direction Requests", before: 278, after: 381, icon: MapPin },
      { label: "Search Visibility", growth: "+24%", icon: TrendingUp }
    ],
    testimonial: "Our store is now showing up for every keyword we care about — from THCA to pre-rolls. We've seen a huge uptick in foot traffic and calls.",
    gradient: "from-purple-600/15 via-pink-600/10 to-purple-600/15"
  },
  {
    name: "The Pipefather Plumbing",
    duration: "Growth Domination System",
    metrics: [
      { label: "Phone Calls", before: 193, after: 282, icon: Phone },
      { label: "Direction Requests", before: 110, after: 186, icon: MapPin },
      { label: "Website Clicks", before: 484, after: 704, icon: Globe },
      { label: "Search Visibility", growth: "+24%", icon: TrendingUp }
    ],
    testimonial: "Before working with GeeNius, we were buried under competitors on Google. Within just a few months, we started getting more calls and became the go-to plumber in our area.",
    gradient: "from-orange-600/15 via-red-600/10 to-orange-600/15"
  },
  {
    name: "Superior Water Restoration",
    duration: "Since May",
    metrics: [
      { label: "Phone Calls", before: 152, after: 233, icon: Phone },
      { label: "Website Clicks", before: 628, after: 823, icon: Globe },
      { label: "Direction Requests", before: 408, after: 497, icon: MapPin },
      { label: "Search Visibility", growth: "+34%", icon: TrendingUp }
    ],
    testimonial: "We delivered exactly what we needed — more local leads and higher map rankings. Our phones are ringing more than ever. Total game changer.",
    gradient: "from-teal-600/15 via-cyan-600/10 to-teal-600/15"
  },
  {
    name: "Anchored Cannabis Co",
    duration: "Since May",
    metrics: [
      { label: "Phone Calls", before: 219, after: 295, icon: Phone },
      { label: "Direction Requests", before: 367, after: 663, icon: MapPin },
      { label: "Maps Views", before: 3128, after: 4191, icon: Eye },
      { label: "Search Views", growth: "+92%", icon: TrendingUp }
    ],
    testimonial: "Even with premium products and incredible in-store experience, our online visibility wasn't keeping up. That changed completely with GeeNius.",
    gradient: "from-indigo-600/15 via-violet-600/10 to-indigo-600/15"
  }
];

export default function CaseStudiesShowcase() {
  const calculateGrowth = (before, after) => {
    if (!before || !after) return null;
    const growth = ((after - before) / before) * 100;
    return Math.round(growth);
  };

  return (
    <div className="mt-16 space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-12"
      >
        <h2 className="text-3xl sm:text-4xl font-black text-white mb-4">
          Real Results from Real Businesses
        </h2>
        <p className="text-gray-400 text-lg max-w-2xl mx-auto">
          See how businesses like yours transformed their local visibility and drove measurable growth in just months.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {caseStudies.map((study, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`p-8 rounded-3xl bg-gradient-to-br ${study.gradient} border-2 border-white/10 backdrop-blur-sm`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-2xl font-black text-white mb-2">{study.name}</h3>
                <p className="text-sm text-gray-400">{study.duration}</p>
              </div>
              <div className="bg-white/10 p-3 rounded-xl">
                <Star className="w-6 h-6 text-yellow-400" />
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              {study.metrics.map((metric, midx) => {
                const Icon = metric.icon;
                const growth = metric.growth || (metric.before && metric.after ? calculateGrowth(metric.before, metric.after) : null);
                
                return (
                  <div key={midx} className="bg-white/5 p-4 rounded-xl border border-white/10">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className="w-4 h-4 text-gray-400" />
                      <p className="text-xs text-gray-400">{metric.label}</p>
                    </div>
                    {metric.before && metric.after ? (
                      <div className="space-y-1">
                        <p className="text-2xl font-bold text-white">{metric.after.toLocaleString()}</p>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-gray-500">{metric.before.toLocaleString()}</p>
                          {growth && (
                            <span className="text-xs font-semibold text-green-400 flex items-center gap-1">
                              <ArrowUpRight className="w-3 h-3" />
                              {growth}%
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <p className="text-2xl font-bold text-green-400">{metric.growth}</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Keywords (if available) */}
            {study.keywords && study.keywords.length > 0 && (
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-6">
                <p className="text-xs text-gray-400 mb-3">Top Keywords</p>
                <div className="space-y-2">
                  {study.keywords.slice(0, 3).map((kw, kidx) => (
                    <div key={kidx} className="flex items-center justify-between">
                      <p className="text-sm text-white">{kw.term}</p>
                      <p className="text-sm font-semibold text-green-400">
                        {kw.rank ? `#${kw.rank}` : kw.growth}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Testimonial */}
            <div className="bg-white/5 p-5 rounded-xl border border-white/10">
              <p className="text-sm text-gray-300 italic leading-relaxed">
                "{study.testimonial}"
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="text-center mt-12 p-8 rounded-3xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/40"
      >
        <h3 className="text-2xl font-black text-white mb-3">
          Ready to Join Them?
        </h3>
        <p className="text-gray-300 mb-6 max-w-xl mx-auto">
          These businesses aren't special — they just took action. Your competitors are growing right now. Don't get left behind.
        </p>
        {onViewPathways && (
          <motion.button
            onClick={onViewPathways}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center gap-3 px-10 py-4 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-lg transition-all shadow-lg shadow-purple-500/30 hover:shadow-2xl hover:shadow-purple-500/50 active:scale-95"
          >
            View My Pathways →
          </motion.button>
        )}
      </motion.div>
    </div>
  );
}