"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Heart,
  ShoppingCart,
  Truck,
  Shield,
  Package,
  Check,
  Star,
  Share2,
  Calendar as CalendarIcon,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { getProductBySlug } from "@/actions/products";
import { addToCart } from "@/actions/cart";
import {
  addToWishlist,
  removeFromWishlist,
  isInWishlist,
} from "@/actions/wishlist";
import { toast } from "sonner";
import ProductAvailabilityCalendar from "@/components/ProductAvailabilityCalendar";
import { cn } from "@/lib/utils";

// --- Types (Kept same) ---
interface ProductVariantAttribute {
  id: string;
  attributeName: string;
  attributeId: string;
  valueId: string;
  value: string;
}

interface ProductVariant {
  id: string;
  name: string | null;
  priceModifier: number;
  sku: string;
  quantity: number;
  isActive: boolean;
  attributes: ProductVariantAttribute[];
}

interface ProductImage {
  id: string;
  url: string;
  alt: string | null;
  isPrimary: boolean;
}

interface RentalPricing {
  id: string;
  periodType: string;
  duration: number;
  price: number;
}

interface ProductData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  basePrice: number;
  securityDeposit: number;
  quantity: number;
  isRentable: boolean;
  isPublished: boolean;
  minRentalPeriod: number;
  maxRentalPeriod: number | null;
  images: ProductImage[];
  variants: ProductVariant[];
  rentalPricing: RentalPricing[];
  category: { id: string; name: string; slug: string } | null;
  vendor: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    companyName: string | null;
  };
}

