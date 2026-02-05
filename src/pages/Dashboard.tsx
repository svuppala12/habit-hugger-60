import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHabits } from '@/hooks/useHabits';
import { HabitCard } from '@/components/HabitCard';
import { Button } from '@/components/ui/button';
import { Plus, Target, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, subDays, addDays, isToday, isBefore, startOfDay } from 'date-fns';

export default function Dashboard() {
  const { profile } = useAuth();
  const { habits, loading, toggleEntry, isCompletedOnDate, getStreak } = useHabits();
  const [selectedDate, setSelectedDate] = useState(new Date());

  const formattedDate = format(selectedDate, 'yyyy-MM-dd');
  const completedOnDate = habits.filter(h => isCompletedOnDate(h.id, formattedDate)).length;

  const goToPreviousDay = () => {
    setSelectedDate(prev => subDays(prev, 1));
  };

  const goToNextDay = () => {
    const nextDay = addDays(selectedDate, 1);
    if (!isBefore(startOfDay(new Date()), startOfDay(nextDay))) {
      setSelectedDate(nextDay);
    }
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const canGoNext = isBefore(startOfDay(selectedDate), startOfDay(new Date()));

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = profile?.first_name || 'there';

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-muted-foreground">Loading your habits...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 px-4">
      <header className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {getGreeting()}, {displayName}
        </h1>
        <p className="text-muted-foreground mt-1.5 leading-relaxed">
          {habits.length === 0 
            ? "Let's start building some habits."
            : `You've completed ${completedOnDate} of ${habits.length} habits${isToday(selectedDate) ? ' today' : ''}.`
          }
        </p>
      </header>

      {habits.length === 0 ? (
        <div className="text-center py-16">
          <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-xl gradient-bg shadow-md">
            <Target className="w-8 h-8 text-primary-foreground" />
          </div>
          <h2 className="text-lg font-bold mb-2 tracking-tight">No habits yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto leading-relaxed">
            Create your first habit to start tracking your daily progress.
          </p>
          <Button asChild className="gradient-bg border-0 shadow-sm">
            <Link to="/habits/new" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Habit
            </Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-8">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                id={habit.id}
                name={habit.name}
                description={habit.description}
                frequency={habit.frequency}
                completedToday={isCompletedOnDate(habit.id, formattedDate)}
                streak={getStreak(habit.id)}
                onToggle={() => toggleEntry(habit.id, formattedDate)}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 pt-6 border-t border-border/60">
            <div className="flex items-center gap-3 bg-card/80 rounded-full px-2 py-1 border border-border/50 shadow-sm">
              <Button variant="ghost" size="icon" onClick={goToPreviousDay} className="rounded-full h-8 w-8">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <button 
                onClick={goToToday}
                className="text-sm font-semibold min-w-[140px] text-center hover:text-primary transition-colors tracking-tight"
              >
                {isToday(selectedDate) ? 'Today' : format(selectedDate, 'EEEE, MMM d')}
              </button>
              <Button 
                variant="ghost" 
                size="icon"
                className="rounded-full h-8 w-8"
                onClick={goToNextDay}
                disabled={!canGoNext}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            
            <Button asChild className="gradient-bg border-0 shadow-sm">
              <Link to="/habits/new" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Add Habit
              </Link>
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
