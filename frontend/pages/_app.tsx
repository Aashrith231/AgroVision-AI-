import type { AppProps } from "next/app";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import "../styles/globals.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <meta name="theme-color" content="#16a34a" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/agrovision-icon.svg" />
      </Head>
      <Component {...pageProps} />
      <Toaster position="top-center" toastOptions={{ duration: 3600 }} />
    </>
  );
}
