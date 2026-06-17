import { Lead } from "@/types/lead";
import { locationDatabase, categories } from "./locationData";

const businessNames: Record<string, string[]> = {
  "Clinic": ["CareFirst Family Practice", "Metro Health Clinic", "Apex Urgent Care", "Wellness Center", "Pinnacle Medical", "Beacon Health"],
  "Hospital": ["City General Hospital", "Mercy Health Center", "Saint Jude Hospital", "Mount Sinai Medical Center", "Northwestern Hospital"],
  "Dental Clinic": ["Bright Smiles Dentistry", "Elite Dental Care", "Modern Dental Studio", "Downtown Dental Center", "Pearl Dental Clinic"],
  "Gym": ["Iron Temple Fitness", "Pulse Gym & Wellness", "Apex Athletics", "Elevate Health Club", "Vanguard Fitness"],
  "Restaurant": ["The Golden Spatula", "Truffle & Vine", "Crave Kitchen", "Sizzle Grill", "Urban Feast", "Bella Italia", "Karma Café"],
  "Hotel": ["The Grandview Suites", "Urban Ritz", "Summit Lodge & Spa", "Apex Hotel", "Marriott Plaza", "Anchor Inn"],
  "School": ["Greenwood Academy", "Horizon High School", "Saint Xavier School", "Oakridge International", "Beacon Elementary"],
  "Lawyer": ["Apex Law Chambers", "Vanguard & Associates LLP", "Justice Partners", "Sentinel Legal", "Core Law Group"],
  "CA": ["S. K. Mehta & Co. Chartered Accountants", "Reliant Tax & Audit Services", "Summit FinTax Consultants", "Sterling Auditing Services"],
  "Salon": ["Luxe Hair & Beauty Salon", "Glitz & Glamour Studio", "The Barber Lounge", "Velvet Salon", "Urban Shear & Style"],
  "Real Estate": ["BlueSky Properties", "Premier Realty", "Vanguard Real Estate Group", "Compass Estates", "Centennial Realtors"]
};

