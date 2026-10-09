export interface ProfileFormData {
  businessName: string;
  businessType: string;
  city: string;
  county: string;
  employees: string;
  revenue: string;
  yearsInBusiness: string;
  industryTags: string[];
  demographics: string[];
}

export const emptyProfileFormData: ProfileFormData = {
  businessName: "",
  businessType: "",
  city: "",
  county: "",
  employees: "",
  revenue: "",
  yearsInBusiness: "",
  industryTags: [],
  demographics: [],
};

export const optionalNumber = (value: string) => (value.trim() === "" ? null : Number(value));
