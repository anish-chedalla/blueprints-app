const GRANTS_GOV_API_BASE = "https://api.grants.gov/v1/api";

export const FEDERAL_GRANT_PAGE_SIZE = 20;

export const FEDERAL_GRANT_CATEGORIES = [
  { value: "AG", label: "Agriculture" },
  { value: "AR", label: "Arts" },
  { value: "BC", label: "Business & commerce" },
  { value: "CD", label: "Community development" },
  { value: "ED", label: "Education" },
  { value: "ELT", label: "Employment & training" },
  { value: "EN", label: "Energy" },
  { value: "ENV", label: "Environment" },
  { value: "HL", label: "Health" },
  { value: "HO", label: "Housing" },
  { value: "NR", label: "Natural resources" },
  { value: "RD", label: "Regional development" },
  { value: "ST", label: "Science & technology" },
  { value: "T", label: "Transportation" },
] as const;

export const FEDERAL_GRANT_AGENCIES = [
  { value: "SBA", label: "Small Business Administration" },
  { value: "USDA", label: "Department of Agriculture" },
  { value: "DOC", label: "Department of Commerce" },
  { value: "DOE", label: "Department of Energy" },
  { value: "HHS", label: "Health & Human Services" },
  { value: "DOI", label: "Department of the Interior" },
  { value: "NSF", label: "National Science Foundation" },
] as const;

export interface FederalGrantSearchParams {
  keyword?: string;
  status: "posted" | "forecasted" | "posted|forecasted";
  eligibility?: "23" | "23|99" | "22" | "99";
  category?: string;
  agency?: string;
  instrument?: "G" | "CA" | "G|CA";
  page?: number;
  rows?: number;
}

export interface FederalGrantSearchHit {
  id: string;
  number: string;
  title: string;
  agencyCode: string;
  agency: string;
  openDate: string | null;
  closeDate: string | null;
  status: "posted" | "forecasted" | string;
  documentType: string;
  alnNumbers: string[];
}

export interface FederalGrantSearchResult {
  hitCount: number;
  startRecord: number;
  opportunities: FederalGrantSearchHit[];
  suggestion: string;
}

export interface FederalGrantDetail {
  id: number;
  number: string;
  title: string;
  agencyCode: string;
  agency: string;
  status: string;
  documentType: string;
  opportunityCategory: string | null;
  description: string;
  postedDate: string | null;
  deadline: string | null;
  archiveDate: string | null;
  awardFloor: number | null;
  awardCeiling: number | null;
  estimatedFunding: number | null;
  expectedAwards: number | null;
  costSharing: boolean | null;
  eligibilityDescription: string;
  applicantTypes: string[];
  fundingInstruments: string[];
  categories: string[];
  alnNumbers: Array<{ number: string; title: string }>;
  contact: {
    name: string;
    email: string;
    phone: string;
    description: string;
  };
  officialUrl: string;
  additionalUrl: string | null;
}

interface GrantsGovEnvelope<T> {
  errorcode?: number;
  msg?: string;
  data?: T;
}

interface RawSearchHit {
  id?: string | number;
  number?: string;
  title?: string;
  agencyCode?: string;
  agency?: string;
  agencyName?: string;
  openDate?: string;
  closeDate?: string;
  oppStatus?: string;
  docType?: string;
  cfdaList?: string[];
  alnist?: string[];
}

interface RawSearchData {
  hitCount?: number;
  startRecord?: number;
  oppHits?: RawSearchHit[];
  suggestion?: string;
}

type UnknownRecord = Record<string, unknown>;

const HTML_ENTITIES: Record<string, string> = {
  amp: "&",
  apos: "'",
  gt: ">",
  hellip: "…",
  ldquo: "“",
  lsquo: "‘",
  lt: "<",
  mdash: "—",
  nbsp: " ",
  ndash: "–",
  quot: '"',
  rdquo: "”",
  rsquo: "’",
};

export function htmlToPlainText(value: unknown): string {
  if (typeof value !== "string") return "";

  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (entity, code: string) => {
      if (code.startsWith("#x") || code.startsWith("#X")) {
        const parsed = Number.parseInt(code.slice(2), 16);
        return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : entity;
      }
      if (code.startsWith("#")) {
        const parsed = Number.parseInt(code.slice(1), 10);
        return Number.isFinite(parsed) ? String.fromCodePoint(parsed) : entity;
      }
      return HTML_ENTITIES[code.toLowerCase()] ?? entity;
    })
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}

export function normalizeGrantDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    return `${usMatch[3]}-${usMatch[1].padStart(2, "0")}-${usMatch[2].padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}

export function grantsGovOpportunityUrl(id: string | number): string {
  return `https://www.grants.gov/search-results-detail/${encodeURIComponent(String(id))}`;
}

