export type AppointmentType = 'checkup' | 'preventive' | 'diagnostic' | 'emergency' | 'restorative';
export type AppointmentStatus = 'scheduled' | 'confirmed' | 'completed' | 'noshow' | 'cancelled';

export const APPOINTMENT_STATUSES: { value: AppointmentStatus; label: string; color: string; bg: string; icon: string }[] = [
  { value: 'scheduled',  label: 'Scheduled',  color: '#4A5568', bg: '#F4F7FB', icon: '○' },
  { value: 'confirmed',  label: 'Confirmed',  color: '#185FA5', bg: '#E6F1FB', icon: '◉' },
  { value: 'completed',  label: 'Completed',  color: '#1A8A55', bg: '#EAF3DE', icon: '✓' },
  { value: 'noshow',     label: 'No-show',    color: '#C21016', bg: '#FCEBEB', icon: '✗' },
  { value: 'cancelled',  label: 'Cancelled',  color: '#8A9BB0', bg: '#E8EDF4', icon: '⊘' },
];

export interface Appointment {
  id: string;
  patientName: string;
  phone: string;
  date: string;       // YYYY-MM-DD
  hour: number;       // 7-20
  minute: number;     // 0 or 30
  doctorId: string;
  type: AppointmentType;
  notes: string;
  duration: number;
  status: AppointmentStatus; // in minutes
  createdAt: string;
}

export const APPOINTMENT_TYPES: { value: AppointmentType; label: string; color: string; bg: string; border: string }[] = [
  { value: 'checkup',     label: 'Check-up',    color: '#0C447C', bg: '#E6F1FB', border: '#185FA5' },
  { value: 'preventive',  label: 'Preventive',  color: '#27500A', bg: '#EAF3DE', border: '#3B6D11' },
  { value: 'diagnostic',  label: 'Diagnostic',  color: '#633806', bg: '#FAEEDA', border: '#854F0B' },
  { value: 'emergency',   label: 'Emergency',   color: '#791F1F', bg: '#FCEBEB', border: '#A32D2D' },
  { value: 'restorative', label: 'Restorative', color: '#3C3489', bg: '#EEEDFE', border: '#534AB7' },
];

export const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7-20

export const DURATIONS = [
  { value: 15,  label: '15 min' },
  { value: 30,  label: '30 min' },
  { value: 45,  label: '45 min' },
  { value: 60,  label: '1 hour' },
  { value: 90,  label: '1.5 hours' },
  { value: 120, label: '2 hours' },
];

export const MINUTES = [0, 15, 30, 45];