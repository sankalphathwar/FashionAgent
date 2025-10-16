import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Sparkles, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const BODY_TYPES = [
  { value: "athletic", label: "Athletic" },
  { value: "slim", label: "Slim" },
  { value: "curvy", label: "Curvy" },
  { value: "plus_size", label: "Plus Size" },
  { value: "petite", label: "Petite" },
  { value: "tall", label: "Tall" },
];

const AESTHETICS = [
  { value: "minimalist", label: "Minimalist" },
  { value: "bohemian", label: "Bohemian" },
  { value: "streetwear", label: "Streetwear" },
  { value: "classic", label: "Classic" },
  { value: "romantic", label: "Romantic" },
  { value: "edgy", label: "Edgy" },
  { value: "preppy", label: "Preppy" },
  { value: "casual", label: "Casual" },
];

const Onboarding = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [height, setHeight] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [location, setLocation] = useState("");
  const [selectedAesthetics, setSelectedAesthetics] = useState<string[]>([]);
  const [colorPreferences, setColorPreferences] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
    }
  };

  const handleAestheticToggle = (aesthetic: string) => {
    setSelectedAesthetics(prev =>
      prev.includes(aesthetic)
        ? prev.filter(a => a !== aesthetic)
        : [...prev, aesthetic]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const colors = colorPreferences.split(",").map(c => c.trim()).filter(Boolean);

      const { error } = await supabase
        .from("profiles")
        .update({
          height: parseInt(height),
          body_type: bodyType as any,
          aesthetics: selectedAesthetics as any,
          color_preferences: colors,
          location,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile complete! Let's build your virtual closet.");
      navigate("/closet");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5 p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center space-y-2 mb-8">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-gradient-to-br from-accent to-secondary">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Tell us about yourself</h1>
          <p className="text-muted-foreground">Help us personalize your fashion experience</p>
        </div>

        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Profile Setup</CardTitle>
            <CardDescription>This helps us recommend the perfect outfits for you</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="e.g., 170"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bodyType">Body Type</Label>
                  <Select value={bodyType} onValueChange={setBodyType} required disabled={isLoading}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select body type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BODY_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location (City)</Label>
                <Input
                  id="location"
                  type="text"
                  placeholder="e.g., New York"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-3">
                <Label>Aesthetic Preferences (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-3">
                  {AESTHETICS.map((aesthetic) => (
                    <div key={aesthetic.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={aesthetic.value}
                        checked={selectedAesthetics.includes(aesthetic.value)}
                        onCheckedChange={() => handleAestheticToggle(aesthetic.value)}
                        disabled={isLoading}
                      />
                      <label
                        htmlFor={aesthetic.value}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {aesthetic.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="colors">Color Preferences (comma-separated)</Label>
                <Input
                  id="colors"
                  type="text"
                  placeholder="e.g., blue, white, black"
                  value={colorPreferences}
                  onChange={(e) => setColorPreferences(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-accent to-secondary hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? "Saving..." : "Complete Setup"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;