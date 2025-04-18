import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { Github } from "lucide-react";
import { useOnboarding } from "@/contexts/onboarding-context";
import { StepContainer } from "../common/step-container";
import { StepNavigation } from "../common/step-navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useParams } from "next/navigation";

interface SignUpStepProps {
  onBack?: () => void;
}

export function SignUpStep({ onBack }: SignUpStepProps) {
  const { currentStep, userData } = useOnboarding();
  const params = useParams();
  const lang = params.lang || "en";
  const [email, setEmail] = useState(userData.email || "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleGithubSignIn = () => {
    signIn("github", {
      callbackUrl: `/${lang}/vault`,
    });
  };

  const handleGoogleSignIn = () => {
    signIn("google", {
      callbackUrl: `/${lang}/vault`,
    });
  };

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (response?.error) {
        setError("Invalid email or password");
        return;
      }

      // If successful, redirect to vault
      window.location.href = `/${lang}/vault`;
    } catch {
      setError("An error occurred. Please try again.");
    }
  };

  return (
    <StepContainer>
      <div className="pt-4">
        <p className="text-4xl font-bold mb-8">Last Step: Sign Up! </p>
        <p className="text-xl text-muted-foreground">
          If you want the real deal! Keep your memories forever by creating an account.
        </p>
      </div>

      <div className="grid gap-4 mt-8">
        <Button variant="outline" className="gap-2" onClick={handleGithubSignIn}>
          <Github className="h-4 w-4" />
          Continue with GitHub
        </Button>
        <Button variant="outline" className="gap-2" onClick={handleGoogleSignIn}>
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </Button>
      </div>

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
        </div>
      </div>

      <form onSubmit={handleEmailSignUp} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            required
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" className="w-full">
          Sign up with Email
        </Button>
      </form>

      <StepNavigation currentStep={currentStep} onBack={onBack} showBackButton={true} />
    </StepContainer>
  );
}
