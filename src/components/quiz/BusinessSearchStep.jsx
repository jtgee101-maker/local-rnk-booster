import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, MapPin, Star, Building2, Loader2, CheckCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function BusinessSearchStep({ onSelect, isLoading: parentLoading }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedBusiness, setSelectedBusiness] = useState(null);
  const [businessDetails, setBusinessDetails] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults([]);
    setSelectedBusiness(null);
    setBusinessDetails(null);

    try {
      const response = await base44.functions.invoke('searchGoogleBusiness', {
        searchQuery: searchQuery
      });

      if (response.data.success && response.data.results.length > 0) {
        setSearchResults(response.data.results);
      } else {
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error searching business:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBusiness = async (business) => {
    setSelectedBusiness(business);
    setIsLoadingDetails(true);

    try {
      const response = await base44.functions.invoke('getGoogleBusinessDetails', {
        placeId: business.place_id
      });

      if (response.data.success) {
        setBusinessDetails(response.data.business);
      }
    } catch (error) {
      console.error('Error getting business details:', error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleConfirm = () => {
    if (businessDetails) {
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
      <div className="text-center mb-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="inline-flex items-center gap-2 bg-[#c8ff00]/10 border border-[#c8ff00]/30 rounded-full px-4 py-2 mb-4"
        >
          <span className="text-xs text-[#c8ff00] font-semibold">FINAL STEP</span>
        </motion.div>
        <h2 className="text-2xl md:text-4xl font-bold text-white mb-3">
          Find Your Business on <span className="text-[#c8ff00]">Google Maps</span>
        </h2>
        <p className="text-gray-400 text-lg mb-2">
          We'll scan your actual GMB profile for real-time insights
        </p>
        <p className="text-gray-500 text-sm">
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
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 pr-32 py-6 bg-gray-900/50 border-gray-800 text-white placeholder:text-gray-500 rounded-xl focus:border-[#c8ff00]/50 focus:ring-[#c8ff00]/20"
            />
            <Button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold px-6 rounded-lg"
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>
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
              className="w-full bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-left hover:border-[#c8ff00]/50 hover:bg-gray-900/80 transition-all"
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
                  variant="outline"
                  className="flex-1 border-gray-700 text-gray-300 hover:bg-gray-800"
                >
                  Search Again
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={parentLoading}
                  className="flex-1 bg-[#c8ff00] hover:bg-[#d4ff33] text-black font-semibold"
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

      {/* No Results */}
      {searchResults.length === 0 && !isSearching && searchQuery && !selectedBusiness && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8 bg-gray-900/30 border border-gray-800 rounded-xl"
        >
          <p className="text-gray-400 mb-2">No businesses found</p>
          <p className="text-gray-600 text-sm">Try a different search query</p>
        </motion.div>
      )}
    </motion.div>
  );
}