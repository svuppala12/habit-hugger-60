import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useHabits } from '@/hooks/useHabits';
import { HabitCard } from '@/components/HabitCard';
import { Button } from '@/components/ui/button';
import { Plus, Target, Sparkles } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const { habits, loading, toggleEntry, isCompletedOnDate, getStreak } = useHabits();

  const today = format(new Date(), 'yyyy-MM-dd');
  const completedToday = habits.filter(h => isCompletedOnDate(h.id, today)).length;

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading your habits...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl py-8 px-4">
      <header className="mb-8 animate-fade-in">
        <h1 className="font-display text-3xl font-bold text-foreground">
          Good {getTimeOfDay()}, {user?.email?.split('@')[0] || 'there'}!
        </h1>
        <p className="text-muted-foreground mt-2">
          {habits.length === 0 
            ? "Let's start building some habits."
            : `You've completed ${completedToday} of ${habits.length} habits today.`
          }
        </p>
      </header>

      {habits.length > 0 && (
        <div className="mb-6 animate-fade-in stagger-1">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/20">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">
                {completedToday === habits.length 
                  ? "Perfect day! All habits complete! 🎉"
                  : completedToday > 0 
                    ? "Keep going! You're making progress."
                    : "Start your day strong. Complete a habit!"}
              </p>
              <p className="text-sm text-muted-foreground">
                {format(new Date(), 'EEEE, MMMM d')}
              </p>
            </div>
          </div>
        </div>
      )}

      {habits.length === 0 ? (
        <div className="text-center py-16 animate-fade-in">
          <div className="flex items-center justify-center w-20 h-20 mx-auto mb-6 rounded-2xl bg-muted">
            <Target className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="font-display text-xl font-semibold mb-2">No habits yet</h2>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Create your first habit to start tracking your daily progress.
          </p>
          <Button asChild>
            <Link to="/habits/new" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create Your First Habit
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit, index) => (
            <div 
              key={habit.id} 
              className={`animate-fade-in stagger-${Math.min(index + 2, 5)}`}
            >
              <HabitCard
                id={habit.id}
                name={habit.name}
                description={habit.description}
                frequency={habit.frequency}
                completedToday={isCompletedOnDate(habit.id, today)}
                streak={getStreak(habit.id)}
                onToggle={() => toggleEntry(habit.id, today)}
              />
            </div>
          ))}
        </div>
      )}

      {habits.length > 0 && (
        <div className="mt-8 text-center">
          <Button asChild variant="outline">
            <Link to="/habits/new" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add Another Habit
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}
