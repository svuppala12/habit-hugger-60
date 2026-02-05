import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Target, LogOut } from 'lucide-react';

export function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-border/60 bg-card/80 backdrop-blur-md supports-[backdrop-filter]:bg-card/70">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg gradient-bg text-primary-foreground shadow-sm">
            <Target className="w-4 h-4" />
          </div>
          <span className="font-semibold text-foreground tracking-tight">HabitFlow</span>
        </Link>

        <div className="flex items-center gap-2">
          {user ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleSignOut}
              className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          ) : (
            <Button asChild size="sm" className="gradient-bg border-0 shadow-sm">
              <Link to="/auth">Sign In</Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
