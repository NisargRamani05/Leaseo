"use client";

import { Dancing_Script } from "next/font/google";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  ShoppingCart,
  User,
  LogOut,
  Menu,
  Heart,
  FileText,
  LayoutDashboard,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { useCurrentUserClient } from "@/hook/use-current-user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const dancingScript = Dancing_Script({ subsets: ["latin"] });

export function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user: session } = useCurrentUserClient();

  const isAuthPage = pathname?.startsWith("/auth");
  const isVendorPage = pathname?.startsWith("/vendor");
  const isAdminPage = pathname?.startsWith("/admin");

  // Don't show navbar on auth pages, vendor pages, admin pages, or landing page
  if (isAuthPage || isVendorPage || isAdminPage || pathname === "/") return null;

  // If vendor is on customer pages, redirect them
  const isVendor = session?.role === "VENDOR";
  const isAdmin = session?.role === "ADMIN";

  return (
    <nav className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 md:px-12 flex items-center justify-between font-sans sticky top-0 z-40 transition-colors duration-300">
      {/* Left: Logo & Links */}
      <div className="flex items-center gap-8">
        <Link
          href={
            isVendor
              ? "/vendor/dashboard"
              : isAdmin
                ? "/admin/dashboard"
                : "/"
          }
          className={`font-semibold text-3xl text-sky-500 tracking-wide ${dancingScript.className}`}
        >
          Leaseo
        </Link>
        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
          {!isVendor && !isAdmin && (
            <>
              <Link
                href="/products"
                className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
              >
                Browse
              </Link>
              {session && session.role === "CUSTOMER" && (
                <>
                  <Link
                    href="/wishlist"
                    className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1"
                  >
                    Wishlist
                  </Link>
                  <Link
                    href="/quotations"
                    className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-1"
                  >
                    Quotations
                  </Link>
                  <Link
                    href="/orders"
                    className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors"
                  >
                    Orders
                  </Link>
                </>
              )}
            </>
          )}

          {/* Vendor/Admin quick link to dashboard */}
          {(isVendor || isAdmin) && (
            <Link
              href={isVendor ? "/vendor/dashboard" : "/admin/dashboard"}
              className="hover:text-sky-500 dark:hover:text-sky-400 transition-colors flex items-center gap-2"
            >
              <LayoutDashboard className="h-4 w-4" />
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {session && session.role === "CUSTOMER" && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push("/cart")}
            className="relative text-slate-500 hover:text-sky-500 dark:text-slate-400 dark:hover:text-sky-400"
          >
            <ShoppingCart className="h-5 w-5" />
            <span className="absolute top-2 right-2 bg-sky-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center border-2 border-white dark:border-slate-900">
              0
            </span>
          </Button>
        )}

        {session ? (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 pl-2 pr-4 h-10 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={session?.image || ""} />
                    <AvatarFallback className="bg-sky-100 text-sky-600 dark:bg-sky-900 dark:text-sky-200">
                      {session?.firstName
                        ? `${session.firstName[0]}${session.lastName?.[0] || ""}`
                        : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col text-left hidden sm:block">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white leading-none">
                      {session?.firstName
                        ? `${session.firstName} ${session.lastName || ""}`
                        : session?.name || session?.email || "User"}
                    </span>
                    <span className="text-[10px] text-slate-500 capitalize">
                      {session?.role?.toLowerCase()}
                    </span>
                  </div>
                  <ChevronDown className="w-4 h-4 text-slate-500 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {!isVendor && !isAdmin && (
                  <DropdownMenuItem onClick={() => router.push("/profile")}>
                    <User className="h-4 w-4 mr-2" /> Profile
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                  onClick={() => signOut()}
                >
                  <LogOut className="h-4 w-4 mr-2" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ) : (
          <div className="flex gap-4">
            <Button
              variant="ghost"
              className="text-slate-600 hover:text-sky-500"
              onClick={() => router.push("/auth/login")}
            >
              Login
            </Button>
            <Button
              onClick={() => router.push("/auth/signup")}
              className="bg-sky-500 hover:bg-sky-600 text-white rounded-full px-6"
            >
              Sign Up
            </Button>
          </div>
        )}

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-slate-500"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu className="h-6 w-6" />
        </Button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="absolute top-16 left-0 w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 md:hidden shadow-lg flex flex-col gap-2">
          {!isVendor && !isAdmin ? (
            <>
              <Link
                href="/products"
                className="block px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Products
              </Link>
              {session && session.role === "CUSTOMER" && (
                <>
                  <Link
                    href="/wishlist"
                    className="block px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Wishlist
                  </Link>
                  <Link
                    href="/quotations"
                    className="block px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Quotations
                  </Link>
                  <Link
                    href="/orders"
                    className="block px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Orders
                  </Link>
                </>
              )}
            </>
          ) : (
            <Link
              href={isVendor ? "/vendor/dashboard" : "/admin/dashboard"}
              className="block px-4 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
