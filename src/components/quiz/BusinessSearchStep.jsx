import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Star, Building2, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useDebounce, sessionCache } from '@/components/utils/performanceHooks';

export default function BusinessSearchStep({ onSelect, isLoading: parentLoading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(() => sessionCache.get('search_results') || []);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (query) => {
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    setSearchResults([]);
    setSelectedBusiness(null);
    setBusinessDetails(null);
    setHasSearched(true);

    try {
      const response = await base44.functions.invoke('searchGoogleBusiness', {
        searchQuery: query
      });

      if (response.data.success && response.data.results.length > 0) {
        setSearchResults(response.data.results);
        sessionCache.set('search_results', response.data.results);
        
        base44.analytics.track({ 
          eventName: 'business_search_results', 
          properties: { results_count: response.data.results.length } 
        });
      } else {
        setSearchResults([]);
        base44.analytics.track({ 
          eventName: 'business_search_no_results', 
          properties: { query: query } 
        });
      }
    } catch (error) {
      console.error('Error searching business:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, [isSearching]);
  
  // Debounced search for better performance
  const debouncedSearch = useDebounce(performSearch, 800);

  const handleSearch = (e) => {
    e.preventDefault();
    base44.analytics.track({ 
      eventName: 'business_search_initiated', 
      properties: { query_length: searchQuery.length } 
    });
    performSearch(searchQuery);
  };

  // Manual search only - no auto-search to prevent loops
  const handleInputChange = (e) => {
    setSearchQuery(e.target.value);
    setHasSearched(false);
    setSearchResults([]);
  };

  const handleSelectBusiness = useCallback(async (business) => {
    if (isLoadingDetails) return; // Prevent double-clicks
    
    base44.analytics.track({ 
      eventName: 'business_selected', 
      properties: { business_name: business.name } 
    });
    
    setSelectedBusiness(business);
    setIsLoadingDetails(true);

    try {
      const response = await base44.functions.invoke('getGoogleBusinessDetails', {
        placeId: business.place_id
      });

      if (response?.data?.success && response?.data?.business) {
        setBusinessDetails(response.data.business);
      } else {
        throw new Error('Invalid response');
      }
    } catch (error) {
      console.error('Error fetching details:', error);
      // Use fallback from search result
      setBusinessDetails({
        name: business.name,
        address: business.address,
        rating: business.rating || 0,
        total_reviews: business.user_ratings_total || 0,
        photos_count: 0,
        has_hours: false,
        types: business.types || [],
        place_id: business.place_id,
        website: '',
        phone: '',
        reviews: [],
        location: business.geometry?.location || {}
      });
    } finally {
      setIsLoadingDetails(false);
    }
  }, [isLoadingDetails]);

  const handleConfirm = () => {
    if (businessDetails) {
      base44.analytics.track({ 
        eventName: 'business_confirmed', 
        properties: { 
          business_name: businessDetails.name,
          rating: businessDetails.rating,
          reviews_count: businessDetails.total_reviews
        } 
      });
      
      onSelect({
        business_name: businessDetails.name,
        website: businessDetails.website || '',
        place_id: businessDetails.place_id,
        address: businessDetails.address,
        phone: businessDetails.phone,
        gmb_rating: businessDetails.rating,
        gmb_reviews_count: businessDetails.total_reviews,
        gmb_photos_count: businessDetails.photos_count,
        gmb_has_hours: businessDetails.has_hours,
        gmb_types: businessDetails.types,
        gmb_reviews: businessDetails.reviews,
        location: businessDetails.location
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-2xl mx-auto px-4"
    >
      <div className="text-center mb-8 md:mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-4"
        >
          <span className="text-xs text-[#c8ff00] font-semibold">FINAL STEP</span>
        </motion.div>
        <h2 className="text-xl md:text-3xl lg:text-4xl font-bold text-white mb-3 leading-tight px-2">
          Find Your Business on <span className="text-[#c8ff00]">Google Maps</span>
        </h2>
        <p className="text-gray-400 text-base md:text-lg mb-2 px-2">
          We'll scan your actual GMB profile for real-time insights
        </p>
        <p className="text-gray-500 text-xs md:text-sm px-2">
          🔍 Search by business name + location for best results
        </p>
      </div>

      {/* Search Form */}
      {!selectedBusiness && (
        <motion.form
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSearch}
          className="mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="e.g., Joe's Pizza Brooklyn NY"
              value={searchQuery}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
              autoFocus
              className="pl-12 pr-32 py-6 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 rounded-xl focus:border-[#c8ff00]/50 focus:ring-[#c8ff00]/20"
            />
            <Button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#c8ff00] hover:bg-[#d4ff33] active:bg-[#b8e600] text-black font-semibold px-4 sm:px-6 rounded-lg min-h-[40px] touch-manipulation"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
          {isSearching && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center text-gray-400 text-sm mt-3"
            >
              Searching Google Maps...
            </motion.p>
          )}
        </motion.form>
      )}

      {/* Search Results */}
      {searchResults.length > 0 && !selectedBusiness && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3 mb-8"
        >
          <p className="text-gray-400 text-sm mb-4">Select your business:</p>
          {searchResults.map((business, index) => (
            <motion.button
              key={business.place_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelectBusiness(business)}
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-left hover:border-[#c8ff00]/50 hover:bg-gray-900/80 transition-all min-h-[80px] touch-manipulation"
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-gray-800">
                  <Building2 className="w-5 h-5 text-[#c8ff00]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-1">{business.name}</h3>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-3 h-3 text-gray-500" />
                    <p className="text-sm text-gray-400">{business.address}</p>
                  </div>
                  {business.rating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="w-3 h-3 text-[#c8ff00] fill-[#c8ff00]" />
                      <span className="text-sm text-gray-400">
                        {business.rating} ({business.user_ratings_total} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      )}

      {/* Selected Business Details */}
      {selectedBusiness && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-[#c8ff00]/10 to-green-500/10 border-2 border-[#c8ff00] rounded-2xl p-6 mb-6"
        >
          {isLoadingDetails ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-[#c8ff00] animate-spin mx-auto mb-3" />
              <p className="text-gray-400">Loading business details...</p>
            </div>
          ) : businessDetails ? (
            <>
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 rounded-xl bg-[#c8ff00]/20">
                  <CheckCircle className="w-6 h-6 text-[#c8ff00]" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-bold text-xl mb-2">{businessDetails.name}</h3>
                  <div className="space-y-1 text-sm text-gray-300">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-500" />
                      <span>{businessDetails.address}</span>
                    </div>
                    {businessDetails.rating > 0 && (
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-[#c8ff00] fill-[#c8ff00]" />
                        <span className="font-semibold text-[#c8ff00]">
                          {businessDetails.rating} ★
                        </span>
                        <span className="text-gray-400">
                          ({businessDetails.total_reviews} reviews)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => {
                    setSelectedBusiness(null);
                    setBusinessDetails(null);
                    setSearchResults([]);
                  }}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold border-0"
                >
                  Search Again
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={parentLoading}
                  className="flex-1 bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-bold shadow-lg"
                >
                  {parentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Confirm & Analyze'
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </motion.div>
      )}

      {/* No Results - Only show if actually searched */}
      {searchResults.length === 0 && !isSearching && hasSearched && searchQuery && !selectedBusiness && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 bg-gray-900/30 border border-gray-800 rounded-xl"
        >
          <p className="text-gray-400 mb-2">No matches found for "{searchQuery}"</p>
          <p className="text-gray-600 text-sm">Try including your city or state (e.g., "Business Name New York")</p>
        </motion.div>
      )}
    </motion.div>
  );
}