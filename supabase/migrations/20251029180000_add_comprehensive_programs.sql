-- Add comprehensive grants and loans for Arizona small businesses
-- This migration adds realistic funding programs to populate the app

-- Insert additional GRANTS
INSERT INTO public.programs (type, level, name, sponsor, state, county, city, url, description, industry_tags, demographics, min_amount, max_amount, deadline, rolling, status) VALUES

-- State-Level Grants
('GRANT', 'STATE', 'Arizona Competes Fund', 'Arizona Commerce Authority', 'AZ', NULL, NULL, 'https://www.azcommerce.com/incentives/arizona-competes-fund/', 'Performance-based incentive for businesses creating quality jobs in Arizona.', ARRAY['manufacturing', 'technology', 'professional services'], ARRAY[]::TEXT[], 50000, 5000000, NULL, true, 'OPEN'),

('GRANT', 'STATE', 'AZ Main Street Program', 'Arizona Commerce Authority', 'AZ', NULL, NULL, 'https://www.azcommerce.com/community/az-main-street/', 'Grants for downtown revitalization and historic preservation in Arizona communities.', ARRAY['retail', 'hospitality', 'arts'], ARRAY[]::TEXT[], 5000, 50000, '2025-12-31T00:00:00.000Z', false, 'OPEN'),

('GRANT', 'STATE', 'Rural Business Development Grant', 'Arizona Department of Commerce', 'AZ', NULL, NULL, 'https://www.azcommerce.com/rural/', 'Supporting rural businesses and economic development across Arizona.', ARRAY['agriculture', 'tourism', 'retail'], ARRAY[]::TEXT[], 10000, 100000, '2026-03-15T00:00:00.000Z', false, 'OPEN'),

('GRANT', 'STATE', 'Workforce Development Grant', 'Arizona Office of Economic Opportunity', 'AZ', NULL, NULL, 'https://www.azcommerce.com/workforce/', 'Training grants for businesses investing in employee skill development.', ARRAY['manufacturing', 'healthcare', 'technology'], ARRAY[]::TEXT[], 25000, 250000, NULL, true, 'OPEN'),

-- Local Grants - Maricopa County
('GRANT', 'LOCAL', 'Greater Phoenix Economic Council Grant', 'GPEC', 'AZ', 'Maricopa', 'Phoenix', 'https://www.gpec.org/', 'Business expansion and attraction incentives for the Phoenix metro area.', ARRAY['technology', 'manufacturing', 'logistics'], ARRAY[]::TEXT[], 20000, 500000, NULL, true, 'OPEN'),

('GRANT', 'LOCAL', 'City of Phoenix Small Business Grant', 'City of Phoenix', 'AZ', 'Maricopa', 'Phoenix', 'https://www.phoenix.gov/economic-development/', 'Grants for small businesses in designated Phoenix opportunity zones.', ARRAY['retail', 'food service', 'services'], ARRAY['minority-owned', 'women-owned'], 5000, 25000, '2026-02-28T00:00:00.000Z', false, 'OPEN'),

('GRANT', 'LOCAL', 'Scottsdale Arts District Grant', 'City of Scottsdale', 'AZ', 'Maricopa', 'Scottsdale', 'https://www.scottsdaleaz.gov/arts/', 'Supporting arts and cultural businesses in Scottsdale.', ARRAY['arts', 'entertainment', 'hospitality'], ARRAY[]::TEXT[], 3000, 15000, '2025-11-15T00:00:00.000Z', false, 'OPEN'),

('GRANT', 'LOCAL', 'Mesa Manufacturing Incentive', 'City of Mesa', 'AZ', 'Maricopa', 'Mesa', 'https://www.mesaaz.gov/business/', 'Incentives for manufacturing businesses establishing or expanding in Mesa.', ARRAY['manufacturing', 'aerospace', 'technology'], ARRAY[]::TEXT[], 50000, 750000, NULL, true, 'OPEN'),

