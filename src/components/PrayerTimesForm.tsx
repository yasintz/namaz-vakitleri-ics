'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  getDisplayName,
  type HierarchicalData,
} from '@/lib/api';

interface PrayerTimesFormProps {
  hierarchicalData: HierarchicalData;
}

export default function PrayerTimesForm({ hierarchicalData }: PrayerTimesFormProps) {
  // State for selections
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedCity, setSelectedCity] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('');
  const [language, setLanguage] = useState<'tr' | 'en'>('tr');

  // Loading/UI states
  const [isCopying, setIsCopying] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [error, setError] = useState('');

  // Get available cities for the selected country
  const availableCities = useMemo(() => {
    if (!selectedCountry) return [];
    
    const country = hierarchicalData.countries.find(c => c.UlkeID === selectedCountry);
    return country ? country.cities : [];
  }, [selectedCountry, hierarchicalData.countries]);

  // Get available districts for the selected city
  const availableDistricts = useMemo(() => {
    if (!selectedCity) return [];
    
    const city = availableCities.find(c => c.SehirID === selectedCity);
    return city ? city.districts : [];
  }, [selectedCity, availableCities]);

  // Reset dependent selections when parent selection changes
  useEffect(() => {
    setSelectedCity('');
    setSelectedDistrict('');
    setError('');
    setCopySuccess(false);
  }, [selectedCountry]);

  useEffect(() => {
    setSelectedDistrict('');
    setError('');
    setCopySuccess(false);
  }, [selectedCity]);

  // Clear messages when language changes
  useEffect(() => {
    setCopySuccess(false);
  }, [language]);

  // Generate the ICS URL
  const generateIcsUrl = () => {
    if (!selectedDistrict) return '';

    const params = new URLSearchParams({
      districtID: selectedDistrict,
      lang: language,
    });

    const currentHost =
      typeof window !== 'undefined' ? window.location.origin : '';
    return `${currentHost}/api/times-ics?${params}`;
  };

  const handleCopyIcsUrl = async () => {
    if (!selectedDistrict) {
      setError('Please select a country, city, and district first');
      return;
    }

    setIsCopying(true);
    setError('');
    setCopySuccess(false);

    try {
      const icsUrl = generateIcsUrl();
      await navigator.clipboard.writeText(icsUrl);
      setCopySuccess(true);

      // Reset success message after 3 seconds
      setTimeout(() => {
        setCopySuccess(false);
      }, 3000);
    } catch {
      setError('Failed to copy to clipboard. Please try again.');
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
      <div className="space-y-6">
        {/* Country Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            1. Select Country
          </label>
          <select
            value={selectedCountry}
            onChange={(e) => {
              setSelectedCountry(e.target.value);
              setError('');
              setCopySuccess(false);
            }}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-black"
          >
            <option value="">Choose a country...</option>
            {hierarchicalData.flatCountries.map((country) => (
              <option key={country.UlkeID} value={country.UlkeID}>
                {getDisplayName(country, language)}
              </option>
            ))}
          </select>
        </div>

        {/* City Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            2. Select City
          </label>
          <select
            value={selectedCity}
            onChange={(e) => {
              setSelectedCity(e.target.value);
              setError('');
              setCopySuccess(false);
            }}
            disabled={!selectedCountry}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100 text-black"
          >
            <option value="">
              {!selectedCountry ? 'Select a country first...' : 'Choose a city...'}
            </option>
            {availableCities.map((city) => (
              <option key={city.SehirID} value={city.SehirID}>
                {getDisplayName(city, language)}
              </option>
            ))}
          </select>
        </div>

        {/* District Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            3. Select District
          </label>
          <select
            value={selectedDistrict}
            onChange={(e) => {
              setSelectedDistrict(e.target.value);
              setError('');
              setCopySuccess(false);
            }}
            disabled={!selectedCity}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all disabled:bg-gray-100 text-black"
          >
            <option value="">
              {!selectedCity ? 'Select a city first...' : 'Choose a district...'}
            </option>
            {availableDistricts.map((district) => (
              <option key={district.IlceID} value={district.IlceID}>
                {getDisplayName(district, language)}
              </option>
            ))}
          </select>
        </div>

        {/* Language Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            4. Language
          </label>
          <div className="flex space-x-4">
            <label className="flex items-center">
              <input
                type="radio"
                value="tr"
                checked={language === 'tr'}
                onChange={(e) => {
                  setLanguage(e.target.value as 'tr' | 'en');
                  setCopySuccess(false);
                }}
                className="mr-2 text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-700">Turkish</span>
            </label>
            <label className="flex items-center">
              <input
                type="radio"
                value="en"
                checked={language === 'en'}
                onChange={(e) => {
                  setLanguage(e.target.value as 'tr' | 'en');
                  setCopySuccess(false);
                }}
                className="mr-2 text-green-600 focus:ring-green-500"
              />
              <span className="text-gray-700">English</span>
            </label>
          </div>
        </div>

        {/* Success Message for Copy */}
        {copySuccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-green-600 text-sm flex items-center">
              <span className="mr-2">✅</span>
              ICS URL copied to clipboard! You can now paste it into your
              calendar app to subscribe to live prayer times.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Copy URL Button */}
        <button
          onClick={handleCopyIcsUrl}
          disabled={isCopying || !selectedDistrict}
          className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-4 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed"
        >
          {isCopying ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Copying URL...
            </div>
          ) : (
            '🔗 Copy ICS URL (for live calendar subscription)'
          )}
        </button>
      </div>
    </div>
  );
} 