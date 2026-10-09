import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { PROFILE_BUSINESS_TYPES } from "@/lib/profile-options";
import type { ProfileFormData } from "@/lib/profile-form";

interface Props {
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  showHeading?: boolean;
}

export function BusinessInfoFields({ formData, setFormData, showHeading = true }: Props) {
  return (
    <div className="space-y-6">
      {showHeading && (
        <div className="flex items-center gap-3 mb-6">
          <Building2 className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Business Information</h3>
            <p className="text-sm text-muted-foreground">Tell us about your business</p>
          </div>
        </div>
      )}
      <div>
        <Label htmlFor="businessName">Business Name *</Label>
        <Input id="businessName" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} placeholder="Enter your business name" required />
      </div>
      <div>
        <Label htmlFor="businessType">Business Type *</Label>
        <Select value={formData.businessType} onValueChange={(value) => setFormData({ ...formData, businessType: value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select business type" />
          </SelectTrigger>
          <SelectContent>
            {PROFILE_BUSINESS_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="employees">Number of Employees</Label>
        <Input id="employees" type="number" min="0" value={formData.employees} onChange={(e) => setFormData({ ...formData, employees: e.target.value })} placeholder="e.g., 5" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="revenue">Approximate annual revenue</Label>
          <Input id="revenue" type="number" min="0" value={formData.revenue} onChange={(e) => setFormData({ ...formData, revenue: e.target.value })} placeholder="e.g., 75000" />
        </div>
        <div>
          <Label htmlFor="yearsInBusiness">Years in business</Label>
          <Input id="yearsInBusiness" type="number" min="0" value={formData.yearsInBusiness} onChange={(e) => setFormData({ ...formData, yearsInBusiness: e.target.value })} placeholder="0 for pre-launch" />
        </div>
      </div>
    </div>
  );
}
