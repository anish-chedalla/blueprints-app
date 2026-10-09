import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin } from "lucide-react";
import type { ProfileFormData } from "@/lib/profile-form";

interface Props {
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  showHeading?: boolean;
}

export function LocationFields({ formData, setFormData, showHeading = true }: Props) {
  return (
    <div className="space-y-6">
      {showHeading && (
        <div className="flex items-center gap-3 mb-6">
          <MapPin className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Location</h3>
            <p className="text-sm text-muted-foreground">Where is your business located?</p>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input id="city" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="e.g., Phoenix" />
        </div>
        <div>
          <Label htmlFor="county">County</Label>
          <Input id="county" value={formData.county} onChange={(e) => setFormData({ ...formData, county: e.target.value })} placeholder="e.g., Maricopa" />
        </div>
      </div>
    </div>
  );
}
