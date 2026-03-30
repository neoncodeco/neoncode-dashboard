"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import LeadProjectPopup from "@/components/LeadProjectPopup";
import { serviceCategories } from "./servicesData";

export default function ServicesPage() {

  const [activeCategory, setActiveCategory] = useState(serviceCategories[0].id);
  const [expandedService, setExpandedService] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [popupPrefill, setPopupPrefill] = useState({ projectName: "", serviceType: "" });
  const [discoveryOpen, setDiscoveryOpen] = useState(false);

  const currentCategory = useMemo(
    () => serviceCategories.find((category) => category.id === activeCategory) ?? serviceCategories[0],
    [activeCategory]
  );



  return (
    <main className="user-dashboard-theme-scope services-page relative min-h-screen overflow-hidden bg-transparent px-1 pt-6 pb-20">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-8%] top-[5%] h-80 w-80 rounded-full bg-[#214211]/22 blur-[120px]" />
        <div className="absolute right-[-10%] top-[25%] h-[28rem] w-[28rem] rounded-full bg-[#d8ff30]/8 blur-[140px]" />
        <div className="absolute bottom-[-15%] left-[30%] h-96 w-96 rounded-full bg-[#214211]/16 blur-[140px]" />
      </div>

      <div className="container relative z-10 mx-auto px-5 md:px-8">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mb-12"
        >
          <p className="mb-4 inline-flex rounded-full border border-lime-200 bg-lime-50 px-4 py-1 text-xs font-bold uppercase tracking-[0.25em] text-lime-700">
            Service Architecture
          </p>
          
        </motion.section>

        <section className="mb-10 flex flex-wrap gap-3">
          {serviceCategories.map((category) => {
            const isActive = category.id === activeCategory;
            return (
              <button
                key={category.id}
                type="button"
                onClick={() => {
                  setActiveCategory(category.id);
                  setExpandedService(null);
                }}
                className={`rounded-2xl border px-5 py-3 text-left transition-all duration-300 ${
                  isActive
                    ? "border-lime-200 bg-lime-50 text-slate-900 shadow-[0_10px_30px_rgba(163,230,53,0.12)]"
                    : "border-slate-200 bg-white/80 text-slate-700 hover:border-lime-200 hover:bg-lime-50/70"
                }`}
              >
                <p className="text-sm font-semibold">{category.title}</p>
                <p className="dashboard-text-muted text-xs">{category.services.length} active services</p>
              </button>
            );
          })}
        </section>

        <motion.section
          key={currentCategory.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="dashboard-subpanel relative overflow-hidden rounded-3xl p-6 md:p-8"
        >
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold md:text-3xl">{currentCategory.title}</h2>
              <p className="dashboard-text-muted mt-2 text-sm md:text-base">{currentCategory.tagline}</p>
            </div>
            <button
              type="button"
              onClick={() => setDiscoveryOpen(true)}
              className="btn-primary rounded-xl px-5 py-2 text-sm font-bold transition hover:scale-[1.03]"
            >
              Book discovery call
            </button>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {currentCategory.services.map((service, index) => {
              const isExpanded = expandedService === service.id;
              return (
                <motion.article
                  key={service.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.06, duration: 0.35 }}
                  className="dashboard-subpanel overflow-hidden rounded-2xl"
                >
                  <div className="relative h-44 w-full">
                    <Image src={service.image} alt={service.name} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                    <span className="dashboard-chip absolute right-4 top-4 px-3 py-1 text-[11px] uppercase tracking-widest">
                      {service.timeline}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="dashboard-text-strong text-xl font-bold leading-tight">{service.name}</h3>
                    <p className="dashboard-text-muted mt-3 mb-4 text-sm leading-relaxed">{service.summary}</p>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="dashboard-subpanel rounded-xl p-3">
                        <p className="dashboard-text-faint mb-1 text-[10px] uppercase tracking-[0.15em]">Best for</p>
                        <p className="dashboard-text-strong font-medium">{service.bestFor}</p>
                      </div>
                      <div className="dashboard-subpanel rounded-xl p-3">
                        <p className="dashboard-text-faint mb-1 text-[10px] uppercase tracking-[0.15em]">Pricing model</p>
                        <p className="dashboard-text-strong font-medium">{service.model}</p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedService(service)}
                        className="rounded-lg border border-lime-200 bg-lime-50 px-4 py-2 text-xs font-semibold text-lime-700 transition hover:bg-lime-100"
                      >
                        View details
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpandedService((prev) => (prev === service.id ? null : service.id))}
                        className="rounded-lg border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        {isExpanded ? "Hide preview" : "See sample workflow"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPopupPrefill({
                            projectName: `${service.name} Project`,
                            serviceType: service.name,
                          });
                          setPopupOpen(true);
                        }}
                        className="rounded-lg border border-slate-200 bg-white/90 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-lime-200 hover:bg-lime-50/60"
                      >
                        Start this service
                      </button>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="dashboard-subpanel mt-4 overflow-hidden rounded-xl"
                        >
                          <div className="p-4">
                            <p className="dashboard-text-faint mb-3 text-xs font-semibold uppercase tracking-[0.2em]">Included deliverables</p>
                            <ul className="grid gap-2 text-sm">
                              {service.whatYouGet.map((item) => (
                                <li key={item} className="dashboard-subpanel dashboard-text-strong rounded-lg px-3 py-2">
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.article>
              );
            })}
          </div>
        </motion.section>
      </div>

      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4"
            onClick={() => setSelectedService(null)}
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.25 }}
              onClick={(event) => event.stopPropagation()}
              className="dashboard-subpanel w-full max-w-3xl overflow-hidden rounded-3xl"
            >
              <div className="relative h-56 w-full">
                <Image src={selectedService.image} alt={selectedService.name} fill sizes="(max-width: 1024px) 100vw, 60vw" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
              </div>

              <div className="p-6 md:p-8">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <p className="dashboard-text-faint text-xs uppercase tracking-[0.2em]">Service Detail</p>
                    <h3 className="dashboard-text-strong mt-2 text-2xl font-black leading-tight">{selectedService.name}</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedService(null)}
                    className="dashboard-muted-button rounded-lg border px-3 py-1 text-sm"
                  >
                    Close
                  </button>
                </div>

                <p className="dashboard-text-muted mb-5 text-sm leading-relaxed">{selectedService.summary}</p>

                <div className="grid gap-3 md:grid-cols-2">
                  {selectedService.whatYouGet.map((item) => (
                    <div key={item} className="dashboard-subpanel dashboard-text-strong rounded-xl px-4 py-3 text-sm">
                      {item}
                    </div>
                  ))}
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setPopupPrefill({
                        projectName: `${selectedService.name} Project`,
                        serviceType: selectedService.name,
                      });
                      setPopupOpen(true);
                      setSelectedService(null);
                    }}
                    className="btn-primary rounded-xl px-5 py-2 text-sm font-bold transition hover:scale-[1.02]"
                  >
                    Request proposal
                  </button>
                  <Link
                    href="/portfolio"
                    className="btn-secondary rounded-xl px-5 py-2 text-sm font-semibold"
                  >
                    View work samples
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {popupOpen && (
        <LeadProjectPopup
          open={popupOpen}
          onClose={() => setPopupOpen(false)}
          defaultProjectName={popupPrefill.projectName}
          defaultServiceType={popupPrefill.serviceType}
          key={`${popupPrefill.projectName}-${popupPrefill.serviceType}`}
        />
      )}

      {discoveryOpen && (
        <LeadProjectPopup
          open={discoveryOpen}
          onClose={() => setDiscoveryOpen(false)}
          meetingOnly
          title="Book Discovery Call"
          key="discovery-meeting"
        />
      )}
    </main>
  );
}
