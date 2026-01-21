import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check localStorage on mount
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("access_token");
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user: loggedInUser } = response.data;
      
      // The backend returns user object, ensure it matches our frontend User type
      // Adapt as necessary based on backend response structure
      // Map backend data to frontend User object
      const companyType = loggedInUser.company?.type;
      let userRole: UserRole = 'contractor'; // Default fallback

      if (companyType === 'SUPPLIER') {
        userRole = 'supplier';
      } else if (companyType === 'CONTRACTOR') {
        userRole = 'contractor';
      } else if (loggedInUser.role === 'ADMIN' && !companyType) {
        userRole = 'admin';
      }

      const user: User = {
        id: loggedInUser.id,
        name: loggedInUser.name || email.split("@")[0],
        email: loggedInUser.email,
        role: userRole,
        companyName: loggedInUser.company?.name || "No Company",
        crNumber: loggedInUser.company?.commercial_reg_no,
        companyId: loggedInUser.company?.id,
        companyType: loggedInUser.company?.type,
      };

      setUser(user);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("access_token", access_token);
      
      toast({
        title: "Welcome back!",
        description: `Logged in as ${user.name}`,
      });
      
      navigate("/");
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Login Failed",
        description: error.response?.data?.message || "Invalid credentials",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: any) => {
    setIsLoading(true);
    try {
        // Map frontend registration usage to backend expectation if needed
        // Assuming backend expects: { email, password, name, role, company_name }
        await api.post('/auth/register', data);
        
        toast({
            title: "Account Created",
            description: "You have successfully registered. Please login.",
        });

        navigate("/login");
    } catch (error: any) {
         console.error(error);
         toast({
            variant: "destructive",
            title: "Registration Failed",
            description: error.response?.data?.message || "Could not register account",
         });
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("access_token");
    navigate("/login");
    toast({
      title: "Logged out",
      description: "See you soon!",
    });
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
