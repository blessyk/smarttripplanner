import { useState, useEffect } from "react";
import { FaBars } from "react-icons/fa";
import LoginModal from "./LoginModal";
import RegisterModal from "./RegisterModal";
import api from "./Utils/api";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [modal, setModal] = useState(null);
    const [logoUrl, setLogoUrl] = useState("/logo.png");

    useEffect(() => {
        const fetchLogo = async () => {
            try {
                const response = await api.get("/auth/portal-logo");
                if (response.data?.success) {
                    setLogoUrl(response.data.data);
                }
            } catch (err) {
                console.error("Failed to load portal logo:", err);
            }
        };
        fetchLogo();
    }, []);

    console.log(modal)
    return (
        <nav className="fixed top-0 bg-[#0A3D62] text-white px-6 md:px-12 py-5 shadow-md z-50 w-full">
            <div className="flex items-center justify-between">

                {/* Logo */}
                <div className="flex items-center gap-2 font-bold">
                    <img
                        src={logoUrl}
                        alt="logo"
                        className="w-40 h-10 object-contain"
                    />
                </div>
                <div className="hidden md:flex items-center gap-8">
                    <ul className="flex gap-6 text-lg font-medium">
                        <li><a href="#" className="hover:text-[#F4E1C1]">Home</a></li>
                        <li><a href="#about" className="hover:text-[#F4E1C1]">About</a></li>
                        <li><a href="#destinations" className="hover:text-[#F4E1C1]">How It Works</a></li>
                        <li><a href="#testimonialsandcontact" className="hover:text-[#F4E1C1]">Testimonials</a></li>
                        <li><a href="#testimonialsandcontact" className="hover:text-[#F4E1C1]">Contact</a></li>
                    </ul>
                    <button 
                      onClick={() => setModal("login")} 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-5 py-1.5 rounded-full font-semibold shadow-md transition-all text-sm cursor-pointer"
                    >
                        Login
                    </button>
                </div>
                <button
                    className="md:hidden hover:text-slate-200 transition-colors"
                    onClick={() => setIsOpen(!isOpen)}>
                    <FaBars className="text-xl" />
                </button>
            </div>
            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden mt-4 flex flex-col gap-4 text-center">
                    <a href="#" className="hover:text-[#F4E1C1]">Home</a>
                    <a href="#about" className="hover:text-[#F4E1C1]">About</a>
                    <a href="#destinations" className="hover:text-[#F4E1C1]">How It Works</a>
                    <a href="#testimonialsandcontact" className="hover:text-[#F4E1C1]">Testimonials</a>
                    <a href="#testimonialsandcontact" className="hover:text-[#F4E1C1]">Contact</a>
                    <button 
                      onClick={() => setModal("login")} 
                      className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white px-5 py-2 rounded-full font-semibold shadow-md transition-all text-sm cursor-pointer w-full"
                    >
                        Login
                    </button>
                </div>
            )}
            {modal === "login" && (<LoginModal onSwitch={() => setModal("register")} closeModal={() => setModal(null)} />)}
            {modal === "register" && (<RegisterModal onSwitch={() => setModal("login")} closeModal={() => setModal(null)} />)}
        </nav>
    );
}
