"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  CreditCard,
  LayoutPanelTop,
  MessageCircleMore,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import LeadProjectPopup from "@/components/LeadProjectPopup";
import { servicesById } from "../servicesData";

const numberFormatter = new Intl.NumberFormat("en-US");
const RELATED_SUMMARY_CLAMP_STYLE = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 2,
  overflow: "hidden",
};

const REQUIREMENTS_BY_CATEGORY = {
  growth: [
    "Business goal and target audience details",
    "Brand page or ad account access if available",
    "Current offers, products, or service list",
    "Existing creatives or campaign references",
  ],
  design: [
    "Brand name, positioning, and audience notes",
    "Preferred style, references, or inspiration",
    "Copy points, slogans, or product information",
    "Existing brand files if you already have them",
  ],
  build: [
    "Project goal, features, and expected outcome",
    "Reference websites or apps you like",
    "Brand assets, content, or product information",
    "Hosting, domain, or platform access if available",
  ],
};

function formatPrice(price) {
  return `৳${numberFormatter.format(price)}`;
}

function buildOverview(service) {
  return [
    `${service.name} is designed for ${service.bestFor}. ${service.summary}`,
    `This offer runs on a ${service.model.toLowerCase()} workflow, which keeps the process clear from kickoff to delivery. Most projects start with discovery, move into focused production, and wrap up within ${service.timeline.toLowerCase()}.`,
  ];
}

function buildFaqs(service, requirements) {
  return [
    {
      question: "What is included in this service?",
      answer: `You get ${service.whatYouGet.join(", ")}. The scope is arranged to keep delivery practical, polished, and ready for use.`,
    },
    {
      question: "How long does this usually take?",
      answer: `The standard delivery window for this service is ${service.timeline}. Final timing can shift slightly depending on revisions and content readiness.`,
    },
    {
      question: "Who is this best suited for?",
      answer: `${service.name} works best for ${service.bestFor}. If your goal matches that outcome, this package gives you a strong starting point.`,
    },
    {
      question: "What do you need from me before starting?",
      answer: `To start smoothly, we usually need ${requirements.join(", ")}.`,
    },
  ];
}

