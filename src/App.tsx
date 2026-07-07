import Navbar from "./sections/Navbar";
import HeroSection from "./sections/HeroSection";
import ComparisonSection from "./sections/ComparisonSection";
import ScenariosSection from "./sections/ScenariosSection";
import AccessSection from "./sections/AccessSection";
import FeaturesSection from "./sections/FeaturesSection";
import PricingSection from "./sections/PricingSection";
import RoadmapSection from "./sections/RoadmapSection";
import Footer from "./sections/Footer";

function App() {
  return (
    <div className="min-h-screen bg-[#fafaf8] text-stone-900">
      <Navbar />
      <main>
        <HeroSection />
        <ComparisonSection />
        <ScenariosSection />
        <AccessSection />
        <FeaturesSection />
        <PricingSection />
        <RoadmapSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