('GRANT', 'LOCAL', 'Tempe Innovation Hub Grant', 'City of Tempe', 'AZ', 'Maricopa', 'Tempe', 'https://www.tempe.gov/business/', 'Supporting tech startups and innovation-driven businesses.', ARRAY['technology', 'biotech', 'cleantech'], ARRAY[]::TEXT[], 10000, 100000, '2026-01-31T00:00:00.000Z', false, 'OPEN'),

-- Local Grants - Pima County
('GRANT', 'LOCAL', 'Pima County Small Business Grant', 'Pima County', 'AZ', 'Pima', 'Tucson', 'https://webcms.pima.gov/business/', 'Economic development grants for Pima County small businesses.', ARRAY['retail', 'services', 'hospitality'], ARRAY['veteran-owned', 'women-owned'], 5000, 30000, '2026-04-30T00:00:00.000Z', false, 'OPEN'),

('GRANT', 'LOCAL', 'Tucson Hispanic Business Grant', 'City of Tucson', 'AZ', 'Pima', 'Tucson', 'https://www.tucsonaz.gov/business/', 'Supporting Hispanic-owned businesses in Tucson.', ARRAY['retail', 'food service', 'services'], ARRAY['hispanic-owned'], 3000, 20000, '2025-12-15T00:00:00.000Z', false, 'OPEN'),

-- National Grants
('GRANT', 'NATIONAL', 'SBIR Phase II', 'US Federal – multiple agencies', NULL, NULL, NULL, 'https://www.sbir.gov/', 'Second phase R&D funding for SBIR Phase I recipients.', ARRAY['technology', 'biotech', 'aerospace'], ARRAY[]::TEXT[], 500000, 1000000, '2026-06-30T00:00:00.000Z', false, 'OPEN'),

('GRANT', 'NATIONAL', 'STTR Phase I', 'US Federal – multiple agencies', NULL, NULL, NULL, 'https://www.sbir.gov/sttr', 'Small Business Technology Transfer program for collaborative R&D.', ARRAY['technology', 'biotech', 'research'], ARRAY[]::TEXT[], 50000, 225000, '2026-02-15T00:00:00.000Z', false, 'OPEN'),

('GRANT', 'NATIONAL', 'USDA Rural Business Development Grant', 'US Department of Agriculture', NULL, NULL, NULL, 'https://www.rd.usda.gov/programs-services/business-programs/', 'Supporting rural small businesses and economic development.', ARRAY['agriculture', 'food processing', 'tourism'], ARRAY[]::TEXT[], 10000, 500000, NULL, true, 'OPEN'),

('GRANT', 'NATIONAL', 'EDA Economic Adjustment Assistance', 'US Economic Development Administration', NULL, NULL, NULL, 'https://www.eda.gov/funding/', 'Grants for businesses in economically distressed areas.', ARRAY['manufacturing', 'services', 'technology'], ARRAY[]::TEXT[], 100000, 3000000, NULL, true, 'OPEN'),

('GRANT', 'NATIONAL', 'Minority Business Development Grant', 'US Minority Business Development Agency', NULL, NULL, NULL, 'https://www.mbda.gov/', 'Federal grants supporting minority-owned business enterprises.', ARRAY['retail', 'services', 'technology'], ARRAY['minority-owned'], 25000, 250000, '2026-05-31T00:00:00.000Z', false, 'OPEN'),

('GRANT', 'NATIONAL', 'Women-Owned Small Business Grant', 'US Small Business Administration', NULL, NULL, NULL, 'https://www.sba.gov/wosb', 'Federal grants and contracts for women-owned small businesses.', ARRAY['professional services', 'technology', 'manufacturing'], ARRAY['women-owned'], 15000, 150000, NULL, true, 'OPEN'),

('GRANT', 'NATIONAL', 'Veteran Business Grant Program', 'US Small Business Administration', NULL, NULL, NULL, 'https://www.sba.gov/veterans', 'Supporting veteran entrepreneurs and service-disabled veteran-owned businesses.', ARRAY['services', 'construction', 'technology'], ARRAY['veteran-owned'], 10000, 100000, NULL, true, 'OPEN');


