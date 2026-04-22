"use client";

import { useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "./ui/accordion";
import { useRouter } from "next/navigation";
import { HelpCircle } from "lucide-react";

const FAQ_DATA = [
  {
    category: "Driver",
    items: [
      {
        q: "How do I make a parking reservation?",
        a: "Log in to your PakiPark account, navigate to 'Find Parking', choose your preferred location and time slot, select your vehicle, then confirm the reservation.",
      },
      {
        q: "How much does parking cost?",
        a: "The first 2 hours of every session are FREE. Overtime is billed at ₱15 per hour, rounded up to the next full hour (ceiling billing).",
      },
      {
        q: "Can I cancel or modify my reservation?",
        a: "You can cancel an upcoming reservation from the My Bookings section before the reservation start time. Once the grace period begins, cancellation is no longer available.",
      },
      {
        q: "What payment methods are accepted?",
        a: "Payment is processed at check-out via the teller terminal. Cash payments are currently the standard method.",
      },
      {
        q: "What is the 15-minute grace period?",
        a: "You have a 15-minute window before your reserved time slot to check in. If you do not check in, your reservation will be automatically forfeited.",
      },
    ],
  },
  {
    category: "Operator",
    items: [
      {
        q: "How do I manage incoming reservations?",
        a: "As an admin, you can view real-time reservation statuses, check-in customers, and process check-outs through the Smart Parking Dashboard.",
      },
      {
        q: "How do I update facility hours?",
        a: "Administrators can configure the operating hours for each specific location in the 'Advanced Parking Layout Config', setting separate schedules for each day of the week.",
      },
      {
        q: "How do I handle a no-show customer?",
        a: "If a customer doesn't arrive within the 15-minute grace period after their reservation starts, the system will automatically mark them as 'no-show' and free up the slot.",
      },
      {
        q: "Is there an audit log of transactions?",
        a: "Yes, all successful payments, check-ins, and check-outs are recorded permanently in the Transaction and Activity Logs for security and dispute resolution.",
      },
      {
        q: "Can I add custom parking slots?",
        a: "Yes, you can add VIP, PWD, or Standard slots, assign them to specific floors and rows, and toggle their active status via the configuration dashboard.",
      },
    ],
  },
];

export function LandingFAQ() {
  const [activeTab, setActiveTab] = useState<"Driver" | "Operator">("Driver");
  const router = useRouter();

  const activeQuestions = FAQ_DATA.find((d) => d.category === activeTab)?.items || [];

  return (
    <section id="faq" className="py-24 bg-[#1e3d5a] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">Frequently asked questions</h2>
            <p className="text-[#ee6b20] font-medium text-sm flex items-center gap-1.5 cursor-pointer hover:underline" onClick={() => router.push('/help')}>
              <HelpCircle className="size-4" /> Go to full Help Center
            </p>
          </div>

          {/* Toggle Pills */}
          <div className="flex bg-[#2a5373] p-1.5 rounded-full self-start md:self-auto">
            <button
              onClick={() => setActiveTab("Driver")}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                activeTab === "Driver"
                  ? "bg-white text-[#1e3d5a] shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Driver
            </button>
            <button
              onClick={() => setActiveTab("Operator")}
              className={`px-5 py-2 rounded-full text-sm font-bold transition-all duration-300 ${
                activeTab === "Operator"
                  ? "bg-white text-[#1e3d5a] shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Operator
            </button>
          </div>
        </div>

        {/* Accordion Questions */}
        <Accordion type="single" collapsible className="w-full space-y-2">
          {activeQuestions.map((faq, index) => (
            <AccordionItem
              key={index}
              value={`item-${index}`}
              className="border-b border-white/10"
            >
              <AccordionTrigger className="text-left font-semibold text-white/90 hover:text-[#ee6b20] hover:no-underline py-5 group transition-colors">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-white/60 leading-relaxed pb-6 text-sm">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

      </div>
    </section>
  );
}
