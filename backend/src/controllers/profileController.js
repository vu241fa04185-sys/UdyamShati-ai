// Clean initial profile - no hardcoded assumptions or dummy names
const profiles = {
  'default': {
    name: null,
    photo: '',
    gender: null,
    address: null,
    phone: null,
    social_category: null,
    annual_family_income: null,
    state: null,
    district: null,
    mandal_or_block: null,
    village_name: null,
    pincode: null,
    post: null,
    police_station: null,
    latitude: null,
    longitude: null,
    available_capital: null,
    liquid_reserve: null,
    land_acres: null,
    has_shop_building: false,
    has_vehicle: false,
    has_machinery: false,
    has_electricity: true,
    has_water_source: true,
    has_internet: true,
    has_storage_facility: false,
    skills: [],
    experience_years: null,
    business_interest: null,
    target_monthly_income: null,
    risk_preference: 'MODERATE',
    preferred_language: 'hi',
    analysis_radius_km: 10.0
  }
};

exports.getProfile = (req, res) => {
  const userId = req.user?.id || 'default';
  const profile = profiles[userId] || profiles['default'];
  res.json(profile);
};

exports.updateProfile = (req, res) => {
  const userId = req.user?.id || 'default';
  const current = profiles[userId] || { ...profiles['default'] };
  profiles[userId] = {
    ...current,
    ...req.body
  };
  res.json({ message: 'Profile updated successfully', profile: profiles[userId] });
};
