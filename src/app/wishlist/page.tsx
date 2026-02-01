"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, ShoppingCart, ArrowLeft, Heart, Package, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getWishlist, removeFromWishlist } from "@/actions/wishlist";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface WishlistItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  basePrice: number;
  image: string | null;
  rating: number;
  reviews: number;
  inStock: boolean;
  addedAt: Date;
}

export default function WishlistPage() {
  const router = useRouter();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setIsLoading(true);
      const data = await getWishlist();
      setWishlistItems(data);
    } catch (error) {
      console.error("Error fetching wishlist:", error);
      toast.error("Failed to load wishlist");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveFromWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    startTransition(async () => {
      const result = await removeFromWishlist(id);
      if (result.success) {
        setWishlistItems((prev) => prev.filter((item) => item.id !== id));
        toast.success("Removed from wishlist");
      } else {
        toast.error(result.error || "Failed to remove from wishlist");
      }
    });
  };

  const handleAddToCart = (slug: string, e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/products/${slug}?action=add-to-cart`);
  };

  const handleViewProduct = (slug: string) => {
    router.push(`/products/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center">
        <div className="h-10 w-10 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans w-full  pb-20">

      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-[1464px] mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                My Wishlist
                <span className="text-sm font-normal text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                  {wishlistItems.length}
                </span>
              </h1>
            </div>
          </div>
          <Button variant="outline" onClick={() => router.push("/products")}>
            Continue Shopping
          </Button>
        </div>
      </header>

      <div className="max-w-[1464px] mx-auto px-6 py-8">

        {wishlistItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="h-24 w-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-6">
              <Heart className="h-10 w-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Your wishlist is empty</h2>
            <p className="text-slate-500 max-w-md mb-8">Save items you want to rent later by clicking the heart icon on any product.</p>
            <Button size="lg" className="bg-sky-500 hover:bg-sky-600" onClick={() => router.push("/products")}>
              Explore Products
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {wishlistItems.map((item) => (
              <div
                key={item.id}
                onClick={() => handleViewProduct(item.slug)}
                className="group relative bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
              >
                {/* Image Area */}
                <div className="aspect-square bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Package className="h-10 w-10 opacity-50" />
                    </div>
                  )}

                  {/* Floating Actions */}
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8 rounded-full bg-white/90 hover:bg-red-50 text-slate-400 hover:text-red-500 shadow-sm backdrop-blur-sm"
                      onClick={(e) => handleRemoveFromWishlist(item.id, e)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {!item.inStock && (
                    <div className="absolute bottom-0 left-0 right-0 bg-red-500/90 text-white text-xs font-bold py-1 text-center backdrop-blur-sm">
                      OUT OF STOCK
                    </div>
                  )}
                </div>

                {/* Content Area */}
                <div className="p-5 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white truncate group-hover:text-sky-500 transition-colors">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-medium">{item.rating.toFixed(1)}</span>
                      <span className="text-xs text-slate-400">({item.reviews})</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                    <div className="text-xl font-bold">
                      ₹{item.basePrice}
                      <span className="text-xs font-normal text-slate-400 ml-1">/day</span>
                    </div>
                    <Button
                      size="sm"
                      disabled={!item.inStock}
                      onClick={(e) => handleAddToCart(item.slug, e)}
                      className={cn("rounded-lg", item.inStock ? "bg-sky-500 hover:bg-sky-600" : "opacity-50")}
                    >
                      <ShoppingCart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
