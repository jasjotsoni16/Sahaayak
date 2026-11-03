// Demo data for local development: gig-work jobs around Chandigarh / Mohali / Panchkula.
// Used by scripts/seedGigJobs.js. Everything here is invented for demos: the employers are
// clearly marked (phone numbers 90000001xx, GSTINs starting with "DEMO") and can be removed
// again with `npm run seed-jobs -- --remove-demo`.
//
// Wages are realistic rupee amounts for the area. `salary_min`/`salary_max` mean:
//   daily    -> rupees per day
//   weekly   -> rupees per week
//   per_task -> rupees per delivery / visit / event / job (see the job description)
// coordinates are GeoJSON order: [longitude, latitude].

const DEMO_PASSWORD = 'Demo@1234';

const EMPLOYERS = [
  { key: 'canteen', name: 'Rajesh Sharma', company_name: 'Sharma Canteen & Catering', company_type: 'business', phone_number: '9000000101', gstin_number: 'DEMO000000101', city: 'Chandigarh' },
  { key: 'quickdrop', name: 'Neha Kapoor', company_name: 'QuickDrop Logistics', company_type: 'startup', phone_number: '9000000102', gstin_number: 'DEMO000000102', city: 'Mohali' },
  { key: 'homeserv', name: 'Gurpreet Gupta', company_name: 'Gupta Home Services', company_type: 'business', phone_number: '9000000103', gstin_number: 'DEMO000000103', city: 'Mohali' },
  { key: 'events', name: 'Vikram Malhotra', company_name: 'Royal Events & Weddings', company_type: 'business', phone_number: '9000000104', gstin_number: 'DEMO000000104', city: 'Chandigarh' },
  { key: 'security', name: 'Harbans Singh', company_name: 'SafeGuard Security Services', company_type: 'enterprise', phone_number: '9000000105', gstin_number: 'DEMO000000105', city: 'Chandigarh' },
  { key: 'builders', name: 'Amandeep Bajwa', company_name: 'BuildRight Contractors', company_type: 'business', phone_number: '9000000106', gstin_number: 'DEMO000000106', city: 'Panchkula' },
  { key: 'autocare', name: 'Sukhdev Singh', company_name: 'Singh Auto Care', company_type: 'individual', phone_number: '9000000107', gstin_number: 'DEMO000000107', city: 'Mohali' },
];

