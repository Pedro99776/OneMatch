export async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`, {
      headers: {
        'Accept-Language': 'pt-BR'
      }
    });
    const data = await response.json();
    
    if (data && data.address) {
      const city = data.address.city || data.address.town || data.address.village || data.address.municipality || '';
      const state = data.address.state || '';
      return { city, state };
    }
  } catch (err) {
    console.error("Erro no geocoding:", err);
  }
  return null;
}
