"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { servicesById } from "../servicesData";

export default function ServiceDetail() {
  const params = useParams();
  const slug = Array.isArray(params?.slug) ? params.slug[0] : params?.slug;
  const service = slug ? servicesById[slug] : null;

  if (!service) {
    return (
      <main className="min-h-screen bg-[#000f08] px-6 pt-32 pb-20 text-white">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center">
          <p className="text-xs uppercase tracking-[0.2em] text-[#d8ff30]">Service Not Found</p>
          <h1 className="mt-4 text-3xl font-black">This service is not available.</h1>
          <p className="mt-3 text-sm text-white/65">
            The link may be outdated, or the service entry has been removed from the dashboard.
          </p>
          <Link
            href="/user-dashboard/services"
            className="btn-primary mt-6 inline-flex rounded-xl px-5 py-2 text-sm font-bold"
          >
            Back to services
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen overflow-hidden bg-[#000f08] pt-24 pb-20 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[8%] h-80 w-80 rounded-full bg-[#214211]/22 blur-[120px]" />
        <div className="absolute right-[-10%] top-[20%] h-[28rem] w-[28rem] rounded-full bg-[#d8ff30]/8 blur-[140px]" />
      </div>

      <div className="container relative z-10 mx-auto px-5 md:px-8">
        <Link
          href="/user-dashboard/services"
          className="mb-8 inline-flex text-sm text-[#d8ff30] transition hover:text-[#f3ffc2]"
        >
          {"<- Back to services"}
        </Link>

        <section className="overflow-hidden rounded-3xl border border-white/15 bg-[linear-gradient(180deg,rgba(12,24,18,0.98),rgba(33,66,17,0.24))]">
          <div className="relative h-72 w-full md:h-96">
            <Image
              src={service.image}
              alt={service.name}
              fill
              sizes="100vw"
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#000f08] via-black/40 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
              <p className="text-xs uppercase tracking-[0.2em] text-[#d8ff30]">{service.categoryTitle}</p>
              <h1 className="mt-3 max-w-4xl text-3xl font-black leading-tight md:text-5xl">{service.name}</h1>
              <p className="mt-4 max-w-3xl text-sm leading-relaxed text-white/75 md:text-base">{service.summary}</p>
            </div>
          </div>

          <div className="grid gap-6 p-6 md:grid-cols-[1.3fr_0.7fr] md:p-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Included deliverables</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {service.whatYouGet.map((item) => (
                  <div key={item} className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-sm text-white/90">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <aside className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5">
              <DetailRow label="Best for" value={service.bestFor} />
              <DetailRow label="Timeline" value={service.timeline} />
              <DetailRow label="Pricing model" value={service.model} />

              <div className="pt-3">
                <Link
                  href="/user-dashboard/services"
                  className="btn-primary inline-flex w-full items-center justify-center rounded-xl px-5 py-2 text-sm font-bold"
                >
                  Start from dashboard
                </Link>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="rounded-xl border border-white/10 bg-[#000f08]/45 p-4">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/45">{label}</p>
      <p className="mt-2 text-sm font-medium text-white">{value}</p>
    </div>
  );
}
