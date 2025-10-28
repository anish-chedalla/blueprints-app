import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";

interface FilterPanelProps {
  filters: {
    level: string[];
    city: string;
    county: string;
    industryTags: string[];
    demographics: string[];
    rolling: boolean | null;
    minAmount: string;
    maxAmount: string;
  };
  onFilterChange: (filters: any) => void;
  type: "GRANT" | "LOAN";
}

const LEVELS = ["LOCAL", "STATE", "NATIONAL"];
const INDUSTRIES = ["technology", "retail", "services", "food service", "sustainability", "biotech", "healthcare", "manufacturing"];
const DEMOGRAPHICS = ["women_owned", "veteran_owned", "minority_owned", "lgbtq_owned"];
const COUNTIES = ["Maricopa", "Pima", "Pinal", "Yavapai", "Coconino", "Mohave", "Yuma"];
const CITIES = ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe"];

export const FilterPanel = ({ filters, onFilterChange, type }: FilterPanelProps) => {
  const handleLevelToggle = (level: string) => {
    const newLevels = filters.level.includes(level)
      ? filters.level.filter(l => l !== level)
      : [...filters.level, level];
    onFilterChange({ ...filters, level: newLevels });
  };

  const handleIndustryToggle = (industry: string) => {
    const newIndustries = filters.industryTags.includes(industry)
      ? filters.industryTags.filter(i => i !== industry)
      : [...filters.industryTags, industry];
    onFilterChange({ ...filters, industryTags: newIndustries });
  };

  const handleDemographicToggle = (demo: string) => {
    const newDemos = filters.demographics.includes(demo)
      ? filters.demographics.filter(d => d !== demo)
      : [...filters.demographics, demo];
    onFilterChange({ ...filters, demographics: newDemos });
  };

  const clearFilters = () => {
    onFilterChange({
      level: [],
      city: "",
      county: "",
      industryTags: [],
      demographics: [],
      rolling: null,
      minAmount: "",
      maxAmount: "",
    });
  };

  const activeFilterCount = filters.level.length + filters.industryTags.length + filters.demographics.length + 
    (filters.city ? 1 : 0) + (filters.county ? 1 : 0) + (filters.rolling !== null ? 1 : 0) +
    (filters.minAmount ? 1 : 0) + (filters.maxAmount ? 1 : 0);

  return (
    <Card className="h-fit sticky top-20">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Filters</CardTitle>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear ({activeFilterCount})
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[calc(100vh-12rem)] pr-4">
          <div className="space-y-6">
            {/* Level */}
            <div className="space-y-3">
              <Label className="font-semibold">Level</Label>
              <div className="space-y-2">
                {LEVELS.map(level => (
                  <div key={level} className="flex items-center space-x-2">
                    <Checkbox
                      id={`level-${level}`}
                      checked={filters.level.includes(level)}
                      onCheckedChange={() => handleLevelToggle(level)}
                    />
                    <label htmlFor={`level-${level}`} className="text-sm cursor-pointer">
                      {level}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Location */}
            <div className="space-y-3">
              <Label className="font-semibold">Location</Label>
              <div className="space-y-2">
                <Select value={filters.county || "all"} onValueChange={(value) => onFilterChange({ ...filters, county: value === "all" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select county" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Counties</SelectItem>
                    {COUNTIES.map(county => (
                      <SelectItem key={county} value={county}>{county}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.city || "all"} onValueChange={(value) => onFilterChange({ ...filters, city: value === "all" ? "" : value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Cities</SelectItem>
                    {CITIES.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Industry */}
            <div className="space-y-3">
              <Label className="font-semibold">Industry</Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(industry => (
                  <Badge
                    key={industry}
                    variant={filters.industryTags.includes(industry) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => handleIndustryToggle(industry)}
                  >
                    {industry}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Demographics */}
            <div className="space-y-3">
              <Label className="font-semibold">Demographics</Label>
              <div className="space-y-2">
                {DEMOGRAPHICS.map(demo => (
                  <div key={demo} className="flex items-center space-x-2">
                    <Checkbox
                      id={`demo-${demo}`}
                      checked={filters.demographics.includes(demo)}
                      onCheckedChange={() => handleDemographicToggle(demo)}
                    />
                    <label htmlFor={`demo-${demo}`} className="text-sm cursor-pointer capitalize">
                      {demo.replace(/_/g, " ")}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Amount Range */}
            <div className="space-y-3">
              <Label className="font-semibold">Amount Range</Label>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Min amount"
                  value={filters.minAmount}
                  onChange={(e) => onFilterChange({ ...filters, minAmount: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Max amount"
                  value={filters.maxAmount}
                  onChange={(e) => onFilterChange({ ...filters, maxAmount: e.target.value })}
                />
              </div>
            </div>

            {/* Rolling */}
            <div className="space-y-3">
              <Label className="font-semibold">Application Status</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rolling"
                    checked={filters.rolling === true}
                    onCheckedChange={(checked) => 
                      onFilterChange({ ...filters, rolling: checked ? true : null })
                    }
                  />
                  <label htmlFor="rolling" className="text-sm cursor-pointer">
                    Rolling applications only
                  </label>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
