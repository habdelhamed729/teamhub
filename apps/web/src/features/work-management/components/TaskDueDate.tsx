import { Calendar } from 'lucide-react';

export const TaskDueDate = ({ date }: { date: string | Date | null | undefined }) => {
  if (!date) return null;
  
  const d = new Date(date);
  const isOverdue = d < new Date() && d.toDateString() !== new Date().toDateString();
  
  return (
    <div className={`flex items-center gap-1.5 ${isOverdue ? 'text-danger' : 'text-text-muted'}`}>
      <Calendar className="w-3 h-3" />
      <span className="text-[10px] font-medium">{d.toLocaleDateString()}</span>
    </div>
  );
};
