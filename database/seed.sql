-- =============================================================================
-- SIH26091: Seed Data for Hyper-Local Business Advisory
-- Realistic Indian Rural Locations, Competitor Clusters, Schemes, and Rules
-- =============================================================================

-- 1. Insert Locations
INSERT INTO locations (id, village_name, mandal_or_block, district, state, pincode, latitude, longitude, population, households, road_connectivity_grade, power_reliability_hours, nearest_mandi_distance_km)
VALUES
('a1111111-1111-1111-1111-111111111111', 'Pimpalgaon Baswant', 'Niphad', 'Nashik', 'Maharashtra', '422209', 20.1706000, 73.9840000, 14200, 2800, 'A', 21.5, 3.2),
('a2222222-2222-2222-2222-222222222222', 'Kankipadu', 'Kankipadu', 'Krishna', 'Andhra Pradesh', '521151', 16.4258000, 80.7712000, 16500, 3400, 'A', 22.0, 6.0),
('a3333333-3333-3333-3333-333333333333', 'Chaubeypur', 'Chaubeypur', 'Varanasi', 'Uttar Pradesh', '221104', 25.4380000, 83.0560000, 11800, 2300, 'B', 19.0, 7.5),
('a4444444-4444-4444-4444-444444444444', 'Mogalthur', 'Mogalthur', 'West Godavari', 'Andhra Pradesh', '534281', 16.4170000, 81.6030000, 13400, 2900, 'B', 20.0, 9.0)
ON CONFLICT (id) DO NOTHING;

-- 2. Insert Business Categories
INSERT INTO business_categories (id, category_code, name_en, name_hi, name_te, sector, description, min_capital, max_capital, min_land_acres, requires_water, requires_three_phase_power, typical_margin_pct, base_monthly_revenue, base_monthly_expense, risk_tier, seasonality_factor)
VALUES
('b1111111-1111-1111-1111-111111111111', 'VEGETABLE_FARMING', 'Polyhouse Vegetable Farming', 'सब्जी उत्पादन (पॉलीहाउस/प्राकृतिक)', 'పాలీహౌస్ కూరగాయల సాగు', 'AGRI_ALLIED', 'High-density seasonal and exotic vegetable cultivation with drip irrigation and local mandi linkage.', 150000.00, 500000.00, 1.0, TRUE, FALSE, 32.0, 65000.00, 42000.00, 'MEDIUM', 'MODERATE'),

('b2222222-2222-2222-2222-222222222222', 'DAIRY_FARMING', 'Commercial Dairy Farming (2-5 Cows)', 'डेयरी फार्मिंग (दुग्ध व्यवसाय)', 'వాణిజ్య పాడి పరిశ్రమ', 'AGRI_ALLIED', '2-5 Murrah buffaloes or HF cows with cooperative milk collection center tie-up and organic manure sales.', 200000.00, 800000.00, 0.5, TRUE, TRUE, 28.0, 75000.00, 48000.00, 'LOW', 'LOW'),

('b3333333-3333-3333-3333-333333333333', 'POULTRY_BROILER', 'Broiler Poultry Unit (1000 birds)', 'ब्रायलर पोल्ट्री फार्मिंग', 'బ్రాయిలర్ పౌల్ట్రీ యూనిట్', 'AGRI_ALLIED', 'Contract or independent broiler rearing unit with automated feeding troughs and regional integrator support.', 250000.00, 600000.00, 0.5, TRUE, TRUE, 22.0, 85000.00, 62000.00, 'HIGH', 'HIGH'),

('b4444444-4444-4444-4444-444444444444', 'MUSHROOM_FARMING', 'Oyster & Button Mushroom Cultivation', 'मशरूम उत्पादन यूनिट', 'పుట్టగొడుగుల పెంపకం', 'AGRI_ALLIED', 'Climate-controlled indoor bag cultivation with high protein value and growing town/restaurant demand.', 80000.00, 250000.00, 0.1, TRUE, FALSE, 40.0, 45000.00, 24000.00, 'LOW', 'LOW'),

