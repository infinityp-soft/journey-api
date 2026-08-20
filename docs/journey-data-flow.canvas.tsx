import {
  Callout,
  Card,
  CardBody,
  CardHeader,
  Code,
  CollapsibleSection,
  Divider,
  Grid,
  H1,
  H2,
  H3,
  Pill,
  Row,
  Select,
  Spacer,
  Stack,
  Stat,
  Table,
  Text,
  computeDAGLayout,
  useCanvasState,
  useHostTheme,
} from "cursor/canvas";

type FlowId =
  | "auth"
  | "content"
  | "media"
  | "leads"
  | "events"
  | "visits"
  | "settings";

const FLOW_OPTIONS = [
  { value: "auth", label: "Admin login → dashboard" },
  { value: "content", label: "Content CRUD" },
  { value: "media", label: "Media upload → attach" },
  { value: "leads", label: "Public lead capture" },
  { value: "events", label: "Event registration" },
  { value: "visits", label: "Site visit counter" },
  { value: "settings", label: "Global settings → pre-footer CTA" },
];

const FLOWS: Record<
  FlowId,
  {
    title: string;
    auth: string;
    steps: string[];
    files: string[];
    endpoints: string[];
  }
> = {
  auth: {
    title: "Admin login → dashboard",
    auth: "Public login, then Bearer JWT",
    steps: [
      "POST /api/auth/login with email + password",
      "AuthService validates user via bcrypt against users",
      "Issue access + refresh tokens; store refresh hash in refresh_tokens",
      "Client calls GET /api/dashboard/summary with Bearer token",
      "DashboardService aggregates leads, articles, destinations, siteVisits, activity_logs",
    ],
    files: [
      "src/auth/auth.controller.ts",
      "src/auth/auth.service.ts",
      "src/dashboard/dashboard.service.ts",
    ],
    endpoints: [
      "POST /api/auth/login",
      "POST /api/auth/refresh",
      "GET /api/dashboard/summary",
    ],
  },
  content: {
    title: "Content CRUD (banners, staff, destinations, …)",
    auth: "JWT + CASL subject check",
    steps: [
      "Authenticated request hits controller with @CheckPolicies",
      "Service uses BasePrismaService or custom Prisma calls",
      "DTOs pass media FK ids (not file blobs)",
      "Prisma write/read with include for related media_assets",
      "MediaUrlInterceptor adds public url; mutating calls write activity_logs",
    ],
    files: [
      "src/common/crud/base-prisma.service.ts",
      "src/banners/",
      "src/articles/articles.service.ts",
      "src/common/interceptors/media-url.interceptor.ts",
    ],
    endpoints: [
      "GET|POST|PATCH|DELETE /api/banners",
      "GET|POST|PATCH|DELETE /api/articles",
      "…same pattern for staff, destinations, visa, etc.",
    ],
  },
  media: {
    title: "Media upload → attach to content",
    auth: "JWT + Action.Create on Media",
    steps: [
      "POST /api/media-assets multipart field file",
      "Validate mime → sharp → WebP → UPLOAD_DIR/yyyy/mm/dd/{uuid}.webp",
      "Insert media_assets row (storageKey, dimensions, checksum)",
      "Client stores returned id as featuredImageId / coverImageId on content",
      "Nightly MediaGarbageCollector deletes orphans older than 24h",
    ],
    files: [
      "src/media/media.controller.ts",
      "src/media/media.service.ts",
      "src/media/media.gc.ts",
    ],
    endpoints: [
      "POST /api/media-assets",
      "GET /media/{storageKey}",
    ],
  },
  leads: {
    title: "Public lead capture",
    auth: "@Public() — no JWT",
    steps: [
      "Marketing site POST /api/leads/submit",
      "LeadsService.create → leads row (status: new, topic enum)",
      "Admins later list/update via authenticated /api/leads",
    ],
    files: [
      "src/leads/leads.controller.ts",
      "src/leads/leads.service.ts",
    ],
    endpoints: [
      "POST /api/leads/submit",
      "GET|PATCH /api/leads",
    ],
  },
  events: {
    title: "Public event registration",
    auth: "Admin JWT for setup; public for register",
    steps: [
      "Admin creates event + nested formFields",
      "Site POST /api/events/:id/registrations",
      "Check form enabled + max capacity",
      "Insert event_registrations with answers JSON",
      "Admin lists via GET /api/events/:id/registrations",
    ],
    files: [
      "src/events/events.controller.ts",
      "src/events/events.service.ts",
    ],
    endpoints: [
      "POST /api/events",
      "POST /api/events/:id/registrations",
      "GET /api/events/:id/registrations",
    ],
  },
  visits: {
    title: "Site visit counter",
    auth: "@Public()",
    steps: [
      "Site POST /api/analytics/visit",
      "SettingsService.incrementSiteVisits on singleton site_settings",
      "Dashboard summary reads siteVisits",
    ],
    files: [
      "src/settings/analytics.controller.ts",
      "src/settings/settings.service.ts",
    ],
    endpoints: [
      "POST /api/analytics/visit",
      "GET /api/dashboard/summary",
    ],
  },
  settings: {
    title: "Global settings → pre-footer CTA",
    auth: "JWT + Action.Update on SiteSettings (admin only)",
    steps: [
      "GET /api/settings returns the singleton with preFooterHighlights ordered by sortOrder",
      "PATCH /api/settings edits the bilingual title/description and preFooterEnabled",
      "CTA button stores preFooterCtaPlatform (e.g. line), label and destination URL",
      "Checklist rows are managed separately and capped at 3 by the service",
      "Marketing site renders the band above the footer",
    ],
    files: [
      "src/settings/settings.controller.ts",
      "src/settings/settings.service.ts",
    ],
    endpoints: [
      "GET|PATCH /api/settings",
      "POST /api/settings/pre-footer-highlights",
      "PATCH|DELETE /api/settings/pre-footer-highlights/:id",
    ],
  },
};

