import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format, subDays, startOfDay } from 'date-fns';

export interface Habit {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  is_archived: boolean;
  created_at: string;
  user_id: string;
}

export interface HabitEntry {
  id: string;
  habit_id: string;
  date: string;
  completed: boolean;
}

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [entries, setEntries] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHabits = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('is_archived', false)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setHabits(data);
    }
  };

  const fetchEntries = async (days = 30) => {
    if (!user || habits.length === 0) return;

    const fromDate = format(subDays(new Date(), days), 'yyyy-MM-dd');
    const toDate = format(new Date(), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('habit_entries')
      .select('*')
      .in('habit_id', habits.map(h => h.id))
      .gte('date', fromDate)
      .lte('date', toDate);

    if (!error && data) {
      setEntries(data);
    }
  };

  useEffect(() => {
    if (user) {
      fetchHabits().finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (habits.length > 0) {
      fetchEntries();
    }
  }, [habits]);

  const createHabit = async (name: string, description: string, frequency: string) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('habits')
      .insert({
        name,
        description: description || null,
        frequency,
        user_id: user.id
      })
      .select()
      .single();

    if (!error && data) {
      setHabits(prev => [data, ...prev]);
      return data;
    }
    return null;
  };

  const updateHabit = async (id: string, name: string, description: string, frequency: string) => {
    const { data, error } = await supabase
      .from('habits')
      .update({ name, description: description || null, frequency })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setHabits(prev => prev.map(h => h.id === id ? data : h));
      return data;
    }
    return null;
  };

  const deleteHabit = async (id: string) => {
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', id);

    if (!error) {
      setHabits(prev => prev.filter(h => h.id !== id));
      return true;
    }
    return false;
  };

  const toggleEntry = async (habitId: string, date: string) => {
    const existingEntry = entries.find(
      e => e.habit_id === habitId && e.date === date
    );

    if (existingEntry) {
      const { data, error } = await supabase
        .from('habit_entries')
        .update({ completed: !existingEntry.completed })
        .eq('id', existingEntry.id)
        .select()
        .single();

      if (!error && data) {
        setEntries(prev => prev.map(e => e.id === data.id ? data : e));
      }
    } else {
      const { data, error } = await supabase
        .from('habit_entries')
        .insert({ habit_id: habitId, date, completed: true })
        .select()
        .single();

      if (!error && data) {
        setEntries(prev => [...prev, data]);
      }
    }
  };

  const isCompletedOnDate = (habitId: string, date: string) => {
    return entries.some(e => e.habit_id === habitId && e.date === date && e.completed);
  };

  const getStreak = (habitId: string) => {
    let streak = 0;
    let currentDate = startOfDay(new Date());

    while (true) {
      const dateStr = format(currentDate, 'yyyy-MM-dd');
      if (isCompletedOnDate(habitId, dateStr)) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else {
        break;
      }
    }

    return streak;
  };

  const getEntriesForHabit = (habitId: string) => {
    return entries.filter(e => e.habit_id === habitId);
  };

  return {
    habits,
    entries,
    loading,
    createHabit,
    updateHabit,
    deleteHabit,
    toggleEntry,
    isCompletedOnDate,
    getStreak,
    getEntriesForHabit,
    refetch: fetchHabits
  };
}
