import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Users, Briefcase, Award } from "lucide-react";
import { PROFILE_DEMOGRAPHICS, PROFILE_INDUSTRIES } from "@/lib/profile-options";
import type { ProfileFormData } from "@/lib/profile-form";

interface Props {
  formData: ProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>>;
  showHeading?: boolean;
}

export function IndustryDemographicsFields({ formData, setFormData, showHeading = true }: Props) {
  const toggleTag = (tag: string, field: "industryTags" | "demographics") => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(tag) ? prev[field].filter((t) => t !== tag) : [...prev[field], tag],
    }));
  };

  return (
    <div className="space-y-6">
      {showHeading && (
        <div className="flex items-center gap-3 mb-6">
          <Briefcase className="h-8 w-8 text-primary" />
          <div>
            <h3 className="text-lg font-semibold">Industry & Demographics</h3>
            <p className="text-sm text-muted-foreground">Help us personalize your experience</p>
          </div>
        </div>
      )}
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Users className="h-4 w-4" />
          Industries (select all that apply)
        </Label>
        <div className="flex flex-wrap gap-2">
          {PROFILE_INDUSTRIES.map(({ value, label }) => (
            <Badge key={value} variant={formData.industryTags.includes(value) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTag(value, "industryTags")}>{label}</Badge>
          ))}
        </div>
      </div>
      <div>
        <Label className="flex items-center gap-2 mb-3">
          <Award className="h-4 w-4" />
          Business Demographics (optional)
        </Label>
        <div className="flex flex-wrap gap-2">
          {PROFILE_DEMOGRAPHICS.map(({ value, label }) => (
            <Badge key={value} variant={formData.demographics.includes(value) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTag(value, "demographics")}>{label}</Badge>
          ))}
        </div>
      </div>
    </div>
  );
}
