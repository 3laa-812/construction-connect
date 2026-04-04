import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, UserRole } from "@/types/auth";
import { useNavigate } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { api } from "@/lib/api";

function mapBackendUser(loggedInUser: any, emailFallback: string): User {
  const companyType = loggedInUser.company?.type;
  let userRole: UserRole = "contractor";

  if (companyType === "SUPPLIER") {
    userRole = "supplier";
  } else if (companyType === "CONTRACTOR") {
    userRole = "contractor";
  } else if (loggedInUser.role === "ADMIN" && !companyType) {
    userRole = "admin";
  }

  return {
    id: loggedInUser.id,
    name: loggedInUser.name || emailFallback.split("@")[0],
    email: loggedInUser.email,
    role: userRole,
    companyName: loggedInUser.company?.name || "No Company",
    crNumber: loggedInUser.company?.commercial_reg_no,
    companyId: loggedInUser.company?.id,
    companyType: loggedInUser.company?.type,
    companyCountry: loggedInUser.company?.country ?? undefined,
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  registerInit: (data: Record<string, unknown>) => Promise<{ message: string; userId: string }>;
  verifyOtp: (userId: string, otp: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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
      const response = await api.post("/auth/login", { email, password });
      const { access_token, user: loggedInUser } = response.data;

      const mapped = mapBackendUser(loggedInUser, email);

      setUser(mapped);
      localStorage.setItem("user", JSON.stringify(mapped));
      localStorage.setItem("access_token", access_token);

      toast({
        title: "Welcome back!",
        description: `Logged in as ${mapped.name}`,
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

  const registerInit = async (data: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/register", data);
      return response.data as { message: string; userId: string };
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description: error.response?.data?.message || "Could not start registration",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (userId: string, otp: string) => {
    setIsLoading(true);
    try {
      const response = await api.post("/auth/verify-otp", { userId, otp });
      const { access_token, user: loggedInUser } = response.data;

      const mapped = mapBackendUser(loggedInUser, loggedInUser.email);

      setUser(mapped);
      localStorage.setItem("user", JSON.stringify(mapped));
      localStorage.setItem("access_token", access_token);

      toast({
        title: "Verified",
        description: "Complete your company profile to finish KYB.",
      });

      navigate("/onboarding");
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.response?.data?.message || "Invalid or expired code",
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
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerInit,
        verifyOtp,
        logout,
      }}
    >
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
