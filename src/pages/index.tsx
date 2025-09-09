import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import Head from "next/head";

const Home = () => {

  return (
    <>
      <Head>
        <title>Airduple</title>
        <link rel="icon" href="airtable.png" />
      </Head>
      <main>
        <SignedOut>
          <SignInButton mode="modal"/>
        </SignedOut>
        <SignedIn>
          <UserButton/>
        </SignedIn>
      </main>
    </>
  );
}

export default Home;