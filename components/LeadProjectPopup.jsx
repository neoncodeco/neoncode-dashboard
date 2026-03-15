"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  projectName: "",
  serviceType: "",
};

export default function LeadProjectPopup({
  open,
  onClose,
  defaultProjectName = "",
  defaultServiceType = "",
  title = "Start Your Project",
  meetingOnly = false,
}) {
  const [form, setForm] = useState(() => ({
    ...initialForm,
    projectName: defaultProjectName,
    serviceType: defaultServiceType,
  }));
  const [submitted, setSubmitted] = useState(false);
  const [meetingOpen, setMeetingOpen] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <>
      <AnimatePresence>
        {open && !meetingOnly && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 px-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-2xl rounded-3xl border border-white/15 bg-[#08150e] p-6 md:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#d8ff30]">Project Intake</p>
                  <h3 className="mt-2 text-2xl font-black text-white">{title}</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-lg border border-white/20 bg-white/[0.04] px-3 py-1 text-sm text-gray-100"
                >
                  Close
                </button>
              </div>

              {!submitted ? (
                <form onSubmit={handleSubmit} className="grid gap-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="Name" name="name" value={form.name} onChange={updateField} required />
                    <InputField label="Email" name="email" type="email" value={form.email} onChange={updateField} required />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <InputField label="Number" name="phone" value={form.phone} onChange={updateField} required />
                    <InputField label="Project Name" name="projectName" value={form.projectName} onChange={updateField} required />
                  </div>

                  <InputField label="Service Type" name="serviceType" value={form.serviceType} onChange={updateField} required />

                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      type="submit"
                      className="btn-primary rounded-xl px-5 py-2 text-sm font-bold transition hover:scale-[1.02]"
                    >
                      Submit Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeetingOpen(true)}
                      className="btn-secondary rounded-xl px-5 py-2 text-sm font-semibold"
                    >
                      Book Meeting (Optional)
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-2xl border border-[#d8ff30]/25 bg-[#d8ff30]/10 p-5 text-sm text-[#f6ffd0]">
                  Request received. Our team will contact you shortly using your provided details.
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {(meetingOnly ? open : meetingOpen) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 px-4"
            onClick={() => (meetingOnly ? onClose() : setMeetingOpen(false))}
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="h-[85vh] w-full max-w-5xl overflow-hidden rounded-3xl border border-white/15 bg-[#08150e]"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <p className="text-sm font-semibold text-white">Book a Meeting</p>
                <button
                  type="button"
                  onClick={() => (meetingOnly ? onClose() : setMeetingOpen(false))}
                  className="rounded-lg border border-white/20 px-3 py-1 text-xs text-gray-100"
                >
                  Close
                </button>
              </div>

              <iframe
                title="Cal booking"
                src="https://cal.com/neoncode"
                className="h-[calc(85vh-54px)] w-full border-0"
                loading="lazy"
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function InputField({ label, ...props }) {
  return (
    <label className="grid gap-2 text-sm text-gray-200">
      <span className="text-xs uppercase tracking-[0.14em] text-gray-400">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-white/15 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-[#d8ff30]/60"
      />
    </label>
  );
}
