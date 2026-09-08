// Default pre-populated profiles for rural testing
const profiles = {
  'default': {
    name: 'Ramesh Kisan',
    phone: '9876543210',
    social_category: 'OBC',
    gender: 'MALE',
    annual_family_income: 180000,
    state: 'Maharashtra',
    district: 'Nashik',
    mandal_or_block: 'Niphad',
    village_name: 'Pimpalgaon Baswant',
    pincode: '422209',
    latitude: 20.1706,
    longitude: 73.9840,
    available_capital: 300000,
    liquid_reserve: 20000,
    land_acres: 2.0,
    has_shop_building: false,
    has_vehicle: true,
    has_machinery: false,
    has_electricity: true,
    has_water_source: true,
    has_internet: true,
    has_storage_facility: false,
    skills: ['farming', 'agriculture'],
    experience_years: 5,
    business_interest: null,
    target_monthly_income: 25000,
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