const GIG_JOBS = [
  {
    employer: 'quickdrop', title: 'Food delivery partner (own bike)',
    description: 'Deliver restaurant orders within a 5 km radius in Sector 17 and nearby. Choose your own hours; most partners do the lunch and dinner rush.',
    responsibilities: 'Pick up orders on time, deliver them hot, keep the delivery app updated and handle cash-on-delivery carefully.',
    skills: ['driving'], experience_required: 0, number_of_openings: 8, wage_type: 'per_task', salary_min: 30, salary_max: 60, negotiable: false,
    duration: 'Flexible hours, ongoing', city: 'Chandigarh', area: 'Sector 17', coordinates: [76.7827, 30.7398],
  },
  {
    employer: 'quickdrop', title: 'Grocery delivery rider',
    description: 'Morning and evening grocery deliveries for a dark store in Phase 7. Orders are small, so a two-wheeler is enough. Fuel allowance included in the daily rate.',
    responsibilities: 'Collect packed orders, deliver within 20 minutes, collect payment where required, return unsold items to the store.',
    skills: ['driving'], experience_required: 0, number_of_openings: 5, wage_type: 'daily', salary_min: 600, salary_max: 900, negotiable: true,
    duration: 'Daily, 6 days a week', city: 'Mohali', area: 'Phase 7', coordinates: [76.7179, 30.7046],
  },
  {
    employer: 'quickdrop', title: 'Festive-season parcel packer',
    description: 'Short contract to pack and label courier parcels in our Zirakpur warehouse during the festival rush. No experience needed; we train you on day one.',
    responsibilities: 'Pack items safely, label parcels, sort them by pin code and keep your packing table clean.',
    skills: ['warehouse_works'], experience_required: 0, number_of_openings: 12, wage_type: 'daily', salary_min: 500, salary_max: 650, negotiable: false,
    duration: '2 weeks', city: 'Zirakpur', area: 'VIP Road', coordinates: [76.8173, 30.6425],
  },
  {
    employer: 'quickdrop', title: 'Night shift parcel loader',
    description: 'Load and unload courier trucks at the Industrial Area hub between 10 pm and 6 am. Physically demanding work; night allowance is included in the rate.',
    responsibilities: 'Unload trucks, move cartons to the right bays, load outgoing vehicles and report damaged parcels.',
    skills: ['warehouse_works'], experience_required: 0, number_of_openings: 6, wage_type: 'daily', salary_min: 700, salary_max: 900, negotiable: false,
    duration: 'Nightly, ongoing', city: 'Chandigarh', area: 'Industrial Area Phase 1', coordinates: [76.8020, 30.7060],
  },
  {
    employer: 'events', title: 'Wedding waiter (weekend events)',
    description: 'Serve guests at weddings and receptions in Chandigarh and Mohali. Uniform provided. Pay is per event and includes a meal.',
    responsibilities: 'Set tables, serve food and drinks politely, clear plates and help clean up after the event.',
    skills: ['waiter'], experience_required: 0, number_of_openings: 10, wage_type: 'per_task', salary_min: 800, salary_max: 1200, negotiable: false,
    duration: 'Per event (about 6 hours)', city: 'Chandigarh', area: 'Sector 35', coordinates: [76.7589, 30.7243],
  },
  {
    employer: 'events', title: 'Bartender for private parties',
    description: 'Mix and serve cocktails and mocktails at house parties and corporate evenings. Experience with basic cocktails is needed; you bring your own tools.',
    responsibilities: 'Prepare drinks to the menu, keep the bar clean and stocked, and check guests\' age where required.',
    skills: ['bartending'], experience_required: 1, number_of_openings: 3, wage_type: 'per_task', salary_min: 1500, salary_max: 2500, negotiable: true,
    duration: 'Per event (4 to 6 hours)', city: 'Mohali', area: 'Sector 70', coordinates: [76.6930, 30.7110],
  },
  {
    employer: 'canteen', title: 'Party cook (up to 30 guests)',
    description: 'Cook North Indian vegetarian dishes for house parties and kitty events at the host\'s home. Ingredients are provided; you bring the know-how.',
    responsibilities: 'Plan the menu with the host, cook and plate for up to 30 guests, and leave the kitchen clean.',
    skills: ['cooking'], experience_required: 2, number_of_openings: 3, wage_type: 'per_task', salary_min: 1800, salary_max: 3000, negotiable: true,
    duration: 'Per event', city: 'Chandigarh', area: 'Sector 22', coordinates: [76.7737, 30.7333],
  },
  {
    employer: 'canteen', title: 'Dishwasher for the lunch rush',
    description: 'Wash utensils and keep the kitchen area clean during the busy lunch hours (11 am to 3 pm) at our Sector 22 canteen. A free meal is included.',
    responsibilities: 'Wash and stack dishes, clean the wash area and take out the kitchen waste.',
    skills: ['dishwashing'], experience_required: 0, number_of_openings: 2, wage_type: 'daily', salary_min: 450, salary_max: 600, negotiable: false,
    duration: '4 hours a day, ongoing', city: 'Chandigarh', area: 'Sector 22', coordinates: [76.7737, 30.7333],
  },
  {
    employer: 'homeserv', title: 'Home deep-cleaning team member',
    description: 'Join a two-person team deep-cleaning flats before people move in. All cleaning supplies and machines are provided.',
    responsibilities: 'Scrub kitchens and bathrooms, clean windows and floors, and finish the flat to the checklist standard.',
    skills: ['cleaning'], experience_required: 0, number_of_openings: 6, wage_type: 'per_task', salary_min: 700, salary_max: 1200, negotiable: false,
    duration: 'Per flat (about 5 hours)', city: 'Mohali', area: 'Sector 70', coordinates: [76.6930, 30.7110],
  },
  {
    employer: 'homeserv', title: 'Plumber for home repair visits',
    description: 'Fix leaking taps, blocked drains and fitting work at customer homes, booked through our app. You must have your own basic toolkit.',
    responsibilities: 'Diagnose the problem, quote honestly, complete the repair and take a photo of the finished job.',
    skills: ['plumbing'], experience_required: 2, number_of_openings: 4, wage_type: 'per_task', salary_min: 400, salary_max: 900, negotiable: true,
    duration: 'Per visit', city: 'Panchkula', area: 'Sector 5', coordinates: [76.8606, 30.6942],
  },
  {
    employer: 'homeserv', title: 'Electrician helper',
    description: 'Assist a senior electrician on wiring, fan, light and switchboard jobs in homes. A good way to learn the trade on the job.',
    responsibilities: 'Carry tools and materials, hold and fix wires under guidance, and clean up after each job.',
    skills: ['electric_work'], experience_required: 0, number_of_openings: 3, wage_type: 'daily', salary_min: 600, salary_max: 900, negotiable: false,
    duration: 'Daily, as jobs come in', city: 'Mohali', area: 'Phase 7', coordinates: [76.7179, 30.7046],
  },
  {
    employer: 'homeserv', title: 'Garden maintenance (weekly visits)',
    description: 'Look after lawns and potted plants in a housing society: trimming, watering, weeding and tidying. Two visits a week.',
    responsibilities: 'Mow and trim lawns, water and weed beds, and remove garden waste.',
    skills: ['gardening'], experience_required: 1, number_of_openings: 2, wage_type: 'weekly', salary_min: 2000, salary_max: 3000, negotiable: true,
    duration: 'Ongoing, 2 visits a week', city: 'Panchkula', area: 'Sector 20', coordinates: [76.8497, 30.6891],
  },
  {
    employer: 'builders', title: 'House painter (2 BHK repaint)',
    description: 'Interior repainting of a 2 BHK flat over about a week. Putty, primer and two coats; paint and brushes are supplied.',
    responsibilities: 'Prepare walls, apply putty and primer, paint two even coats and protect floors and furniture.',
    skills: ['painting'], experience_required: 2, number_of_openings: 4, wage_type: 'daily', salary_min: 800, salary_max: 1100, negotiable: true,
    duration: '5 to 7 days', city: 'Panchkula', area: 'Sector 5', coordinates: [76.8606, 30.6942],
  },
  {
    employer: 'builders', title: 'Construction site labourer',
    description: 'Daily-wage labour on a residential construction site: carrying material, mixing cement and general site work. Safety shoes and helmet are provided.',
    responsibilities: 'Carry bricks and cement, help with mixing and shuttering, and follow the site supervisor\'s safety rules.',
    skills: ['constructor_labour'], experience_required: 0, number_of_openings: 15, wage_type: 'daily', salary_min: 600, salary_max: 800, negotiable: false,
    duration: '3 weeks, may extend', city: 'Zirakpur', area: 'Dhakoli', coordinates: [76.8173, 30.6425],
  },
  {
    employer: 'builders', title: 'Carpenter for furniture fitting',
    description: 'Assemble and fit modular wardrobes and kitchen cabinets in new homes. Own hand tools needed; drilling machine provided on site.',
    responsibilities: 'Read the fitting plan, assemble and align units, fix hinges and handles, and make small on-site adjustments.',
    skills: ['carpentering'], experience_required: 3, number_of_openings: 2, wage_type: 'per_task', salary_min: 1000, salary_max: 2500, negotiable: true,
    duration: 'Per job (1 to 2 days)', city: 'Chandigarh', area: 'Sector 35', coordinates: [76.7589, 30.7243],
  },
  {
    employer: 'autocare', title: 'Car washer for housing society',
    description: 'Wash cars in the early morning at a housing society in Phase 7. Pay is per car, so you earn more the more cars you do.',
    responsibilities: 'Wash and dry cars without scratching them, clean the interior mats and keep the parking area tidy.',
    skills: ['vehicle_cleaning'], experience_required: 0, number_of_openings: 3, wage_type: 'per_task', salary_min: 120, salary_max: 200, negotiable: false,
    duration: 'Mornings, 6 am to 9 am', city: 'Mohali', area: 'Phase 7', coordinates: [76.7179, 30.7046],
  },
  {
    employer: 'autocare', title: 'Two-wheeler mechanic (weekend shifts)',
    description: 'Service and repair bikes and scooters at our garage on Saturdays and Sundays: oil change, brakes, chains and puncture work.',
    responsibilities: 'Inspect vehicles, carry out the service checklist, explain repairs to the customer and keep the tools in order.',
    skills: ['mechanic'], experience_required: 2, number_of_openings: 2, wage_type: 'daily', salary_min: 700, salary_max: 1000, negotiable: true,
    duration: 'Weekends, ongoing', city: 'Mohali', area: 'Phase 3B2', coordinates: [76.7160, 30.7140],
  },
  {
    employer: 'security', title: 'Night security guard for an event venue',
    description: 'Guard a marriage venue overnight during the wedding season. Uniform and a torch are provided. Shift runs from 8 pm to 8 am.',
    responsibilities: 'Check entry and exit, patrol the premises every hour, log incidents and call the supervisor in an emergency.',
    skills: ['security_guards'], experience_required: 1, number_of_openings: 4, wage_type: 'daily', salary_min: 700, salary_max: 900, negotiable: false,
    duration: 'Per night, wedding season', city: 'Chandigarh', area: 'Sector 35', coordinates: [76.7589, 30.7243],
  },
];

// Every listing here is gig work (short, flexible or per-task), so the type is stamped once.
const JOBS = GIG_JOBS.map((job) => ({ job_type: 'gig', ...job }));

module.exports = { DEMO_PASSWORD, EMPLOYERS, JOBS };
