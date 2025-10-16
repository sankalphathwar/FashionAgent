import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Outfit {
  name: string;
  items: string[];
  reasoning: string;
}

const Recommendations = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [occasion, setOccasion] = useState("casual outing");
  const [weather, setWeather] = useState("moderate");
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
  };

  const handleGenerateOutfits = async () => {
    setIsLoading(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      const headers: Record<string, string> = { apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY };
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const { data, error } = await supabase.functions.invoke("recommend-outfits", {
        body: { occasion, weather },
        headers,
      });

      if (error) {
        const msg = error.message || "Failed to generate recommendations";
        if (msg.includes("Rate limits")) {
          toast.error("Too many requests. Please try again shortly.");
        } else if (msg.includes("Payment required")) {
          toast.error("AI usage limit reached. Please add credits to continue.");
        } else {
          toast.error(msg);
        }
        return;
      }
      
      setOutfits(data.outfits || []);
      if (data.outfits?.length === 0) {
        toast.info("No outfits found. Try uploading more items to your closet!");
      } else {
        toast.success(`Generated ${data.outfits.length} outfit recommendations!`);
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to generate recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button onClick={() => navigate("/closet")} variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent to-secondary">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold">Outfit Recommendations</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="mb-8 shadow-elegant">
          <CardHeader>
            <CardTitle>Get Personalized Outfit Suggestions</CardTitle>
            <CardDescription>
              Tell us about the occasion and we'll recommend the perfect outfits from your closet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="occasion">Occasion</Label>
                <Input
                  id="occasion"
                  placeholder="e.g., casual outing, work meeting, date night"
                  value={occasion}
                  onChange={(e) => setOccasion(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weather">Weather</Label>
                <Input
                  id="weather"
                  placeholder="e.g., warm, cold, rainy"
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
            <Button
              onClick={handleGenerateOutfits}
              disabled={isLoading}
              className="w-full gap-2 bg-gradient-to-r from-accent to-secondary hover:opacity-90"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Outfits...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate Recommendations
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {outfits.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Your Personalized Outfits</h2>
            {outfits.map((outfit, index) => (
              <Card key={index} className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-accent to-secondary text-white text-sm">
                      {index + 1}
                    </span>
                    {outfit.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">Items in this outfit:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {outfit.items.map((item, i) => (
                        <li key={i} className="text-sm">{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-2 text-sm text-muted-foreground">Why this works:</h4>
                    <p className="text-sm text-foreground/80">{outfit.reasoning}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Recommendations;