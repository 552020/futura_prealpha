import Image from "next/image";

export default function Home() {
  return (
    <div>
      {/* <Header /> */}
      <main>
        <div className="relative h-screen w-full">
          <Image src="/hero/abstract-1.jpg" alt="Futura" fill className="absolute object-cover -z-10" priority />
          <div className="flex flex-col items-center justify-center h-full text-white px-4 sm:px-8">
            <h1 className="text-6xl sm:text-8xl lg:text-9xl font-bold tracking-[.15em]">Futura</h1>
            <h3 className="text-3xl sm:text-5xl lg:text-6xl mt-4 ">Live Forever. Now.</h3>
          </div>
        </div>
      </main>
      {/* <Footer /> */}
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

function Footer() {
  return (
    <footer>
      <p>© 2025 Futura</p>
    </footer>
  );
}
