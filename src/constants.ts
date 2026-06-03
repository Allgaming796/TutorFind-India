export const SUBJECTS = [
  'Maths', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'History', 
  'Computer Science', 'Economics', 'Accountancy', 'Sanskrit', 'Geography', 'Social Studies'
];

export const GRADES = [
  'Class 1–5', 'Class 6–8', 'Class 9–10', 'Class 11–12', 'JEE/NEET', 'UPSC/SSC', 'Graduation', 'Other'
];

export const MODES = ['Online', 'Offline', 'Both'];

export const CITIES = [
  "Visakhapatnam", "Vijayawada", "Guntur", "Nellore", "Kurnool", "Rajahmundry", "Tirupati", "Kakinada", "Kadapa", "Anantapur",
  "Itanagar", "Pasighat", "Bomdila", "Aalo", "Ziro", "Tezu", "Namsai",
  "Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tinsukia", "Tezpur",
  "Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Purnia", "Darbhanga", "Bihar Sharif", "Arrah", "Begusarai", "Katihar",
  "Raipur", "Bhilai", "Bilaspur", "Durg", "Rajnandgaon", "Raigarh", "Jagdalpur", "Ambikapur",
  "New Delhi", "Delhi", "Dwarka", "Rohini", "Janakpuri", "Saket", "Vasant Kunj", "Mayur Vihar", "Shahdara", "Karol Bagh",
  "Panaji", "Margao", "Vasco Da Gama", "Mapusa", "Ponda",
  "Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar", "Jamnagar", "Junagadh", "Gandhidham", "Anand", "Navsari",
  "Faridabad", "Gurgaon", "Panipat", "Ambala", "Yamunanagar", "Rohtak", "Hisar", "Karnal", "Sonipat", "Panchkula",
  "Shimla", "Solan", "Dharamsala", "Mandi", "Baddi", "Nahan", "Palampur",
  "Ranchi", "Jamshedpur", "Dhanbad", "Bokaro", "Deoghar", "Hazaribagh", "Giridih",
  "Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Davangere", "Bellary", "Gulbarga", "Shimoga", "Tumkur",
  "Thiruvananthapuram", "Kochi", "Kozhikode", "Thrissur", "Kollam", "Palakkad", "Alappuzha", "Malappuram", "Kannur",
  "Bhopal", "Indore", "Jabalpur", "Gwalior", "Ujjain", "Sagar", "Ratlam", "Satna",
  "Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Nanded", "Sangli",
  "Imphal", "Thoubal", "Bishnupur", "Churachandpur",
  "Shillong", "Tura", "Jowai",
  "Aizawl", "Lunglei",
  "Kohima", "Dimapur", "Mokokchung",
  "Bhubaneswar", "Cuttack", "Rourkela", "Berhampur", "Sambalpur", "Puri",
  "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Pathankot", "Hoshiarpur",
  "Jaipur", "Jodhpur", "Kota", "Bikaner", "Ajmer", "Udaipur", "Bhilwara", "Alwar", "Bharatpur", "Sikar",
  "Gangtok", "Namchi",
  "Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Erode", "Vellore", "Thoothukudi",
  "Hyderabad", "Warangal", "Nizamabad", "Khammam", "Karimnagar", "Ramagundam", "Suryapet",
  "Agartala", "Dharmanagar", "Udaipur",
  "Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Prayagraj", "Aligarh", "Bareilly", "Moradabad", "Gorakhpur",
  "Dehradun", "Haridwar", "Roorkee", "Haldwani", "Rudrapur", "Rishikesh",
  "Kolkata", "Asansol", "Siliguri", "Durgapur", "Bardhaman", "Malda", "Baharampur", "Habra", "Kharagpur",
  "Srinagar", "Jammu", "Anantnag", "Baramulla"
].sort();

export const STATE_GROUPS: { [key: string]: string[] } = {
  UP: ["Lucknow", "Kanpur", "Agra", "Varanasi", "Meerut", "Prayagraj", "Aligarh", "Bareilly", "Moradabad", "Gorakhpur"],
  MH: ["Mumbai", "Pune", "Nagpur", "Thane", "Nashik", "Aurangabad", "Solapur", "Kolhapur", "Amravati", "Nanded", "Sangli"],
  KA: ["Bangalore", "Mysore", "Hubli", "Mangalore", "Belgaum", "Davangere", "Bellary", "Gulbarga", "Shimoga", "Tumkur"],
  TN: ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Tiruppur", "Erode", "Vellore", "Thoothukudi"],
  DL: ["New Delhi", "Delhi", "Dwarka", "Rohini", "Janakpuri", "Saket", "Vasant Kunj", "Mayur Vihar", "Shahdara", "Karol Bagh"]
};

