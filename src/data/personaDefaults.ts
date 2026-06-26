export interface PersonaDefault {
  firstName: string;
  lastName: string;
  dob: string;
  nationality: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  postcode: string;
  country: string;
  loanAmount: number;
  loanTerm: string;
  employmentType: string;
  annualIncome: number;
  monthlyRent: number;
  existingDebt: number;
  otherExpenses: number;
}

export const personaDefaults: Record<string, PersonaDefault> = {
  'happy-path': {
    firstName: 'Maria',
    lastName: 'Santos',
    dob: '1988-04-12',
    nationality: 'PT',
    email: 'maria.santos@example.com',
    phone: '+351912345678',
    addressLine1: 'Rua Augusta 10',
    addressLine2: 'Apartment 5',
    city: 'Lisbon',
    postcode: '1100-053',
    country: 'PT',
    loanAmount: 15000,
    loanTerm: '36',
    employmentType: 'employed',
    annualIncome: 52000,
    monthlyRent: 1200,
    existingDebt: 200,
    otherExpenses: 400,
  },
  'blurry-docs': {
    firstName: 'James',
    lastName: 'Chen',
    dob: '1992-09-05',
    nationality: 'US',
    email: 'james.chen@example.com',
    phone: '+15551234567',
    addressLine1: '123 Main St',
    addressLine2: 'Suite 2',
    city: 'New York',
    postcode: '10001',
    country: 'US',
    loanAmount: 10000,
    loanTerm: '24',
    employmentType: 'employed',
    annualIncome: 85000,
    monthlyRent: 2500,
    existingDebt: 500,
    otherExpenses: 800,
  },
  'watchlist-hit': {
    firstName: 'Alex',
    lastName: 'Petrov',
    dob: '1980-02-20',
    nationality: 'RU',
    email: 'alex.petrov@example.com',
    phone: '+79005550101',
    addressLine1: 'Tverskaya St 7',
    addressLine2: 'Floor 3',
    city: 'Moscow',
    postcode: '125009',
    country: 'RU',
    loanAmount: 20000,
    loanTerm: '48',
    employmentType: 'self-employed',
    annualIncome: 120000,
    monthlyRent: 800,
    existingDebt: 3000,
    otherExpenses: 1500,
  },
  'borderline-credit': {
    firstName: 'Sarah',
    lastName: 'Miller',
    dob: '1985-07-14',
    nationality: 'GB',
    email: 'sarah.miller@example.com',
    phone: '+447700900124',
    addressLine1: '12 Baker Street',
    addressLine2: 'Apt B',
    city: 'London',
    postcode: 'NW1 6XE',
    country: 'GB',
    loanAmount: 15000,
    loanTerm: '36',
    employmentType: 'employed',
    annualIncome: 42000,
    monthlyRent: 1200,
    existingDebt: 1300,
    otherExpenses: 600,
  },
  declined: {
    firstName: 'Tom',
    lastName: 'Baker',
    dob: '1975-11-02',
    nationality: 'GB',
    email: 'tom.baker@example.com',
    phone: '+447700900125',
    addressLine1: '45 High Street',
    addressLine2: '',
    city: 'Bristol',
    postcode: 'BS1 4ST',
    country: 'GB',
    loanAmount: 25000,
    loanTerm: '60',
    employmentType: 'unemployed',
    annualIncome: 18000,
    monthlyRent: 600,
    existingDebt: 5000,
    otherExpenses: 400,
  },
  'counter-offer': {
    firstName: 'Lisa',
    lastName: 'Wang',
    dob: '1990-03-30',
    nationality: 'CN',
    email: 'lisa.wang@example.com',
    phone: '+8613812345678',
    addressLine1: 'No. 88 Nanjing Rd',
    addressLine2: 'Unit 1201',
    city: 'Shanghai',
    postcode: '200001',
    country: 'CN',
    loanAmount: 15000,
    loanTerm: '24',
    employmentType: 'employed',
    annualIncome: 65000,
    monthlyRent: 3000,
    existingDebt: 2000,
    otherExpenses: 1000,
  },
};

export function getPersonaDefaults(): PersonaDefault {
  const key = localStorage.getItem('demoPersona') ?? 'happy-path';
  return personaDefaults[key] ?? personaDefaults['happy-path'];
}

export function applyPersonaDefaults(personaKey: string) {
  const defaults = personaDefaults[personaKey] ?? personaDefaults['happy-path'];
  localStorage.setItem('demoPersona', personaKey);
  // Store all fields for easy retrieval by form components
  for (const [key, value] of Object.entries(defaults)) {
    localStorage.setItem(`demo_${key}`, String(value));
  }
}
