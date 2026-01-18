import React from 'react';
import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: "Michael Rodriguez",
    business: "Rodriguez HVAC Services",
    rating: 5,
    text: "I never imagined my business appearing on the first page of Maps. This audit showed me exactly what was wrong, and the fix was instant!",
    result: "Went from page 4 to Top 3 in 18 days"
  },
  {
    name: "Sarah Chen",
    business: "Downtown Dental Clinic",
    rating: 5,
    text: "The competitor analysis was eye-opening. We were making 3 critical mistakes that were handing customers to our competition.",
    result: "+247% profile views in first month"
  },
  {
    name: "James Patterson",
    business: "Patterson Law Firm",
    rating: 5,
    text: "Best $40 I've ever spent on marketing. The monthly protection keeps us at #1 while I focus on clients.",
    result: "62% increase in phone calls"
  },
  {
    name: "Maria Gonzalez",
    business: "Bella's Boutique",
    rating: 5,
    text: "The daily price made it a no-brainer. For less than a coffee, I'm now dominating local search in my area.",
    result: "3x more foot traffic from Maps"
  }
];

export default function TrustSection() {
  return (
    <div className="py-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-4">
            <Star className="w-4 h-4 text-[#c8ff00] fill-[#c8ff00]" />
            <span className="text-[#c8ff00] font-semibold text-sm">7+ Million Audits Completed</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Join 7 Million Business Owners Who Found Their Story on Google
          </h2>
          <p className="text-gray-400 text-lg">
            Real businesses, real results, real rankings
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-900/50 backdrop-blur border border-gray-800 rounded-2xl p-6 hover:border-[#c8ff00]/30 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-1">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-[#c8ff00] fill-[#c8ff00]" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-[#c8ff00]/20" />
              </div>

              <p className="text-gray-300 mb-4 leading-relaxed">
                "{testimonial.text}"
              </p>

              <div className="pt-4 border-t border-gray-800">
                <p className="font-semibold text-white">{testimonial.name}</p>
                <p className="text-sm text-gray-500 mb-2">{testimonial.business}</p>
                <div className="inline-block bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-lg px-3 py-1">
                  <p className="text-[#c8ff00] text-xs font-semibold">{testimonial.result}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}