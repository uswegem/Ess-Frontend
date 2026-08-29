import geoData from '../data/tanzania-locations.json';

// Real Tanzania administrative geo data (region -> district -> ward -> postcode), sourced
// from https://github.com/uswegem/mms-frontend's src/data/tanzania-locations.json (26
// regions, 158 districts, 3,964 wards, each ward carrying a real postal code) - not the
// design handoff's illustrative sample data. Used by the FSP Onboarding address cascade.

export function listRegions() {
  return geoData.map((r) => r.region).sort();
}

export function listDistricts(regionName) {
  const region = geoData.find((r) => r.region === regionName);
  return region ? region.districts.map((d) => d.name).sort() : [];
}

export function listWards(regionName, districtName) {
  const region = geoData.find((r) => r.region === regionName);
  const district = region?.districts.find((d) => d.name === districtName);
  return district ? district.wards.map((w) => w.name).sort() : [];
}

export function getPostcode(regionName, districtName, wardName) {
  const region = geoData.find((r) => r.region === regionName);
  const district = region?.districts.find((d) => d.name === districtName);
  const ward = district?.wards.find((w) => w.name === wardName);
  return ward?.postcode || '';
}