export default function ServiceDetail() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const service = slug ? servicesById[slug] : null;
  const [popupOpen, setPopupOpen] = useState(false);

  useEffect(() => {
    const dashboardContent = document.querySelector(".dashboard-content");
    const pageSurface = document.querySelector(".user-dashboard-page-surface");
    if (!dashboardContent) return undefined;

    dashboardContent.classList.add("services-detail-scroll-hidden");
    pageSurface?.classList.add("services-detail-surface-auto");

    return () => {
      dashboardContent.classList.remove("services-detail-scroll-hidden");
      pageSurface?.classList.remove("services-detail-surface-auto");
    };
  }, []);

  if (!service) {
    return (
      <main className="user-dashboard-theme-scope min-h-screen bg-transparent px-4 pt-8 pb-20">
        <div className="mx-auto max-w-3xl">
          <div
            className="dashboard-subpanel rounded-[32px] border px-8 py-12 text-center"
            style={{
              background: "rgba(255,255,255,0.92)",
              borderColor: "rgba(70, 88, 14, 0.14)",
            }}
          >
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#5f7418]">Service Not Found</p>
            <h1 className="mt-4 text-3xl font-black text-[var(--dashboard-text-strong)]">
              This service is not available.
            </h1>
            <p className="dashboard-text-muted mt-3 text-sm leading-7">
              The link may be outdated, or the service entry has been removed from the dashboard.
            </p>
            <Link
              href="/user-dashboard/services"
              className="mt-6 inline-flex items-center gap-2 rounded-[16px] px-5 py-2.5 text-sm font-bold text-[#0d1504]"
              style={{ background: "#C1EA2D" }}
            >
              <ArrowLeft size={16} />
              Back to Services
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const requirements = REQUIREMENTS_BY_CATEGORY[service.categoryId] ?? REQUIREMENTS_BY_CATEGORY.build;
  const overview = buildOverview(service);
  const faqs = buildFaqs(service, requirements);
  const allOtherServices = Object.values(servicesById).filter((item) => item.id !== service.id);
  const relatedServices = [
    ...allOtherServices.filter((item) => item.categoryId === service.categoryId),
    ...allOtherServices.filter((item) => item.categoryId !== service.categoryId),
  ].slice(0, 4);

  return (
    <main className="user-dashboard-theme-scope relative overflow-x-hidden max-h-[calc(100vh)] bg-transparent px-1 pt-6 pb-10">
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute left-[-8%] top-[4%] h-72 w-72 rounded-full blur-[120px]"
          style={{ background: "rgba(35, 70, 18, 0.14)" }}
        />
        <div
          className="absolute right-[-12%] top-[12%] h-[24rem] w-[24rem] rounded-full blur-[140px]"
          style={{ background: "rgba(216, 255, 48, 0.1)" }}
        />
        <div
          className="absolute bottom-[-18%] left-[18%] h-[24rem] w-[24rem] rounded-full blur-[140px]"
          style={{ background: "rgba(68, 99, 27, 0.1)" }}
        />
      </div>

      <div className="relative z-10 w-full max-w-full px-4 sm:px-5 lg:px-6">
        <div className="mt-6 mb-6 flex flex-wrap items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--dashboard-text-faint)] sm:mt-7">
          <Link href="/user-dashboard/services" className="inline-flex items-center gap-1 transition hover:text-[#31420f]">
            <ArrowLeft size={14} />
            Services
          </Link>
          <span>/</span>
          <span className="text-[#31420f]">{service.categoryTitle}</span>
          <span>/</span>
          <span className="text-[#31420f]">{service.name}</span>
        </div>

        <div className="grid gap-6 xl:items-start xl:grid-cols-[minmax(0,1fr)_400px] 2xl:grid-cols-[minmax(0,1fr)_430px]">
          <div className="min-w-0 space-y-6">
            <section
              className="dashboard-subpanel overflow-hidden rounded-[32px] border"
              style={{
                background: "rgba(255,255,255,0.94)",
                borderColor: "rgba(70, 88, 14, 0.14)",
              }}
            >
              <div className="relative aspect-[1.7/1] min-h-[280px] overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.name}
                  fill
                  sizes="(max-width: 1280px) 100vw, 66vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0d1504]/28 via-transparent to-transparent" />

                <div
                  className="absolute left-5 top-5 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]"
                  style={{
                    background: "rgba(13, 21, 4, 0.82)",
                    borderColor: "rgba(255, 255, 255, 0.14)",
                    color: "#f5ffd4",
                  }}
                >
                  {service.badge}
                </div>
              </div>

              <div className="p-6 sm:p-7">
                <div className="flex flex-wrap items-center gap-2">
                  <DetailPill>{service.categoryTitle}</DetailPill>
                  <DetailPill>{service.model}</DetailPill>
                  <DetailPill>{service.timeline}</DetailPill>
                </div>

                <h1 className="mt-4 text-3xl font-black leading-tight text-[var(--dashboard-text-strong)] md:text-[2.45rem]">
                  {service.name}
                </h1>
                <p className="dashboard-text-muted mt-4 max-w-4xl text-sm leading-7 md:text-[15px]">
                  {service.summary}
                </p>
              </div>
            </section>

            <section
              className="dashboard-subpanel rounded-[32px] border p-6 sm:p-7"
              style={{
                background: "rgba(255,255,255,0.92)",
                borderColor: "rgba(70, 88, 14, 0.14)",
              }}
            >
              <SectionTitle icon={LayoutPanelTop} title="Overview" />

              <div className="mt-5 space-y-4">
                {overview.map((paragraph) => (
                  <p key={paragraph} className="dashboard-text-muted text-sm leading-7 md:text-[15px]">
                    {paragraph}
                  </p>
                ))}
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <InfoCard label="Best For" value={service.bestFor} />
                <InfoCard label="Delivery Window" value={service.timeline} />
              </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-2">
              <ChecklistCard
                title="What You Get"
                items={service.whatYouGet}
                note="Everything is arranged to keep the output polished, consistent, and ready to use."
              />
              <ChecklistCard
                title="What We Need From You"
                items={requirements}
                note="These basics help us move faster and keep the delivery aligned with your goal."
              />
            </div>

            <section
              className="dashboard-subpanel rounded-[32px] border p-6 sm:p-7"
              style={{
                background: "rgba(255,255,255,0.92)",
                borderColor: "rgba(70, 88, 14, 0.14)",
              }}
            >
              <SectionTitle icon={CircleHelp} title="Frequently Asked Questions" />

              <div className="mt-4 divide-y divide-[rgba(70,88,14,0.12)]">
                {faqs.map((item) => (
                  <details key={item.question} className="group py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-bold text-[var(--dashboard-text-strong)]">
                      {item.question}
                      <ChevronRight size={18} className="shrink-0 transition-transform group-open:rotate-90" />
                    </summary>
                    <p className="dashboard-text-muted mt-3 pr-6 text-sm leading-7">{item.answer}</p>
                  </details>
                ))}
              </div>
            </section>

          </div>

          <aside className="space-y-5 xl:sticky xl:top-10 xl:h-fit xl:self-start">
            <section
              className="dashboard-subpanel rounded-[32px] border p-5 sm:p-6"
              style={{
                background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(246,251,235,0.96))",
                borderColor: "rgba(70, 88, 14, 0.16)",
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--dashboard-text-faint)]">
                    Starting From
                  </p>
                  <h2 className="mt-2 text-[2rem] font-black leading-none tracking-tight text-[#111704]">
                    {formatPrice(service.startingPrice)}
                  </h2>
                </div>

                <div
                  className="rounded-full border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#111704]"
                  style={{
                    background: "#C1EA2D",
                    borderColor: "#d7f47b",
                  }}
                >
                  {service.timeline}
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-3">
                <SidebarMeta label="Category" value={service.categoryTitle} />
                <SidebarMeta label="Model" value={service.model} />
                <SidebarMeta label="Best Fit" value={service.bestFor} />
              </div>

              <div
                className="mt-5 rounded-[24px] border p-4"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  borderColor: "rgba(70, 88, 14, 0.12)",
                }}
              >
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--dashboard-text-faint)]">
                  Included In This Package
                </p>
                <ul className="mt-4 grid gap-2.5">
                  {service.whatYouGet.map((item) => (
                    <li key={item} className="flex items-start gap-2.5 text-sm text-[var(--dashboard-text-strong)]">
                      <span
                        className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full"
                        style={{ background: "#C1EA2D", color: "#111704" }}
                      >
                        <Check size={13} />
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={() => setPopupOpen(true)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] px-5 py-3 text-sm font-black text-[#0d1504] transition-transform hover:-translate-y-0.5"
                  style={{ background: "#C1EA2D" }}
                >
                  <MessageCircleMore size={17} />
                  Start This Service
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      window.dispatchEvent(new Event("open-live-chat"));
                    }
                  }}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-[18px] border px-5 py-3 text-sm font-bold text-[var(--dashboard-text-strong)] transition-colors hover:bg-[rgba(193,234,45,0.14)]"
                  style={{
                    background: "rgba(255,255,255,0.82)",
                    borderColor: "rgba(70, 88, 14, 0.14)",
                  }}
                >
                  Open Live Chat
                </button>
              </div>

              <p className="dashboard-text-muted mt-4 text-center text-xs leading-6">
                Structured revisions, guided handoff, and clear delivery checkpoints are included.
              </p>
            </section>

            <section
              className="dashboard-subpanel rounded-[28px] border p-5"
              style={{
                background: "rgba(255,255,255,0.9)",
                borderColor: "rgba(70, 88, 14, 0.14)",
              }}
            >
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5f7418]">Why Teams Pick This</p>
              <div className="mt-4 grid gap-3">
                <TrustRow
                  icon={ShieldCheck}
                  title="Clear workflow"
                  value="Structured stages from discovery to final handoff."
                />
                <TrustRow icon={Clock3} title="Delivery pace" value={`Typical turnaround: ${service.timeline}.`} />
                <TrustRow
                  icon={CreditCard}
                  title="Commercial fit"
                  value={`Offered as ${service.model.toLowerCase()} for flexible execution.`}
                />
              </div>
            </section>
          </aside>
        </div>

        {relatedServices.length ? (
          <section
            className="dashboard-subpanel mt-6 rounded-[32px] border p-5 sm:p-6"
            style={{
              background: "rgba(255,255,255,0.92)",
              borderColor: "rgba(70, 88, 14, 0.14)",
            }}
          >
            <SectionTitle icon={Sparkles} title="Related Services" />

            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {relatedServices.map((item) => (
                <Link
                  key={item.id}
                  href={`/user-dashboard/services/${item.id}`}
                  className="group dashboard-subpanel flex h-full min-w-0 flex-col overflow-hidden rounded-[24px] border transition-transform duration-200 hover:-translate-y-1"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(246,251,235,0.9))",
                    borderColor: "rgba(70, 88, 14, 0.12)",
                  }}
                >
                  <div className="relative aspect-[1.55/1] overflow-hidden">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0d1504]/28 via-transparent to-transparent" />
                    <div
                      className="absolute left-3 top-3 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                      style={{
                        background: "rgba(13, 21, 4, 0.82)",
                        borderColor: "rgba(255, 255, 255, 0.12)",
                        color: "#f5ffd4",
                      }}
                    >
                      {item.badge}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#5f7418]">
                      {item.categoryTitle}
                    </p>
                    <h3 className="mt-2 text-[1.05rem] font-black leading-snug text-[var(--dashboard-text-strong)]">
                      {item.name}
                    </h3>
                    <p
                      className="dashboard-text-muted mt-2 text-sm leading-6"
                      style={RELATED_SUMMARY_CLAMP_STYLE}
                    >
                      {item.summary}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                      <span className="text-[1.15rem] font-black tracking-tight text-[#101703]">
                        {formatPrice(item.startingPrice)}
                      </span>
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#101703]"
                        style={{ background: "#C1EA2D" }}
                      >
                        View
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>

      {popupOpen ? (
        <LeadProjectPopup
          open={popupOpen}
          onClose={() => setPopupOpen(false)}
          defaultProjectName={`${service.name} Project`}
          defaultServiceType={service.name}
          key={`${service.id}-service-detail`}
        />
      ) : null}
    </main>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex h-11 w-11 items-center justify-center rounded-[16px]"
        style={{ background: "rgba(193,234,45,0.22)", color: "#2f410c" }}
      >
        <Icon size={18} />
      </span>
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5f7418]">Service Section</p>
        <h2 className="text-xl font-black text-[var(--dashboard-text-strong)]">{title}</h2>
      </div>
    </div>
  );
}