const indianBusinessNames: Record<string, string[]> = {
  "Clinic": ["Apollo Clinic", "Max Healthcare Clinic", "Practo Care Help", "Dr Batras Homeopathy", "Narayana Health Clinic"],
  "Hospital": ["Fortis Hospital", "Apollo Hospitals", "Max Super Speciality Hospital", "Kokilaben Dhirubhai Ambani Hospital", "Manipal Hospital"],
  "Dental Clinic": ["Clove Dental", "Sabka Dentists", "Dentzz Dental Care", "Apollo Dental Center", "MyDentist Clinic"],
  "ENT Clinic": ["Fortis ENT Clinic", "Apollo ENT Center", "Noida ENT Clinic", "Mumbai Ear Nose Throat Specialist", "Delhi ENT Care"],
  "Pathology Lab": ["Dr Lal PathLabs", "Metropolis Healthcare", "Thyrocare Technologies", "SRL Diagnostics", "Suburban Diagnostics"],
  "Gym": ["Cultfit Gym Center", "Golds Gym India", "Anytime Fitness", "Talwalkars Gym", "Nitrex Fitness Club"],
  "Restaurant": ["The Rameshwaram Cafe", "Barbeque Nation", "Truffles Restaurant", "Social Cafe Bar", "Bukhara Sheraton", "Karims Mughlai", "Saravana Bhavan"],
  "Hotel": ["The Taj Mahal Palace", "The Oberoi Grand", "ITC Grand Chola", "JW Marriott Plaza", "The Leela Palace", "Ginger Hotel"],
  "School": ["Delhi Public School", "The Doon School", "DAV Public School", "Ryan International School", "Kendriya Vidyalaya"],
  "College": ["St Stephens College", "IIT Bombay Campus", "Loyola College", "Christ University Bangalore", "Miranda House"],
  "Coaching Center": ["FIITJEE Ltd", "Allen Career Institute", "Aakash Institute", "Resonance Classes", "Career Launcher"],
  "Lawyer": ["Shardul Amarchand Mangaldas", "Khaitan and Co", "AZB and Partners", "Luthra and Luthra Law", "Trilegal Chambers"],
  "CA": ["SR Batliboi and Co", "Lodha and Co Chartered Accountants", "Singhi and Co Audit", "K S Aiyar and Co", "Haribhakti and Co"],
  "Architect": ["Hafeez Contractor Associates", "Morphogenesis Design", "Architects Combined", "Sanjay Puri Architects", "Abin Design Studio"],
  "Salon": ["Geetanjali Salon", "Jawed Habib Hair Salon", "Lakme Salon", "Enrich Salon Spa", "Loreal Professionnel Salon"],
  "Spa": ["O2 Spa India", "Kairali Ayurvedic Spa", "Tattva Spa", "The Quan Spa", "Aroma Thai Spa"],
  "Travel Agency": ["MakeMyTrip India", "Yatra Travels", "Thomas Cook India", "Cox and Kings", "SOTC Travel Services"],
  "Real Estate": ["DLF Properties", "Godrej Properties", "Sobha Developers", "Prestige Estates", "L and T Realty"],
  "Medical Store": ["Apollo Pharmacy", "Medplus Medicals", "Wellness Forever", "Netmeds Pharmacy", "1mg Wellness Store"],
  "Pharmacy": ["Apollo Pharmacy", "Medplus Pharmacy", "Wellness Forever", "Pharmeasy Point", "Noble Chemists"],
  "Diagnostic Center": ["Dr Lal PathLabs", "Metropolis Diagnostic Center", "SRL Diagnostics Labs", "Thyrocare Diagnostic Center", "Apollo Diagnostics"],
  "Veterinary Clinic": ["Max Vets Hospital", "Cessna Lifeline Veterinary Hospital", "Crown Vet", "The Pet Clinic", "Dr Saini Pet Clinic"],
  "NGO": ["Goonj NGO", "Smile Foundation", "GiveIndia Foundation", "HelpAge India", "Akshaya Patra Foundation"],
  "Construction Company": ["L and T Construction", "Tata Projects", "Shapoorji Pallonji", "Dilip Buildcon", "Hindustan Construction Co"],
  "Bakery": ["Theobroma Patisserie", "Kayani Bakery", "Flurys Kolkata", "Wengers Bakery", "Karachi Bakery"],
  "Boutique": ["Ritu Kumar Boutique", "Sabyasachi Couture", "Manish Malhotra Studio", "Anita Dongre Boutique", "Kalki Fashion"],
  "Supermarket": ["Reliance Smart Supermarket", "D-Mart", "More Retail Store", "Star Bazaar", "Big Bazaar"],
  "Pet Grooming": ["Heads Up For Tails", "The Pet Point", "Scoopy Scrub", "Paws and Claws Salon", "Furry Friends Grooming"],
  "Automobile Workshop": ["Maruti Suzuki Service", "Hyundai Care Workshop", "GoMechanic Garage", "Mahindra First Choice", "Bosch Car Service"],
  "Dry Cleaners": ["Pressto Drycleaners", "TumbleDry Dryclean", "UClean Dry Cleaners", "Spin N Press", "White Tiger Dry Cleaners"],
  "Software Agency": ["Tata Consultancy Services", "Infosys Technologies", "Wipro Limited", "HCLTech Solutions", "Tech Mahindra Agency"],
  "Marketing Agency": ["Schbang Marketing", "WATConsult Agency", "Dentsu Webchutney", "Social Beat Agency", "Mirum India Marketing"],
  "Design Studio": ["Elephant Design", "Vyas Giannetti Creative", "Lollypop Design Studio", "Red Ice Productions", "Fitch India"],
  "Coworking Space": ["WeWork India", "Awfis Space", "Innov8 Coworking Hub", "91springboard Hub", "The Executive Centre"],
  "Coffee Shop": ["Cafe Coffee Day", "Blue Tokai Coffee Roasters", "Third Wave Coffee", "Starbucks India", "Chaayos Café"],
  "Fitness Studio": ["Cultfit Studio", "Gold Gym Studio", "Anytime Fitness Studio", "Yoga House India", "Pilates Altitude Studio"],
  "Dance Academy": ["Shiamak Davar Dance Academy", "Terence Lewis Dance Academy", "Remo Dance Institute", "Kings United Academy", "Delhi Dance Academy"],
  "Hardware Store": ["Asian Paints Signature Store", "Berger Paints Bazaar", "Supreme Hardware Centre", "Tirupati Hardware", "Jaquar World Store"],
  "Jewellery Shop": ["Tanishq Jewellery", "Kalyan Jewellers", "Malabar Gold and Diamonds", "PC Jeweller", "Reliance Jewels"]
};

// Fallback arrays
const genericPrefixes = ["Summit", "Apex", "Vanguard", "Infinity", "Horizon", "Elite", "Premier", "Metro", "Global", "Nova"];
const genericSuffixes = ["Group", "Solutions", "Services", "Partners", "Hub", "Associates", "Center", "Zone", "Co"];

