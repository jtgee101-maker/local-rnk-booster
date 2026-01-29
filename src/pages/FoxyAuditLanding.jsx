import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { 
  MapPin, TrendingUp, DollarSign, Clock, CheckCircle, 
  AlertTriangle, Star, Users, Eye, Target, Zap, ArrowRight,
  Shield, TrendingDown, PhoneCall, MessageSquare
} from 'lucide-react';

export default function FoxyAuditLanding() {
  const [activeTestimonial, setActiveTestimonial] = useState(0);
  const [viewersCount, setViewersCount] = useState(127);
  const { scrollY } = useScroll();
  const headerOpacity = useTransform(scrollY, [0, 200], [1, 0.8]);

  useEffect(() => {
    const interval = setInterval(() => {
      setViewersCount(prev => Math.floor(Math.random() * 30) + 110);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial(prev => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const painPoints = [
    {
      icon: TrendingDown,
      stat: "73%",
      problem: "Lost in Google Maps",
      description: "Your business doesn't show up when customers search nearby"
    },
    {
      icon: PhoneCall,
      stat: "$2,847",
      problem: "Monthly Revenue Leak",
      description: "Calls going to competitors because they outrank you"
    },
    {
      icon: Eye,
      stat: "1,200+",
      problem: "Invisible to Local Searches",
      description: "Customers per month who never find your business"
    },
    {
      icon: AlertTriangle,
      stat: "47%",
      problem: "Profile Optimization Gap",
      description: "Critical GMB elements missing or outdated"
    }
  ];

  const benefits = [
    {
      icon: Target,
      title: "Pinpoint Weak Zones",
      description: "See exactly which neighborhoods can't find you on Google Maps",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: DollarSign,
      title: "Revenue Leak Calculator",
      description: "Discover how much money you're losing every month to competitors",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: MapPin,
      title: "Geographic Heatmap",
      description: "Interactive map showing your visibility across your entire service area",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: TrendingUp,
      title: "Competitor Battle Card",
      description: "See how you stack up against top 3 local competitors in real-time",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: Zap,
      title: "AI-Powered Insights",
      description: "Foxy AI analyzes 47+ ranking factors to create your custom action plan",
      color: "from-yellow-500 to-amber-500"
    },
    {
      icon: CheckCircle,
      title: "90-Day Domination Roadmap",
      description: "Step-by-step plan to dominate your local market rankings",
      color: "from-indigo-500 to-purple-500"
    }
  ];

  const testimonials = [
    {
      name: "Mike Rodriguez",
      business: "Rodriguez Plumbing",
      location: "Austin, TX",
      rating: 5,
      text: "Went from invisible to #1 in my area in just 6 weeks. Calls tripled!",
      result: "+287% Calls",
      image: "🔧"
    },
    {
      name: "Sarah Chen",
      business: "Elite Dental Care",
      location: "Seattle, WA",
      rating: 5,
      text: "The heatmap showed me blind spots I never knew existed. Game changer.",
      result: "+$12K Monthly",
      image: "🦷"
    },
    {
      name: "James Wilson",
      business: "Wilson HVAC",
      location: "Phoenix, AZ",
      rating: 5,
      text: "Finally beating the big franchise competitors. ROI was 8x in first month.",
      result: "+450% ROI",
      image: "❄️"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Businesses Analyzed" },
    { number: "94%", label: "See Ranking Improvements" },
    { number: "$2.4M+", label: "Revenue Recovered" },
    { number: "4.9/5", label: "Average Rating" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0f] via-[#0f0f1a] to-[#0a0a0f] text-white overflow-hidden">
      {/* Floating Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.06, 0.03],
            rotate: [0, 180, 360]
          }}
          transition={{ duration: 20, repeat: Infinity }}
          className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#c8ff00] rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.03, 0.06, 0.03],
            rotate: [360, 180, 0]
          }}
          transition={{ duration: 25, repeat: Infinity }}
          className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-purple-500 rounded-full blur-[120px]"
        />
      </div>

      {/* Sticky Top Bar */}
      <motion.div 
        style={{ opacity: headerOpacity }}
        className="sticky top-0 z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-gray-800/50"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#c8ff00]" />
            <span className="text-[#c8ff00] font-bold text-lg">
              LocalRank<span className="text-white">.ai</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="text-gray-300">{viewersCount} viewing now</span>
            </div>
            <Button 
              onClick={() => window.location.href = createPageUrl('QuizGeeniusV2')}
              className="bg-[#c8ff00] hover:bg-[#b8ef00] text-gray-900 font-bold"
            >
              Get Free Audit
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Hero Section */}
      <section className="relative pt-16 pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-16"
          >
            {/* Urgency Badge */}
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 rounded-full px-4 py-2 mb-6"
            >
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <span className="text-red-300 text-sm font-semibold">
                You're Losing Money Right Now While Reading This
              </span>
            </motion.div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-black mb-6 leading-tight">
              Discover Why <span className="text-[#c8ff00]">73%</span> of Your<br />
              Local Customers <span className="text-red-400">Can't Find You</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
              Free AI-Powered Audit Reveals Your Exact Geographic "Blind Spots" 
              and Shows You <span className="text-[#c8ff00] font-bold">How Much Revenue You're Bleeding</span> to Competitors Every Month
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button
                onClick={() => window.location.href = createPageUrl('QuizGeeniusV2')}
                className="bg-[#c8ff00] hover:bg-[#b8ef00] text-gray-900 font-black text-lg px-8 py-7 rounded-xl shadow-2xl shadow-[#c8ff00]/20 transform hover:scale-105 transition-all"
              >
                <Zap className="w-5 h-5 mr-2" />
                Get My Free Foxy Audit Now
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span>Results in 60 Seconds</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-400" />
                <span>100% Free Forever</span>
              </div>
            </div>

            {/* Foxy Mascot Hero */}
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="mt-12 relative"
            >
              <div className="relative inline-block">
                <motion.div 
                  className="absolute inset-0 bg-[#c8ff00] rounded-full blur-3xl opacity-50"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.7, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/2f56189cf_Gemini_Generated_Image_yyfn0byyfn0byyfn-removebg-preview.png"
                  alt="Foxy AI Sniffer"
                  className="w-48 h-48 sm:w-64 sm:h-64 object-contain relative z-10"
                  style={{ filter: 'drop-shadow(0 0 30px rgba(200, 255, 0, 0.9))' }}
                />
              </div>
              <p className="text-gray-300 mt-4 text-lg">
                👋 Meet Foxy - Your AI Local SEO Detective
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Pain Points Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-gray-900/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-red-500/20 border-red-500/50 text-red-300 px-4 py-2 mb-4">
              The Hidden Problem
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              Your Google Business Profile is <span className="text-red-400">Quietly Killing</span> Your Revenue
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Most local businesses have no idea they're invisible in 70%+ of their service area
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((pain, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-red-500/10 via-gray-900 to-gray-900 border-2 border-red-500/30 p-6 h-full hover:border-red-500/60 transition-all">
                  <pain.icon className="w-12 h-12 text-red-400 mb-4" />
                  <div className="text-4xl font-black text-red-400 mb-2">{pain.stat}</div>
                  <h3 className="text-white font-bold text-lg mb-2">{pain.problem}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{pain.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Industries We Serve Section */}
      <section className="py-20 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-[#c8ff00]/20 border-[#c8ff00]/50 text-[#c8ff00] px-4 py-2 mb-4">
              Industries We Dominate
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              <span className="text-[#c8ff00]">Every Industry.</span> Every Neighborhood.<br />
              <span className="text-white">Foxy Knows Your Business.</span>
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              From contractors to chiropractors, Foxy's trained to optimize visibility for your exact industry
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {[
              {
                name: "Contractors",
                img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/5621d14f6_image_4a6827e0-cd50-4185-bab5-fa7ecf3a2086-removebg-preview.png",
                color: "from-yellow-500 to-orange-500"
              },
              {
                name: "HVAC",
                img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/6e955e2a0_image_029b4f8a-3246-40dd-9195-7399d4682f28-removebg-preview.png",
                color: "from-blue-500 to-cyan-500"
              },
              {
                name: "Dentists",
                img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/14f08c7c1_image_b889927d-b8d1-4989-a178-a45db30b245a-removebg-preview.png",
                color: "from-teal-500 to-emerald-500"
              },
              {
                name: "Roofers",
                img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/d299082f2_image_e83e280e-f84a-465e-9658-b91853417110-removebg-preview.png",
                color: "from-orange-500 to-red-500"
              },
              {
                name: "Plumbers",
                img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/e0ae33ab6_image_1fa11bf0-524b-4495-8f41-041627a503bd-removebg-preview.png",
                color: "from-blue-600 to-indigo-600"
              },
              {
                name: "Auto Repair",
                img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/406283c2b_image_66e859df-3f63-4464-9522-a65fc0b499f9-removebg-preview.png",
                color: "from-gray-600 to-gray-800"
              },
              {
                name: "Landscaping",
                img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/d42bd0bf5_image_fcc179d7-2946-4786-8889-8798b0547c14-removebg-preview.png",
                color: "from-green-500 to-lime-500"
              },
              {
                name: "Chiropractors",
                img: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/a92f5eaa6_image_e1e92fb4-0cac-4502-aab2-7966804f71ca-removebg-preview.png",
                color: "from-purple-500 to-pink-500"
              }
            ].map((industry, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.05 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="group"
              >
                <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-gray-700 hover:border-[#c8ff00]/50 p-6 text-center transition-all h-full">
                  <div className="relative mb-4">
                    <motion.div 
                      className={`absolute inset-0 bg-gradient-to-r ${industry.color} rounded-full blur-2xl opacity-0 group-hover:opacity-40`}
                      transition={{ duration: 0.3 }}
                    />
                    <img
                      src={industry.img}
                      alt={industry.name}
                      className="w-32 h-32 mx-auto object-contain relative z-10 group-hover:scale-110 transition-transform duration-300"
                      style={{ filter: 'drop-shadow(0 0 15px rgba(200, 255, 0, 0.5))' }}
                    />
                  </div>
                  <h3 className="text-white font-bold text-lg group-hover:text-[#c8ff00] transition-colors">
                    {industry.name}
                  </h3>
                </Card>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-gray-300 text-lg mb-6">
              <span className="text-[#c8ff00] font-bold">Plus 100+ more industries</span> including electricians, lawyers, restaurants, retail, and more
            </p>
            <Button
              onClick={() => window.location.href = createPageUrl('QuizGeeniusV2')}
              variant="outline"
              className="border-3 border-[#c8ff00] text-[#c8ff00] hover:bg-[#c8ff00] hover:text-gray-900 font-black text-xl px-10 py-6 rounded-xl shadow-xl shadow-[#c8ff00]/20 transform hover:scale-105 transition-all"
            >
              <Target className="w-6 h-6 mr-2" />
              See If We Serve Your Industry
              <ArrowRight className="w-6 h-6 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* What You Get Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-[#c8ff00]/20 border-[#c8ff00]/50 text-[#c8ff00] px-4 py-2 mb-4">
              What's Included (100% Free)
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              Your Complete <span className="text-[#c8ff00]">Local Visibility</span> X-Ray
            </h2>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Foxy AI analyzes 47+ ranking factors in 60 seconds to create your custom diagnosis
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {benefits.map((benefit, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 border-2 border-gray-700 p-6 h-full hover:border-[#c8ff00]/50 transition-all group">
                  <div className={`w-14 h-14 bg-gradient-to-r ${benefit.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <benefit.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-xl mb-2">{benefit.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{benefit.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <Button
              onClick={() => window.location.href = createPageUrl('QuizGeeniusV2')}
              className="bg-[#c8ff00] hover:bg-[#b8ef00] text-gray-900 font-black text-lg px-10 py-7 rounded-xl shadow-2xl shadow-[#c8ff00]/20 transform hover:scale-105 transition-all"
            >
              Start My Free Foxy Audit
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <p className="text-gray-400 text-sm mt-4">
              ⚡ Takes only 60 seconds • No credit card needed
            </p>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-transparent via-gray-900/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="bg-green-500/20 border-green-500/50 text-green-300 px-4 py-2 mb-4">
              Trusted by Thousands
            </Badge>
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              Real Results from <span className="text-[#c8ff00]">Real Businesses</span>
            </h2>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center"
              >
                <div className="text-5xl font-black text-[#c8ff00] mb-2">{stat.number}</div>
                <div className="text-gray-300 font-medium">{stat.label}</div>
              </motion.div>
            ))}
          </div>

          {/* Testimonial Carousel */}
          <div className="relative max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-2 border-gray-700 p-8">
              {testimonials.map((testimonial, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: activeTestimonial === idx ? 1 : 0 }}
                  className={activeTestimonial === idx ? 'block' : 'hidden'}
                >
                  <div className="flex items-center gap-4 mb-6">
                    <div className="text-5xl">{testimonial.image}</div>
                    <div>
                      <div className="flex items-center gap-1 mb-1">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <h4 className="text-white font-bold text-xl">{testimonial.name}</h4>
                      <p className="text-gray-400 text-sm">
                        {testimonial.business} • {testimonial.location}
                      </p>
                    </div>
                    <Badge className="ml-auto bg-green-500 text-white font-bold px-4 py-2">
                      {testimonial.result}
                    </Badge>
                  </div>
                  <p className="text-gray-200 text-lg leading-relaxed italic">
                    "{testimonial.text}"
                  </p>
                </motion.div>
              ))}
              
              {/* Carousel Indicators */}
              <div className="flex items-center justify-center gap-2 mt-6">
                {testimonials.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveTestimonial(idx)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      activeTestimonial === idx ? 'bg-[#c8ff00] w-8' : 'bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Objection Crusher */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-4xl sm:text-5xl font-black mb-6">
              Why This is <span className="text-[#c8ff00]">Different</span> From Everything Else
            </h2>
          </motion.div>

          <div className="space-y-4">
            {[
              {
                question: "Is this really free?",
                answer: "Yes, 100% free. No credit card, no trial, no catch. We built this to help local businesses discover the hidden money they're leaving on the table."
              },
              {
                question: "How long does it take?",
                answer: "60 seconds. Just enter your business name and Foxy does the rest. You'll get your complete audit instantly."
              },
              {
                question: "Will this work for my industry?",
                answer: "If you serve local customers and have a Google Business Profile, yes. We've helped plumbers, dentists, lawyers, contractors, and 100+ other industries."
              },
              {
                question: "What makes Foxy AI different?",
                answer: "Traditional GMB tools show surface-level metrics. Foxy actually tests your visibility from 20+ locations in your service area, analyzes 47 ranking factors, and calculates your exact revenue leak."
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="bg-gradient-to-r from-gray-900 to-gray-800 border-2 border-gray-700 p-6 hover:border-[#c8ff00]/50 transition-all">
                  <h3 className="text-[#c8ff00] font-bold text-lg mb-2">{item.question}</h3>
                  <p className="text-gray-300 leading-relaxed">{item.answer}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 px-4">
        <div className="max-w-5xl mx-auto">
          <Card className="bg-gradient-to-br from-[#c8ff00]/10 via-gray-900 to-purple-500/10 border-4 border-[#c8ff00]/30 p-12">
            <div className="text-center">
              <div className="relative inline-block">
                <motion.div 
                  className="absolute inset-0 bg-[#c8ff00] rounded-full blur-3xl opacity-50"
                  animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.7, 0.5] }}
                  transition={{ duration: 3, repeat: Infinity }}
                />
                <motion.img
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696d57cd4797fbebf0798aa4/a834b4d7d_image_d204ca79-7fa0-4451-958c-8c77d8c6c16f-removebg-preview.png"
                  alt="Foxy Celebrating"
                  className="w-48 h-48 mx-auto mb-6 object-contain relative z-10"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  style={{ filter: 'drop-shadow(0 0 30px rgba(200, 255, 0, 0.9))' }}
                />
              </div>
              
              <h2 className="text-4xl sm:text-5xl font-black mb-6 bg-gradient-to-r from-[#c8ff00] via-[#d4ff33] to-[#c8ff00] bg-clip-text text-transparent drop-shadow-[0_0_25px_rgba(200,255,0,0.5)]">
                Ready to Stop <span className="text-red-400 font-extrabold drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]">Bleeding Revenue?</span>
              </h2>
              
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto leading-relaxed">
                Every minute you wait, customers are choosing your competitors. 
                Let Foxy show you <span className="text-[#c8ff00] font-bold">exactly</span> where you're losing them.
              </p>

              <Button
                onClick={() => window.location.href = createPageUrl('QuizGeeniusV2')}
                className="bg-[#c8ff00] hover:bg-[#b8ef00] text-gray-900 font-black text-xl px-12 py-8 rounded-xl shadow-2xl shadow-[#c8ff00]/30 transform hover:scale-105 transition-all"
              >
                <Zap className="w-6 h-6 mr-2" />
                Get My Free Foxy Audit Now
                <ArrowRight className="w-6 h-6 ml-2" />
              </Button>

              <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>100% Free Forever</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-400" />
                  <span>60 Second Setup</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-400" />
                  <span>No Credit Card</span>
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-gray-700">
                <p className="text-gray-400 text-sm">
                  Join 10,000+ local businesses who discovered their hidden revenue leaks with Foxy
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Trust Footer */}
      <section className="py-12 px-4 border-t border-gray-800">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex flex-wrap items-center justify-center gap-8 text-gray-500 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>10,000+ Businesses Trust Us</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4" />
              <span>4.9/5 Average Rating</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}