/**
 * cities.ts — World city coordinates database
 *
 * ~280 major cities across all countries/continents.
 * Each entry: name, country, latitude, longitude, IANA timezone id,
 * plus a fixed UTC-offset fallback (`tz`) for zone-less callers.
 * Historical offsets (DST, zone reforms) resolve through the browser's
 * full tz database via `utcOffsetHours`.
 * Used for birth chart computation when user enters city name.
 * Fuzzy search matches partial names.
 */

export interface CityData {
  name: string;
  country: string;
  lat: number;
  lon: number;
  /** Fixed modern UTC offset — fallback only; prefer `zone` + utcOffsetHours. */
  tz: number;
  /**
   * IANA timezone id, e.g. "Europe/Kyiv". Present on every bundled city;
   * optional in the type so ad-hoc CityData literals (fallbacks in older
   * callers) stay valid — those resolve through the fixed `tz` offset.
   */
  zone?: string;
}

// Sorted alphabetically by city name
export const CITIES: CityData[] = [
  // ── AFRICA ──
  { name: "Abidjan", country: "Côte d'Ivoire", lat: 5.32, lon: -4.03, tz: 0, zone: "Africa/Abidjan" },
  { name: "Accra", country: "Ghana", lat: 5.56, lon: -0.19, tz: 0, zone: "Africa/Accra" },
  { name: "Addis Ababa", country: "Ethiopia", lat: 9.02, lon: 38.75, tz: 3, zone: "Africa/Addis_Ababa" },
  { name: "Alexandria", country: "Egypt", lat: 31.20, lon: 29.92, tz: 2, zone: "Africa/Cairo" },
  { name: "Algiers", country: "Algeria", lat: 36.75, lon: 3.04, tz: 1, zone: "Africa/Algiers" },
  { name: "Antananarivo", country: "Madagascar", lat: -18.91, lon: 47.54, tz: 3, zone: "Indian/Antananarivo" },
  { name: "Cairo", country: "Egypt", lat: 30.04, lon: 31.24, tz: 2, zone: "Africa/Cairo" },
  { name: "Cape Town", country: "South Africa", lat: -33.93, lon: 18.42, tz: 2, zone: "Africa/Johannesburg" },
  { name: "Casablanca", country: "Morocco", lat: 33.57, lon: -7.59, tz: 1, zone: "Africa/Casablanca" },
  { name: "Dakar", country: "Senegal", lat: 14.69, lon: -17.44, tz: 0, zone: "Africa/Dakar" },
  { name: "Dar es Salaam", country: "Tanzania", lat: -6.79, lon: 39.28, tz: 3, zone: "Africa/Dar_es_Salaam" },
  { name: "Durban", country: "South Africa", lat: -29.86, lon: 31.02, tz: 2, zone: "Africa/Johannesburg" },
  { name: "Johannesburg", country: "South Africa", lat: -26.20, lon: 28.05, tz: 2, zone: "Africa/Johannesburg" },
  { name: "Kampala", country: "Uganda", lat: 0.35, lon: 32.58, tz: 3, zone: "Africa/Kampala" },
  { name: "Khartoum", country: "Sudan", lat: 15.50, lon: 32.56, tz: 2, zone: "Africa/Khartoum" },
  { name: "Kinshasa", country: "DR Congo", lat: -4.44, lon: 15.27, tz: 1, zone: "Africa/Kinshasa" },
  { name: "Lagos", country: "Nigeria", lat: 6.52, lon: 3.38, tz: 1, zone: "Africa/Lagos" },
  { name: "Luanda", country: "Angola", lat: -8.84, lon: 13.23, tz: 1, zone: "Africa/Luanda" },
  { name: "Lusaka", country: "Zambia", lat: -15.39, lon: 28.32, tz: 2, zone: "Africa/Lusaka" },
  { name: "Maputo", country: "Mozambique", lat: -25.97, lon: 32.57, tz: 2, zone: "Africa/Maputo" },
  { name: "Marrakech", country: "Morocco", lat: 31.63, lon: -8.00, tz: 1, zone: "Africa/Casablanca" },
  { name: "Mombasa", country: "Kenya", lat: -4.04, lon: 39.67, tz: 3, zone: "Africa/Nairobi" },
  { name: "Nairobi", country: "Kenya", lat: -1.29, lon: 36.82, tz: 3, zone: "Africa/Nairobi" },
  { name: "Pretoria", country: "South Africa", lat: -25.75, lon: 28.19, tz: 2, zone: "Africa/Johannesburg" },
  { name: "Tunis", country: "Tunisia", lat: 36.81, lon: 10.18, tz: 1, zone: "Africa/Tunis" },

  // ── ASIA ──
  { name: "Almaty", country: "Kazakhstan", lat: 43.24, lon: 76.95, tz: 6, zone: "Asia/Almaty" },
  { name: "Amman", country: "Jordan", lat: 31.95, lon: 35.93, tz: 3, zone: "Asia/Amman" },
  { name: "Ankara", country: "Turkey", lat: 39.93, lon: 32.85, tz: 3, zone: "Europe/Istanbul" },
  { name: "Astana", country: "Kazakhstan", lat: 51.17, lon: 71.43, tz: 6, zone: "Asia/Almaty" },
  { name: "Baghdad", country: "Iraq", lat: 33.31, lon: 44.37, tz: 3, zone: "Asia/Baghdad" },
  { name: "Baku", country: "Azerbaijan", lat: 40.41, lon: 49.87, tz: 4, zone: "Asia/Baku" },
  { name: "Bangalore", country: "India", lat: 12.97, lon: 77.59, tz: 5.5, zone: "Asia/Kolkata" },
  { name: "Bangkok", country: "Thailand", lat: 13.76, lon: 100.50, tz: 7, zone: "Asia/Bangkok" },
  { name: "Beijing", country: "China", lat: 39.90, lon: 116.41, tz: 8, zone: "Asia/Shanghai" },
  { name: "Beirut", country: "Lebanon", lat: 33.89, lon: 35.50, tz: 2, zone: "Asia/Beirut" },
  { name: "Bishkek", country: "Kyrgyzstan", lat: 42.87, lon: 74.59, tz: 6, zone: "Asia/Bishkek" },
  { name: "Busan", country: "South Korea", lat: 35.18, lon: 129.08, tz: 9, zone: "Asia/Seoul" },
  { name: "Cebu", country: "Philippines", lat: 10.32, lon: 123.89, tz: 8, zone: "Asia/Manila" },
  { name: "Changsha", country: "China", lat: 28.23, lon: 112.94, tz: 8, zone: "Asia/Shanghai" },
  { name: "Chengdu", country: "China", lat: 30.57, lon: 104.07, tz: 8, zone: "Asia/Shanghai" },
  { name: "Chennai", country: "India", lat: 13.08, lon: 80.27, tz: 5.5, zone: "Asia/Kolkata" },
  { name: "Chittagong", country: "Bangladesh", lat: 22.36, lon: 91.78, tz: 6, zone: "Asia/Dhaka" },
  { name: "Chongqing", country: "China", lat: 29.43, lon: 106.91, tz: 8, zone: "Asia/Shanghai" },
  { name: "Colombo", country: "Sri Lanka", lat: 6.93, lon: 79.85, tz: 5.5, zone: "Asia/Colombo" },
  { name: "Daegu", country: "South Korea", lat: 35.87, lon: 128.60, tz: 9, zone: "Asia/Seoul" },
  { name: "Damascus", country: "Syria", lat: 33.51, lon: 36.29, tz: 3, zone: "Asia/Damascus" },
  { name: "Davao", country: "Philippines", lat: 7.19, lon: 125.46, tz: 8, zone: "Asia/Manila" },
  { name: "Delhi", country: "India", lat: 28.61, lon: 77.21, tz: 5.5, zone: "Asia/Kolkata" },
  { name: "Dhaka", country: "Bangladesh", lat: 23.81, lon: 90.41, tz: 6, zone: "Asia/Dhaka" },
  { name: "Doha", country: "Qatar", lat: 25.29, lon: 51.53, tz: 3, zone: "Asia/Qatar" },
  { name: "Dubai", country: "UAE", lat: 25.20, lon: 55.27, tz: 4, zone: "Asia/Dubai" },
  { name: "Dushanbe", country: "Tajikistan", lat: 38.54, lon: 68.77, tz: 5, zone: "Asia/Dushanbe" },
  { name: "Fukuoka", country: "Japan", lat: 33.59, lon: 130.40, tz: 9, zone: "Asia/Tokyo" },
  { name: "Guangzhou", country: "China", lat: 23.13, lon: 113.26, tz: 8, zone: "Asia/Shanghai" },
  { name: "Hanoi", country: "Vietnam", lat: 21.03, lon: 105.85, tz: 7, zone: "Asia/Ho_Chi_Minh" },
  { name: "Ho Chi Minh City", country: "Vietnam", lat: 10.82, lon: 106.63, tz: 7, zone: "Asia/Ho_Chi_Minh" },
  { name: "Hong Kong", country: "China", lat: 22.32, lon: 114.17, tz: 8, zone: "Asia/Hong_Kong" },
  { name: "Hyderabad", country: "India", lat: 17.38, lon: 78.49, tz: 5.5, zone: "Asia/Kolkata" },
  { name: "Incheon", country: "South Korea", lat: 37.46, lon: 126.71, tz: 9, zone: "Asia/Seoul" },
  { name: "Islamabad", country: "Pakistan", lat: 33.69, lon: 73.04, tz: 5, zone: "Asia/Karachi" },
  { name: "Istanbul", country: "Turkey", lat: 41.01, lon: 28.98, tz: 3, zone: "Europe/Istanbul" },
  { name: "Izmir", country: "Turkey", lat: 38.42, lon: 27.13, tz: 3, zone: "Europe/Istanbul" },
  { name: "Jaipur", country: "India", lat: 26.91, lon: 75.79, tz: 5.5, zone: "Asia/Kolkata" },
  { name: "Jakarta", country: "Indonesia", lat: -6.21, lon: 106.85, tz: 7, zone: "Asia/Jakarta" },
  { name: "Jeddah", country: "Saudi Arabia", lat: 21.49, lon: 39.19, tz: 3, zone: "Asia/Riyadh" },
  { name: "Jerusalem", country: "Israel", lat: 31.77, lon: 35.24, tz: 2, zone: "Asia/Jerusalem" },
  { name: "Kabul", country: "Afghanistan", lat: 34.53, lon: 69.17, tz: 4.5, zone: "Asia/Kabul" },
  { name: "Karachi", country: "Pakistan", lat: 24.86, lon: 67.01, tz: 5, zone: "Asia/Karachi" },
  { name: "Kathmandu", country: "Nepal", lat: 27.72, lon: 85.32, tz: 5.75, zone: "Asia/Kathmandu" },
  { name: "Kolkata", country: "India", lat: 22.57, lon: 88.36, tz: 5.5, zone: "Asia/Kolkata" },
  { name: "Kuala Lumpur", country: "Malaysia", lat: 3.14, lon: 101.69, tz: 8, zone: "Asia/Kuala_Lumpur" },
  { name: "Kuwait City", country: "Kuwait", lat: 29.38, lon: 47.99, tz: 3, zone: "Asia/Kuwait" },
  { name: "Lahore", country: "Pakistan", lat: 31.55, lon: 74.35, tz: 5, zone: "Asia/Karachi" },
  { name: "Lucknow", country: "India", lat: 26.85, lon: 80.95, tz: 5.5, zone: "Asia/Kolkata" },
  { name: "Macau", country: "China", lat: 22.20, lon: 113.55, tz: 8, zone: "Asia/Macau" },
  { name: "Manila", country: "Philippines", lat: 14.60, lon: 120.98, tz: 8, zone: "Asia/Manila" },
  { name: "Mecca", country: "Saudi Arabia", lat: 21.43, lon: 39.83, tz: 3, zone: "Asia/Riyadh" },
  { name: "Medina", country: "Saudi Arabia", lat: 24.47, lon: 39.61, tz: 3, zone: "Asia/Riyadh" },
  { name: "Mumbai", country: "India", lat: 19.08, lon: 72.88, tz: 5.5, zone: "Asia/Kolkata" },
  { name: "Muscat", country: "Oman", lat: 23.59, lon: 58.54, tz: 4, zone: "Asia/Muscat" },
  { name: "Nagoya", country: "Japan", lat: 35.18, lon: 136.91, tz: 9, zone: "Asia/Tokyo" },
  { name: "Nanjing", country: "China", lat: 32.06, lon: 118.78, tz: 8, zone: "Asia/Shanghai" },
  { name: "New Delhi", country: "India", lat: 28.61, lon: 77.21, tz: 5.5, zone: "Asia/Kolkata" },
  { name: "Novosibirsk", country: "Russia", lat: 55.04, lon: 82.93, tz: 7, zone: "Asia/Novosibirsk" },
  { name: "Osaka", country: "Japan", lat: 34.69, lon: 135.50, tz: 9, zone: "Asia/Tokyo" },
  { name: "Phnom Penh", country: "Cambodia", lat: 11.56, lon: 104.93, tz: 7, zone: "Asia/Phnom_Penh" },
  { name: "Pune", country: "India", lat: 18.52, lon: 73.86, tz: 5.5, zone: "Asia/Kolkata" },
  { name: "Pyongyang", country: "North Korea", lat: 39.02, lon: 125.75, tz: 9, zone: "Asia/Pyongyang" },
  { name: "Riyadh", country: "Saudi Arabia", lat: 24.71, lon: 46.68, tz: 3, zone: "Asia/Riyadh" },
  { name: "Sapporo", country: "Japan", lat: 43.06, lon: 141.35, tz: 9, zone: "Asia/Tokyo" },
  { name: "Seoul", country: "South Korea", lat: 37.57, lon: 126.98, tz: 9, zone: "Asia/Seoul" },
  { name: "Shanghai", country: "China", lat: 31.23, lon: 121.47, tz: 8, zone: "Asia/Shanghai" },
  { name: "Shenzhen", country: "China", lat: 22.54, lon: 114.06, tz: 8, zone: "Asia/Shanghai" },
  { name: "Singapore", country: "Singapore", lat: 1.35, lon: 103.82, tz: 8, zone: "Asia/Singapore" },
  { name: "Surabaya", country: "Indonesia", lat: -7.25, lon: 112.75, tz: 7, zone: "Asia/Jakarta" },
  { name: "Taipei", country: "Taiwan", lat: 25.03, lon: 121.57, tz: 8, zone: "Asia/Taipei" },
  { name: "Tashkent", country: "Uzbekistan", lat: 41.30, lon: 69.28, tz: 5, zone: "Asia/Tashkent" },
  { name: "Tbilisi", country: "Georgia", lat: 41.72, lon: 44.79, tz: 4, zone: "Asia/Tbilisi" },
  { name: "Tehran", country: "Iran", lat: 35.69, lon: 51.39, tz: 3.5, zone: "Asia/Tehran" },
  { name: "Tel Aviv", country: "Israel", lat: 32.08, lon: 34.78, tz: 2, zone: "Asia/Jerusalem" },
  { name: "Tianjin", country: "China", lat: 39.34, lon: 117.36, tz: 8, zone: "Asia/Shanghai" },
  { name: "Tokyo", country: "Japan", lat: 35.68, lon: 139.69, tz: 9, zone: "Asia/Tokyo" },
  { name: "Ulaanbaatar", country: "Mongolia", lat: 47.91, lon: 106.91, tz: 8, zone: "Asia/Ulaanbaatar" },
  { name: "Vladivostok", country: "Russia", lat: 43.12, lon: 131.87, tz: 10, zone: "Asia/Vladivostok" },
  { name: "Wuhan", country: "China", lat: 30.59, lon: 114.31, tz: 8, zone: "Asia/Shanghai" },
  { name: "Xian", country: "China", lat: 34.26, lon: 108.94, tz: 8, zone: "Asia/Shanghai" },
  { name: "Yangon", country: "Myanmar", lat: 16.87, lon: 96.20, tz: 6.5, zone: "Asia/Yangon" },
  { name: "Yerevan", country: "Armenia", lat: 40.18, lon: 44.51, tz: 4, zone: "Asia/Yerevan" },
  { name: "Yokohama", country: "Japan", lat: 35.44, lon: 139.64, tz: 9, zone: "Asia/Tokyo" },

  // ── EUROPE ──
  { name: "Amsterdam", country: "Netherlands", lat: 52.37, lon: 4.90, tz: 1, zone: "Europe/Amsterdam" },
  { name: "Athens", country: "Greece", lat: 37.98, lon: 23.73, tz: 2, zone: "Europe/Athens" },
  { name: "Barcelona", country: "Spain", lat: 41.39, lon: 2.17, tz: 1, zone: "Europe/Madrid" },
  { name: "Belgrade", country: "Serbia", lat: 44.79, lon: 20.47, tz: 1, zone: "Europe/Belgrade" },
  { name: "Berlin", country: "Germany", lat: 52.52, lon: 13.41, tz: 1, zone: "Europe/Berlin" },
  { name: "Birmingham", country: "UK", lat: 52.49, lon: -1.90, tz: 0, zone: "Europe/London" },
  { name: "Bratislava", country: "Slovakia", lat: 48.15, lon: 17.11, tz: 1, zone: "Europe/Bratislava" },
  { name: "Brussels", country: "Belgium", lat: 50.85, lon: 4.35, tz: 1, zone: "Europe/Brussels" },
  { name: "Bucharest", country: "Romania", lat: 44.43, lon: 26.10, tz: 2, zone: "Europe/Bucharest" },
  { name: "Budapest", country: "Hungary", lat: 47.50, lon: 19.04, tz: 1, zone: "Europe/Budapest" },
  { name: "Chisinau", country: "Moldova", lat: 47.01, lon: 28.86, tz: 2, zone: "Europe/Chisinau" },
  { name: "Copenhagen", country: "Denmark", lat: 55.68, lon: 12.57, tz: 1, zone: "Europe/Copenhagen" },
  { name: "Cork", country: "Ireland", lat: 51.90, lon: -8.47, tz: 0, zone: "Europe/Dublin" },
  { name: "Dnipro", country: "Ukraine", lat: 48.46, lon: 35.05, tz: 2, zone: "Europe/Kyiv" },
  { name: "Dublin", country: "Ireland", lat: 53.35, lon: -6.26, tz: 0, zone: "Europe/Dublin" },
  { name: "Edinburgh", country: "UK", lat: 55.95, lon: -3.19, tz: 0, zone: "Europe/London" },
  { name: "Florence", country: "Italy", lat: 43.77, lon: 11.25, tz: 1, zone: "Europe/Rome" },
  { name: "Frankfurt", country: "Germany", lat: 50.11, lon: 8.68, tz: 1, zone: "Europe/Berlin" },
  { name: "Geneva", country: "Switzerland", lat: 46.20, lon: 6.14, tz: 1, zone: "Europe/Zurich" },
  { name: "Gothenburg", country: "Sweden", lat: 57.71, lon: 11.97, tz: 1, zone: "Europe/Stockholm" },
  { name: "Hamburg", country: "Germany", lat: 53.55, lon: 9.99, tz: 1, zone: "Europe/Berlin" },
  { name: "Helsinki", country: "Finland", lat: 60.17, lon: 24.94, tz: 2, zone: "Europe/Helsinki" },
  { name: "Kharkiv", country: "Ukraine", lat: 49.99, lon: 36.23, tz: 2, zone: "Europe/Kyiv" },
  { name: "Krakow", country: "Poland", lat: 50.06, lon: 19.94, tz: 1, zone: "Europe/Warsaw" },
  { name: "Kyiv", country: "Ukraine", lat: 50.45, lon: 30.52, tz: 2, zone: "Europe/Kyiv" },
  { name: "Lisbon", country: "Portugal", lat: 38.72, lon: -9.14, tz: 0, zone: "Europe/Lisbon" },
  { name: "Liverpool", country: "UK", lat: 53.41, lon: -2.98, tz: 0, zone: "Europe/London" },
  { name: "Ljubljana", country: "Slovenia", lat: 46.06, lon: 14.51, tz: 1, zone: "Europe/Ljubljana" },
  { name: "London", country: "UK", lat: 51.51, lon: -0.13, tz: 0, zone: "Europe/London" },
  { name: "Lviv", country: "Ukraine", lat: 49.84, lon: 24.03, tz: 2, zone: "Europe/Kyiv" },
  { name: "Lyon", country: "France", lat: 45.76, lon: 4.84, tz: 1, zone: "Europe/Paris" },
  { name: "Madrid", country: "Spain", lat: 40.42, lon: -3.70, tz: 1, zone: "Europe/Madrid" },
  { name: "Malmo", country: "Sweden", lat: 55.60, lon: 13.00, tz: 1, zone: "Europe/Stockholm" },
  { name: "Manchester", country: "UK", lat: 53.48, lon: -2.24, tz: 0, zone: "Europe/London" },
  { name: "Marseille", country: "France", lat: 43.30, lon: 5.37, tz: 1, zone: "Europe/Paris" },
  { name: "Milan", country: "Italy", lat: 45.46, lon: 9.19, tz: 1, zone: "Europe/Rome" },
  { name: "Minsk", country: "Belarus", lat: 53.90, lon: 27.57, tz: 3, zone: "Europe/Minsk" },
  { name: "Monaco", country: "Monaco", lat: 43.73, lon: 7.42, tz: 1, zone: "Europe/Monaco" },
  { name: "Moscow", country: "Russia", lat: 55.76, lon: 37.62, tz: 3, zone: "Europe/Moscow" },
  { name: "Munich", country: "Germany", lat: 48.14, lon: 11.58, tz: 1, zone: "Europe/Berlin" },
  { name: "Naples", country: "Italy", lat: 40.85, lon: 14.27, tz: 1, zone: "Europe/Rome" },
  { name: "Nice", country: "France", lat: 43.71, lon: 7.26, tz: 1, zone: "Europe/Paris" },
  { name: "Odesa", country: "Ukraine", lat: 46.48, lon: 30.73, tz: 2, zone: "Europe/Kyiv" },
  { name: "Odessa", country: "Ukraine", lat: 46.48, lon: 30.73, tz: 2, zone: "Europe/Kyiv" },
  { name: "Oslo", country: "Norway", lat: 59.91, lon: 10.75, tz: 1, zone: "Europe/Oslo" },
  { name: "Palermo", country: "Italy", lat: 38.12, lon: 13.36, tz: 1, zone: "Europe/Rome" },
  { name: "Paris", country: "France", lat: 48.86, lon: 2.35, tz: 1, zone: "Europe/Paris" },
  { name: "Porto", country: "Portugal", lat: 41.15, lon: -8.61, tz: 0, zone: "Europe/Lisbon" },
  { name: "Prague", country: "Czech Republic", lat: 50.08, lon: 14.44, tz: 1, zone: "Europe/Prague" },
  { name: "Riga", country: "Latvia", lat: 56.95, lon: 24.11, tz: 2, zone: "Europe/Riga" },
  { name: "Rome", country: "Italy", lat: 41.90, lon: 12.50, tz: 1, zone: "Europe/Rome" },
  { name: "Saint Petersburg", country: "Russia", lat: 59.93, lon: 30.32, tz: 3, zone: "Europe/Moscow" },
  { name: "Sarajevo", country: "Bosnia", lat: 43.86, lon: 18.41, tz: 1, zone: "Europe/Sarajevo" },
  { name: "Seville", country: "Spain", lat: 37.39, lon: -5.98, tz: 1, zone: "Europe/Madrid" },
  { name: "Sofia", country: "Bulgaria", lat: 42.70, lon: 23.32, tz: 2, zone: "Europe/Sofia" },
  { name: "Stockholm", country: "Sweden", lat: 59.33, lon: 18.07, tz: 1, zone: "Europe/Stockholm" },
  { name: "Tallinn", country: "Estonia", lat: 59.44, lon: 24.75, tz: 2, zone: "Europe/Tallinn" },
  { name: "Thessaloniki", country: "Greece", lat: 40.64, lon: 22.94, tz: 2, zone: "Europe/Athens" },
  { name: "Tirana", country: "Albania", lat: 41.33, lon: 19.82, tz: 1, zone: "Europe/Tirane" },
  { name: "Turin", country: "Italy", lat: 45.07, lon: 7.69, tz: 1, zone: "Europe/Rome" },
  { name: "Valencia", country: "Spain", lat: 39.47, lon: -0.38, tz: 1, zone: "Europe/Madrid" },
  { name: "Venice", country: "Italy", lat: 45.44, lon: 12.34, tz: 1, zone: "Europe/Rome" },
  { name: "Vienna", country: "Austria", lat: 48.21, lon: 16.37, tz: 1, zone: "Europe/Vienna" },
  { name: "Vilnius", country: "Lithuania", lat: 54.69, lon: 25.28, tz: 2, zone: "Europe/Vilnius" },
  { name: "Warsaw", country: "Poland", lat: 52.23, lon: 21.01, tz: 1, zone: "Europe/Warsaw" },
  { name: "Wroclaw", country: "Poland", lat: 51.11, lon: 17.04, tz: 1, zone: "Europe/Warsaw" },
  { name: "Zagreb", country: "Croatia", lat: 45.81, lon: 15.98, tz: 1, zone: "Europe/Zagreb" },
  { name: "Zaporizhzhia", country: "Ukraine", lat: 47.84, lon: 35.14, tz: 2, zone: "Europe/Kyiv" },
  { name: "Zurich", country: "Switzerland", lat: 47.38, lon: 8.54, tz: 1, zone: "Europe/Zurich" },

  // ── NORTH AMERICA ──
  { name: "Atlanta", country: "USA", lat: 33.75, lon: -84.39, tz: -5, zone: "America/New_York" },
  { name: "Austin", country: "USA", lat: 30.27, lon: -97.74, tz: -6, zone: "America/Chicago" },
  { name: "Baltimore", country: "USA", lat: 39.29, lon: -76.61, tz: -5, zone: "America/New_York" },
  { name: "Boston", country: "USA", lat: 42.36, lon: -71.06, tz: -5, zone: "America/New_York" },
  { name: "Calgary", country: "Canada", lat: 51.05, lon: -114.07, tz: -7, zone: "America/Edmonton" },
  { name: "Charlotte", country: "USA", lat: 35.23, lon: -80.84, tz: -5, zone: "America/New_York" },
  { name: "Chicago", country: "USA", lat: 41.88, lon: -87.63, tz: -6, zone: "America/Chicago" },
  { name: "Columbus", country: "USA", lat: 39.96, lon: -83.00, tz: -5, zone: "America/New_York" },
  { name: "Dallas", country: "USA", lat: 32.78, lon: -96.80, tz: -6, zone: "America/Chicago" },
  { name: "Denver", country: "USA", lat: 39.74, lon: -104.99, tz: -7, zone: "America/Denver" },
  { name: "Detroit", country: "USA", lat: 42.33, lon: -83.05, tz: -5, zone: "America/Detroit" },
  { name: "Edmonton", country: "Canada", lat: 53.54, lon: -113.49, tz: -7, zone: "America/Edmonton" },
  { name: "Guadalajara", country: "Mexico", lat: 20.68, lon: -103.35, tz: -6, zone: "America/Mexico_City" },
  { name: "Guatemala City", country: "Guatemala", lat: 14.63, lon: -90.51, tz: -6, zone: "America/Guatemala" },
  { name: "Havana", country: "Cuba", lat: 23.11, lon: -82.37, tz: -5, zone: "America/Havana" },
  { name: "Honolulu", country: "USA", lat: 21.31, lon: -157.86, tz: -10, zone: "Pacific/Honolulu" },
  { name: "Houston", country: "USA", lat: 29.76, lon: -95.37, tz: -6, zone: "America/Chicago" },
  { name: "Indianapolis", country: "USA", lat: 39.77, lon: -86.16, tz: -5, zone: "America/Indiana/Indianapolis" },
  { name: "Jacksonville", country: "USA", lat: 30.33, lon: -81.66, tz: -5, zone: "America/New_York" },
  { name: "Kansas City", country: "USA", lat: 39.10, lon: -94.58, tz: -6, zone: "America/Chicago" },
  { name: "Kingston", country: "Jamaica", lat: 18.00, lon: -76.79, tz: -5, zone: "America/Jamaica" },
  { name: "Las Vegas", country: "USA", lat: 36.17, lon: -115.14, tz: -8, zone: "America/Los_Angeles" },
  { name: "Los Angeles", country: "USA", lat: 34.05, lon: -118.24, tz: -8, zone: "America/Los_Angeles" },
  { name: "Memphis", country: "USA", lat: 35.15, lon: -90.05, tz: -6, zone: "America/Chicago" },
  { name: "Mexico City", country: "Mexico", lat: 19.43, lon: -99.13, tz: -6, zone: "America/Mexico_City" },
  { name: "Miami", country: "USA", lat: 25.76, lon: -80.19, tz: -5, zone: "America/New_York" },
  { name: "Milwaukee", country: "USA", lat: 43.04, lon: -87.91, tz: -6, zone: "America/Chicago" },
  { name: "Minneapolis", country: "USA", lat: 44.98, lon: -93.27, tz: -6, zone: "America/Chicago" },
  { name: "Monterrey", country: "Mexico", lat: 25.67, lon: -100.31, tz: -6, zone: "America/Monterrey" },
  { name: "Montreal", country: "Canada", lat: 45.50, lon: -73.57, tz: -5, zone: "America/Toronto" },
  { name: "Nashville", country: "USA", lat: 36.16, lon: -86.78, tz: -6, zone: "America/Chicago" },
  { name: "New Orleans", country: "USA", lat: 29.95, lon: -90.07, tz: -6, zone: "America/Chicago" },
  { name: "New York", country: "USA", lat: 40.71, lon: -74.01, tz: -5, zone: "America/New_York" },
  { name: "Oklahoma City", country: "USA", lat: 35.47, lon: -97.52, tz: -6, zone: "America/Chicago" },
  { name: "Orlando", country: "USA", lat: 28.54, lon: -81.38, tz: -5, zone: "America/New_York" },
  { name: "Ottawa", country: "Canada", lat: 45.42, lon: -75.70, tz: -5, zone: "America/Toronto" },
  { name: "Panama City", country: "Panama", lat: 8.98, lon: -79.52, tz: -5, zone: "America/Panama" },
  { name: "Philadelphia", country: "USA", lat: 39.95, lon: -75.17, tz: -5, zone: "America/New_York" },
  { name: "Phoenix", country: "USA", lat: 33.45, lon: -112.07, tz: -7, zone: "America/Phoenix" },
  { name: "Pittsburgh", country: "USA", lat: 40.44, lon: -80.00, tz: -5, zone: "America/New_York" },
  { name: "Portland", country: "USA", lat: 45.52, lon: -122.68, tz: -8, zone: "America/Los_Angeles" },
  { name: "Raleigh", country: "USA", lat: 35.78, lon: -78.64, tz: -5, zone: "America/New_York" },
  { name: "Salt Lake City", country: "USA", lat: 40.76, lon: -111.89, tz: -7, zone: "America/Denver" },
  { name: "San Antonio", country: "USA", lat: 29.42, lon: -98.49, tz: -6, zone: "America/Chicago" },
  { name: "San Diego", country: "USA", lat: 32.72, lon: -117.16, tz: -8, zone: "America/Los_Angeles" },
  { name: "San Francisco", country: "USA", lat: 37.77, lon: -122.42, tz: -8, zone: "America/Los_Angeles" },
  { name: "San Jose", country: "USA", lat: 37.34, lon: -121.89, tz: -8, zone: "America/Los_Angeles" },
  { name: "San Juan", country: "Puerto Rico", lat: 18.47, lon: -66.11, tz: -4, zone: "America/Puerto_Rico" },
  { name: "Santo Domingo", country: "Dominican Republic", lat: 18.49, lon: -69.93, tz: -4, zone: "America/Santo_Domingo" },
  { name: "Seattle", country: "USA", lat: 47.61, lon: -122.33, tz: -8, zone: "America/Los_Angeles" },
  { name: "Tampa", country: "USA", lat: 27.95, lon: -82.46, tz: -5, zone: "America/New_York" },
  { name: "Toronto", country: "Canada", lat: 43.65, lon: -79.38, tz: -5, zone: "America/Toronto" },
  { name: "Vancouver", country: "Canada", lat: 49.28, lon: -123.12, tz: -8, zone: "America/Vancouver" },
  { name: "Washington DC", country: "USA", lat: 38.91, lon: -77.04, tz: -5, zone: "America/New_York" },
  { name: "Winnipeg", country: "Canada", lat: 49.90, lon: -97.14, tz: -6, zone: "America/Winnipeg" },

  // ── SOUTH AMERICA ──
  { name: "Bogota", country: "Colombia", lat: 4.71, lon: -74.07, tz: -5, zone: "America/Bogota" },
  { name: "Brasilia", country: "Brazil", lat: -15.79, lon: -47.88, tz: -3, zone: "America/Sao_Paulo" },
  { name: "Buenos Aires", country: "Argentina", lat: -34.60, lon: -58.38, tz: -3, zone: "America/Argentina/Buenos_Aires" },
  { name: "Cali", country: "Colombia", lat: 3.45, lon: -76.53, tz: -5, zone: "America/Bogota" },
  { name: "Caracas", country: "Venezuela", lat: 10.48, lon: -66.90, tz: -4, zone: "America/Caracas" },
  { name: "Cartagena", country: "Colombia", lat: 10.39, lon: -75.51, tz: -5, zone: "America/Bogota" },
  { name: "Curitiba", country: "Brazil", lat: -25.43, lon: -49.27, tz: -3, zone: "America/Sao_Paulo" },
  { name: "Fortaleza", country: "Brazil", lat: -3.72, lon: -38.53, tz: -3, zone: "America/Fortaleza" },
  { name: "Guayaquil", country: "Ecuador", lat: -2.17, lon: -79.92, tz: -5, zone: "America/Guayaquil" },
  { name: "La Paz", country: "Bolivia", lat: -16.49, lon: -68.12, tz: -4, zone: "America/La_Paz" },
  { name: "Lima", country: "Peru", lat: -12.05, lon: -77.04, tz: -5, zone: "America/Lima" },
  { name: "Medellin", country: "Colombia", lat: 6.25, lon: -75.56, tz: -5, zone: "America/Bogota" },
  { name: "Montevideo", country: "Uruguay", lat: -34.91, lon: -56.19, tz: -3, zone: "America/Montevideo" },
  { name: "Quito", country: "Ecuador", lat: -0.18, lon: -78.47, tz: -5, zone: "America/Guayaquil" },
  { name: "Recife", country: "Brazil", lat: -8.05, lon: -34.87, tz: -3, zone: "America/Recife" },
  { name: "Rio de Janeiro", country: "Brazil", lat: -22.91, lon: -43.17, tz: -3, zone: "America/Sao_Paulo" },
  { name: "Salvador", country: "Brazil", lat: -12.97, lon: -38.51, tz: -3, zone: "America/Bahia" },
  { name: "Santiago", country: "Chile", lat: -33.45, lon: -70.67, tz: -4, zone: "America/Santiago" },
  { name: "São Paulo", country: "Brazil", lat: -23.55, lon: -46.63, tz: -3, zone: "America/Sao_Paulo" },
  { name: "Sao Paulo", country: "Brazil", lat: -23.55, lon: -46.63, tz: -3, zone: "America/Sao_Paulo" },

  // ── OCEANIA ──
  { name: "Adelaide", country: "Australia", lat: -34.93, lon: 138.60, tz: 9.5, zone: "Australia/Adelaide" },
  { name: "Auckland", country: "New Zealand", lat: -36.85, lon: 174.76, tz: 12, zone: "Pacific/Auckland" },
  { name: "Brisbane", country: "Australia", lat: -27.47, lon: 153.03, tz: 10, zone: "Australia/Brisbane" },
  { name: "Christchurch", country: "New Zealand", lat: -43.53, lon: 172.64, tz: 12, zone: "Pacific/Auckland" },
  { name: "Melbourne", country: "Australia", lat: -37.81, lon: 144.96, tz: 10, zone: "Australia/Melbourne" },
  { name: "Perth", country: "Australia", lat: -31.95, lon: 115.86, tz: 8, zone: "Australia/Perth" },
  { name: "Sydney", country: "Australia", lat: -33.87, lon: 151.21, tz: 10, zone: "Australia/Sydney" },
  { name: "Wellington", country: "New Zealand", lat: -41.29, lon: 174.78, tz: 12, zone: "Pacific/Auckland" },
];

