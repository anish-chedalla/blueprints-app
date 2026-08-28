import { Navbar } from "@/components/Navbar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchFederalGrantDetail } from "@/lib/grants-gov";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleDollarSign,
  ExternalLink,
  Hash,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";

function formatDate(value: string | null): string {
  if (!value) return "Not announced";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatMoney(value: number | null): string {
  if (value === null) return "Not specified";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function FederalGrantDetail() {
  const { id = "" } = useParams();
  const numericId = Number(id);
  const validId = Number.isSafeInteger(numericId) && numericId > 0;
  const detailQuery = useQuery({
    queryKey: ["grants-gov-opportunity", id],
    queryFn: ({ signal }) => fetchFederalGrantDetail(id, signal),
    enabled: validId,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });

  if (!validId) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-4xl px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Invalid opportunity</AlertTitle>
            <AlertDescription>This Grants.gov opportunity ID is not valid.</AlertDescription>
          </Alert>
          <Button asChild variant="outline" className="mt-6">
            <Link to="/grants"><ArrowLeft className="mr-2 h-4 w-4" />Back to grant search</Link>
          </Button>
        </main>
      </div>
    );
  }

  if (detailQuery.isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-5xl space-y-6 px-4 py-8" aria-label="Loading grant details">
          <Skeleton className="h-10 w-36" />
          <Skeleton className="h-48 w-full" />
          <div className="grid gap-6 md:grid-cols-2">
            <Skeleton className="h-72" />
            <Skeleton className="h-72" />
          </div>
        </main>
      </div>
    );
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto max-w-4xl px-4 py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Could not load this opportunity</AlertTitle>
            <AlertDescription>
              Grants.gov may be temporarily unavailable. Try again or open the official listing.
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={() => detailQuery.refetch()}>Try again</Button>
            <Button asChild variant="outline">
              <a href={`https://www.grants.gov/search-results-detail/${numericId}`} target="_blank" rel="noreferrer">
                Open Grants.gov <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const grant = detailQuery.data;
  const hasAwardData = grant.awardFloor !== null
    || grant.awardCeiling !== null
    || grant.estimatedFunding !== null
    || grant.expectedAwards !== null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto max-w-5xl px-4 py-8">
        <Button asChild variant="ghost" className="mb-5">
          <Link to="/grants"><ArrowLeft className="mr-2 h-4 w-4" />Back to grant search</Link>
        </Button>

        <section className="mb-6 rounded-2xl border bg-card p-6 shadow-sm md:p-8">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge>Official Grants.gov opportunity</Badge>
            {grant.status && <Badge variant="outline" className="capitalize">{grant.status}</Badge>}
            {grant.opportunityCategory && <Badge variant="secondary">{grant.opportunityCategory}</Badge>}
          </div>
          <h1 className="text-3xl font-bold leading-tight md:text-4xl">{grant.title}</h1>
          <p className="mt-4 flex items-start gap-2 text-lg text-muted-foreground">
            <Building2 className="mt-1 h-5 w-5 shrink-0" />
            {grant.agency}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <a href={grant.officialUrl} target="_blank" rel="noreferrer">
                View and apply on Grants.gov <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
            {grant.additionalUrl && grant.additionalUrl !== grant.officialUrl && (
              <Button asChild variant="outline">
                <a href={grant.additionalUrl} target="_blank" rel="noreferrer">
                  Agency announcement <ExternalLink className="ml-2 h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle>Opportunity overview</CardTitle></CardHeader>
              <CardContent>
                <p className="whitespace-pre-line leading-7 text-muted-foreground">{grant.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle>Who can apply</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {grant.applicantTypes.length > 0 ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {grant.applicantTypes.map((applicant) => (
                      <li key={applicant} className="flex items-start gap-2 rounded-lg bg-muted/60 p-3 text-sm">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        {applicant}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground">Applicant types were not listed in the API record.</p>
                )}
                {grant.eligibilityDescription && (
                  <div>
                    <h3 className="mb-2 font-semibold">Additional eligibility information</h3>
                    <p className="whitespace-pre-line text-sm leading-6 text-muted-foreground">
                      {grant.eligibilityDescription}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(grant.categories.length > 0 || grant.fundingInstruments.length > 0) && (
              <Card>
                <CardHeader><CardTitle>Funding classification</CardTitle></CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  {[...grant.fundingInstruments, ...grant.categories].map((item) => (
                    <Badge key={item} variant="secondary">{item}</Badge>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          <aside className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="text-lg">Key details</CardTitle></CardHeader>
              <CardContent>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="flex items-center gap-2 font-medium"><Hash className="h-4 w-4 text-primary" />Opportunity number</dt>
                    <dd className="mt-1 pl-6 text-muted-foreground">{grant.number || "Not specified"}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 font-medium"><CalendarDays className="h-4 w-4 text-primary" />Posted</dt>
                    <dd className="mt-1 pl-6 text-muted-foreground">{formatDate(grant.postedDate)}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-2 font-medium"><CalendarDays className="h-4 w-4 text-primary" />Deadline</dt>
                    <dd className="mt-1 pl-6 text-muted-foreground">{formatDate(grant.deadline)}</dd>
                  </div>
                  {grant.alnNumbers.length > 0 && (
                    <div>
                      <dt className="font-medium">Assistance Listing (ALN)</dt>
                      <dd className="mt-1 space-y-2 text-muted-foreground">
                        {grant.alnNumbers.map((aln) => (
                          <div key={aln.number}><span className="font-medium text-foreground">{aln.number}</span>{aln.title ? ` · ${aln.title}` : ""}</div>
                        ))}
                      </dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {hasAwardData && (
              <Card>
                <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><CircleDollarSign className="h-5 w-5 text-primary" />Award information</CardTitle></CardHeader>
                <CardContent>
                  <dl className="space-y-3 text-sm">
                    <div><dt className="text-muted-foreground">Award floor</dt><dd className="font-medium">{formatMoney(grant.awardFloor)}</dd></div>
                    <div><dt className="text-muted-foreground">Award ceiling</dt><dd className="font-medium">{formatMoney(grant.awardCeiling)}</dd></div>
                    <div><dt className="text-muted-foreground">Estimated total funding</dt><dd className="font-medium">{formatMoney(grant.estimatedFunding)}</dd></div>
                    <div><dt className="text-muted-foreground">Expected awards</dt><dd className="font-medium">{grant.expectedAwards ?? "Not specified"}</dd></div>
                    <div><dt className="text-muted-foreground">Cost sharing</dt><dd className="font-medium">{grant.costSharing === null ? "Not specified" : grant.costSharing ? "Required" : "Not required"}</dd></div>
                  </dl>
                </CardContent>
              </Card>
            )}

            {(grant.contact.name || grant.contact.email || grant.contact.phone || grant.contact.description) && (
              <Card>
                <CardHeader><CardTitle className="text-lg">Agency contact</CardTitle></CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {grant.contact.name && <p className="font-medium">{grant.contact.name}</p>}
                  {grant.contact.email && (
                    <a className="flex items-center gap-2 text-primary hover:underline" href={`mailto:${grant.contact.email}`}>
                      <Mail className="h-4 w-4" />{grant.contact.email}
                    </a>
                  )}
                  {grant.contact.phone && <p className="flex items-center gap-2"><Phone className="h-4 w-4" />{grant.contact.phone}</p>}
                  {grant.contact.description && <p className="whitespace-pre-line text-muted-foreground">{grant.contact.description}</p>}
                </CardContent>
              </Card>
            )}
          </aside>
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Data is retrieved live from Grants.gov. Verify all eligibility requirements and dates on the official listing before applying.
        </p>
      </main>
    </div>
  );
}
