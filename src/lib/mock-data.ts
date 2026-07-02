export type Hospital = {
  id: string;
  name: string;
  imageUrl: string;
  address: string;
  coordinates: { lat: number; lng: number };
  rating: number; // 0 to 5
  distanceKm: number; // from user location (mock)
  currentQueueLength: number;
  estimatedWaitMinutes: number;
  departments: string[]; // department codes
  availableDoctors: number;
  bedsAvailable: number;
  emergencyAvailable: boolean;
  bloodBank: boolean;
  pharmacy: boolean;
  parking: boolean;
  insuranceAccepted: string[]; // e.g., ['Aetna', 'BlueCross']
  feeRange: { min: number; max: number };
  government: boolean; // public vs private
};

export const hospitals: Hospital[] = [
  {
    id: "h1",
    name: "City Care Hospital",
    imageUrl: "/images/hospital1.jpg",
    address: "123 Main St, Metropolis",
    coordinates: { lat: 12.9716, lng: 77.5946 },
    rating: 4.5,
    distanceKm: 2.3,
    currentQueueLength: 12,
    estimatedWaitMinutes: 30,
    departments: ["CARD", "ENT", "ORTHO"],
    availableDoctors: 15,
    bedsAvailable: 20,
    emergencyAvailable: true,
    bloodBank: true,
    pharmacy: true,
    parking: true,
    insuranceAccepted: ["Aetna", "BlueCross"],
    feeRange: { min: 500, max: 2500 },
    government: false,
  },
  {
    id: "h2",
    name: "Government General Hospital",
    imageUrl: "/images/hospital2.jpg",
    address: "456 State Rd, Capital City",
    coordinates: { lat: 12.9352, lng: 77.6101 },
    rating: 4.2,
    distanceKm: 5.1,
    currentQueueLength: 8,
    estimatedWaitMinutes: 20,
    departments: ["CARD", "NEURO", "PEDIATRIC"],
    availableDoctors: 20,
    bedsAvailable: 35,
    emergencyAvailable: true,
    bloodBank: true,
    pharmacy: true,
    parking: false,
    insuranceAccepted: ["Government", "Amit"],
    feeRange: { min: 200, max: 1500 },
    government: true,
  },
  // Add more hospitals as needed for demo purposes
];

export type Doctor = {
  id: string;
  name: string;
  photoUrl: string;
  specialization: string;
  departmentId: string;
  qualification: string;
  experienceYears: number;
  languages: string[];
  consultationFee: number;
  rating: number;
  availabilityScore: number; // 0 to 1 for prediction
};

export const doctors: Doctor[] = [
  {
    id: "d1",
    name: "Dr. Aisha Khan",
    photoUrl: "/images/doctor1.jpg",
    specialization: "Cardiology",
    departmentId: "CARD",
    qualification: "MD Cardiology",
    experienceYears: 12,
    languages: ["English", "Hindi"],
    consultationFee: 1200,
    rating: 4.8,
    availabilityScore: 0.9,
  },
  {
    id: "d2",
    name: "Dr. Rohit Patel",
    photoUrl: "/images/doctor2.jpg",
    specialization: "ENT",
    departmentId: "ENT",
    qualification: "MS ENT",
    experienceYears: 8,
    languages: ["English", "Gujarati"],
    consultationFee: 800,
    rating: 4.5,
    availabilityScore: 0.6,
  },
];

export const symptomToDepartmentMap: Record<string, string[]> = {
  chest: ["CARD"],
  headache: ["NEURO"],
  cough: ["ENT", "PEDIATRIC"],
  fever: ["PEDIATRIC", "GENERAL"],
  "back pain": ["ORTHO"],
};

export type Payment = {
  id: string;
  userId: string;
  amount: number;
  status: "pending" | "completed" | "failed";
  method: "UPI" | "Card" | "NetBanking" | "Wallet";
  createdAt: string; // ISO date
};

export const payments: Payment[] = [];

export type Prescription = {
  id: string;
  patientId: string;
  doctorId: string;
  date: string; // ISO date
  diagnosis: string;
  medications: { name: string; dosage: string; frequency: string; duration: string }[];
  notes?: string;
};

export const prescriptions: Prescription[] = [];