('b5555555-5555-5555-5555-555555555555', 'FOOD_PROCESSING_MILL', 'Mini Flour & Spice Processing Mill', 'मिनी आटा एवं मसाला चक्की उद्योग', 'చిన్న పిండి & మసాలా ప్రాసెసింగ్ మిల్లు', 'MANUFACTURING', 'Motorized mini pulverizer for wheat, spices, gram flour, catering to daily household village milling.', 120000.00, 350000.00, 0.0, FALSE, TRUE, 35.0, 50000.00, 28000.00, 'LOW', 'LOW'),

('b6666666-6666-6666-6666-666666666666', 'KIRANA_DAILY_NEEDS', 'Rural Super-Kirana & Daily Provisions', 'ग्रामीण किराना एवं दैनिक आवश्यकता केंद्र', 'గ్రామీణ కిరాణా & రోజువారీ అవసరాల దుకాణం', 'RETAIL', 'Packaged FMCG, grains, dairy, seeds, hygiene items with UPI payments and doorstep delivery for hamlets.', 100000.00, 400000.00, 0.0, FALSE, FALSE, 18.0, 90000.00, 72000.00, 'LOW', 'LOW'),

('b7777777-7777-7777-7777-777777777777', 'AGRI_EQUIPMENT_RENTAL', 'Custom Hiring Agri-Equipment Centre', 'कृषि उपकरण कस्टम हायरिंग सेंटर', 'కస్టమ్ హైరింగ్ వ్యవసాయ పరికరాల కేంద్రం', 'SERVICE', 'Rotavators, power tillers, drone sprayers rented hourly to smallholders without capital to buy machinery.', 300000.00, 1000000.00, 0.2, FALSE, FALSE, 45.0, 70000.00, 32000.00, 'MEDIUM', 'HIGH'),

('b8888888-8888-8888-8888-888888888888', 'GOAT_REARING', 'Stall-Fed Goat Farming (20+1)', 'बकरी पालन इकाई (उन्नत नस्ल)', 'మేకల పెంపకం యూనిట్', 'AGRI_ALLIED', 'Osmanabadi or Boer stall-fed cross-breed goat farming with high meat demand and reproductive multiplier.', 140000.00, 350000.00, 0.2, TRUE, FALSE, 34.0, 40000.00, 22000.00, 'LOW', 'LOW')
ON CONFLICT (id) DO NOTHING;

-- 3. Insert Hyper-Local Competitors within 5-10 km of sample villages
INSERT INTO businesses (id, name, category_id, village_name, mandal, district, latitude, longitude, estimated_monthly_turnover, operational_years, status)
VALUES
-- Near Pimpalgaon Baswant (Nashik)
('c1111111-1111-1111-1111-111111111111', 'Godavari Dairy Farm', 'b2222222-2222-2222-2222-222222222222', 'Pimpalgaon Baswant', 'Niphad', 'Nashik', 20.1740000, 73.9870000, 85000.00, 4, 'ACTIVE'),
('c2222222-2222-2222-2222-222222222222', 'Sai Krupa Milk Centre', 'b2222222-2222-2222-2222-222222222222', 'Shirwade Vani', 'Niphad', 'Nashik', 20.1880000, 73.9650000, 60000.00, 2, 'ACTIVE'),
('c3333333-3333-3333-3333-333333333333', 'Kisan Seva Krishi Kendra', 'b7777777-7777-7777-7777-777777777777', 'Pimpalgaon Baswant', 'Niphad', 'Nashik', 20.1690000, 73.9820000, 95000.00, 5, 'ACTIVE'),
('c4444444-4444-4444-4444-444444444444', 'Niphad Masala & Atta Mill', 'b5555555-5555-5555-5555-555555555555', 'Pimpalgaon Baswant', 'Niphad', 'Nashik', 20.1712000, 73.9845000, 45000.00, 3, 'ACTIVE'),