/** Fuzzy search cities — matches partial name, case-insensitive */
export function searchCities(query: string, limit = 8): CityData[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();

  // Exact start match first, then contains
  const startsWith: CityData[] = [];
  const contains: CityData[] = [];

  for (const city of CITIES) {
    const name = city.name.toLowerCase();
    if (name.startsWith(q)) {
      startsWith.push(city);
    } else if (name.includes(q)) {
      contains.push(city);
    }
  }

  return [...startsWith, ...contains].slice(0, limit);
}

/** Lookup exact city (case-insensitive) */
export function lookupCity(name: string): CityData | null {
  if (!name) return null;
  const q = name.toLowerCase().trim();
  return CITIES.find(c => c.name.toLowerCase() === q) || null;
}

/* ── Historical UTC offsets via the runtime's full IANA tz database ── */

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function offsetOfInstant(zone: string, utcMs: number): number {
  let dtf = dtfCache.get(zone);
  if (!dtf) {
    dtf = new Intl.DateTimeFormat("en-US", {
      timeZone: zone,
      timeZoneName: "longOffset",
      year: "numeric",
    });
    dtfCache.set(zone, dtf);
  }
  const name =
    dtf.formatToParts(new Date(utcMs)).find((p) => p.type === "timeZoneName")?.value ?? "GMT";
  // "GMT" alone means +0; otherwise "GMT+03:00" / "GMT-04:00" / "GMT+5:30"-style.
  const m = name.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  return sign * (parseInt(m[2], 10) + (m[3] ? parseInt(m[3], 10) / 60 : 0));
}

