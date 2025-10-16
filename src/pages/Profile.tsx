import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

const Profile = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [height, setHeight] = useState("");
  const [bodyType, setBodyType] = useState("");
  const [location, setLocation] = useState("");
  const [selectedAesthetics, setSelectedAesthetics] = useState<string[]>([]);
  const [colorPreferences, setColorPreferences] = useState("");

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) throw error;

      setProfile(data);
      setHeight(data.height?.toString() || "");
      setBodyType(data.body_type || "");
      setLocation(data.location || "");
      setSelectedAesthetics(data.aesthetics || []);
      setColorPreferences((data.color_preferences || []).join(", "));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAestheticToggle = (aesthetic: string) => {
    setSelectedAesthetics(prev =>
      prev.includes(aesthetic)
        ? prev.filter(a => a !== aesthetic)
        : [...prev, aesthetic]
    );
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const colors = colorPreferences.split(",").map(c => c.trim()).filter(Boolean);

      const { error } = await supabase
        .from("profiles")
        .update({
          height: height ? parseInt(height) : null,
          body_type: (bodyType || null) as any,
          aesthetics: selectedAesthetics as any,
          color_preferences: colors,
          location: location || null,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button onClick={() => navigate("/closet")} variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-2xl font-bold">Your Profile</h1>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle>Profile Settings</CardTitle>
            <CardDescription>Update your preferences for better recommendations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="height">Height (cm)</Label>
                <Input
                  id="height"
                  type="number"
                  placeholder="e.g., 170"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  disabled={isSaving}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bodyType">Body Type</Label>
                <Select value={bodyType} onValueChange={setBodyType} disabled={isSaving}>
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
                disabled={isSaving}
              />
            </div>

            <div className="space-y-3">
              <Label>Aesthetic Preferences</Label>
              <div className="grid grid-cols-2 gap-3">
                {AESTHETICS.map((aesthetic) => (
                  <div key={aesthetic.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={aesthetic.value}
                      checked={selectedAesthetics.includes(aesthetic.value)}
                      onCheckedChange={() => handleAestheticToggle(aesthetic.value)}
                      disabled={isSaving}
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
                disabled={isSaving}
              />
            </div>

            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full gap-2 bg-gradient-to-r from-accent to-secondary hover:opacity-90"
            >
              <Save className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Profile;