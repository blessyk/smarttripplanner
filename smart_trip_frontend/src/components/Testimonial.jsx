import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import api from "./Utils/api";

const fallbackTestimonials = [
  {
    id: 1,
    name: "Mike Taylor",
    location: "Lahore, Pakistan",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    text: "On the Windows talking painted pasture yet its express parties use. Sure last upon he same as knew next."
  },
  {
    id: 2,
    name: "Chris Thomas",
    location: "CEO of Red Button",
    image: "https://randomuser.me/api/portraits/men/45.jpg",
    text: "Amazing travel experience! Everything was well planned and super smooth."
  },
  {
    id: 3,
    name: "Sara Ali",
    location: "Dubai, UAE",
    image: "https://randomuser.me/api/portraits/women/65.jpg",
    text: "Highly recommend this planner. It made my trip stress-free and enjoyable."
  }
];

const variants = {
  enter: { y: 100, opacity: 0 },
  center: { y: 0, opacity: 1 },
  exit: { y: -100, opacity: 0 }
};

export default function Testimonial() {
  const [index, setIndex] = useState(0);
  const [testimonialsList, setTestimonialsList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTestimonials = async () => {
      try {
        const response = await api.get("/testimonials");
        if (response.data?.success) {
          const list = response.data.data.testimonials || [];
          setTestimonialsList(list.length > 0 ? list : fallbackTestimonials);
        } else {
          setTestimonialsList(fallbackTestimonials);
        }
      } catch (err) {
        console.error("Failed to fetch testimonials:", err);
        setTestimonialsList(fallbackTestimonials);
      } finally {
        setLoading(false);
      }
    };
    fetchTestimonials();
  }, []);

  useEffect(() => {
    if (testimonialsList.length === 0) return;
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % testimonialsList.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [testimonialsList]);

  if (loading || testimonialsList.length === 0) {
    return (
      <div className="relative h-[250px] w-full flex items-center justify-center bg-white rounded-xl shadow-xl border border-slate-200">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0A3D62]"></div>
      </div>
    );
  }

  const current = testimonialsList[index];

  return (
    <div className="relative h-[300px] w-full">
      {/* Background stacked cards */}
      <div className="absolute top-8 left-4 w-full h-full bg-gray-200 rounded-xl transform rotate-1 z-0"></div>
      <div className="absolute top-4 left-2 w-full h-full bg-gray-100 rounded-xl transform -rotate-1 z-10"></div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.6 }}
          className="absolute w-full bg-white p-8 rounded-xl shadow-xl z-20 min-h-[220px]"
        >
          <img
            src={current.image || "https://randomuser.me/api/portraits/men/32.jpg"}
            alt={current.name}
            className="w-14 h-14 rounded-full absolute -top-6 left-6 border-4 border-white object-cover"
            onError={(e) => {
              e.target.src = "https://randomuser.me/api/portraits/men/32.jpg";
            }}
          />
          <p className="text-gray-600 mt-6 mb-4 line-clamp-4">{current.text}</p>
          <h3 className="font-semibold text-[#0A3D62]">{current.name}</h3>
          <p className="text-sm text-gray-500">{current.location}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}