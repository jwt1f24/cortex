import { auth } from "@/auth";
import Link from "next/link";
import Image from "next/image";

const FEATURES = [
  {
    image: "/img1.jpg",
    title: "Upload anything",
    heading: "Drop in a document, get a note",
    body: "PDF, Word, Markdown, or plain text. Cortex extracts the text, generates a title and a summary, and files it away — all in one step.",
  },
  {
    image: "/img2.jpg",
    title: "AI-powered summaries",
    heading: "Key points, not vague descriptions",
    body: "Summaries preserve the specifics like commands, names, numbers, and dates, instead of telling you what the document is broadly about. The summaries are also editable if the model missed something.",
  },
  {
    image: "/img3.jpg",
    title: "Semantic search",
    heading: "Search by meaning, not just words",
    body: "Every note is embedded as a vector. For example, search “version control” and your git notes surface, even though that exact phrase never appears in them.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  const isLoggedIn = Boolean(session?.user?.id);

  return (
    <div className="min-h-screen bg-white">
      {/* navbar */}
      <header className="sticky top-0 z-50">
        <div className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-40 -z-10 bg-gradient-to-b from-blue-200 via-blue-100 to-transparent" />

          <div className="px-8 h-16 flex items-center justify-between">
            <span className="text-2xl font-semibold tracking-tight">
              Cortex
            </span>
            <Link
              href={isLoggedIn ? "/home" : "/login"}
              className="rounded-full px-6 py-2 bg-white text-black text-base font-semibold hover:bg-gray-100 hover:shadow-md transition"
            >
              {isLoggedIn ? "Dashboard" : "Get started"}
            </Link>
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="px-6 pt-40 pb-40 text-center">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-semibold tracking-tight text-black sm:text-5xl">
            Learn faster and smarter
          </h1>
          <p className="mt-6 text-lg text-gray-600">
            Write notes or upload documents. Cortex summarises them
            automatically and lets you search by meaning, not just keywords.
          </p>

          <div className="mt-16 flex justify-center">
            <Link
              href={isLoggedIn ? "/home" : "/login"}
              className="rounded-lg px-16 py-4 bg-blue-500 text-xl font-semibold text-white shadow-md hover:bg-blue-600 hover:shadow-lg transition"
            >
              {isLoggedIn ? "Go to your notes" : "Get started"}
            </Link>
          </div>

          <p className="mt-16 text-lg text-gray-600">
            ↓ See below to see how it works ↓
          </p>
        </div>
      </section>

      {/* features */}
      {FEATURES.map((feature, i) => (
        <section key={feature.title} className="px-8 py-16">
          <div
            className={`mx-auto flex max-w-5xl flex-col items-center gap-12 lg:flex-row ${
              i % 2 === 1 ? "lg:flex-row-reverse" : ""
            }`}
          >
            {/* text */}
            <div className="flex-1">
              <p className="text-base font-semibold tracking-wide text-blue-500">
                {feature.title}
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-black">
                {feature.heading}
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-gray-600">
                {feature.body}
              </p>
            </div>

            {/* graphic */}
            <div className="flex-1">
              <Image
                src={feature.image}
                alt={feature.heading}
                width={1280}
                height={720}
                className="w-full rounded-xl border border-gray-300 shadow-sm"
              />
            </div>
          </div>
        </section>
      ))}

      {/* closing cta */}
      <section className="px-8 py-24">
        <div className="mx-auto max-w-3xl rounded-2xl bg-gray-800 px-8 py-16 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Start using Cortex today
          </h2>
          <p className="mt-3 text-lg text-gray-300">
            Free to use. No credit card required.
          </p>
          <Link
            href={isLoggedIn ? "/home" : "/login"}
            className="mt-8 inline-block rounded-lg bg-white px-10 py-3 text-base font-semibold text-black hover:bg-gray-100 hover:shadow-lg transition"
          >
            {isLoggedIn ? "Go to your notes" : "Get started"}
          </Link>
        </div>
      </section>

      {/* footer */}
      <footer className="border-t border-gray-200 px-8 py-10">
        <div className="flex flex-col items-center gap-3">
          <span className="font-semibold text-black text-xl">Cortex</span>
          <a
            href="https://github.com/jwt1f24/cortex"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-700 hover:text-black transition"
          >
            Check out the GitHub repo!
          </a>
          <span className="text-sm text-gray-500 text-base">
            © {new Date().getFullYear()} Cortex, All rights reserved.
          </span>
        </div>
      </footer>
    </div>
  );
}
