import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero/Hero";
import SocialBand from "@/components/SocialBand";
import Ticker from "@/components/Ticker";
import Output from "@/components/Output";
import Architect from "@/components/Architect";
import HowItWorks from "@/components/HowItWorks";
import MadeFor from "@/components/MadeFor";
import Faq from "@/components/Faq";
import PickYourDoor from "@/components/PickYourDoor";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <SocialBand />
      <Ticker />
      <Output />
      <Architect />
      <HowItWorks />
      <MadeFor />
      <Faq />
      <PickYourDoor />
      <Footer />
    </>
  );
}
