export async function reverseGeocode(lat, lng) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error("VITE_GOOGLE_MAPS_API_KEY não configurada no .env");
    return null;
  }
  
  try {
    const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
    const data = await response.json();
    
    if (data.status === 'OK' && data.results.length > 0) {
      const addressComponents = data.results[0].address_components;
      let city = '';
      let state = '';
      
      // Tenta achar cidade e estado
      for (const component of addressComponents) {
        if (component.types.includes('administrative_area_level_2') || component.types.includes('locality')) {
          if (!city) city = component.long_name;
        }
        if (component.types.includes('administrative_area_level_1')) {
          state = component.short_name;
        }
      }
      return { city, state };
    }
  } catch (err) {
    console.error("Erro no geocoding:", err);
  }
  return null;
}
