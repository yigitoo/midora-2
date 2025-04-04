import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

interface UserMenuProps {
  user: User;
}

const UserMenu = ({ user }: UserMenuProps) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logoutMutation } = useAuth();
  const menuRef = useRef<HTMLDivElement>(null);
  
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getInitials = () => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    } else if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return "U";
  };
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative" ref={menuRef}>
      <button 
        className="flex items-center focus:outline-none" 
        onClick={toggleMenu}
        aria-haspopup="true"
        aria-expanded={isMenuOpen}
      >
        <Avatar className="h-8 w-8">
          {user.avatar ? (
            <AvatarImage src={user.avatar} alt={`${user.firstName || ''} ${user.lastName || ''}`} />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground">
              {getInitials()}
            </AvatarFallback>
          )}
        </Avatar>
        <span className="ml-2 hidden md:inline">
          {user.firstName ? `${user.firstName} ${user.lastName || ''}` : user.username}
        </span>
        <i className={`ri-arrow-down-s-line ml-1 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}></i>
      </button>
      
      {isMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
          <Link href="/profile" className="block px-4 py-2 text-sm hover:bg-hoverBg">
            Profile
          </Link>
          <Link href="/profile?tab=settings" className="block px-4 py-2 text-sm hover:bg-hoverBg">
            Account Settings
          </Link>
          <Link href="/membership" className="block px-4 py-2 text-sm hover:bg-hoverBg">
            Membership
          </Link>
          <div className="border-t border-borderColor my-1"></div>
          <button 
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm hover:bg-hoverBg"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
