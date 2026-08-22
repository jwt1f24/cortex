"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import Link from "next/link";

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
    <div>
      {/* left */}
      <Link href={"/home"}>Cortex</Link>

      {/* right */}
      <button onClick={toggleProfileBtn}>Profile</button>
      {isOpen && (
        <div>
          <p>{user.name}</p>
          <p>{user.email}</p>
          <button onClick={logOut}>Log out</button>
        </div>
      )}
    </div>
  );
}