-- Insert additional LOANS
INSERT INTO public.programs (type, level, name, sponsor, state, county, city, url, description, industry_tags, demographics, min_amount, max_amount, interest_min, interest_max, secured, use_cases, deadline, rolling, status) VALUES

-- State-Level Loans
('LOAN', 'STATE', 'Arizona Small Business Loan Program', 'Arizona Commerce Authority', 'AZ', NULL, NULL, 'https://www.azcommerce.com/loans/', 'Low-interest loans for Arizona small businesses up to 100 employees.', ARRAY['retail', 'manufacturing', 'services'], ARRAY[]::TEXT[], 10000, 500000, 3.5, 7.5, false, ARRAY['working capital', 'equipment', 'expansion'], NULL, true, 'OPEN'),

('LOAN', 'STATE', 'AZ Women Business Loan Fund', 'AZ Women Business Coalition', 'AZ', NULL, NULL, 'https://www.azwomen.org/', 'Loan fund specifically for women entrepreneurs in Arizona.', ARRAY['retail', 'services', 'professional services'], ARRAY['women-owned'], 5000, 100000, 4.0, 8.0, false, ARRAY['working capital', 'inventory', 'equipment'], NULL, true, 'OPEN'),

('LOAN', 'STATE', 'Arizona Growth Capital Loan', 'Arizona Commerce Authority', 'AZ', NULL, NULL, 'https://www.azcommerce.com/growth/', 'Flexible capital for high-growth Arizona businesses.', ARRAY['technology', 'manufacturing', 'healthcare'], ARRAY[]::TEXT[], 50000, 1000000, 5.0, 9.0, true, ARRAY['expansion', 'equipment', 'real estate'], NULL, true, 'OPEN'),

-- Local Loans - Maricopa County
('LOAN', 'LOCAL', 'Phoenix Community Loan Fund', 'Local First Arizona', 'AZ', 'Maricopa', 'Phoenix', 'https://www.localfirstaz.com/', 'Community-based lending for Phoenix independent businesses.', ARRAY['retail', 'food service', 'services'], ARRAY[]::TEXT[], 5000, 75000, 4.5, 10.0, false, ARRAY['working capital', 'equipment', 'inventory'], NULL, true, 'OPEN'),

('LOAN', 'LOCAL', 'Maricopa County Microenterprise Loan', 'Prestamos CDFI', 'AZ', 'Maricopa', NULL, 'https://www.prestamos.org/', 'Microloans for very small businesses in Maricopa County.', ARRAY['retail', 'services', 'food service'], ARRAY['minority-owned', 'women-owned'], 500, 10000, 8.0, 14.0, false, ARRAY['working capital', 'inventory', 'startup costs'], NULL, true, 'OPEN'),

('LOAN', 'LOCAL', 'Scottsdale Small Business Line of Credit', 'Western Alliance Bank', 'AZ', 'Maricopa', 'Scottsdale', 'https://www.westernalliancebank.com/', 'Flexible line of credit for established Scottsdale businesses.', ARRAY['retail', 'professional services', 'technology'], ARRAY[]::TEXT[], 25000, 250000, 5.5, 11.0, true, ARRAY['working capital', 'seasonal needs', 'inventory'], NULL, true, 'OPEN'),

('LOAN', 'LOCAL', 'Mesa Manufacturing Equipment Loan', 'Industrial Development Authority', 'AZ', 'Maricopa', 'Mesa', 'https://www.mesaaz.gov/', 'Equipment financing for Mesa-based manufacturers.', ARRAY['manufacturing', 'aerospace', 'technology'], ARRAY[]::TEXT[], 100000, 2000000, 4.0, 7.0, true, ARRAY['equipment', 'machinery', 'technology'], NULL, true, 'OPEN'),

-- Local Loans - Pima County
('LOAN', 'LOCAL', 'Tucson Hispanic Chamber Loan Fund', 'Tucson Hispanic Chamber', 'AZ', 'Pima', 'Tucson', 'https://www.tucsonhispanicchamber.org/', 'Loans for Hispanic business owners in Tucson area.', ARRAY['retail', 'food service', 'services'], ARRAY['hispanic-owned'], 5000, 50000, 6.0, 10.0, false, ARRAY['working capital', 'equipment', 'expansion'], NULL, true, 'OPEN'),

