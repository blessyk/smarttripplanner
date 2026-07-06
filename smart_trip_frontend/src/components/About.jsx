export default function About() {
  return (
    <div className="w-full">
      <div className="flex flex-col md:flex-row items-center gap-10">

        {/* Left Content */}
        <div className="flex-1">
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 tracking-tight mb-4">
            Plan Less. Travel More.
          </h2>

          <p className="text-slate-500 text-sm md:text-base leading-relaxed mb-4">
            Planning a trip shouldn't feel like a second job. Smart Trip Planner takes the hassle out of travel by building personalized day-by-day itineraries tailored to your unique style.
          </p>

          <p className="text-slate-500 text-sm md:text-base leading-relaxed">
            Whether you're craving a relaxing beach escape, a historic city trek, or a local food tour, we map out your days, suggest verified hotels and dining spots, and calculate realistic budgets. You dream it, we plan it!
          </p>
        </div>

        {/* Right Image */}
        <div className="flex-1 flex justify-center">
          <img
            src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?fm=jpg&q=90&w=800"
            alt="travel planning"
            className="w-full max-w-md rounded-2xl shadow-xl hover:scale-102 transition-all duration-300 border border-slate-100/50"
            style={{ animation: "float 6s ease-in-out infinite" }}
          />
          <style>{`
            @keyframes float {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-10px); }
            }
          `}</style>
        </div>

      </div>
    </div>
  );
}