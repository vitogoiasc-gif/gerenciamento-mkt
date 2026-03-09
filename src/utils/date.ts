export const parseSafeDate = (dateStr?: string | null): Date => {
  if (!dateStr) return new Date();
  
  try {
    const baseDate = dateStr.split('T')[0];
    const d = new Date(`${baseDate}T12:00:00`);
    
    if (isNaN(d.getTime())) {
      // Fallback to regular parsing if custom parsing fails
      const fallback = new Date(dateStr);
      return isNaN(fallback.getTime()) ? new Date() : fallback;
    }
    
    return d;
  } catch (e) {
    return new Date();
  }
};
