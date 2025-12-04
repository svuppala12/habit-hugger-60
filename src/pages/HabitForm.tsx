import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useHabits, Habit } from '@/hooks/useHabits';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const habitSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  frequency: z.enum(['daily', 'weekly']),
});

export default function HabitForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { createHabit, updateHabit } = useHabits();

  const isEditing = Boolean(id);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('daily');
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
        setFetchingHabit(false);
      };

      fetchHabit();
    }
  }, [id, isEditing, navigate, toast]);

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
        <div className="animate-pulse text-muted-foreground">Loading habit...</div>
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

      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            {isEditing ? 'Edit Habit' : 'Create New Habit'}
          </CardTitle>
          <CardDescription>
            {isEditing 
              ? 'Update the details of your habit.' 
              : 'Add a new habit to start tracking.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select value={frequency} onValueChange={setFrequency} disabled={loading}>
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-3 pt-4">
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
