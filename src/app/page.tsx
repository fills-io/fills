import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero/Hero";
import SocialBand from "@/components/SocialBand";
import Ticker from "@/components/Ticker";
import Output from "@/components/Output";
import Architect from "@/components/Architect";
import HowItWorks from "@/components/HowItWorks";
import SampleBoards from "@/components/SampleBoards";
import MadeFor from "@/components/MadeFor";
import WordmarkMoment from "@/components/WordmarkMoment";
import Faq from "@/components/Faq";
import PickYourDoor from "@/components/PickYourDoor";
import Footer from "@/components/Footer";
import Reveal from "@/components/Reveal";

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />
      <SocialBand />
      <Ticker />
      {/* Below-the-fold sections gently reveal as they scroll into view. */}
      <Reveal>
        <Output />
      </Reveal>
      <Reveal>
        <Architect />
      </Reveal>
      <Reveal>
        <HowItWorks />
      </Reveal>
      <Reveal>
        <SampleBoards />
      </Reveal>
      <Reveal>
        <MadeFor />
      </Reveal>
      <Reveal>
        <WordmarkMoment />
      </Reveal>
      <Reveal>
        <Faq />
      </Reveal>
      <Reveal>
        <PickYourDoor />
      </Reveal>
      <Footer />
    </>
  );
}