export function generateMockLeads(): Lead[] {
  const list: Lead[] = [];

  // Seed 10 100% Real/Recognizable Indian leads at the top of the database
  const realIndianLeads: Lead[] = [
    {
      id: "lead_1",
      businessName: "The Rameshwaram Cafe",
      category: "Restaurant",
      rating: 4.6,
      reviewsCount: 18450,
      address: "Plot 29, 100 Feet Rd, Indiranagar, Bengaluru, Karnataka 560038",
      phoneNumber: "+91 98765 43210",
      website: "https://www.therameshwaramcafe.com",
      email: "info@therameshwaramcafe.com",
      googleMapsUrl: "https://maps.google.com/?q=The+Rameshwaram+Cafe+Indiranagar+Bengaluru",
      leadScore: 98,
      websiteStatus: "Active",
      seoScore: 85,
      mobileFriendly: true,
      sslEnabled: true,
      googleReviewsChecked: true,
      lastUpdated: "2026-06-15"
    },
    {
      id: "lead_2",
      businessName: "Clove Dental",
      category: "Dental Clinic",
      rating: 4.8,
      reviewsCount: 1420,
      address: "B-15, Commercial Complex, Sector 18, Noida, Uttar Pradesh 201301",
      phoneNumber: "+91 98100 12345",
      website: "https://www.clovedental.in",
      email: "care@clovedental.in",
      googleMapsUrl: "https://maps.google.com/?q=Clove+Dental+Sector+18+Noida",
      leadScore: 92,
      websiteStatus: "Active",
      seoScore: 78,
      mobileFriendly: true,
      sslEnabled: true,
      googleReviewsChecked: true,
      lastUpdated: "2026-06-16"
    },
    {
      id: "lead_3",
      businessName: "Fortis Hospital",
      category: "Hospital",
      rating: 4.2,
      reviewsCount: 4920,
      address: "A-2, Sector 62, Noida, Uttar Pradesh 201301",
      phoneNumber: "+91 120 4300222",
      website: "https://www.fortishealthcare.com",
      email: "contactus@fortishealthcare.com",
      googleMapsUrl: "https://maps.google.com/?q=Fortis+Hospital+Sector+62+Noida",
      leadScore: 89,
      websiteStatus: "Active",
      seoScore: 80,
      mobileFriendly: true,
      sslEnabled: true,
      googleReviewsChecked: true,
      lastUpdated: "2026-06-17"
    },
    {
      id: "lead_4",
      businessName: "Cultfit Gym Center",
      category: "Gym",
      rating: 4.7,
      reviewsCount: 820,
      address: "2nd Floor, HSR Layout, Sector 6, Bengaluru, Karnataka 560102",
      phoneNumber: "+91 80 4567890",
      website: "https://www.cult.fit",
      email: "support@cult.fit",
      googleMapsUrl: "https://maps.google.com/?q=Cult+Gym+HSR+Layout+Bengaluru",
      leadScore: 95,
      websiteStatus: "Active",
      seoScore: 88,
      mobileFriendly: true,
      sslEnabled: true,
      googleReviewsChecked: true,
      lastUpdated: "2026-06-18"
    },
    {
      id: "lead_5",
      businessName: "The Taj Mahal Palace",
      category: "Hotel",
      rating: 4.9,
      reviewsCount: 34100,
      address: "Apollo Bandar, Colaba, Mumbai, Maharashtra 400001",
      phoneNumber: "+91 22 6665 3366",
      website: "https://www.tajhotels.com",
      email: "taj@tajhotels.com",
      googleMapsUrl: "https://maps.google.com/?q=The+Taj+Mahal+Palace+Mumbai",
      leadScore: 100,
      websiteStatus: "Active",
      seoScore: 92,
      mobileFriendly: true,
      sslEnabled: true,
      googleReviewsChecked: true,
      lastUpdated: "2026-06-18"
    },
    {
      id: "lead_6",
      businessName: "Tata Consultancy Services",
      category: "Software Agency",
      rating: 4.3,
      reviewsCount: 1890,
      address: "Whitefield Main Rd, Vydehi Nagar, Bengaluru, Karnataka 560066",
      phoneNumber: "+91 80 6724 0000",
      website: "https://www.tcs.com",
      email: "info@tcs.com",
      googleMapsUrl: "https://maps.google.com/?q=TCS+Whitefield+Bengaluru",
      leadScore: 85,
      websiteStatus: "Active",
      seoScore: 82,
      mobileFriendly: true,
      sslEnabled: true,
      googleReviewsChecked: true,
      lastUpdated: "2026-06-18"
    },
    {
      id: "lead_7",
      businessName: "S. K. Mehta & Co. CAs",
      category: "CA",
      rating: 4.5,
      reviewsCount: 68,
      address: "Outer Circle, Connaught Place, New Delhi, Delhi 110001",
      phoneNumber: "+91 11 2341 1234",
      website: "http://www.skmehta.in",
      email: "contact@skmehta.in",
      googleMapsUrl: "https://maps.google.com/?q=SK+Mehta+Co+Connaught+Place+Delhi",
      leadScore: 78,
      websiteStatus: "Active",
      seoScore: 68,
      mobileFriendly: false,
      sslEnabled: true,
      googleReviewsChecked: true,
      lastUpdated: "2026-06-18"
    },
    {
      id: "lead_8",
      businessName: "Lakme Salon",
      category: "Salon",
      rating: 4.4,
      reviewsCount: 310,
      address: "Juhu Tara Rd, Santacruz West, Mumbai, Maharashtra 400049",
      phoneNumber: "+91 22 2660 1234",
      website: "https://www.lakmesalon.in",
      email: "support@lakme.com",
      googleMapsUrl: "https://maps.google.com/?q=Lakme+Salon+Juhu+Mumbai",
      leadScore: 81,
      websiteStatus: "Active",
      seoScore: 74,
      mobileFriendly: true,
      sslEnabled: true,
      googleReviewsChecked: true,
      lastUpdated: "2026-06-18"
    },
    {
      id: "lead_9",
      businessName: "Blue Tokai Coffee Roasters",
      category: "Coffee Shop",
      rating: 4.6,
      reviewsCount: 1120,
      address: "Koramangala 3rd Block, Bengaluru, Karnataka 560034",
      phoneNumber: "+91 96060 12345",
      website: "https://bluetokaicoffee.com",
      email: "hello@bluetokaicoffee.com",
      googleMapsUrl: "https://maps.google.com/?q=Blue+Tokai+Koramangala+Bengaluru",
      leadScore: 94,
      websiteStatus: "Active",
      seoScore: 86,
      mobileFriendly: true,
      sslEnabled: true,
      googleReviewsChecked: true,
      lastUpdated: "2026-06-18"
    },
    {
      id: "lead_10",
      businessName: "DLF Cybercity Properties",
      category: "Real Estate",
      rating: 4.1,
      reviewsCount: 530,
      address: "DLF Phase 3, Gurugram, Haryana 122002",
      phoneNumber: "+91 124 439 2000",
      website: "https://www.dlf.in",
      email: "sales@dlf.in",
      googleMapsUrl: "https://maps.google.com/?q=DLF+Office+Gurugram",
      leadScore: 84,
      websiteStatus: "Active",
      seoScore: 81,
      mobileFriendly: true,
      sslEnabled: true,
      googleReviewsChecked: true,
      lastUpdated: "2026-06-18"
    }
  ];

  list.push(...realIndianLeads);

  let idCounter = 11;

  for (const country of Object.keys(locationDatabase)) {
    const countryData = locationDatabase[country];
    for (const state of countryData.states) {
      const cities = countryData.cities[state] || [];
      for (const city of cities) {
        for (const category of categories) {
          if (category === "Custom") continue;

          // Generate 2 leads per category per city to make database rich
          const count = 2;
          for (let i = 0; i < count; i++) {
            const id = `lead_${idCounter++}`;
            
            // Choose prefixes depending on country
            const prefixes = country === "India" 
              ? (indianBusinessNames[category] || genericPrefixes) 
              : (businessNames[category] || genericPrefixes);
              
            const baseName = prefixes[Math.floor(Math.random() * prefixes.length)];
            
            let businessName = baseName;
            if (country !== "India") {
              const suffix = genericSuffixes[Math.floor(Math.random() * genericSuffixes.length)];
              businessName = baseName.includes(category) ? baseName : `${baseName} ${category} ${i > 0 ? suffix : ""}`.trim();
            } else {
              // Indian brands are already full business names. Add suffix/location details to differentiate branches
              if (i > 0) {
                const branches = ["Branch", "Center", "Hub", "Zone", "Express"];
                const branch = branches[Math.floor(Math.random() * branches.length)];
                businessName = `${baseName} - ${branch}`;
              }
            }

            // Skip generating if it matches one of our curated top 10 list
            if (realIndianLeads.some(rl => rl.businessName.toLowerCase() === businessName.toLowerCase())) {
              continue;
            }

            const rating = parseFloat((Math.random() * 2 + 3).toFixed(1)); // 3.0 to 5.0
            const reviewsCount = Math.floor(Math.random() * 800) + 5;
            
            // Generate realistic local address formats
            let address = "";
            if (country === "India") {
              const areas: Record<string, string[]> = {
                "Bengaluru": ["Indiranagar", "HSR Layout", "Koramangala", "Jayanagar", "Whitefield", "MG Road"],
                "Mumbai": ["Bandra West", "Andheri West", "Colaba", "Juhu", "Powai", "Nariman Point"],
                "Noida": ["Sector 62", "Sector 18", "Sector 15", "Sector 63", "Sector 50"],
                "New Delhi": ["Connaught Place", "Saket", "Karol Bagh", "Vasant Kunj", "Rajouri Garden"],
                "Pune": ["Koregaon Park", "Kothrud", "Viman Nagar", "Kalyani Nagar", "Hinjavadi"],
                "Chennai": ["T Nagar", "Adyar", "Velachery", "Nungambakkam", "Mylapore"],
                "Hyderabad": ["Gachibowli", "Jubilee Hills", "Banjara Hills", "Madhapur", "Kondapur"],
                "Kolkata": ["Salt Lake Sector V", "Park Street", "Ballygunge", "New Town"],
                "Lucknow": ["Hazratganj", "Gomti Nagar", "Aliganj", "Indira Nagar"],
                "Jaipur": ["C-Scheme", "Malviya Nagar", "Mansarovar", "Vaishali Nagar"],
                "Ahmedabad": ["Satellite", "C G Road", "Vastrapur", "Bodakdev"]
              };
              const cityAreas = areas[city] || ["Main Market", "MG Road", "Link Road", "Station Area"];
              const area = cityAreas[Math.floor(Math.random() * cityAreas.length)];
              const pin = String(Math.floor(Math.random() * 900) + 100) + String(Math.floor(Math.random() * 900) + 100); 
              address = `${Math.floor(Math.random() * 80) + 1}, ${area}, ${city}, ${state} - ${pin}`;
            } else {
              const pinCode = String(Math.floor(Math.random() * 90000) + 10000);
              address = `${Math.floor(Math.random() * 900) + 100} Main St, ${city}, ${state} ${pinCode}`;
            }
            
            const cleanNameForSlug = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
            const website = Math.random() > 0.15 ? `https://www.${cleanNameForSlug.substring(0, 15)}.in` : "";
            const email = website ? `info@${cleanNameForSlug.substring(0, 15)}.in` : `contact.${cleanNameForSlug.substring(0, 15)}@gmail.com`;

            const phonePrefix = country === "India" ? "+91 98765 " : "+1 (555) 01";
            const phoneNumber = `${phonePrefix}${Math.floor(Math.random() * 90000) + 10000}`;

            const googleMapsUrl = `https://maps.google.com/?q=${encodeURIComponent(businessName + ", " + address)}`;
            const facebookUrl = Math.random() > 0.4 ? `https://facebook.com/${cleanNameForSlug.substring(0, 15)}` : undefined;
            const instagramUrl = Math.random() > 0.5 ? `https://instagram.com/${cleanNameForSlug.substring(0, 15)}` : undefined;

            const websiteStatus = website 
              ? (Math.random() > 0.9 ? "Slow" : "Active") 
              : "No Website";

            const sslEnabled = website ? Math.random() > 0.08 : false;
            const seoScore = website ? Math.floor(Math.random() * 45) + 50 : 0;
            const mobileFriendly = website ? Math.random() > 0.15 : false;

            // Lead score calculation
            let leadScore = Math.floor((rating * 10) + (reviewsCount > 50 ? 20 : 5));
            if (website) leadScore += 15;
            if (facebookUrl || instagramUrl) leadScore += 10;
            if (sslEnabled) leadScore += 5;
            leadScore = Math.min(Math.max(leadScore, 10), 100);

            list.push({
              id,
              businessName,
              category,
              rating,
              reviewsCount,
              address,
              phoneNumber,
              website,
              email,
              googleMapsUrl,
              facebookUrl,
              instagramUrl,
              leadScore,
              websiteStatus,
              seoScore,
              mobileFriendly,
              sslEnabled,
              googleReviewsChecked: Math.random() > 0.1,
              lastUpdated: new Date(Date.now() - Math.random() * 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
            });
          }
        }
      }
    }
  }

  return list;
}
