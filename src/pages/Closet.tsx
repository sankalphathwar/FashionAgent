import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button, ButtonProps } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Upload, LogOut, User, TrendingUp, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useClosetManagement } from "@/hooks/use-closet-management";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ClothingItem {
  id: string;
  image_url: string;
  category: string;
  color: string;
  ai_description: string;
  subcategory: string;
  material: string;
  season: string[];
  tags: string[];
  lastUsed?: string;
}

const Closet: React.FC = () => {
  const navigate = useNavigate();
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [user, setUser] = useState<any>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  
  const { analysis, isAnalyzing, markItemAsWorn } = useClosetManagement(clothes);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    fetchClothes();
  };

  const fetchClothes = async () => {
    try {
      const { data, error } = await supabase
        .from("clothes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Convert data to match ClothingItem interface
      const convertedData = (data || []).map((item: any) => ({
        ...item,
        season: Array.isArray(item.season) ? item.season : item.season?.split(',') || [],
        tags: Array.isArray(item.tags) ? item.tags : item.tags?.split(',') || []
      }));
      
      setClothes(convertedData);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    setIsUploading(true);
    try {
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from("clothes")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("clothes")
        .getPublicUrl(fileName);

      const { data, error } = await supabase.functions.invoke("analyze-clothing", {
        body: { imageUrl: publicUrl }
      });

      if (error) throw error;

      const { error: insertError } = await supabase
        .from("clothes")
        .insert([{
          user_id: user.id,
          image_url: publicUrl,
          category: selectedCategory as any,
          color: data.color,
          tags: data.tags,
          ai_description: data.description,
          subcategory: data.subcategory,
          material: data.material,
          season: data.season
        }]);

      if (insertError) throw insertError;

      toast.success("Clothing item added to your closet!");
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setSelectedCategory("");
      fetchClothes();
    } catch (error: any) {
      toast.error(error.message || "Failed to upload item");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your closet...</p>
        </div>
      </DialogContent>
    );
  }

    <div className="min-h-screen bg-background">
      <>
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-accent to-secondary">
              <img src="/hanger-logo.svg" alt="Logo" className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold">FashiAI</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => navigate("/stylist")}
              className="gap-2 bg-gradient-to-r from-accent to-secondary hover:opacity-90"
            >
              <MessageCircle className="w-4 h-4" />
              Chat with Stylist
            </Button>
            <Button
              onClick={() => navigate("/recommendations")}
              className="gap-2 bg-transparent border border-accent hover:bg-accent/10"
            >
              <TrendingUp className="w-4 h-4" />
              Quick Outfits
            </Button>
            <Button 
              onClick={() => navigate("/profile")} 
              className="icon-button"
            >
              <User className="w-4 h-4" />
            </Button>
            <Button 
              onClick={handleSignOut} 
              className="bg-transparent border border-accent hover:bg-accent/10"
              size="icon"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
      </>
      </header>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Virtual Closet</h2>
            <p className="text-muted-foreground">{clothes.length} items in your wardrobe</p>
          </div>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-accent to-secondary hover:opacity-90">
                <Upload className="w-4 h-4" />
                Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Clothing Item</DialogTitle>
                <DialogDescription>
                  Upload a photo and our AI will automatically categorize and tag it
                </DialogDescription>
              </DialogHeader>
                            <div className="space-y-4 py-4">
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    isDragActive ? 'border-accent bg-accent/10' : 'border-border'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragActive(true);
                  }}
                  onDragLeave={() => setIsDragActive(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragActive(false);
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                      setSelectedFile(file);
                    }
                  }}
                >
                  {selectedFile ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(selectedFile)}
                        alt="Preview"
                        className="mx-auto max-h-48 rounded-lg"
                      />
                        className="outline"
                      <Button
                        variant="outline"
                        className="outline-button"
                        onClick={() => setSelectedFile(null)}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="mx-auto w-12 h-12 mb-4">
                        <img src="/hanger-logo.svg" alt="Upload" className="w-full h-full" />
                      </div>
                      <p className="text-muted-foreground mb-2">
                        Drag and drop your image here, or click to select
                      </p>
                      <Input
                        id="image"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        variant="outline"
                        onClick={() => document.getElementById('image')?.click()}
                      >
                        Choose File
                      </Button>
                    </>
                  )}
                </div>
                </div>
                <Button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile}
                  className="w-full bg-gradient-to-r from-accent to-secondary hover:opacity-90"
                >
                </div>
              </DialogContent>
            </Dialog>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex-1">
          {clothes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Upload className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Your closet is empty</h3>
              <p className="text-muted-foreground mb-6">Start by uploading your first clothing item</p>
              <Button
                onClick={() => setUploadDialogOpen(true)}
                className="gap-2 bg-gradient-to-r from-accent to-secondary"
              >
                <Upload className="w-4 h-4" />
                Add Your First Item
              </Button>
            </CardContent>
          </Card>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Items</TabsTrigger>
              <TabsTrigger value="insights">Closet Insights</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {clothes.map((item) => (
                <Card key={item.id} className="overflow-hidden group hover:ring-2 hover:ring-accent transition-all">
                  <CardContent className="p-0">
                    <div className="aspect-square relative">
                      <img
                        src={item.image_url}
                        alt={item.ai_description}
                        className="w-full h-full object-cover"
                      />
                            <Badge className="secondary">{item.category}</Badge>
                            <Badge className="outline">{item.color}</Badge>
                            <Badge>{item.category}</Badge>
                            <Badge>{item.color}</Badge>
                            <Badge variant="outline">{item.color}</Badge>
                              <Badge className="outline text-xs">
                              <Badge key={tag} className="outline text-xs">
                          <div className="flex gap-2 flex-wrap">
                              <Badge className="text-xs">
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          <Button
                            className="w-full bg-accent/20 hover:bg-accent/30"
                            onClick={() => markItemAsWorn(item.id)}
                          >
                            Mark as Worn
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            {analysis && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{analysis.summary.totalItems}</p>
                        <p className="text-sm text-muted-foreground">Total Items</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{analysis.summary.rarelyUsedCount}</p>
                        <p className="text-sm text-muted-foreground">Rarely Used Items</p>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{analysis.summary.seasonalStorageCount}</p>
                        <p className="text-sm text-muted-foreground">Seasonal Storage</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {analysis.recommendations.map((rec, index) => (
                  <Alert key={index}>
                    <AlertTitle>{rec.type === 'donate' ? 'Donation Suggestions' : 'Storage Suggestions'}</AlertTitle>
                    <AlertDescription>
                      <p className="mb-2">{rec.message}</p>
                      <ScrollArea className="h-[200px] rounded-md border p-4">
                        <div className="space-y-4">
                          {rec.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-4">
                              <img
                                src={item.image_url}
                                alt={item.ai_description}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                              <div>
                                <p className="font-medium">{item.category}</p>
                                <p className="text-sm text-muted-foreground">{item.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}
            </TabsContent>
          </Tabs>
        )}
        </div>
      </main>
    </div>
  );
};

export default Closet;export default Closet;