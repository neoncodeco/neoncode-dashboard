"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

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
            className="fixed inset-0 z-[80] flex items-center justify-center  px-4 backdrop-blur-[10px]"
            onClick={onClose}
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.22 }}
              className="w-full max-w-2xl rounded border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-panel-bg)] p-6 shadow-[0_28px_70px_rgba(15,23,42,0.28)] md:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mb-5 flex items-start justify-between gap-3">
                <div>
                  <p className="dashboard-text-muted text-xs uppercase tracking-[0.2em]">Project Intake</p>
                  <h3 className="dashboard-text-strong mt-2 text-2xl font-black tracking-tight">{title}</h3>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="dashboard-muted-button rounded-xl border px-3 py-1 text-sm font-semibold"
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
                      className="btn-primary rounded-xl border px-5 py-2 text-sm font-bold transition hover:scale-[1.02]"
                    >
                      Submit Request
                    </button>
                    <button
                      type="button"
                      onClick={() => setMeetingOpen(true)}
                      className="btn-secondary rounded-xl border px-5 py-2 text-sm font-semibold"
                    >
                      Book Meeting (Optional)
                    </button>
                  </div>
                </form>
              ) : (
                <div className="rounded-2xl border border-[var(--dashboard-frame-border)] bg-[var(--dashboard-success-soft)] p-5">
                  <p className="dashboard-text-strong text-sm font-semibold">Request received successfully.</p>
                  <p className="dashboard-text-muted mt-1 text-sm">Our team will contact you shortly using your provided details.</p>
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
            className="fixed inset-0 z-[90] flex items-center justify-center  px-4 backdrop-blur-[10px]"
            onClick={() => (meetingOnly ? onClose() : setMeetingOpen(false))}
          >
            <motion.div
              initial={{ y: 30, opacity: 0, scale: 0.96 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 20, opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.2 }}
              onClick={(event) => event.stopPropagation()}
              className="relative h-[min(88vh,505px)] w-[min(96vw,700px)] overflow-hidden rounded-[30px] border border-slate-200/90 bg-white shadow-[0_30px_90px_rgba(15,23,42,0.22)]"
            >
              <button
                type="button"
                onClick={() => (meetingOnly ? onClose() : setMeetingOpen(false))}
                className="absolute right-4 top-4 z-10 inline-flex h-9 items-center justify-center transition hover:-translate-y-0.5 hover:text-slate-900"
              >
                 <X className="h-8 w-8 bg-[#C2EB2D] p-1 rounded-full" />
              </button>

              <iframe
                title="Cal booking"
                src="https://cal.com/neoncode?embed=true&theme=light"
                className="h-full w-full"
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
    <label className="grid gap-2 text-sm dashboard-text-strong">
      <span className="dashboard-text-muted text-xs uppercase tracking-[0.14em]">{label}</span>
      <input
        {...props}
        className="w-full rounded-xl border border-[var(--dashboard-input-border)] bg-[var(--dashboard-input-bg)] px-4 py-3 text-sm text-[var(--dashboard-text-strong)] outline-none transition placeholder:text-[var(--dashboard-placeholder)] focus:border-[var(--dashboard-accent)]"
      />
    </label>
  );
}
