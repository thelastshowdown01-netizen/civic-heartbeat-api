import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { MapPin, Eye, Bell, Heart } from "lucide-react";

const benefits = [
  { icon: MapPin, text: "Report local issues easily" },
  { icon: Eye, text: "Track progress transparently" },
  { icon: Bell, text: "Stay updated on action taken" },
  { icon: Heart, text: "Help improve your area" },
];

const AuthLayout = ({ children }: { children: ReactNode }) => {
  return (
    <div className="flex min-h-screen">
      {/* Left branding panel — hidden on mobile */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-center items-center bg-gradient-to-br from-primary/90 to-primary p-12 text-primary-foreground">
        <div className="max-w-md space-y-8">
          <Link to="/" className="block">
            <h1 className="text-4xl font-bold tracking-tight">Sustain City</h1>
            <p className="mt-2 text-lg text-primary-foreground/80">
              Your civic voice, amplified.
            </p>
          </Link>

          <div className="space-y-5 pt-4">
            {benefits.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/15">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-base font-medium">{text}</span>
              </div>
            ))}
          </div>

          <p className="pt-6 text-sm text-primary-foreground/60">
            Trusted by citizens to build better communities.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex w-full lg:w-1/2 items-center justify-center bg-background p-4 sm:p-8">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