export const CITY_STATE: { [key: string]: string } = {};
Object.entries(STATE_GROUPS).forEach(([state, cities]) => {
  cities.forEach(c => {
    CITY_STATE[c] = state;
  });
});

export function cityScore(tutorCity: string, userCity: string): number {
  if (!tutorCity || !userCity) return 2;
  if (tutorCity === userCity) return 0;
  const us = CITY_STATE[userCity];
  const ts = CITY_STATE[tutorCity];
  if (us && ts && us === ts) return 1; // same state = nearby
  return 2; // different state = far
}

export const INITIAL_TUTORS_DATA = [
  {
    uid: "tutor_priya",
    name: "Priya Sharma",
    city: "Kanpur",
    subjects: ["Maths", "Physics"],
    grade: "Class 9–10",
    rate: 400,
    rating: 4.9,
    reviewsCount: 38,
    mode: "Both" as const,
    exp: "6 years",
    bio: "IIT Kanpur alumna, JEE specialist. Helped 30+ students crack IIT with clean, robust concept building.",
    avatar: "PS",
    color: "#4f46e5",
    online: true,
    qual: "BTech, IIT Kanpur",
    role: "tutor" as const,
    email: "priya@tutorfind.in",
    refReviews: [
      { name: "Rahul K", rating: 5, text: "Cracked JEE Mains with her help!", date: "2 weeks ago" },
      { name: "Asha P", rating: 5, text: "Best maths tutor in Kanpur.", date: "1 month ago" }
    ]
  },
  {
    uid: "tutor_arjun",
    name: "Arjun Mehta",
    city: "Delhi",
    subjects: ["Chemistry", "Biology"],
    grade: "Class 11–12",
    rate: 600,
    rating: 4.7,
    reviewsCount: 55,
    mode: "Online" as const,
    exp: "8 years",
    bio: "MBBS from AIIMS Delhi. NEET expert with 50+ selections into top medical colleges. Focused on visual chemistry and high-yield topics.",
    avatar: "AM",
    color: "#059669",
    online: false,
    qual: "MBBS, AIIMS Delhi",
    role: "tutor" as const,
    email: "arjun@tutorfind.in",
    refReviews: [
      { name: "Sneha M", rating: 5, text: "Got into NEET with his biology notes!", date: "3 weeks ago" },
      { name: "Karan D", rating: 4, text: "Fantastic chemistry lessons.", date: "1 month ago" }
    ]
  },
  {
    uid: "tutor_kavya",
    name: "Kavya Reddy",
    city: "Hyderabad",
    subjects: ["English", "Hindi"],
    grade: "Class 6–8",
    rate: 350,
    rating: 4.6,
    reviewsCount: 29,
    mode: "Offline" as const,
    exp: "4 years",
    bio: "MA English from Hyderabad University. Passionate about building grammar and confident English communication skills from early classes.",
    avatar: "KR",
    color: "#dc2626",
    online: true,
    qual: "MA English, Hyderabad Uni",
    role: "tutor" as const,
    email: "kavya@tutorfind.in",
    refReviews: [
      { name: "Riya S", rating: 5, text: "My writing score increased tremendously!", date: "1 week ago" }
    ]
  },
  {
    uid: "tutor_vikram",
    name: "Vikram Singh",
    city: "Kanpur",
    subjects: ["Maths", "Computer Science"],
    grade: "Class 11–12",
    rate: 450,
    rating: 4.8,
    reviewsCount: 47,
    mode: "Both" as const,
    exp: "7 years",
    bio: "BTech CSE from IIT BHU. Specializes in CBSE school boards Maths, Computer Science, and Data Structures & Algorithms. Makes coders out of thinkers.",
    avatar: "VS",
    color: "#2563eb",
    online: true,
    qual: "BTech CSE, IIT BHU",
    role: "tutor" as const,
    email: "vikram@tutorfind.in",
    refReviews: [
      { name: "Dev P", rating: 5, text: "Patient and explains code logic step-by-step.", date: "5 days ago" }
    ]
  },
  {
    uid: "tutor_meera",
    name: "Meera Joshi",
    city: "Mumbai",
    subjects: ["Accountancy", "Economics"],
    grade: "Class 11–12",
    rate: 500,
    rating: 4.5,
    reviewsCount: 33,
    mode: "Online" as const,
    exp: "5 years",
    bio: "Chartered Accountant (CA) with MBA. Clear guidelines for accounts problems, balance sheets, and macroeconomic policies.",
    avatar: "MJ",
    color: "#7c3aed",
    online: false,
    qual: "CA + MBA Finance",
    role: "tutor" as const,
    email: "meera@tutorfind.in",
    refReviews: [
      { name: "Pooja L", rating: 5, text: "Economics concepts became so vivid!", date: "2 weeks ago" }
    ]
  }
];
