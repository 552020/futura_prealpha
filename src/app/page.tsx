import Image from "next/image";
import { Button } from "@/components/ui/button";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <div>
      {/* <Header /> */}
      <main>
        <div className="relative h-screen w-full overflow-hidden">
          <Image src="/hero/abstract-1.jpg" alt="Futura" fill className="absolute object-cover -z-10" priority />
          <div className="flex flex-col items-center justify-center h-full text-white px-4 sm:px-8">
            <h1 className="text-6xl sm:text-8xl lg:text-9xl font-bold tracking-[.15em]">Futura</h1>
            <h3 className="text-3xl sm:text-5xl lg:text-6xl mt-4">Live Forever. Now.</h3>
            <div className="mt-8 space-x-4">
              <Button asChild className="bg-black text-white hover:bg-white hover:text-black">
                <a href="#learn-more">Learn More</a>
              </Button>
              <Button
                asChild
                variant="outline"
                className="border-white text-black hover:bg-black hover:text-white hover:border-black"
              >
                <a href="/start">Start Here</a>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header>
      <h1>Futura</h1>
    </header>
  );
}
