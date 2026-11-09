export const symptomOptions = [
  { id: 'starting', label: "It's slow or hard to start", icon: '↗' },
  { id: 'battery', label: 'The battery light is on', icon: '▣' },
  { id: 'brakes', label: 'The brakes sound or feel different', icon: '◉' },
  { id: 'overheat', label: 'The temperature is running high', icon: '♨' },
  { id: 'engine', label: 'The engine light is on', icon: '⌁' },
  { id: 'vibration', label: "I've noticed a new vibration", icon: '≋' }
] as const;

export type SymptomId = (typeof symptomOptions)[number]['id'];

export const vehicleOptions = [
  { id: 'hatchback', label: 'Hatchback' },
  { id: 'sedan', label: 'Sedan' },
  { id: 'suv', label: 'SUV' },
  { id: 'other', label: 'Something else / not sure' }
] as const;

export type VehicleId = (typeof vehicleOptions)[number]['id'];

export const timingOptions = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'In the last week' },
  { id: 'longer', label: 'More than a week ago' }
] as const;

export type TimingId = (typeof timingOptions)[number]['id'];

export type Recommendation = {
  id: string;
  title: string;
  reason: string;
  score: number;
};

export type Assessment = {
  id: string;
  vehicle: VehicleId;
  symptoms: SymptomId[];
  timing: TimingId;
  recommendations: Recommendation[];
  createdAt: string;
};

type Rule = Omit<Recommendation, 'score'> & { points: number };

const rules: Record<SymptomId, Rule[]> = {
  starting: [
    { id: 'battery', title: 'Battery health and connections', points: 62, reason: 'A slow start can happen when the battery is weak or its connections are loose.' },
    { id: 'starter', title: 'Starter motor and charging system', points: 30, reason: 'If the battery checks out, a technician may check the starter and charging system.' }
  ],
  battery: [
    { id: 'battery', title: 'Battery health and connections', points: 78, reason: 'A battery warning points toward the charging circuit, battery, or electrical connections.' },
    { id: 'alternator', title: 'Alternator and drive belt', points: 49, reason: 'The alternator helps keep the battery charged while the engine runs.' }
  ],
  brakes: [
    { id: 'brakes', title: 'Brake pads and discs', points: 82, reason: 'New brake noise or a changed pedal feel should be checked by a professional.' },
    { id: 'brake-fluid', title: 'Brake fluid and hydraulic system', points: 35, reason: 'A technician can check fluid level and look for leaks or other hydraulic issues.' }
  ],
  overheat: [
    { id: 'cooling', title: 'Cooling system and coolant level', points: 83, reason: 'A rising temperature can indicate a cooling problem and needs prompt attention.' },
    { id: 'cooling-leaks', title: 'Leaks, radiator and hoses', points: 42, reason: 'A visual inspection can check for coolant leaks or damaged hoses.' }
  ],
  engine: [
    { id: 'diagnostic-codes', title: 'Diagnostic trouble codes', points: 75, reason: 'A scan tool can read stored codes and give a technician a useful starting point.' },
    { id: 'sensors', title: 'Engine sensors and air intake', points: 36, reason: 'Several sensor or air intake issues can trigger the same warning light.' }
  ],
  vibration: [
    { id: 'tyres', title: 'Tyres and wheel balance', points: 54, reason: 'A vibration may be related to tyre condition, wheel balance, or a loose wheel.' },
    { id: 'suspension', title: 'Wheels and suspension', points: 39, reason: 'If the vibration continues, a technician can inspect suspension and steering parts.' }
  ]
};

export function isSymptomId(value: unknown): value is SymptomId {
  return symptomOptions.some(option => option.id === value);
}

export function isVehicleId(value: unknown): value is VehicleId {
  return vehicleOptions.some(option => option.id === value);
}

export function isTimingId(value: unknown): value is TimingId {
  return timingOptions.some(option => option.id === value);
}

export function rankRecommendations(selectedSymptoms: readonly SymptomId[]): Recommendation[] {
  const totals = new Map<string, Recommendation>();

  for (const symptom of selectedSymptoms) {
    for (const rule of rules[symptom]) {
      const existing = totals.get(rule.id);
      if (existing) {
        existing.score = Math.min(96, existing.score + Math.round(rule.points * 0.2));
      } else {
        totals.set(rule.id, {
          id: rule.id,
          title: rule.title,
          reason: rule.reason,
          score: rule.points
        });
      }
    }
  }

  return [...totals.values()].sort((a, b) => b.score - a.score).slice(0, 3);
}

export function isSafetyRelated(symptoms: readonly SymptomId[]): boolean {
  return symptoms.includes('brakes') || symptoms.includes('overheat');
}

export function symptomLabel(id: SymptomId): string {
  return symptomOptions.find(option => option.id === id)?.label ?? id;
}

export function vehicleLabel(id: VehicleId): string {
  return vehicleOptions.find(option => option.id === id)?.label ?? id;
}

export function timingLabel(id: TimingId): string {
  return timingOptions.find(option => option.id === id)?.label ?? id;
}
