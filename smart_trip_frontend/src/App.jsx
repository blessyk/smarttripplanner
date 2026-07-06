import React from 'react'
import Navbar from './components/Navbar'
import Header from './components/Header'
import About from './components/About'
import Destinations from './components/Destinations'
import Footer from './components/Footer'
import TestimonialContact from './components/TestimonialContact'
import AdminHome from './components/Admin/AdminHome'


export default function App() {
  return (
    <div className="bg-slate-100/60 min-h-screen pb-12">
      <Navbar />
      <Header />
      
      {/* Container to center sections and add margins */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-10 space-y-10">
        
        <section 
          id="about" 
          className="bg-white rounded-3xl shadow-md p-6 md:p-10 scroll-mt-24"
        >
          <About />
        </section>

        <section 
          id="destinations" 
          className="bg-white rounded-3xl shadow-md p-6 md:p-10 scroll-mt-24"
        >
          <Destinations />
        </section>

        <section 
          id="testimonialsandcontact" 
          className="bg-white rounded-3xl shadow-md p-6 md:p-10 scroll-mt-24"
        >
          <TestimonialContact />
        </section>
        
      </div>
      
      <Footer/>

      {/* <AdminHome/> */}
    </div>
  )
}
