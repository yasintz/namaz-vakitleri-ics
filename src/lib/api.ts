// Types based on the Ezan Vakti API OpenAPI specification
export interface Ulke {
  UlkeAdi: string;
  UlkeAdiEn: string;
  UlkeID: string;
}

export interface Sehir {
  SehirAdi: string;
  SehirAdiEn: string;
  SehirID: string;
}

export interface Ilce {
  IlceAdi: string;
  IlceAdiEn: string;
  IlceID: string;
}

export interface Vakit {
  HicriTarihKisa: string;
  HicriTarihKisaIso8601: string | null;
  HicriTarihUzun: string;
  HicriTarihUzunIso8601: string | null;
  AyinSekliURL: string;
  MiladiTarihKisa: string;
  MiladiTarihKisaIso8601: string;
  MiladiTarihUzun: string;
  MiladiTarihUzunIso8601: string;
  GreenwichOrtalamaZamani: number;
  Aksam: string;
  Gunes: string;
  GunesBatis: string;
  GunesDogus: string;
  Ikindi: string;
  Imsak: string;
  KibleSaati: string;
  Ogle: string;
  Yatsi: string;
}

// Hierarchical data structure for server-side data
export interface HierarchicalSehir extends Sehir {
  districts: Ilce[];
}

export interface HierarchicalUlke extends Ulke {
  cities: HierarchicalSehir[];
}

export interface HierarchicalData {
  countries: HierarchicalUlke[];
  flatCountries: Ulke[];
  flatCities: Sehir[];
  flatDistricts: Ilce[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://ezanvakti.emushaf.net';

// Generic API request function
async function apiRequest<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// API functions
export const ezanVaktiApi = {
  // Get all countries
  getCountries: (): Promise<Ulke[]> => {
    return apiRequest<Ulke[]>('/ulkeler');
  },

  // Get cities for a country
  getCities: (countryId: string): Promise<Sehir[]> => {
    return apiRequest<Sehir[]>(`/sehirler/${countryId}`);
  },

  // Get districts for a city
  getDistricts: (cityId: string): Promise<Ilce[]> => {
    return apiRequest<Ilce[]>(`/ilceler/${cityId}`);
  },

  // Get prayer times for a district
  getPrayerTimes: (districtId: string): Promise<Vakit[]> => {
    return apiRequest<Vakit[]>(`/vakitler/${districtId}`);
  },
};

// Server-side function to fetch all hierarchical data
export async function fetchAllData(): Promise<HierarchicalData> {
  try {
    // Fetch all countries first
    const countries = await ezanVaktiApi.getCountries();
    
    // Create flat arrays for easy filtering
    const flatCountries: Ulke[] = countries;
    const flatCities: Sehir[] = [];
    const flatDistricts: Ilce[] = [];
    
    // Build hierarchical structure
    const hierarchicalCountries: HierarchicalUlke[] = [];
    
    for (const country of countries) {
      try {
        // Fetch cities for this country
        const cities = await ezanVaktiApi.getCities(country.UlkeID);
        flatCities.push(...cities);
        
        const hierarchicalCities: HierarchicalSehir[] = [];
        
        for (const city of cities) {
          try {
            // Fetch districts for this city
            const districts = await ezanVaktiApi.getDistricts(city.SehirID);
            flatDistricts.push(...districts);
            
            hierarchicalCities.push({
              ...city,
              districts,
            });
          } catch (error) {
            console.warn(`Failed to fetch districts for city ${city.SehirID}:`, error);
            // Continue with empty districts for this city
            hierarchicalCities.push({
              ...city,
              districts: [],
            });
          }
        }
        
        hierarchicalCountries.push({
          ...country,
          cities: hierarchicalCities,
        });
      } catch (error) {
        console.warn(`Failed to fetch cities for country ${country.UlkeID}:`, error);
        // Continue with empty cities for this country
        hierarchicalCountries.push({
          ...country,
          cities: [],
        });
      }
    }
    
    return {
      countries: hierarchicalCountries,
      flatCountries,
      flatCities,
      flatDistricts,
    };
  } catch (error) {
    console.error('Failed to fetch hierarchical data:', error);
    throw error;
  }
}

// Helper function to get display name based on language
export function getDisplayName(item: Ulke | Sehir | Ilce, language: 'tr' | 'en'): string {
  if ('UlkeAdi' in item) {
    return language === 'tr' ? item.UlkeAdi : item.UlkeAdiEn;
  }
  if ('SehirAdi' in item) {
    return language === 'tr' ? item.SehirAdi : item.SehirAdiEn;
  }
  if ('IlceAdi' in item) {
    return language === 'tr' ? item.IlceAdi : item.IlceAdiEn;
  }
  return '';
} 