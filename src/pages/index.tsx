import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight } from "lucide-react";
import { HomeMain } from "~/components/home/HomeMain";
import { LoadingPage } from "~/components/LoadingPage";

const Home = () => {
  const {isLoaded, isSignedIn} = useUser();

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen">
        <LoadingPage />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Airdouble</title>
        <link rel="icon" href="/airtable.png" />
      </Head>
      <main>
        {(isSignedIn) ? (
          <HomeMain />
          ) : ( 
          <div className="min-h-screen bg-gray-100">
            <div className="w-full h-10 bg-blue-50 flex items-center justify-center">
              Meet Omni, your AI collaborator for building custom apps.{" "}
              <Link href="/" className="ml-2 text-blue-600 font-semibold hover:underline" target="_blank">
                See what’s possible.
              </Link>
              <ArrowRight className="text-blue-600" size={16} strokeWidth={2}/>
            </div>
            <div className="h-20 flex items-center justify-between bg-gray-50 hover:bg-white transition-colors duration-300">
              <div className="pl-10 flex items-center">
                <Link href="/">
                  <Image
                    src="/airtable-black.svg"
                    alt="airtable logo"
                    width={40}
                    height={40}
                  />
                </Link>
                <div className="ml-2 font-bold text-2xl">Airdouble</div>  
                <div className="ml-6 font-semibold text-md">Platform</div>
                <ChevronRight className="ml-1 text-gray-400" size={15} strokeWidth={3}/>    
                <div className="ml-4 font-semibold text-md">Solutions</div>
                <ChevronRight className="ml-1 text-gray-400" size={15} strokeWidth={3}/>    
                <div className="ml-4 font-semibold text-md">Resources</div>
                <ChevronRight className="ml-1 text-gray-400" size={15} strokeWidth={3}/>    
                <div className="ml-4 font-semibold text-md">Enterprises</div>
                <div className="ml-4 font-semibold text-md">Pricing</div>
              </div>
              
              <div className="pl-10 flex items-center gap-4">
                <button className="border border-b rounded-xl text-black font-semibold px-6 py-4 hover:text-gray-700 transition-colors duration-300">
                  Book Demo
                </button>
                <SignUpButton mode="modal">
                  <button className="rounded-xl text-white bg-black font-semibold px-6 py-4 hover:bg-gray-700 transition-colors duration-300">
                    Sign up for free
                  </button>
                </SignUpButton>
                <SignInButton mode="modal">
                  <button className="text-black font-semibold mr-8 hover:text-blue-700 transition-colors duration-300">
                    Log In
                  </button>
                </SignInButton>
              </div>
              
            </div>
          </div>
          )
        }
        
      </main>
    </>
  );
}

export default Home;