('LOAN', 'LOCAL', 'Pima County Construction Loan', 'Pima Federal Credit Union', 'AZ', 'Pima', NULL, 'https://www.pimafederal.org/', 'Construction and renovation loans for commercial properties.', ARRAY['construction', 'real estate', 'hospitality'], ARRAY[]::TEXT[], 50000, 1500000, 5.0, 8.5, true, ARRAY['real estate', 'renovation', 'construction'], NULL, true, 'OPEN'),

-- National Loans
('LOAN', 'NATIONAL', 'SBA 7(a) Loan', 'US Small Business Administration', NULL, NULL, NULL, 'https://www.sba.gov/funding-programs/loans/7a-loans', 'SBA flagship loan program for general small business purposes.', ARRAY['retail', 'services', 'manufacturing'], ARRAY[]::TEXT[], 5000, 5000000, 5.5, 10.0, true, ARRAY['working capital', 'equipment', 'real estate', 'expansion'], NULL, true, 'OPEN'),

('LOAN', 'NATIONAL', 'SBA 504 Loan', 'US Small Business Administration', NULL, NULL, NULL, 'https://www.sba.gov/funding-programs/loans/504-loans', 'Long-term, fixed-rate financing for major fixed assets.', ARRAY['manufacturing', 'retail', 'hospitality'], ARRAY[]::TEXT[], 125000, 5500000, 3.0, 6.5, true, ARRAY['real estate', 'equipment', 'construction'], NULL, true, 'OPEN'),

('LOAN', 'NATIONAL', 'SBA Microloan', 'US Small Business Administration', NULL, NULL, NULL, 'https://www.sba.gov/funding-programs/loans/microloans', 'Small loans for startups and underserved entrepreneurs.', ARRAY['retail', 'services', 'food service'], ARRAY['minority-owned', 'women-owned', 'veteran-owned'], 500, 50000, 8.0, 13.0, false, ARRAY['working capital', 'inventory', 'equipment', 'startup costs'], NULL, true, 'OPEN'),

('LOAN', 'NATIONAL', 'SBA Express Loan', 'US Small Business Administration', NULL, NULL, NULL, 'https://www.sba.gov/funding-programs/loans/express-loans', 'Fast-track SBA loan with expedited approval process.', ARRAY['retail', 'services', 'professional services'], ARRAY[]::TEXT[], 5000, 500000, 6.5, 11.5, true, ARRAY['working capital', 'equipment', 'expansion'], NULL, true, 'OPEN'),

('LOAN', 'NATIONAL', 'USDA Business & Industry Loan', 'US Department of Agriculture', NULL, NULL, NULL, 'https://www.rd.usda.gov/programs-services/business-programs/business-industry-loan-guarantees', 'Loans for rural businesses to create jobs and stimulate growth.', ARRAY['agriculture', 'manufacturing', 'food processing'], ARRAY[]::TEXT[], 50000, 10000000, 4.0, 7.5, true, ARRAY['working capital', 'equipment', 'real estate', 'expansion'], NULL, true, 'OPEN'),

('LOAN', 'NATIONAL', 'Veteran Small Business Loan', 'Various SBA Lenders', NULL, NULL, NULL, 'https://www.sba.gov/veterans', 'Special SBA loan terms and rates for veteran-owned businesses.', ARRAY['services', 'construction', 'technology', 'retail'], ARRAY['veteran-owned'], 5000, 500000, 4.5, 9.0, false, ARRAY['working capital', 'equipment', 'expansion'], NULL, true, 'OPEN'),

('LOAN', 'NATIONAL', 'Export Express Loan', 'US Small Business Administration', NULL, NULL, NULL, 'https://www.sba.gov/funding-programs/loans/export-loans', 'Financing for businesses engaged in exporting.', ARRAY['manufacturing', 'technology', 'wholesale'], ARRAY[]::TEXT[], 5000, 500000, 6.0, 10.5, false, ARRAY['working capital', 'equipment', 'export activities'], NULL, true, 'OPEN');
