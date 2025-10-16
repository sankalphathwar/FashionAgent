import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Upload, TrendingUp, Shirt } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="flex justify-center mb-8">
            <div className="p-6 rounded-2xl bg-gradient-to-br from-accent to-secondary shadow-elegant">
              <Sparkles className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-6xl font-bold tracking-tight mb-4">
            <span className="bg-gradient-to-r from-accent via-secondary to-accent bg-clip-text text-transparent">
              Fashion Agent
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your AI-powered virtual closet. Upload your clothes, get personalized outfit recommendations, and manage your wardrobe with intelligent insights.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button
              onClick={() => navigate("/auth")}
              size="lg"
              className="gap-2 bg-gradient-to-r from-accent to-secondary hover:opacity-90 text-lg px-8"
            >
              Get Started
              <Sparkles className="w-5 h-5" />
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-8 pt-16">
            <div className="p-6 rounded-xl bg-card border border-border shadow-soft">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 mx-auto">
                <Upload className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Smart Upload</h3>
              <p className="text-sm text-muted-foreground">
                Upload photos of your clothes and let AI automatically categorize and tag them
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border shadow-soft">
              <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center mb-4 mx-auto">
                <Shirt className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Virtual Closet</h3>
              <p className="text-sm text-muted-foreground">
                Organize your entire wardrobe digitally with AI-powered insights and tracking
              </p>
            </div>

            <div className="p-6 rounded-xl bg-card border border-border shadow-soft">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4 mx-auto">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-lg font-semibold mb-2">AI Recommendations</h3>
              <p className="text-sm text-muted-foreground">
                Get personalized outfit suggestions based on weather, occasion, and your style
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
