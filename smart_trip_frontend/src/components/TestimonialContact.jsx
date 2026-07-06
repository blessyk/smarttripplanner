import Testimonial from "./Testimonial";
import Contact from "./Contact";

export default function TestimonialContact() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
        <div className="space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-2">
            Real Stories from Real Explorers
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed mb-6">
            See how our users turned planning headaches into smooth, unforgettable vacations.
          </p>
          <div className="pt-4">
            <Testimonial />
          </div>
        </div>
        
        <div className="space-y-4 bg-slate-50/50 p-6 md:p-8 rounded-3xl border border-slate-200/50 shadow-2xs">
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
            Have Questions? We're Here to Help!
          </h2>
          <p className="text-slate-500 text-xs leading-relaxed">
            Need help generating your first itinerary or customizing your travel profile? Drop us a message and our support team will get right back to you.
          </p>
          <Contact />
        </div>
      </div>
    </div>
  );
}