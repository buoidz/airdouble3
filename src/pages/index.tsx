import { SignInButton, SignUpButton, useUser } from "@clerk/nextjs";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronRight, ShuffleIcon, SquircleDashed } from "lucide-react";
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
        <title>Airtable</title>
        <link rel="icon" href="/airtable.png" />
      </Head>
      <main className="antialiased">
        {(isSignedIn) ? (
          <HomeMain />
          ) : ( 
          <div className="min-h-screen bg-[#f7f7f0]">
            <div className="w-full h-10 bg-blue-50 flex items-center justify-center">
              Meet Omni, your AI collaborator for building custom apps.{" "}
              <Link href="/" className="ml-2 text-blue-600 font-semibold hover:underline" target="_blank">
                See what’s possible.
              </Link>
              <ArrowRight className="text-blue-600" size={16} strokeWidth={2}/>
            </div>
            <div className="h-20 flex items-center justify-between bg-[#f7f7f0] hover:bg-white transition-colors duration-300 shadow-[0_8px_16px_rgba(0,0,0,0.03)]">
              <div className="pl-10 flex items-center">
                <Link href="/">
                  <Image
                    src="/airtable-black.svg"
                    alt="airtable logo"
                    width={40}
                    height={40}
                  />
                </Link>
                <div className="ml-2 font-bold text-2xl">Airtable</div>  
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
            <div className="pt-10 flex flex-col items-center text-[50px] leading-[1.2]">
              <span>From idea to app in an instant</span>
              <span>Build with AI that means business</span>
              <div className="mt-10 h-55 w-195 bg-white rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.06)] flex flex-col justify-between">
                <span className="px-6 pt-8 text-[21px]">Create a CRM for my startup to track leads and customer relationships</span>
                <div className="px-4 pb-5 flex flex-row justify-between">
                  <button className="px-6 w-52 h-15 border border-gray-300 rounded-full hover:bg-gray-100 hover:cursor-pointer flex flex-row gap-4 items-center">
                    <ShuffleIcon size={16} />
                    <span className="text-[16px] font-semibold">New Suggestion</span>
                  </button>
                  <button className="pl-5 pr-2 w-40 h-15 bg-black rounded-full hover:cursor-pointer flex flex-row gap-2 items-center">
                    <SquircleDashed className="text-white" size={20} />
                    <span className="text-[17px] text-white font-semibold">Build it now</span>
                  </button>
                </div>
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