import PrayerTimesForm from '@/components/PrayerTimesForm';
import { fetchAllData } from '@/lib/api';

export default async function Home() {
  // Fetch all hierarchical data server-side
  let hierarchicalData;
  let error: string | null = null;

  try {
    hierarchicalData = await fetchAllData();
  } catch (err) {
    console.error('Failed to fetch data:', err);
    error = 'Failed to load location data. Please try refreshing the page.';
    // Provide fallback empty data structure
    hierarchicalData = {
      countries: [],
      flatCountries: [],
      flatCities: [],
      flatDistricts: [],
    };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">
              🕌 Prayer Times Calendar Generator
            </h1>
            <p className="text-lg text-gray-600">
              Generate ICS calendar URL for Islamic prayer times from anywhere in the world
            </p>
            {hierarchicalData.flatCountries.length > 0 && (
              <p className="text-sm text-gray-500 mt-2">
                ✅ {hierarchicalData.flatCountries.length} countries, {hierarchicalData.flatCities.length} cities, {hierarchicalData.flatDistricts.length} districts loaded
              </p>
            )}
          </div>

          {/* Show error if data fetching failed */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Prayer Times Form Component */}
          <PrayerTimesForm hierarchicalData={hierarchicalData} />

          {/* Instructions Card */}
          <div className="bg-blue-50 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-blue-800 mb-3">
              📱 How to Use Your Calendar
            </h3>
            
            <div className="space-y-4">
              {/* Live Subscription Instructions */}
              <div>
                <h4 className="font-semibold text-blue-700 mb-2">
                  Live Calendar Subscription
                </h4>
                <ul className="space-y-2 text-blue-700 text-sm">
                  <li className="flex items-start">
                    <span className="mr-2">1️⃣</span>
                    <span>
                      Select your location and click &quot;Copy ICS URL&quot;
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">2️⃣</span>
                    <span>
                      In your calendar app, choose &quot;Subscribe to
                      Calendar&quot; or &quot;Add Calendar by URL&quot;
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">3️⃣</span>
                    <span>
                      Paste the copied URL - your calendar will automatically
                      update with new prayer times!
                    </span>
                  </li>
                </ul>
              </div>

              {/* Calendar App Instructions */}
              <div className="text-xs text-blue-600 bg-blue-100 rounded-lg p-3">
                <p className="font-semibold mb-2">📱 For different calendar apps:</p>
                <ul className="space-y-1">
                  <li><strong>iPhone/iPad:</strong> Settings → Calendar → Accounts → Add Account → Other → Add Subscribed Calendar</li>
                  <li><strong>Google Calendar:</strong> Other calendars → + → From URL</li>
                  <li><strong>Outlook:</strong> Add calendar → Subscribe from web</li>
                  <li><strong>Thunderbird:</strong> Calendar → New Calendar → On the Network</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-500 text-sm">
            <p>
              Prayer times data provided by{' '}
              <a
                href="https://ezanvakti.emushaf.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Ezan Vakti API
              </a>
            </p>
            <p className="mt-2">May Allah accept your prayers 🤲</p>
          </div>
        </div>
      </div>
    </div>
  );
}