-- Near Kankipadu (Krishna, AP)
('c5555555-5555-5555-5555-555555555555', 'Sri Krishna Dairy Parlour', 'b2222222-2222-2222-2222-222222222222', 'Kankipadu', 'Kankipadu', 'Krishna', 16.4270000, 80.7725000, 70000.00, 3, 'ACTIVE'),
('c6666666-6666-6666-6666-666666666666', 'Balaji General Store', 'b6666666-6666-6666-6666-666666666666', 'Kankipadu', 'Kankipadu', 'Krishna', 16.4250000, 80.7700000, 80000.00, 6, 'ACTIVE'),
('c7777777-7777-7777-7777-777777777777', 'Venkateswara Flour Mill', 'b5555555-5555-5555-5555-555555555555', 'Gosala', 'Kankipadu', 'Krishna', 16.4420000, 80.7550000, 52000.00, 2, 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Government Schemes (Focusing on MoSJE SIH26091 guidelines)
INSERT INTO schemes (id, scheme_code, organization, title_en, title_hi, title_te, scheme_type, description, max_project_cost, max_loan_amount, beneficiary_margin_pct, concessional_loan_pct, interest_rate_pct, tenure_years, moratorium_months, subsidy_pct, eligible_social_categories, source_url, last_verified_date)
VALUES
('s1111111-1111-1111-1111-111111111111', 'NBCFDC_MICRO_FINANCE', 'MoSJE - NBCFDC', 'NBCFDC Micro Finance Scheme', 'एनबीसीएफडीसी सूक्ष्म वित्त योजना (ओबीसी)', 'ఎన్‌బీసీఎఫ్‌డీసీ సూక్ష్మ ఆర్థిక పథకం', 'MICRO_FINANCE', 'Concessional micro-credit up to ₹1.40 Lakh for small target group micro-entrepreneurs living below double the poverty line.', 140000.00, 125000.00, 10.0, 90.0, 6.50, 3, 3, 0.0, '{"OBC", "DNT"}', 'https://nbcfdc.gov.in/schemes/micro-finance', '2026-03-01'),

('s2222222-2222-2222-2222-222222222222', 'NBCFDC_TERM_LOAN', 'MoSJE - NBCFDC', 'NBCFDC General Term Loan Scheme', 'एनबीसीएफडीसी सामान्य सावधि ऋण योजना', 'ఎన్‌బీసీఎఫ్‌డీసీ సాధారణ టర్మ్ లోన్ పథకం', 'TERM_LOAN', 'Concessional term loans from ₹1.40 Lakh up to ₹50.0 Lakh with 10% beneficiary margin and 8% p.a. interest rate for viable income generation projects.', 5000000.00, 4500000.00, 10.0, 90.0, 8.00, 7, 6, 0.0, '{"OBC", "DNT"}', 'https://nbcfdc.gov.in/schemes/term-loan', '2026-03-01'),

('s3333333-3333-3333-3333-333333333333', 'NSFDC_TERM_LOAN', 'MoSJE - NSFDC', 'NSFDC Term Loan for SC Entrepreneurs', 'एनएसएफडीसी सावधि ऋण योजना (अनुसूचित जाति)', 'ఎన్‌ఎస్‌ఎఫ్‌డీసీ టర్మ్ లోన్ పథకం', 'TERM_LOAN', 'Concessional term finance for Scheduled Caste micro-entrepreneurs up to ₹50 Lakh with 6.0% - 7.5% subsidized interest rate.', 5000000.00, 4500000.00, 10.0, 90.0, 7.00, 7, 6, 0.0, '{"SC"}', 'https://nsfdc.nic.in/en/term-loan', '2026-02-15'),

('s4444444-4444-4444-4444-444444444444', 'PMEGP_RURAL_MICRO', 'KVIC - Ministry of MSME', 'PMEGP Credit Linked Capital Subsidy Scheme', 'प्रधानमंत्री रोजगार सृजन कार्यक्रम (PMEGP)', 'ప్రధానమంత్రి ఉపాధి కల్పన కార్యక్రమం', 'SUBSIDY', 'Credit linked subsidy program providing 25% to 35% government capital subsidy for rural micro enterprises in manufacturing and service.', 5000000.00, 4500000.00, 10.0, 90.0, 8.50, 7, 6, 35.0, '{"ALL"}', 'https://www.kviconline.gov.in/pmegpeportal/', '2026-03-05'),

('s5555555-5555-5555-5555-555555555555', 'PM_MUDRA_KISHORE', 'Dept of Financial Services (DFS)', 'Pradhan Mantri Mudra Yojana (Kishore)', 'प्रधानमंत्री मुद्रा योजना (किशोर)', 'ప్రధానమంత్రి ముద్ర యోజన (కిషోర్)', 'TERM_LOAN', 'Collateral-free working capital and term loans from ₹50,000 to ₹5,00,000 for expanding micro enterprises.', 500000.00, 500000.00, 15.0, 85.0, 9.25, 5, 3, 0.0, '{"ALL"}', 'https://www.mudra.org.in/', '2026-02-28'),

('s6666666-6666-6666-6666-666666666666', 'PM_VISHWAKARMA', 'MoMSME & MoSJE', 'PM Vishwakarma Artisan Support Scheme', 'पीएम विश्वकर्मा योजना (कारीगर एवं शिल्पकार)', 'పీఎం విశ్వకర్మ పథకం', 'MICRO_FINANCE', 'Collateral-free subsidized credit @ 5% interest with ₹15,000 modern toolkit grant and skill certification.', 300000.00, 300000.00, 5.0, 95.0, 5.00, 3, 3, 10.0, '{"OBC", "SC", "ST", "GENERAL"}', 'https://pmvishwakarma.gov.in/', '2026-03-01')
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Deterministic Eligibility Rules
INSERT INTO scheme_rules (id, scheme_id, rule_code, parameter_name, operator, threshold_value, is_mandatory, description_en, description_hi)
VALUES
-- NBCFDC Micro Finance Rules
('r1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'NBCFDC_MICRO_COST', 'project_cost', '<=', '140000', TRUE, 'Project cost must not exceed ₹1.40 Lakh', 'परियोजना लागत ₹1.40 लाख से अधिक नहीं होनी चाहिए'),
('r2222222-2222-2222-2222-222222222222', 's1111111-1111-1111-1111-111111111111', 'NBCFDC_MICRO_COMM', 'social_category', 'IN', 'OBC,DNT', TRUE, 'Applicant must belong to OBC or DNT category', 'आवेदक अन्य पिछड़ा वर्ग (OBC) या विमुक्त जनजाति (DNT) से होना चाहिए'),
('r3333333-3333-3333-3333-333333333333', 's1111111-1111-1111-1111-111111111111', 'NBCFDC_MICRO_INC', 'annual_family_income', '<=', '300000', TRUE, 'Annual family income must be within ₹3.00 Lakh', 'वार्षिक पारिवारिक आय ₹3.00 लाख से कम होनी चाहिए'),

-- NBCFDC Term Loan Rules
('r4444444-4444-4444-4444-444444444444', 's2222222-2222-2222-2222-222222222222', 'NBCFDC_TERM_COST', 'project_cost', '<=', '5000000', TRUE, 'Project cost up to ₹50 Lakh', 'परियोजना लागत ₹50 लाख तक'),
('r5555555-5555-5555-5555-555555555555', 's2222222-2222-2222-2222-222222222222', 'NBCFDC_TERM_COMM', 'social_category', 'IN', 'OBC,DNT', TRUE, 'Applicant must belong to OBC or DNT category', 'आवेदक ओबीसी वर्ग से होना चाहिए'),

-- NSFDC Term Loan Rules
('r6666666-6666-6666-6666-666666666666', 's3333333-3333-3333-3333-333333333333', 'NSFDC_COMM', 'social_category', '==', 'SC', TRUE, 'Applicant must belong to Scheduled Caste (SC) community', 'आवेदक अनुसूचित जाति (SC) वर्ग से होना चाहिए'),

-- PMEGP Rules
('r7777777-7777-7777-7777-777777777777', 's4444444-4444-4444-4444-444444444444', 'PMEGP_AGE', 'age', '>=', '18', TRUE, 'Applicant must be at least 18 years old', 'आवेदक की आयु न्यूनतम 18 वर्ष होनी चाहिए'),
('r8888888-8888-8888-8888-888888888888', 's4444444-4444-4444-4444-444444444444', 'PMEGP_MAX_COST', 'project_cost', '<=', '5000000', TRUE, 'Manufacturing projects up to ₹50L, Service up to ₹20L', 'विनिर्माण ₹50 लाख तक, सेवा ₹20 लाख तक')
ON CONFLICT (id) DO NOTHING;
