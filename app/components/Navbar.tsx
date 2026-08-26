"use client";
import { useState, useRef, useEffect } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import Searchbar from "../components/Searchbar";

export default function Navbar({
  user,
}: {
  user: { name?: string | null; email?: string | null };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // log out user & return to login page
  const logOut = () => signOut({ callbackUrl: "/login" });

  // toggle profile popup
  const toggleProfileBtn = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="mb-8 border-b border-gray-200 bg-white text-black">
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
        <div className="relative" ref={menuRef}>
          <button
            onClick={toggleProfileBtn}
            className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-900 text-base text-white font-semibold cursor-pointer"
          >
            {user.name?.[0]?.toUpperCase() ?? "?"}
          </button>

          {/* dropdown */}
          {isOpen && (
            <div className="absolute right-0 z-50 p-4 mt-2 w-56 rounded-lg border border-gray-200 bg-white shadow-lg">
              <p className="text-lg font-medium text-black">{user.name}</p>
              <p className="text-sm text-gray-500 truncate">{user.email}</p>
              <button
                onClick={logOut}
                className="w-full mt-4 px-3 py-2 rounded-md bg-red-500 text-base text-white font-semibold hover:bg-red-600 transition duration-0.3 cursor-pointer"
              >
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