export default function ProductDetailPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;

  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [product, setProduct] = useState<ProductData | null>(null);
  const [isInWishlistState, setIsInWishlistState] = useState(false);

  // Form State
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState("");
  const [rentalPeriod, setRentalPeriod] = useState<"HOURLY" | "DAILY" | "WEEKLY">("DAILY");
  const [rentalDuration, setRentalDuration] = useState(1);
  const [startDate, setStartDate] = useState("");
  const [variantDialogOpen, setVariantDialogOpen] = useState(false);
  const [selectedAttributeValues, setSelectedAttributeValues] = useState<Record<string, string>>({});

  // Logic Helpers (Kept same)
  const productAttributes = useMemo(() => {
    if (!product?.variants?.length) return [];
    const attributeMap = new Map<string, { id: string; name: string; values: Array<{ id: string; value: string }> }>();
    product.variants.forEach((variant) => {
      variant.attributes.forEach((attr) => {
        if (!attributeMap.has(attr.attributeId)) {
          attributeMap.set(attr.attributeId, {
            id: attr.attributeId,
            name: attr.attributeName,
            values: [],
          });
        }
        const existing = attributeMap.get(attr.attributeId)!;
        if (!existing.values.find((v) => v.id === attr.valueId)) {
          existing.values.push({ id: attr.valueId, value: attr.value });
        }
      });
    });
    return Array.from(attributeMap.values());
  }, [product?.variants]);

  const hasVariantAttributes = useMemo(() => {
    return product?.variants?.some((v) => v.attributes && v.attributes.length > 0) || false;
  }, [product?.variants]);

  const matchingVariant = useMemo(() => {
    if (!product?.variants?.length || !hasVariantAttributes) return null;
    const selectedValueIds = Object.values(selectedAttributeValues);
    if (selectedValueIds.length !== productAttributes.length) return null;
    return product.variants.find((variant) => {
      const variantValueIds = variant.attributes.map((a) => a.valueId);
      return selectedValueIds.every((valueId) => variantValueIds.includes(valueId));
    });
  }, [product?.variants, selectedAttributeValues, productAttributes.length, hasVariantAttributes]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        const [productData, wishlistStatus] = await Promise.all([
          getProductBySlug(slug),
          isInWishlist(slug),
        ]);
        if (productData) {
          setProduct(productData);
          setIsInWishlistState(wishlistStatus);
          if (productData.variants.length > 0) setSelectedVariant(productData.variants[0].id);
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProduct();
  }, [slug]);

  const getPriceForPeriod = (periodType: "HOURLY" | "DAILY" | "WEEKLY"): number => {
    if (!product) return 0;
    const pricing = product.rentalPricing.find((p) => p.periodType === periodType);
    return pricing ? pricing.price : product.basePrice;
  };

  const calculateTotal = () => {
    if (!product) return 0;
    const basePrice = getPriceForPeriod(rentalPeriod);
    const variantPrice = selectedVariant
      ? product.variants.find((v) => v.id === selectedVariant)?.priceModifier || 0
      : 0;
    return (basePrice + variantPrice) * rentalDuration * quantity;
  };

  const currentPrice = getPriceForPeriod(rentalPeriod);

  const handleAddToCartClick = () => {
    if (!product) return;
    if (hasVariantAttributes && !matchingVariant && !selectedVariant) {
      setVariantDialogOpen(true);
      return;
    }
    handleAddToCart();
  };

  const handleAddToCart = () => {
    if (!product) return;
    if (!startDate) {
      toast.error("Please select a start date");
      return;
    }
    const variantToUse = matchingVariant?.id || selectedVariant || undefined;
    startTransition(async () => {
      const result = await addToCart({
        productId: product.id,
        variantId: variantToUse,
        quantity,
        rentalStartDate: new Date(startDate),
        rentalEndDate: new Date(new Date(startDate).getTime() + rentalDuration * 24 * 60 * 60 * 1000),
        periodType: rentalPeriod,
      });

      if (result.success) {
        toast.success("Added to cart");
        setVariantDialogOpen(false);
        router.push("/cart");
      } else {
        toast.error(result.error || "Failed to add to cart");
      }
    });
  };

  const handleWishlistToggle = () => {
    if (!product) return;
    startTransition(async () => {
      if (isInWishlistState) {
        const result = await removeFromWishlist(product.id);
        if (result.success) {
          setIsInWishlistState(false);
          toast.success("Removed from wishlist");
        } else {
          toast.error(result.error || "Failed to remove from wishlist");
        }
      } else {
        const result = await addToWishlist(product.id);
        if (result.success) {
          setIsInWishlistState(true);
          toast.success("Added to wishlist");
        } else {
          toast.error(result.error || "Failed to add to wishlist");
        }
      }
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) return null;

  return (
    <div className="min-h-screen px-6 bg-slate-50 dark:bg-slate-950 font-sans pb-20">
      {/* Navbar Placeholder/Back */}
      <div className="container mx-auto px-4 py-6 flex items-center justify-between">
        <Button variant="ghost" className="hover:bg-transparent pl-0 hover:text-sky-500 transition-colors" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Browse
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" className="hover:text-red-500" onClick={handleWishlistToggle}>
            <Heart className={cn("h-5 w-5", isInWishlistState ? "fill-red-500 text-red-500" : "")} />
          </Button>
          <Button variant="ghost" size="icon">
            <Share2 className="h-5 w-5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* LEFT COLUMN: Gallery & Details (Col Span 7) */}
          <div className="lg:col-span-7 space-y-12">
            {/* Image Gallery */}
            <div className="space-y-4">
              <div className="aspect-[4/3] w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-100 dark:border-slate-800">
                {product.images?.[0] ? (
                  <img
                    src={product.images[0].url}
                    alt={product.images[0].alt || product.name}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-400">
                    <Package className="h-16 w-16 opacity-50" />
                  </div>
                )}
              </div>
              {/* Secondary Grid */}
              {product.images.length > 1 && (
                <div className="grid grid-cols-2 gap-4">
                  {product.images.slice(1).map((img, idx) => (
                    <div key={idx} className="aspect-square bg-white dark:bg-slate-900 rounded-xl overflow-hidden border border-slate-100 dark:border-slate-800">
                      <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="prose dark:prose-invert max-w-none">
              <h3 className="text-2xl font-bold font-hand text-slate-800 dark:text-white">Product Overview</h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                {product.description || "No description available for this product."}
              </p>
            </div>

            {/* Features / Details Bento */}
            <div className="space-y-6">
              <h3 className="text-2xl font-bold font-hand text-slate-800 dark:text-white">Specifications</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Truck className="h-6 w-6 text-sky-500 mb-4" />
                  <h4 className="font-semibold text-lg mb-1">Delivery</h4>
                  <p className="text-sm text-slate-500">Pick-up and Drop-off options available for this item.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Shield className="h-6 w-6 text-sky-500 mb-4" />
                  <h4 className="font-semibold text-lg mb-1">Insurance</h4>
                  <p className="text-sm text-slate-500">Includes basic damage protection coverage.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                  <CalendarIcon className="h-6 w-6 text-sky-500 mb-4" />
                  <h4 className="font-semibold text-lg mb-1">Min Rental</h4>
                  <p className="text-sm text-slate-500">{product.minRentalPeriod} Day(s) minimum duration.</p>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-100 dark:border-slate-800">
                  <Info className="h-6 w-6 text-sky-500 mb-4" />
                  <h4 className="font-semibold text-lg mb-1">Availability</h4>
                  <p className="text-sm text-slate-500">{product.quantity} units currently in stock.</p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Info & Actions (Col Span 5) */}
          <div className="lg:col-span-5 relative">
            <div className="sticky top-24 space-y-8">

              {/* Header Info */}
              <div className="space-y-4">
                {product.category && (
                  <Badge variant="outline" className="border-sky-500 text-sky-500">
                    {product.category.name}
                  </Badge>
                )}
                <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 dark:text-white tracking-tight leading-tight">
                  {product.name}
                </h1>
                <div className="flex items-center gap-4">
                  <div className="text-3xl font-bold text-sky-600 dark:text-sky-400">
                    ₹{currentPrice.toLocaleString()}
                    <span className="text-base font-normal text-slate-400 ml-1">
                      /{rentalPeriod === "HOURLY" ? "hr" : rentalPeriod === "WEEKLY" ? "wk" : "day"}
                    </span>
                  </div>
                  {product.securityDeposit > 0 && (
                    <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-600">
                      + ₹{product.securityDeposit} Deposit
                    </Badge>
                  )}
                </div>
              </div>

              {/* Configuration Panel */}
              <Card className="border-0 shadow-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl ring-1 ring-slate-200 dark:ring-slate-800">
                <CardContent className="p-6 space-y-6">

                  {/* Period Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Rental Type</Label>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                      {["HOURLY", "DAILY", "WEEKLY"].map((type) => {
                        const available = product.rentalPricing.some(p => p.periodType === type) || type === "DAILY"; // Daily fallback
                        if (!available) return null;
                        return (
                          <button
                            key={type}
                            onClick={() => setRentalPeriod(type as any)}
                            className={cn(
                              "flex-1 py-2 text-sm font-medium rounded-md transition-all",
                              rentalPeriod === type
                                ? "bg-white dark:bg-slate-700 text-sky-600 shadow-sm"
                                : "text-slate-500 hover:text-slate-700"
                            )}
                          >
                            {type.charAt(0) + type.slice(1).toLowerCase()}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Variants if any */}
                  {product.variants.length > 0 && (
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Options</Label>
                      <Select value={selectedVariant} onValueChange={setSelectedVariant}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select Option" />
                        </SelectTrigger>
                        <SelectContent>
                          {product.variants.map((v) => (
                            <SelectItem key={v.id} value={v.id}>
                              {v.name} {v.priceModifier > 0 ? `(+₹${v.priceModifier})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Date & Duration */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">Start Date</Label>
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="bg-slate-50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-slate-500 uppercase">Duration</Label>
                      <div className="flex items-center">
                        <Button variant="outline" size="icon" className="h-10 w-10 bg-slate-50 rounded-r-none border-r-0"
                          onClick={() => setRentalDuration(Math.max(product.minRentalPeriod, rentalDuration - 1))}
                        >-</Button>
                        <div className="h-10 flex-1 flex items-center justify-center border-y border-slate-200 bg-slate-50 font-medium">
                          {rentalDuration}
                        </div>
                        <Button variant="outline" size="icon" className="h-10 w-10 bg-slate-50 rounded-l-none border-l-0"
                          onClick={() => setRentalDuration(Math.min(product.maxRentalPeriod || 365, rentalDuration + 1))}
                        >+</Button>
                      </div>
                    </div>
                  </div>

                  {/* Total Calculation */}
                  <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="text-sm text-slate-500">Estimated Total</div>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      ₹{calculateTotal().toLocaleString()}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Button
                    size="lg"
                    className="w-full h-14 text-lg bg-sky-500 hover:bg-sky-600 rounded-xl"
                    onClick={handleAddToCartClick}
                    disabled={isPending || !startDate}
                  >
                    {isPending ? (
                      <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        Add to Cart
                        <ShoppingCart className="ml-2 h-5 w-5" />
                      </>
                    )}
                  </Button>
                  {!startDate && (
                    <p className="text-xs text-center text-red-500/80">
                      Please select a start date to continue
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Vendor Info Mini Card */}
              {product.vendor && (
                <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-100 dark:bg-slate-800/50">
                  <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-lg font-bold text-slate-500">
                    {product.vendor.companyName?.[0] || "V"}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900 dark:text-white">Fulfilled by {product.vendor.companyName || "Verified Vendor"}</p>
                    <p className="text-xs text-slate-500">Verified Partner • 98% Positive</p>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Configuration Dialog (Modal) */}
      <Dialog open={variantDialogOpen} onOpenChange={setVariantDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Select Options</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {productAttributes.map((attribute) => (
              <div key={attribute.id} className="space-y-3">
                <Label className="text-sm font-medium">{attribute.name}</Label>
                <RadioGroup
                  value={selectedAttributeValues[attribute.id] || ""}
                  onValueChange={(value) =>
                    setSelectedAttributeValues((prev) => ({ ...prev, [attribute.id]: value }))
                  }
                  className="grid grid-cols-2 gap-2"
                >
                  {attribute.values.map((attrValue) => (
                    <div key={attrValue.id} className="flex items-center space-x-2 border p-2 rounded-lg cursor-pointer hover:bg-slate-50">
                      <RadioGroupItem value={attrValue.id} id={attrValue.id} />
                      <Label htmlFor={attrValue.id} className="cursor-pointer flex-1 user-select-none">
                        {attrValue.value}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            <Button className="w-full bg-sky-500" onClick={() => {
              if (!matchingVariant && hasVariantAttributes) {
                toast.error("Please select all options");
                return;
              }
              handleAddToCart();
            }}>
              Confirm & Add
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
