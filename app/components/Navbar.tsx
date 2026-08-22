"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Searchbar from "../components/Searchbar";

export default function Navbar({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  const [isOpen, setIsOpen] = useState(false);

  // log out user & return to login page
  const logOut = () => signOut({ callbackUrl: "/login" });

  // toggle profile popup
  const toggleProfileBtn = () => setIsOpen(!isOpen);

  return (
    <div className="flex items-center justify-between gap-10 mb-8">
      {/* left */}
      <Link href={"/home"} className="cursor-pointer">
        Cortex
      </Link>

      {/* middle */}
      <Searchbar />

      {/* right */}
      <div className="relative">
        <button onClick={toggleProfileBtn} className="cursor-pointer">
          Profile
        </button>

        {isOpen && (
          <div className="absolute right-0 top-full mt-2 w-48 rounded-md bg-white text-black p-4 shadow-lg z-50 border border-gray-200">
            <p>{user.name}</p>
            <p>{user.email}</p>
            <button
              onClick={logOut}
              className="mt-4 p-1 pl-6 pr-6 bg-red-500 text-white font-semibold cursor-pointer"
            >
              Log out
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