/**
 * Historical UTC offset (hours, east positive) for a wall-clock instant
 * in an IANA zone — DST and past zone reforms included.
 *
 * Iterative resolve: read the wall clock as if UTC, ask the zone what
 * offset it reports at that instant, shift, ask again. Two iterations
 * converge everywhere outside pathological transitions.
 * Returns NaN when the zone id is missing or unknown to the runtime.
 */
export function utcOffsetHours(
  zone: string | undefined,
  y: number,
  m: number,
  d: number,
  hh: number,
  mm: number,
): number {
  if (!zone) return NaN;
  try {
    const wall = new Date(0);
    wall.setUTCFullYear(y, m - 1, d);
    wall.setUTCHours(hh, mm, 0, 0);
    const wallMs = wall.getTime();
    let off = offsetOfInstant(zone, wallMs);
    off = offsetOfInstant(zone, wallMs - off * 3600_000);
    return off;
  } catch {
    return NaN;
  }
}

/** "UTC+3", "UTC−4", "UTC+5:30" — for the resolved-offset line under forms. */
export function fmtUtcOffset(off: number): string {
  const sign = off < 0 ? "−" : "+";
  const abs = Math.abs(off);
  const h = Math.floor(abs);
  const mins = Math.round((abs - h) * 60);
  return `UTC${sign}${h}${mins ? ":" + String(mins).padStart(2, "0") : ""}`;
}

/**
 * True when the zone observes summer time at that wall-clock instant —
 * offset exceeds the year's standard (minimum of mid-January/mid-July).
 */
export function isSummerTime(zone: string | undefined, y: number, m: number, d: number, hh: number, mm: number): boolean {
  const off = utcOffsetHours(zone, y, m, d, hh, mm);
  if (!Number.isFinite(off)) return false;
  const jan = utcOffsetHours(zone, y, 1, 15, 12, 0);
  const jul = utcOffsetHours(zone, y, 7, 15, 12, 0);
  const std = Math.min(jan, jul);
  return Number.isFinite(std) && off > std;
}
