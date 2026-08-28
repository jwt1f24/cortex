"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SignUp() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // handle user sign up
  async function handleSignUp(name: string, email: string, password: string) {
    setError(null);
    setLoading(true);

    try {
      // create user through api route
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create account.");
        setLoading(false);
        return;
      }

      // auto login if sign up successful
      const signInRes = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        setError("Automatic sign-in failed, please login manually.");
      } else if (signInRes?.ok) {
        router.push("/home");
        router.refresh();
      } else {
        setError("Automatic sign-in failed, please login manually.");
      }
    } catch (err) {
      setError("Network error, please check your connection.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="text-3xl font-semibold tracking-tight text-black hover:opacity-70 transition"
          >
            Cortex
          </Link>
          <p className="mt-1 text-base text-gray-800">Create an account</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSignUp(name, email, password);
          }}
          className="space-y-4 rounded-lg border border-gray-300 bg-white p-6 shadow-lg"
        >
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="name"
              className="block text-base text-black font-medium mb-1"
            >
              Name
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-base text-black font-medium mb-1"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-base text-black font-medium mb-1"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              minLength={8}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-base text-black placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-sm text-gray-500">At least 8 characters.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gray-700 px-4 py-2 text-base font-semibold text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer"
          >
            {loading ? "Creating account..." : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-base text-gray-600">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-blue-500 underline hover:text-blue-600"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
