import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';

export default function CompetitorBenchmark({ currentBusiness, leadId }) {
  const [competitors, setCompetitors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data } = await base44.functions.invoke('searchGoogleBusiness', {
        searchQuery: searchQuery
      });
      
      if (data.success && data.results) {
        // Filter out current business
        const filtered = data.results.filter(r => r.place_id !== currentBusiness.place_id).slice(0, 3);
        setCompetitors(filtered);
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAnalyze = async () => {
    if (competitors.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      const competitorDetails = await Promise.all(
        competitors.map(c => 
          base44.functions.invoke('getGoogleBusinessDetails', { placeId: c.place_id })
            .then(res => res.data.business)
        )
      );

      const competitorScores = competitorDetails.map(c => ({
        name: c.name,
        health_score: c.health_score || calculateHealthScore(c),
        rating: c.rating,
        total_reviews: c.total_reviews,
        photos_count: c.photos_count,
        has_website: !!c.website,
        has_phone: !!c.phone,
        has_hours: c.has_hours
      }));

      const avgCompetitorScore = Math.round(
        competitorScores.reduce((sum, c) => sum + c.health_score, 0) / competitorScores.length
      );

      const currentScore = currentBusiness.health_score || 50;
      const gap = currentScore - avgCompetitorScore;

      setAnalysis({
        competitors: competitorScores,
        avgCompetitorScore,
        currentScore,
        gap,
        advantages: identifyAdvantages(currentBusiness, competitorScores),
        vulnerabilities: identifyVulnerabilities(currentBusiness, competitorScores)
      });

      // Log the analysis for admin
      await base44.entities.ConversionEvent.create({
        funnel_version: 'geenius',
        event_name: 'competitor_analysis_completed',
        lead_id: leadId,
        properties: {
          competitor_count: competitorScores.length,
          avg_competitor_score: avgCompetitorScore,
          score_gap: gap
        }
      }).catch(() => {});

    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateHealthScore = (business) => {
    const rating = business.rating || 0;
    const reviewCount = business.total_reviews || 0;
    const photosCount = business.photos_count || 0;
    
    const rScore = Math.min(25, ((rating * Math.log10(reviewCount + 1)) / (5 * Math.log10(201))) * 25);
    const vScore = Math.min(20, (photosCount / 10) * 20);
    let oScore = 0;
    if (business.has_website || business.website) oScore += 10;
    if (business.has_phone || business.phone) oScore += 10;
    if (business.has_hours) oScore += 10;
    
    return Math.round(25 + rScore + vScore + oScore);
  };

  const identifyAdvantages = (current, competitors) => {
    const advantages = [];
    const currentScore = current.health_score || calculateHealthScore(current);
    const avgRating = competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length;
    const avgReviews = competitors.reduce((sum, c) => sum + c.total_reviews, 0) / competitors.length;

    if (current.gmb_rating > avgRating + 0.3) {
      advantages.push(`Superior rating (${current.gmb_rating}★ vs ${avgRating.toFixed(1)}★ avg)`);
    }
    if (current.gmb_reviews_count > avgReviews * 1.2) {
      advantages.push(`More reviews (${current.gmb_reviews_count} vs ${Math.round(avgReviews)} avg)`);
    }
    if (currentScore > competitors[0]?.health_score) {
      advantages.push('Leading health score in comparison');
    }

    return advantages.length > 0 ? advantages : ['Building competitive position'];
  };

  const identifyVulnerabilities = (current, competitors) => {
    const vulnerabilities = [];
    const avgRating = competitors.reduce((sum, c) => sum + c.rating, 0) / competitors.length;
    const avgReviews = competitors.reduce((sum, c) => sum + c.total_reviews, 0) / competitors.length;
    const avgPhotos = competitors.reduce((sum, c) => sum + c.photos_count, 0) / competitors.length;

    if (current.gmb_rating < avgRating - 0.2) {
      vulnerabilities.push(`Rating below average (${current.gmb_rating}★ vs ${avgRating.toFixed(1)}★)`);
    }
    if (current.gmb_reviews_count < avgReviews * 0.7) {
      vulnerabilities.push(`Fewer reviews (${current.gmb_reviews_count} vs ${Math.round(avgReviews)} avg)`);
    }
    if (current.gmb_photos_count < avgPhotos * 0.6) {
      vulnerabilities.push(`Photo gap (${current.gmb_photos_count} vs ${Math.round(avgPhotos)} avg)`);
    }

    return vulnerabilities;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-12 p-8 rounded-3xl bg-gradient-to-br from-blue-600/15 via-indigo-600/10 to-purple-600/15 border-2 border-blue-500/40 backdrop-blur-sm"
    >
      <h3 className="text-2xl font-black text-white mb-4 flex items-center gap-3">
        <TrendingUp className="w-7 h-7 text-blue-400" />
        Competitor Benchmark Analysis
      </h3>
      <p className="text-gray-300 mb-6">
        See how your GMB performance stacks up against your top competitors and uncover opportunities to dominate your market.
      </p>

      {/* Search Competitors */}
      <div className="flex gap-3 mb-6">
        <Input
          placeholder="Search competitors (e.g., 'plumber brooklyn')"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-gray-900/50 border-gray-700 text-white"
        />
        <Button
          onClick={handleSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="bg-blue-600 hover:bg-blue-500"
        >
          {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </Button>
      </div>

      {/* Selected Competitors */}
      {competitors.length > 0 && (
        <div className="space-y-4 mb-6">
          <h4 className="text-white font-semibold">Selected Competitors ({competitors.length}/3)</h4>
          <div className="grid gap-3">
            {competitors.map((comp, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-900/50 p-4 rounded-xl border border-gray-700">
                <div>
                  <p className="text-white font-semibold">{comp.name}</p>
                  <p className="text-sm text-gray-400">{comp.rating}★ • {comp.user_ratings_total} reviews</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCompetitors(competitors.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-white"
                >
                  Remove
                </Button>
              </div>
            ))}
          </div>
          
          <Button
            onClick={handleAnalyze}
            disabled={isAnalyzing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                Analyze Competition
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}

      {/* Analysis Results */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Score Comparison */}
            <div className="bg-gray-900/70 p-6 rounded-2xl border border-gray-700">
              <h4 className="text-white font-bold mb-4">Health Score Comparison</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Your Score</p>
                  <p className="text-4xl font-black text-white">{analysis.currentScore}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Competitor Avg</p>
                  <p className="text-4xl font-black text-white">{analysis.avgCompetitorScore}</p>
                </div>
                <div className="text-center">
                  <p className="text-gray-400 text-sm mb-2">Gap</p>
                  <div className="flex items-center justify-center gap-2">
                    <p className={`text-4xl font-black ${analysis.gap >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {analysis.gap > 0 ? '+' : ''}{analysis.gap}
                    </p>
                    {analysis.gap >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-400" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Competitor Details */}
              <div className="mt-6 space-y-3">
                {analysis.competitors.map((comp, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl">
                    <div>
                      <p className="text-white font-semibold">{comp.name}</p>
                      <p className="text-sm text-gray-400">
                        {comp.rating}★ • {comp.total_reviews} reviews • {comp.photos_count} photos
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-white">{comp.health_score}</p>
                      <p className="text-xs text-gray-400">Health Score</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Competitive Advantages */}
            {analysis.advantages.length > 0 && (
              <div className="bg-green-900/20 border border-green-500/30 p-6 rounded-2xl">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  Your Competitive Advantages
                </h4>
                <ul className="space-y-2">
                  {analysis.advantages.map((adv, idx) => (
                    <li key={idx} className="text-green-300 flex items-start gap-2">
                      <span className="text-green-400 mt-1">✓</span>
                      {adv}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Vulnerabilities */}
            {analysis.vulnerabilities.length > 0 && (
              <div className="bg-red-900/20 border border-red-500/30 p-6 rounded-2xl">
                <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  Areas for Improvement
                </h4>
                <ul className="space-y-2">
                  {analysis.vulnerabilities.map((vuln, idx) => (
                    <li key={idx} className="text-red-300 flex items-start gap-2">
                      <span className="text-red-400 mt-1">⚠</span>
                      {vuln}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}