function DetailPill({ children }) {
  return (
    <span
      className="inline-flex rounded-full border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] text-[#213009]"
      style={{
        background: "rgba(193,234,45,0.18)",
        borderColor: "rgba(70, 88, 14, 0.14)",
      }}
    >
      {children}
    </span>
  );
}

function InfoCard({ label, value }) {
  return (
    <div
      className="rounded-[22px] border px-4 py-4"
      style={{
        background: "rgba(255,255,255,0.72)",
        borderColor: "rgba(70, 88, 14, 0.12)",
      }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">{label}</p>
      <p className="mt-2 text-sm font-semibold text-[var(--dashboard-text-strong)]">{value}</p>
    </div>
  );
}

function ChecklistCard({ title, items, note }) {
  return (
    <section
      className="dashboard-subpanel rounded-[32px] border p-6"
      style={{
        background: "rgba(255,255,255,0.92)",
        borderColor: "rgba(70, 88, 14, 0.14)",
      }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#5f7418]">{title}</p>

      <ul className="mt-5 grid gap-3">
        {items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-3 rounded-[20px] border border-[rgba(70,88,14,0.1)] px-4 py-3 text-sm text-[var(--dashboard-text-strong)]"
            style={{ background: "rgba(255,255,255,0.75)" }}
          >
            <span
              className="mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full"
              style={{ background: "#C1EA2D", color: "#111704" }}
            >
              <Check size={13} />
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <p className="dashboard-text-muted mt-4 text-sm leading-7">{note}</p>
    </section>
  );
}

function SidebarMeta({ label, value }) {
  return (
    <div
      className="rounded-[18px] border px-3 py-3"
      style={{
        background: "rgba(255,255,255,0.72)",
        borderColor: "rgba(70, 88, 14, 0.12)",
      }}
    >
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-[var(--dashboard-text-faint)]">{label}</p>
      <p className="mt-1.5 text-xs font-bold leading-5 text-[var(--dashboard-text-strong)]">{value}</p>
    </div>
  );
}

function TrustRow({ icon: Icon, title, value }) {
  return (
    <div
      className="flex items-start gap-3 rounded-[22px] border px-4 py-4"
      style={{
        background: "rgba(255,255,255,0.78)",
        borderColor: "rgba(70, 88, 14, 0.12)",
      }}
    >
      <span
        className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-[14px]"
        style={{ background: "rgba(193,234,45,0.22)", color: "#2f410c" }}
      >
        <Icon size={18} />
      </span>
      <div>
        <p className="text-sm font-black text-[var(--dashboard-text-strong)]">{title}</p>
        <p className="dashboard-text-muted mt-1 text-sm leading-6">{value}</p>
      </div>
    </div>
  );
}
