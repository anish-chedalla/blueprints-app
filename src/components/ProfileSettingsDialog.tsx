import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, MapPin, Users, Briefcase } from "lucide-react";

const INDUSTRIES = ["technology", "retail", "services", "food service", "sustainability", "biotech", "manufacturing", "healthcare"];
const DEMOGRAPHICS = ["women_owned", "veteran_owned", "minority_owned"];
const BUSINESS_TYPES = ["LLC", "Sole Proprietor", "Corporation", "Partnership", "Nonprofit"];

interface ProfileSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSettingsDialog({ open, onOpenChange }: ProfileSettingsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    city: "",
    county: "",
    employees: "",
    industryTags: [] as string[],
    demographics: [] as string[],
  });

  useEffect(() => {
    if (open) {
      loadProfile();
    }
  }, [open]);

  const loadProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", session.user.id)
      .single();

    if (profile) {
      setFormData({
        businessName: profile.business_name || "",
        businessType: "",
        city: profile.city || "",
        county: profile.county || "",
        employees: profile.employees?.toString() || "",
        industryTags: profile.industry_tags || [],
        demographics: profile.demographics || [],
      });
    }
  };

  const toggleTag = (tag: string, field: "industryTags" | "demographics") => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(tag) ? prev[field].filter(t => t !== tag) : [...prev[field], tag]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert(
          {
            user_id: session.user.id,
            business_name: formData.businessName,
            city: formData.city || null,
            county: formData.county || null,
            employees: parseInt(formData.employees) || null,
            industry_tags: formData.industryTags,
            demographics: formData.demographics,
          },
          {
            onConflict: 'user_id'
          }
        );

      if (error) throw error;
      toast.success("Profile updated successfully!");
      onOpenChange(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Edit Profile</DialogTitle>
          <DialogDescription>Update your business information</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Building2 className="h-4 w-4" />
              Business Information
            </div>
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input id="businessName" value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} required />
            </div>
            <div>
              <Label htmlFor="businessType">Business Type</Label>
              <Select value={formData.businessType} onValueChange={(value) => setFormData({...formData, businessType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employees">Number of Employees</Label>
              <Input id="employees" type="number" value={formData.employees} onChange={(e) => setFormData({...formData, employees: e.target.value})} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <MapPin className="h-4 w-4" />
              Location
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} />
              </div>
              <div>
                <Label htmlFor="county">County</Label>
                <Input id="county" value={formData.county} onChange={(e) => setFormData({...formData, county: e.target.value})} />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Briefcase className="h-4 w-4" />
              Industry & Demographics
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                Industries
              </Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(tag => (
                  <Badge key={tag} variant={formData.industryTags.includes(tag) ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => toggleTag(tag, "industryTags")}>{tag}</Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-3 block">Business Demographics</Label>
              <div className="flex flex-wrap gap-2">
                {DEMOGRAPHICS.map(tag => (
                  <Badge key={tag} variant={formData.demographics.includes(tag) ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => toggleTag(tag, "demographics")}>{tag.replace(/_/g, "-")}</Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="w-full">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
