"use client";
import Link from "next/link";
import Searchbar from "../components/Searchbar";
import ProfileMenu from "../components/ProfileMenu";

export default function Navbar({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  return (
    <div className="mb-8 border-b border-gray-200 bg-white text-black text-2xl">
      <div className="px-3 sm:px-6 h-14 flex items-center justify-between gap-3 sm:gap-6">
        {/* left */}
        <Link
          href={"/home"}
          className="shrink-0 font-semibold tracking-tight text-lg sm:text-2xl cursor-pointer"
        >
          Cortex
        </Link>

        {/* middle */}
        <div className="flex-1 min-w-0">
          <Searchbar />
        </div>

        {/* right */}
        <div className="shrink-0">
          <ProfileMenu user={user} />
        </div>
      </div>
    </div>
  );
}
