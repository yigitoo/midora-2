import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import UserMenu from "./user-menu";
import { useAuth } from "@/hooks/use-auth";

const Header = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    try {
      const symbol = searchQuery.trim().toUpperCase();
      
      // Add to search history
      await apiRequest("GET", `/api/stocks/${symbol}`);
      
      // Navigate to the stock detail page
      navigate(`/stocks/${symbol}`);
      
      // Reset search input
      setSearchQuery("");
      
      // Invalidate activity data
      queryClient.invalidateQueries({ queryKey: ["/api/activity"] });
    } catch (error) {
      toast({
        title: "Stock not found",
        description: "Please check the symbol and try again",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (isMenuOpen && !target.closest('.mobile-menu')) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <header className="bg-white shadow">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center">
              <i className="ri-line-chart-fill text-3xl text-primary"></i>
              <span className="ml-2 text-xl font-semibold">Midora</span>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-6 ml-10">
              <Link href="/" className={`py-2 px-1 font-medium ${isActive('/') ? 'tab-active text-primary border-b-2 border-primary' : 'hover:text-primary'}`}>
                Dashboard
              </Link>
              <Link href="/watchlist" className={`py-2 px-1 font-medium ${isActive('/watchlist') ? 'tab-active text-primary border-b-2 border-primary' : 'hover:text-primary'}`}>
                Watchlist
              </Link>
              <Link href="/market" className={`py-2 px-1 font-medium ${isActive('/market') ? 'tab-active text-primary border-b-2 border-primary' : 'hover:text-primary'}`}>
                Market
              </Link>
              <Link href="/news" className={`py-2 px-1 font-medium ${isActive('/news') ? 'tab-active text-primary border-b-2 border-primary' : 'hover:text-primary'}`}>
                News
              </Link>
              <Link href="/forum" className={`py-2 px-1 font-medium ${isActive('/forum') ? 'tab-active text-primary border-b-2 border-primary' : 'hover:text-primary'}`}>
                Forum
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <form onSubmit={handleSearch} className="relative hidden md:block">
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search stocks..."
                className="border border-borderColor rounded-md px-4 py-2 pl-10 w-64 focus:outline-none focus:border-primary"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
            </form>
            
            {user && <UserMenu user={user} />}
            
            {/* Mobile menu button */}
            <button 
              className="md:hidden focus:outline-none" 
              onClick={toggleMenu}
              aria-label="Toggle mobile menu"
            >
              <i className={`${isMenuOpen ? 'ri-close-line' : 'ri-menu-line'} text-2xl`}></i>
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 mobile-menu">
            <form onSubmit={handleSearch} className="mb-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search stocks..."
                  className="border border-borderColor rounded-md px-4 py-2 pl-10 w-full focus:outline-none focus:border-primary"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <i className="ri-search-line absolute left-3 top-3 text-gray-400"></i>
              </div>
            </form>
            <nav className="flex flex-col space-y-2">
              <Link href="/" className={`py-2 px-4 rounded-md ${isActive('/') ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-gray-100'}`}>
                Dashboard
              </Link>
              <Link href="/watchlist" className={`py-2 px-4 rounded-md ${isActive('/watchlist') ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-gray-100'}`}>
                Watchlist
              </Link>
              <Link href="/market" className={`py-2 px-4 rounded-md ${isActive('/market') ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-gray-100'}`}>
                Market
              </Link>
              <Link href="/news" className={`py-2 px-4 rounded-md ${isActive('/news') ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-gray-100'}`}>
                News
              </Link>
              <Link href="/forum" className={`py-2 px-4 rounded-md ${isActive('/forum') ? 'bg-primary bg-opacity-10 text-primary' : 'hover:bg-gray-100'}`}>
                Forum
              </Link>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
