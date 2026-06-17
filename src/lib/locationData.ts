export interface LocationData {
  states: string[];
  cities: Record<string, string[]>;
}

export const locationDatabase: Record<string, LocationData> = {
  "India": {
    states: [
      "Andhra Pradesh", "Bihar", "Delhi", "Gujarat", "Karnataka", 
      "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh"
    ],
    cities: {
      "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Tirupati"],
      "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia"],
      "Delhi": ["New Delhi", "Dwarka", "Rohini", "Saket", "Vasant Kunj"],
      "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar"],
      "Karnataka": ["Bengaluru", "Mysuru", "Hubli", "Mangaluru", "Belagavi"],
      "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Navi Mumbai"],
      "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"],
      "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Bikaner", "Ajmer"],
      "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Trichy", "Salem"],
      "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
      "Uttar Pradesh": ["Lucknow", "Kanpur", "Noida", "Ghaziabad", "Agra", "Varanasi", "Meerut", "Prayagraj", "Bareilly", "Aligarh"]
    }
  },
  "United States": {
    states: ["California", "Florida", "Illinois", "New York", "Texas", "Washington"],
    cities: {
      "California": ["Los Angeles", "San Francisco", "San Diego", "San Jose", "Sacramento", "Oakland"],
      "Florida": ["Miami", "Tampa", "Orlando", "Jacksonville", "Fort Lauderdale"],
      "Illinois": ["Chicago", "Aurora", "Rockford", "Naperville", "Joliet"],
      "New York": ["New York City", "Buffalo", "Rochester", "Yonkers", "Syracuse"],
      "Texas": ["Houston", "San Antonio", "Dallas", "Austin", "Fort Worth", "El Paso"],
      "Washington": ["Seattle", "Spokane", "Tacoma", "Bellevue", "Olympia"]
    }
  },
  "United Kingdom": {
    states: ["England", "Scotland", "Wales", "Northern Ireland"],
    cities: {
      "England": ["London", "Birmingham", "Manchester", "Leeds", "Liverpool", "Newcastle"],
      "Scotland": ["Edinburgh", "Glasgow", "Aberdeen", "Dundee"],
      "Wales": ["Cardiff", "Swansea", "Newport"],
      "Northern Ireland": ["Belfast", "Derry", "Lisburn"]
    }
  },
  "Canada": {
    states: ["Ontario", "Quebec", "British Columbia", "Alberta"],
    cities: {
      "Ontario": ["Toronto", "Ottawa", "Mississauga", "Hamilton", "London"],
      "Quebec": ["Montreal", "Quebec City", "Laval", "Gatineau"],
      "British Columbia": ["Vancouver", "Victoria", "Burnaby", "Richmond"],
      "Alberta": ["Calgary", "Edmonton", "Red Deer"]
    }
  },
  "Australia": {
    states: ["New South Wales", "Victoria", "Queensland", "Western Australia"],
    cities: {
      "New South Wales": ["Sydney", "Newcastle", "Wollongong"],
      "Victoria": ["Melbourne", "Geelong", "Ballarat"],
      "Queensland": ["Brisbane", "Gold Coast", "Cairns"],
      "Western Australia": ["Perth", "Fremantle"]
    }
  }
};

export const categories = [
  "Clinic", "Hospital", "Dental Clinic", "ENT Clinic", "Pathology Lab", 
  "Gym", "Restaurant", "Hotel", "School", "College", "Coaching Center", 
  "Lawyer", "CA", "Architect", "Salon", "Spa", "Travel Agency", 
  "Real Estate", "Medical Store", "Pharmacy", "Diagnostic Center", 
  "Veterinary Clinic", "NGO", "Construction Company",
  "Bakery", "Boutique", "Supermarket", "Pet Grooming", "Automobile Workshop", 
  "Dry Cleaners", "Software Agency", "Marketing Agency", "Design Studio", 
  "Coworking Space", "Coffee Shop", "Fitness Studio", "Dance Academy", 
  "Hardware Store", "Jewellery Shop", "Custom"
];