async function grantsGovRequest<T>(path: string, body: UnknownRecord, signal?: AbortSignal): Promise<T> {
  const response = await fetch(`${GRANTS_GOV_API_BASE}/${path}`, {
    method: "POST",
    // Grants.gov's OPTIONS route currently rejects preflight requests. text/plain
    // is a CORS-safelisted content type, and the API accepts the JSON body.
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    throw new Error(`Grants.gov request failed (${response.status})`);
  }

  const payload = (await response.json()) as GrantsGovEnvelope<T>;
  if (payload.errorcode !== 0 || !payload.data) {
    throw new Error(payload.msg || "Grants.gov returned an invalid response");
  }

  return payload.data;
}

export async function searchFederalGrants(
  params: FederalGrantSearchParams,
  signal?: AbortSignal,
): Promise<FederalGrantSearchResult> {
  const rows = Math.min(Math.max(params.rows ?? FEDERAL_GRANT_PAGE_SIZE, 1), 100);
  const page = Math.max(params.page ?? 0, 0);
  const data = await grantsGovRequest<RawSearchData>("search2", {
    rows,
    startRecordNum: page * rows,
    keyword: params.keyword?.trim() || "",
    oppStatuses: params.status,
    eligibilities: params.eligibility || "",
    fundingCategories: params.category || "",
    agencies: params.agency || "",
    fundingInstruments: params.instrument || "G",
  }, signal);

  return {
    hitCount: Number(data.hitCount) || 0,
    startRecord: Number(data.startRecord) || 0,
    suggestion: htmlToPlainText(data.suggestion),
    opportunities: (data.oppHits ?? []).map((hit) => ({
      id: String(hit.id ?? ""),
      number: htmlToPlainText(hit.number),
      title: htmlToPlainText(hit.title) || "Untitled opportunity",
      agencyCode: htmlToPlainText(hit.agencyCode),
      agency: htmlToPlainText(hit.agency ?? hit.agencyName) || "Unknown federal agency",
      openDate: normalizeGrantDate(hit.openDate),
      closeDate: normalizeGrantDate(hit.closeDate),
      status: htmlToPlainText(hit.oppStatus).toLowerCase(),
      documentType: htmlToPlainText(hit.docType).toLowerCase(),
      alnNumbers: Array.isArray(hit.cfdaList)
        ? hit.cfdaList.map(htmlToPlainText).filter(Boolean)
        : Array.isArray(hit.alnist)
          ? hit.alnist.map(htmlToPlainText).filter(Boolean)
          : [],
    })).filter((hit) => hit.id),
  };
}

function asRecord(value: unknown): UnknownRecord {
  return value && typeof value === "object" && !Array.isArray(value) ? value as UnknownRecord : {};
}

function asRecordArray(value: unknown): UnknownRecord[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = htmlToPlainText(value);
    if (text) return text;
  }
  return "";
}

function parseMoney(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim() || value.toLowerCase() === "none") return null;
  const parsed = Number(value.replace(/[$,\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.trunc(value);
  if (typeof value !== "string") return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeExternalUrl(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null;
  } catch {
    return null;
  }
}

export async function fetchFederalGrantDetail(
  opportunityId: string | number,
  signal?: AbortSignal,
): Promise<FederalGrantDetail> {
  const numericId = Number(opportunityId);
  if (!Number.isSafeInteger(numericId) || numericId <= 0) {
    throw new Error("Invalid Grants.gov opportunity ID");
  }

  const data = await grantsGovRequest<UnknownRecord>("fetchOpportunity", {
    opportunityId: numericId,
  }, signal);
  const synopsis = asRecord(data.synopsis);
  const forecast = asRecord(data.forecast);
  const details = Object.keys(synopsis).length > 0 ? synopsis : forecast;
  const agencyDetails = asRecord(data.agencyDetails);
  const opportunityCategory = asRecord(data.opportunityCategory);
  const cfdas = asRecordArray(data.cfdas ?? data.alns);

  return {
    id: numericId,
    number: firstText(data.opportunityNumber),
    title: firstText(data.opportunityTitle) || "Untitled opportunity",
    agencyCode: firstText(data.owningAgencyCode, details.agencyCode),
    agency: firstText(details.agencyName, agencyDetails.agencyName) || "Unknown federal agency",
    status: firstText(data.ost, data.docType).toLowerCase(),
    documentType: firstText(data.docType).toLowerCase(),
    opportunityCategory: firstText(opportunityCategory.description) || null,
    description: firstText(details.synopsisDesc, details.forecastDesc, details.description)
      || "See the official Grants.gov listing for the complete opportunity description.",
    postedDate: normalizeGrantDate(details.postingDateStr ?? details.postingDate ?? details.estimatedPostDate),
    deadline: normalizeGrantDate(
      details.responseDateStr
      ?? details.responseDate
      ?? details.estimatedApplicationDueDate
      ?? data.originalDueDate,
    ),
    archiveDate: normalizeGrantDate(details.archiveDateStr ?? details.archiveDate),
    awardFloor: parseMoney(details.awardFloor),
    awardCeiling: parseMoney(details.awardCeiling),
    estimatedFunding: parseMoney(details.estimatedFunding),
    expectedAwards: parseInteger(details.expectedNumberOfAwards),
    costSharing: typeof details.costSharing === "boolean" ? details.costSharing : null,
    eligibilityDescription: firstText(details.applicantEligibilityDesc),
    applicantTypes: asRecordArray(details.applicantTypes)
      .map((item) => firstText(item.description))
      .filter(Boolean),
    fundingInstruments: asRecordArray(details.fundingInstruments)
      .map((item) => firstText(item.description))
      .filter(Boolean),
    categories: asRecordArray(details.fundingActivityCategories)
      .map((item) => firstText(item.description))
      .filter(Boolean),
    alnNumbers: cfdas
      .map((item) => ({
        number: firstText(item.cfdaNumber, item.alnNumber),
        title: firstText(item.programTitle),
      }))
      .filter((item) => item.number),
    contact: {
      name: firstText(details.agencyContactName),
      email: firstText(details.agencyContactEmail),
      phone: firstText(details.agencyContactPhone, details.agencyPhone),
      description: firstText(details.agencyContactDesc),
    },
    officialUrl: grantsGovOpportunityUrl(numericId),
    additionalUrl: safeExternalUrl(details.fundingDescLinkUrl),
  };
}
