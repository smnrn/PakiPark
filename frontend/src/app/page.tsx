"use client";
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { Reviews } from '../components/Reviews';
import { Services } from '../components/Services';
import { Footer } from '../components/Footer';

export default function HomePage() {
  return (
    <div className="font-sans antialiased text-[#1e3d5a]">
      <Navbar />
      <Hero />
      <Features />
      <Services />
      <Reviews />
      <Footer />
    </div>
  );
}
