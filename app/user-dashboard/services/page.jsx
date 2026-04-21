"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MessageCircleMore, Search } from "lucide-react";
import LeadProjectPopup from "@/components/LeadProjectPopup";
import { serviceCategories } from "./servicesData";

const ALL_CATEGORY_ID = "all";
const SUMMARY_CLAMP_STYLE = {
  display: "-webkit-box",
  WebkitBoxOrient: "vertical",
  WebkitLineClamp: 3,
  overflow: "hidden",
};

const numberFormatter = new Intl.NumberFormat("en-US");

function formatPrice(price) {
  return `৳${numberFormatter.format(price)}`;
}

function formatCount(count) {
  return numberFormatter.format(count);
}

export default function ServicesPage() {
  const [activeCategory, setActiveCategory] = useState(ALL_CATEGORY_ID);
  const [searchTerm, setSearchTerm] = useState("");
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPrefill, setPopupPrefill] = useState({ projectName: "", serviceType: "" });

  const allServices = useMemo(
    () =>
      serviceCategories.flatMap((category) =>
        category.services.map((service) => ({
          ...service,
          categoryId: category.id,
          categoryTitle: category.title,
          categoryTitleBn: category.titleBn ?? category.title,
          categoryTagline: category.taglineBn ?? category.tagline,
        }))
      ),
    []
  );

  const categoryTabs = useMemo(
    () => [
      {
        id: ALL_CATEGORY_ID,
        label: "All",
        count: allServices.length,
      },
      ...serviceCategories.map((category) => ({
        id: category.id,
        label: category.title,
        count: category.services.length,
      })),
    ],
    [allServices.length]
  );

  const filteredServices = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();

    return allServices.filter((service) => {
      const matchesCategory = activeCategory === ALL_CATEGORY_ID || service.categoryId === activeCategory;

      if (!normalizedQuery) {
        return matchesCategory;
      }

      const haystack = [
        service.name,
        service.summary,
        service.bestFor,
        service.model,
        service.badge,
        service.categoryTitle,
        service.categoryTitleBn,
      ]
        .join(" ")
        .toLowerCase();

      return matchesCategory && haystack.includes(normalizedQuery);
    });
  }, [activeCategory, allServices, searchTerm]);

  return (
    <main className="user-dashboard-theme-scope services-page relative min-h-screen overflow-hidden bg-transparent px-1 pt-6 pb-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[4%] h-72 w-72 rounded-full bg-[#234612]/14 blur-[120px]" />
        <div className="absolute right-[-12%] top-[18%] h-[24rem] w-[24rem] rounded-full bg-[#d8ff30]/10 blur-[140px]" />
        <div className="absolute bottom-[-16%] left-[22%] h-[22rem] w-[22rem] rounded-full bg-[#44631b]/12 blur-[130px]" />
      </div>

      <div className="relative z-10 mx-auto w-full px-4 sm:px-5 lg:px-6">
        <motion.section
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mx-auto w-full text-center"
        >
          <h1 className="mt-5 text-3xl font-black tracking-tight text-[var(--dashboard-text-strong)] md:text-5xl">
            Our Services
          </h1>
          <p className="dashboard-text-muted mx-auto mt-3 max-w-2xl text-sm leading-7 md:text-base">
            আমাদের ডিজিটাল সার্ভিস দেখুন এবং WhatsApp-এ যোগাযোগ করুন 
          </p>
          <div className="mt-5 -mx-1 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex w-max min-w-full items-center gap-2.5 md:w-full md:min-w-0 md:flex-wrap md:justify-center">
              {categoryTabs.map((category) => {
                const isActive = category.id === activeCategory;

                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setActiveCategory(category.id)}
                    className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-4 py-2 text-sm font-bold transition-all ${
                      isActive
                        ? "border-[#C1EA2D] bg-[#C1EA2D] text-[#0d1504] shadow-[0_12px_28px_rgba(193,234,45,0.28)]"
                        : "border-[color:rgba(70,88,14,0.14)] bg-white/88 text-[#30420d] hover:border-[color:rgba(70,88,14,0.24)] hover:bg-[#f7fbeb]"
                    }`}
                  >
                    {category.label}
                    <span className={`ml-2 text-[11px] ${isActive ? "text-[#223107]" : "text-[#61782b]"}`}>
                      {formatCount(category.count)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <p className="dashboard-text-faint mt-4 text-xs font-semibold uppercase tracking-[0.2em]">
            {filteredServices.length ? `${formatCount(filteredServices.length)} services found` : "No services found"}
          </p>
        </motion.section>

        <section className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filteredServices.map((service, index) => (
            <motion.article
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.04, duration: 0.28 }}
              className="group dashboard-subpanel overflow-hidden rounded-[26px] border border-[color:rgba(70,88,14,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(246,251,235,0.96))] shadow-[0_18px_42px_rgba(15,23,42,0.08)]"
            >
              <Link href={`/user-dashboard/services/${service.id}`} className="block">
                <div className="relative aspect-[1.58/1] overflow-hidden border-b border-[color:rgba(70,88,14,0.12)]">
                  <Image
                    src={service.image}
                    alt={service.name}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1004]/32 via-[#0a1004]/10 to-transparent" />
                  <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#0a1004]/72 via-[#0a1004]/34 to-transparent" />

                  <div
                    className="absolute left-3 top-3 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.16em] backdrop-blur-md"
                    style={{
                      background: "rgba(13, 21, 4, 0.84)",
                      borderColor: "rgba(255, 255, 255, 0.14)",
                      color: "#f5ffd4",
                      boxShadow: "0 10px 24px rgba(10, 16, 4, 0.24)",
                    }}
                  >
                    {service.badge || service.categoryTitleBn}
                  </div>

                  <div
                    className="absolute right-3 top-3 rounded-full border px-3.5 py-1.5 text-[11px] font-black uppercase tracking-[0.16em]"
                    style={{
                      background: "#C1EA2D",
                      borderColor: "#d7f47b",
                      color: "#111704",
                      boxShadow: "0 10px 24px rgba(193, 234, 45, 0.26)",
                    }}
                  >
                    {service.timeline}
                  </div>
                </div>
              </Link>

              <div className="p-5">
                <Link href={`/user-dashboard/services/${service.id}`} className="block">
                  <h2 className="text-[1.12rem] font-black leading-snug text-[var(--dashboard-text-strong)] transition-colors group-hover:text-[#182406]">
                    {service.name}
                  </h2>
                </Link>

                <p
                  className="dashboard-text-muted mt-3 min-h-[4.75rem] text-sm leading-6"
                  style={SUMMARY_CLAMP_STYLE}
                >
                  {service.summary}
                </p>

                <div className="mt-4 rounded-[18px] border border-[color:rgba(70,88,14,0.12)] bg-white/76 px-4 py-3">
                  <p className="dashboard-text-faint text-[10px] font-black uppercase tracking-[0.15em]">Best For</p>
                  <p className="mt-1 text-sm font-semibold text-[var(--dashboard-text-strong)]">{service.bestFor}</p>
                </div>

                <div className="mt-5 flex items-end justify-between gap-3">
                  <div>
                    <p className="dashboard-text-faint text-[10px] font-black uppercase tracking-[0.16em]">Starts At</p>
                    <p className="mt-1 text-2xl font-black tracking-tight text-[#0d1504]">
                      {formatPrice(service.startingPrice)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPopupPrefill({
                          projectName: `${service.name} Project`,
                          serviceType: service.name,
                        });
                        setPopupOpen(true);
                      }}
                      className="inline-flex h-10 w-10 items-center justify-center rounded-[14px] border border-[#C1EA2D] bg-[#C1EA2D] text-[#0d1504] transition-transform hover:-translate-y-0.5 hover:bg-[#b6df28]"
                      aria-label={`${service.name} quick brief`}
                      title="Quick brief"
                    >
                      <MessageCircleMore size={18} />
                    </button>

                    <Link
                      href={`/user-dashboard/services/${service.id}`}
                      className="inline-flex h-10 items-center gap-2 rounded-[14px] bg-[#C1EA2D] px-4 text-sm font-bold text-[#0d1504] transition-transform hover:-translate-y-0.5 hover:bg-[#b6df28]"
                    >
                      Details
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </section>

      </div>

      {popupOpen ? (
        <LeadProjectPopup
          open={popupOpen}
          onClose={() => setPopupOpen(false)}
          defaultProjectName={popupPrefill.projectName}
          defaultServiceType={popupPrefill.serviceType}
          key={`${popupPrefill.projectName}-${popupPrefill.serviceType}`}
        />
      ) : null}
    </main>
  );
}