const ARCH_NODES = [
  { id: "admin", label: "Admin CMS UI" },
  { id: "site", label: "Marketing site" },
  { id: "api", label: "NestJS /api" },
  { id: "guards", label: "JWT + CASL" },
  { id: "svc", label: "Services" },
  { id: "pg", label: "PostgreSQL" },
  { id: "disk", label: "Upload volume" },
  { id: "media", label: "GET /media" },
];

const ARCH_EDGES = [
  { from: "admin", to: "api" },
  { from: "site", to: "api" },
  { from: "api", to: "guards" },
  { from: "guards", to: "svc" },
  { from: "svc", to: "pg" },
  { from: "svc", to: "disk" },
  { from: "disk", to: "media" },
  { from: "media", to: "site" },
];

function ArchitectureDag() {
  const theme = useHostTheme();
  const layout = computeDAGLayout({
    nodes: ARCH_NODES.map((n) => ({ id: n.id })),
    edges: ARCH_EDGES,
    direction: "horizontal",
    nodeWidth: 120,
    nodeHeight: 36,
    rankGap: 56,
    nodeGap: 28,
    padding: 16,
  });
  const labelById = Object.fromEntries(ARCH_NODES.map((n) => [n.id, n.label]));

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${layout.width} ${layout.height}`}
      style={{ maxWidth: layout.width, display: "block" }}
    >
      {layout.edges.map((e, i) => (
        <line
          key={i}
          x1={e.sourceX}
          y1={e.sourceY}
          x2={e.targetX}
          y2={e.targetY}
          stroke={theme.stroke.secondary}
          strokeWidth={1.5}
          strokeDasharray={e.isBackEdge ? "4 3" : undefined}
        />
      ))}
      {layout.nodes.map((n) => (
        <g key={n.id}>
          <rect
            x={n.x}
            y={n.y}
            width={120}
            height={36}
            rx={4}
            fill={theme.fill.secondary}
            stroke={theme.stroke.primary}
          />
          <text
            x={n.x + 60}
            y={n.y + 22}
            textAnchor="middle"
            fill={theme.text.primary}
            fontSize={11}
            fontFamily="system-ui, sans-serif"
          >
            {labelById[n.id]}
          </text>
        </g>
      ))}
    </svg>
  );
}

function PipelineBar() {
  const theme = useHostTheme();
  const stages = [
    "ValidationPipe",
    "JwtAuthGuard",
    "PoliciesGuard",
    "Controller → Service",
    "Prisma",
    "MediaUrl + ActivityLog",
  ];
  return (
    <Row gap={6} style={{ flexWrap: "wrap", alignItems: "center" }}>
      {stages.map((s, i) => (
        <Row key={s} gap={6} style={{ alignItems: "center" }}>
          <div
            style={{
              padding: "4px 10px",
              background: theme.fill.tertiary,
              border: `1px solid ${theme.stroke.secondary}`,
              borderRadius: 4,
            }}
          >
            <Text size="small" weight="medium">
              {s}
            </Text>
          </div>
          {i < stages.length - 1 ? (
            <Text size="small" tone="tertiary">
              →
            </Text>
          ) : null}
        </Row>
      ))}
    </Row>
  );
}

export default function JourneyDataFlow() {
  const theme = useHostTheme();
  const [flowId, setFlowId] = useCanvasState<FlowId>("flow", "auth");
  const flow = FLOWS[flowId];

  return (
    <Stack gap={24} style={{ padding: 20, maxWidth: 960 }}>
      <Stack gap={6}>
        <H1>Journey Project — Data Flow</H1>
        <Text tone="secondary">
          Backend-only Admin CMS API (NestJS + Prisma + PostgreSQL). External
          admin panel and marketing site are the consumers.
        </Text>
      </Stack>

      <Grid columns={4} gap={12}>
        <Stat value="NestJS 10" label="API framework" />
        <Stat value="Prisma 5" label="ORM → Postgres" />
        <Stat value="JWT + CASL" label="Auth / roles" />
        <Stat value="/api/docs" label="Swagger" />
      </Grid>

      <Callout tone="info">
        Public capture endpoints feed leads, event registrations, and site
        visits. Media is WebP on disk; metadata lives in Postgres. ERD:{" "}
        <Code>prisma/ERD.md</Code>
      </Callout>

      <Stack gap={10}>
        <H2>Architecture</H2>
        <Card>
          <CardHeader>Clients → API → data stores</CardHeader>
          <CardBody>
            <ArchitectureDag />
          </CardBody>
        </Card>
        <H3>Authenticated request pipeline</H3>
        <PipelineBar />
      </Stack>

      <Divider />

      <Stack gap={12}>
        <Row gap={12} style={{ alignItems: "center", justifyContent: "space-between" }}>
          <H2>Journey walkthrough</H2>
          <Select
            value={flowId}
            onChange={(v) => setFlowId(v as FlowId)}
            options={FLOW_OPTIONS}
          />
        </Row>
        <Card>
          <CardHeader
            trailing={
              <Pill tone="info" size="small">
                {flow.auth}
              </Pill>
            }
          >
            {flow.title}
          </CardHeader>
          <CardBody>
            <Stack gap={14}>
              <Stack gap={6}>
                <Text weight="semibold">Steps</Text>
                {flow.steps.map((step, i) => (
                  <Row key={i} gap={8} style={{ alignItems: "flex-start" }}>
                    <Text
                      size="small"
                      weight="semibold"
                      style={{
                        width: 20,
                        color: theme.accent.primary,
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}.
                    </Text>
                    <Text size="small">{step}</Text>
                  </Row>
                ))}
              </Stack>
              <Grid columns={2} gap={12}>
                <Stack gap={4}>
                  <Text size="small" weight="semibold" tone="secondary">
                    Endpoints
                  </Text>
                  {flow.endpoints.map((e) => (
                    <Code key={e}>{e}</Code>
                  ))}
                </Stack>
                <Stack gap={4}>
                  <Text size="small" weight="semibold" tone="secondary">
                    Key files
                  </Text>
                  {flow.files.map((f) => (
                    <Code key={f}>{f}</Code>
                  ))}
                </Stack>
              </Grid>
            </Stack>
          </CardBody>
        </Card>
      </Stack>

      <Divider />

      <Stack gap={10}>
        <H2>Module → route map</H2>
        <Table
          headers={["Module", "Base route", "Notes"]}
          rows={[
            ["Auth", "/api/auth", "login, refresh, logout, me"],
            ["Users", "/api/users", "admin CRUD + self profile"],
            ["Media", "/api/media-assets", "files at /media"],
            ["Dashboard", "/api/dashboard/summary", "aggregates"],
            ["Activity logs", "/api/activity-logs", "audit feed"],
            ["Banners", "/api/banners", "homepage"],
            ["About Us", "/api/about-us", "singleton + highlights"],
            ["Staff", "/api/staff", "team members"],
            ["Destinations", "/api/destinations", "PublishStatus"],
            ["Articles", "/api/articles", "+ /article-categories"],
            ["Visa", "/api/visa-services", "+ documents (bilingual)"],
            ["Testimonials", "/api/testimonials", "counselor FK"],
            ["Videos", "/api/videos", "+ page-settings"],
            ["Events", "/api/events", "+ public registrations"],
            ["Leads", "/api/leads", "+ public /submit"],
            ["Settings", "/api/settings", "+ social-links, pre-footer-highlights"],
            ["Analytics", "/api/analytics/visit", "public counter"],
          ]}
        />
      </Stack>

      <Stack gap={10}>
        <H2>Roles</H2>
        <Grid columns={3} gap={12}>
          <Card>
            <CardHeader trailing={<Pill tone="warning" size="small">admin</Pill>}>
              Full control
            </CardHeader>
            <CardBody>
              <Text size="small">manage all — users, settings, content</Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Pill tone="info" size="small">editor</Pill>}>
              Content ops
            </CardHeader>
            <CardBody>
              <Text size="small">
                Full content CRUD/publish; no users/settings/social/pre-footer
                CTA; can update own user
              </Text>
            </CardBody>
          </Card>
          <Card>
            <CardHeader trailing={<Pill size="small">viewer</Pill>}>
              Read-only
            </CardHeader>
            <CardBody>
              <Text size="small">Read-all; update own user</Text>
            </CardBody>
          </Card>
        </Grid>
      </Stack>

      <CollapsibleSection title="Entity hub (media_assets)">
        <Stack gap={8}>
          <Text size="small" tone="secondary">
            All image FKs point to media_assets (ON DELETE SET NULL). Files live
            on disk only.
          </Text>
          <Table
            headers={["Entity", "Role", "Key relations"]}
            rows={[
              ["users", "CMS accounts", "avatar, refresh_tokens, activity_logs, articles"],
              ["refresh_tokens", "Session rotate/revoke", "→ user (cascade)"],
              ["activity_logs", "Audit feed", "→ user (set null)"],
              ["media_assets", "Image metadata", "referenced by most content"],
              ["banners", "Homepage", "→ image"],
              ["about_us", "Singleton bio", "highlights, team header image"],
              ["staff_members", "Team", "photo; testimonials as counselor"],
              ["destinations", "Study destinations", "cover + country flag; PublishStatus"],
              ["articles", "Blog", "category, author, featured image"],
              ["visa_services", "Visa pages (bilingual)", "cascade visa_documents"],
              ["testimonials", "Reviews", "counselor, portrait"],
              ["videos", "Video page", "YouTube + thumbnail"],
              ["events", "Events + RSVP", "form_fields, registrations"],
              ["leads", "Inquiries", "topic/status; lead_code"],
              ["site_settings", "Contact/SEO/visits/pre-footer CTA", "logo + contact cover; cascade pre_footer_highlights"],
              ["pre_footer_highlights", "Pre-footer CTA checklist", "→ site_settings (cascade)"],
              ["social_links", "Footer/social", "platform enum"],
            ]}
          />
        </Stack>
      </CollapsibleSection>

      <CollapsibleSection title="Auth token lifecycle">
        <Stack gap={6}>
          <Text size="small">
            Access TTL default 15m · Refresh 7d (hashed, rotated on refresh)
          </Text>
          <Row gap={8} style={{ flexWrap: "wrap" }}>
            <Pill size="small">login → issue pair</Pill>
            <Text size="small" tone="tertiary">
              →
            </Text>
            <Pill size="small">Bearer accessToken</Pill>
            <Text size="small" tone="tertiary">
              →
            </Text>
            <Pill size="small">refresh → revoke old + new pair</Pill>
            <Text size="small" tone="tertiary">
              →
            </Text>
            <Pill size="small">logout → revokedAt</Pill>
          </Row>
        </Stack>
      </CollapsibleSection>

      <CollapsibleSection title="Key environment variables">
        <Table
          headers={["Variable", "Purpose"]}
          rows={[
            ["DATABASE_URL", "Postgres for Prisma"],
            ["JWT_ACCESS_SECRET / TTL", "Access token"],
            ["JWT_REFRESH_SECRET / TTL", "Refresh token"],
            ["UPLOAD_DIR", "Disk path for images"],
            ["PUBLIC_MEDIA_URL", "Public media base URL"],
            ["MAX_UPLOAD_MB", "Upload size limit"],
            ["SEED_ADMIN_*", "Bootstrap admin via seed"],
            ["PORT / API_PREFIX", "Runtime (3000 / api)"],
          ]}
        />
      </CollapsibleSection>

      <Spacer />
      <Text size="small" tone="tertiary">
        Source: journey-project codebase · NestJS modules under src/ · Prisma
        schema
      </Text>
    </Stack>
  );
}
