import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import slide1 from "../assets/images/slide1.jpeg"
import slide2 from "../assets/images/slide2.jpg"
import slide3 from "../assets/images/slide3.jpg"
import slide4 from "../assets/images/slide4.png"
import slide5 from "../assets/images/slide5.jpg"

const slides = [
  {
    id: 1,
    image: slide1,
    title: "Explore Beautiful Beaches",
    text: "Relax and unwind at the world's most stunning beaches."
  },
  {
    id: 2,
    image: slide2,
    title: "Adventure in the Mountains",
    text: "Experience thrilling hikes and breathtaking views."
  },
  {
    id: 3,
    image: slide3,
    title: "Discover Urban Wonders",
    text: "Explore vibrant cities and cultural landmarks."
  },
  {
    id: 4,
    image: slide4,
    title: "Reconnect with Nature",
    text: "Find peace in lush green forests and wildlife."
  },
  {
    id: 5,
    image: slide5,
    title: "Escape to Tropical Islands",
    text: "Enjoy crystal clear waters and sunny skies."
  }
];

// Animation variants
const variants = {
  enter: (direction) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0
  }),
  center: {
    x: 0,
    opacity: 1
  },
  exit: (direction) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0
  })
};

export default function Header() {
  const [[current, direction], setCurrent] = useState([0, 0]);

  const paginate = (dir) => {
    setCurrent(([prev]) => {
      const newIndex = (prev + dir + slides.length) % slides.length;
      return [newIndex, dir];
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      paginate(1);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-[75vh] overflow-hidden bg-slate-100">
      <AnimatePresence>
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Hardware-Accelerated Ken Burns slide image */}
          <img
            src={slides[current].image}
            alt=""
            className="w-full h-full object-cover animate-[kenburns_6s_ease-out_forwards]"
          />

          {/* Light Theme Glassmorphism Text Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-100/60 via-transparent to-transparent flex flex-col justify-center items-center text-center px-4">
            <div className="bg-white/80 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/40 shadow-2xl max-w-2xl text-slate-800 scale-95 sm:scale-100 transition-all duration-300">
              <motion.h1
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.35 }}
                className="text-3xl md:text-5xl font-extrabold text-slate-900 mb-4 tracking-tight leading-tight"
              >
                {slides[current].title}
              </motion.h1>
              <p className="text-sm md:text-base text-slate-600 font-medium">
                {slides[current].text}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1.1); }
          100% { transform: scale(1.0); }
        }
      `}</style>

      {/* Navigation Arrows */}
      <button
        onClick={() => paginate(-1)}
        className="absolute top-1/2 left-5 transform -translate-y-1/2 w-11 h-11 bg-white/70 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-md transition-all text-xs z-10 cursor-pointer hover:scale-105"
      >
        <FaChevronLeft />
      </button>
      <button
        onClick={() => paginate(1)}
        className="absolute top-1/2 right-5 transform -translate-y-1/2 w-11 h-11 bg-white/70 hover:bg-white text-slate-800 rounded-full flex items-center justify-center shadow-md transition-all text-xs z-10 cursor-pointer hover:scale-105"
      >
        <FaChevronRight />
      </button>

      {/* Slide Indicators (Dots) */}
      <div className="absolute bottom-6 w-full flex justify-center gap-2.5 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent([index, index > current ? 1 : -1])}
            className={`h-2.5 rounded-full transition-all duration-300 ${
              current === index ? "w-6 bg-blue-600 shadow-sm" : "w-2.5 bg-slate-300 hover:bg-slate-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}