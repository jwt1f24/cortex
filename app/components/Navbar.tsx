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
      <div className="px-6 h-14 flex items-center justify-between gap-6">
        {/* left */}
        <Link
          href={"/home"}
          className="font-semibold tracking-tight cursor-pointer"
        >
          Cortex
        </Link>

        {/* middle */}
        <Searchbar />

        {/* right */}
        <ProfileMenu user={user} />
      </div>
    </div>
  );
}
