import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Check, ChevronRight, Calendar, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HabitCardProps {
  id: string;
  name: string;
  description?: string | null;
  frequency: string;
  completedToday: boolean;
  streak: number;
  onToggle: () => void;
  className?: string;
}

export function HabitCard({ 
  id, 
  name, 
  description, 
  frequency, 
  completedToday, 
  streak,
  onToggle,
  className 
}: HabitCardProps) {
  return (
    <Card className={cn("card-hover bg-card border-border overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="flex items-stretch">
          <button
            onClick={(e) => {
              e.preventDefault();
              onToggle();
            }}
            className={cn(
              "flex items-center justify-center w-20 sm:w-24 shrink-0 transition-all duration-300",
              completedToday 
                ? "bg-success" 
                : "bg-muted hover:bg-primary/10"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
              completedToday 
                ? "bg-success-foreground/20 border-success-foreground/30" 
                : "border-border bg-background"
            )}>
              {completedToday && (
                <Check className="w-5 h-5 text-success-foreground animate-check" />
              )}
            </div>
          </button>

          <Link to={`/habits/${id}`} className="flex-1 p-4 flex items-center justify-between group">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {name}
              </h3>
              {description && (
                <p className="text-sm text-muted-foreground truncate mt-0.5">{description}</p>
              )}
              <div className="flex items-center gap-3 mt-2">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Repeat className="w-3 h-3" />
                  {frequency}
                </span>
                {streak > 0 && (
                  <span className="flex items-center gap-1 text-xs text-accent font-medium">
                    <Calendar className="w-3 h-3" />
                    {streak} day streak
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors shrink-0 ml-2" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
