export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  color: string; // hex for avatar background
  textColor: string; // hex for avatar text
}

export const DOCTOR_COLORS = [
  { bg: '#E6F1FB', text: '#185FA5' },
  { bg: '#EAF3DE', text: '#3B6D11' },
  { bg: '#FAEEDA', text: '#854F0B' },
  { bg: '#FBEAF0', text: '#993556' },
  { bg: '#EEEDFE', text: '#534AB7' },
  { bg: '#E1F5EE', text: '#0F6E56' },
];