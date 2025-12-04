import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useHabits } from '@/hooks/useHabits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';
import { cn } from '@/lib/utils';

const habitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  frequency: z.enum(['daily', 'weekdays', 'weekends', 'custom']),
});

const DAYS = [
  { key: 'mon', label: 'M' },
  { key: 'tue', label: 'T' },
  { key: 'wed', label: 'W' },
  { key: 'thu', label: 'T' },
  { key: 'fri', label: 'F' },
  { key: 'sat', label: 'S' },
  { key: 'sun', label: 'S' },
];

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Every day', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
  { value: 'weekdays', label: 'Weekdays', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  { value: 'weekends', label: 'Weekends', days: ['sat', 'sun'] },
  { value: 'custom', label: 'Custom', days: [] },
];

export default function HabitForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createHabit, updateHabit } = useHabits();

  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('daily');
  const [selectedDays, setSelectedDays] = useState<string[]>(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']);
  const [loading, setLoading] = useState(false);
  const [fetchingHabit, setFetchingHabit] = useState(isEditing);
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  useEffect(() => {
    if (isEditing && id) {
      const fetchHabit = async () => {
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

        setName(data.name);
        setDescription(data.description || '');
        setFrequency(data.frequency);
        
        // Set selected days based on frequency
        const option = FREQUENCY_OPTIONS.find(o => o.value === data.frequency);
        if (option && data.frequency !== 'custom') {
          setSelectedDays(option.days);
        }
        
        setFetchingHabit(false);
      };

      fetchHabit();
    }
  }, [id, isEditing, navigate, toast]);

  const handleFrequencyChange = (value: string) => {
    setFrequency(value);
    const option = FREQUENCY_OPTIONS.find(o => o.value === value);
    if (option && value !== 'custom') {
      setSelectedDays(option.days);
    }
  };

  const toggleDay = (day: string) => {
    setFrequency('custom');
    setSelectedDays(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day]
    );
  };

  const validateForm = () => {
    try {
      habitSchema.parse({ name, description, frequency });
      setErrors({});
      return true;
    } catch (e) {
      if (e instanceof z.ZodError) {
        const newErrors: typeof errors = {};
        e.errors.forEach((err) => {
          if (err.path[0] === 'name') newErrors.name = err.message;
          if (err.path[0] === 'description') newErrors.description = err.message;
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);

    try {
      if (isEditing && id) {
        const result = await updateHabit(id, name, description, frequency);
        if (result) {
          toast({
            title: 'Habit updated',
            description: 'Your changes have been saved.',
          });
          navigate(`/habits/${id}`);
        }
      } else {
        const result = await createHabit(name, description, frequency);
        if (result) {
          toast({
            title: 'Habit created',
            description: `"${name}" has been added to your habits.`,
          });
          navigate('/');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (fetchingHabit) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-muted-foreground">Loading habit...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-lg py-8 px-4">
      <Button
        variant="ghost"
        asChild
        className="mb-6 -ml-2"
      >
        <Link to={isEditing ? `/habits/${id}` : '/'} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {isEditing ? 'Back to Habit' : 'Back to Dashboard'}
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            {isEditing ? 'Edit Habit' : 'Create New Habit'}
          </CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update the details of your habit.' 
              : 'Add a new habit to start tracking.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Habit Name</Label>
              <Input
                id="name"
                placeholder="e.g., Morning meditation"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={loading}
                maxLength={100}
              />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What does this habit involve?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={loading}
                rows={3}
                maxLength={500}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div className="space-y-3">
              <Label>Frequency</Label>
              <div className="flex flex-wrap gap-2">
                {FREQUENCY_OPTIONS.slice(0, 3).map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleFrequencyChange(option.value)}
                    disabled={loading}
                    className={cn(
                      "px-3 py-1.5 text-sm rounded-md border transition-colors",
                      frequency === option.value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background text-foreground border-border hover:bg-muted"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              
              <div className="flex gap-1.5 pt-2">
                {DAYS.map((day, index) => (
                  <button
                    key={day.key}
                    type="button"
                    onClick={() => toggleDay(day.key)}
                    disabled={loading}
                    className={cn(
                      "w-9 h-9 rounded-full text-sm font-medium transition-colors",
                      selectedDays.includes(day.key)
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    )}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Habit'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate(isEditing ? `/habits/${id}` : '/')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
