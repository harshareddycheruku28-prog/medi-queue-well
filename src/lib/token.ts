import { supabase } from '@/integrations/supabase/client';

export async function generateToken(departmentId: string, doctorId: string, date: string) {
  // Fetch the highest existing token_number for the given doctor and date (excluding cancelled appointments)
  const { data, error } = await supabase
    .from('appointments')
    .select('token_number')
    .eq('department_id', departmentId)
    .eq('doctor_id', doctorId)
    .eq('appointment_date', date)
    .neq('status', 'cancelled')
    .order('token_number', { ascending: false })
    .limit(1);
  if (error) {
    console.error('Failed to generate token number:', error);
    // fallback to 1 if query fails
    return { token_number: 1, token_code: `${departmentId}-${doctorId}-${date.replace(/-/g, '')}-001` };
  }
  const max = data?.[0]?.token_number ?? 0;
  const token_number = max + 1;
  const token_code = `${departmentId}-${doctorId}-${date.replace(/-/g, '')}-${String(token_number).padStart(3, '0')}`;
  return { token_number, token_code };
}
