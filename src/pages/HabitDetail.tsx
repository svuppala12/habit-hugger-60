import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useHabits, Habit } from '@/hooks/useHabits';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit, Trash2, Calendar, Check, Repeat } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function HabitDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { deleteHabit, toggleEntry, isCompletedOnDate, getStreak, getEntriesForHabit } = useHabits();
  
  const [habit, setHabit] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHabit = async () => {
      if (!id) return;
      
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) {
        toast({
          title: 'Habit not found',
          description: 'This habit may have been deleted.',
          variant: 'destructive',
        });
        navigate('/');
        return;
      }

      setHabit(data);
      setLoading(false);
    };

    fetchHabit();
  }, [id, navigate, toast]);

  const handleDelete = async () => {
    if (!id) return;
    
    const success = await deleteHabit(id);
    if (success) {
      toast({
        title: 'Habit deleted',
        description: 'Your habit has been removed.',
      });
      navigate('/');
    }
  };

  // Generate last 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = subDays(startOfDay(new Date()), 13 - i);
    return {
      date,
      dateStr: format(date, 'yyyy-MM-dd'),
      dayName: format(date, 'EEE'),
      dayNum: format(date, 'd'),
      isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
    };
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading habit...</div>
      </div>
    );
  }

  if (!habit) return null;

  const streak = getStreak(habit.id);

  return (
    <div className="container max-w-2xl py-8 px-4">
      <Button
        variant="ghost"
        asChild
        className="mb-6 -ml-2"
      >
        <Link to="/" className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </Button>

      <div className="animate-fade-in">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">{habit.name}</h1>
              {habit.description && (
                <p className="text-muted-foreground mt-1">{habit.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" asChild>
                <Link to={`/habits/${habit.id}/edit`}>
                  <Edit className="w-4 h-4" />
                </Link>
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete habit?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete "{habit.name}" and all its completion history. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <span className="flex items-center gap-1.5 text-sm text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              <Repeat className="w-3.5 h-3.5" />
              {habit.frequency}
            </span>
            {streak > 0 && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-accent bg-accent/10 px-3 py-1.5 rounded-full">
                <Calendar className="w-3.5 h-3.5" />
                {streak} day streak
              </span>
            )}
          </div>
        </header>

        <Card className="animate-fade-in stagger-1">
          <CardHeader>
            <CardTitle className="font-display text-lg">Completion History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {days.map((day) => {
                const completed = isCompletedOnDate(habit.id, day.dateStr);
                return (
                  <button
                    key={day.dateStr}
                    onClick={() => toggleEntry(habit.id, day.dateStr)}
                    className={cn(
                      "flex flex-col items-center p-2 rounded-lg transition-all duration-200",
                      day.isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "",
                      completed 
                        ? "bg-success text-success-foreground" 
                        : "bg-muted hover:bg-primary/10"
                    )}
                  >
                    <span className="text-[10px] font-medium opacity-75">{day.dayName}</span>
                    <span className="text-sm font-semibold">{day.dayNum}</span>
                    {completed && <Check className="w-3.5 h-3.5 mt-0.5" />}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Click any day to toggle completion
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
