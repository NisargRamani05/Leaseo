"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Package, Calendar, Eye, Filter, Truck, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getOrders, cancelOrder } from "@/actions/orders";
import { toast } from "sonner";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  rentalStartDate: Date;
  rentalEndDate: Date;
}

interface RentalOrder {
  id: string;
  orderNumber: string;
  status: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  securityDeposit: number;
  paidAmount: number;
  createdAt: Date;
  confirmedAt: Date | null;
  items: OrderItem[];
  address: {
    addressLine1: string;
    city: string;
    state: string;
  } | null;
}

const statusConfig: Record<
  string,
  { bg: string; border: string; text: string; badge: string }
> = {
  draft: {
    bg: "bg-slate-400",
    border: "border-slate-200",
    text: "text-slate-700",
    badge: "bg-slate-100 text-slate-800",
  },
  confirmed: {
    bg: "bg-sky-500",
    border: "border-sky-200",
    text: "text-sky-700",
    badge: "bg-sky-100 text-sky-800",
  },
  "in-progress": {
    bg: "bg-indigo-500",
    border: "border-indigo-200",
    text: "text-indigo-700",
    badge: "bg-indigo-100 text-indigo-800",
  },
  completed: {
    bg: "bg-green-500",
    border: "border-green-200",
    text: "text-green-700",
    badge: "bg-green-100 text-green-800",
  },
  cancelled: {
    bg: "bg-red-500",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800",
  },
};

const statusLabels: Record<string, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  "in-progress": "active",
  completed: "Completed",
  cancelled: "Cancelled",
};

export default function OrdersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [orders, setOrders] = useState<RentalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchOrders();
  }, [activeTab]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await getOrders(activeTab === "all" ? undefined : activeTab);
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewOrder = (orderId: string) => {
    router.push(`/orders/${orderId}`);
  };

  const handleCancelOrder = async (orderId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to cancel this order?")) return;

    startTransition(async () => {
      const result = await cancelOrder(orderId);
      if (result.success) {
        toast.success("Order cancelled successfully");
        fetchOrders();
      } else if ((result as { requiresRefund?: boolean }).requiresRefund) {
        try {
          const refundResponse = await fetch("/api/payment/refund", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              orderId,
              reason: "Customer requested cancellation",
            }),
          });
          const refundData = await refundResponse.json();
          if (refundData.success) {
            toast.success(
              refundData.refund
                ? `Order cancelled. Refund of ₹${refundData.refund.amount} initiated.`
                : "Order cancelled successfully",
            );
            fetchOrders();
          } else {
            toast.error(refundData.error || "Failed to process refund");
          }
        } catch (error) {
          toast.error("Failed to process refund. Please try again.");
        }
      } else {
        toast.error(result.error || "Failed to cancel order");
      }
    });
  };

  const getStatusStyle = (status: string) => {
    return statusConfig[status] || statusConfig.draft;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-[1464px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">My Orders</h1>
              <p className="text-slate-500 mt-1">Track and manage your rental history</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1464px] mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl h-auto flex-wrap">
            {["all", "confirmed", "in-progress", "completed", "cancelled"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex-1 min-w-[100px] py-2.5 rounded-lg data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white capitalize font-medium"
              >
                {tab.replace("-", " ")}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                <Package className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">No orders found</h3>
                <p className="text-slate-500 mb-6">Looks like you haven&apos;t placed any orders yet.</p>
                <Button onClick={() => router.push("/products")} size="lg" className="bg-sky-500 hover:bg-sky-600">
                  Browse Products
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {orders.map((order) => {
                  const style = getStatusStyle(order.status);
                  const firstItem = order.items[0];

                  return (
                    <Card
                      key={order.id}
                      className="group overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer"
                      onClick={() => handleViewOrder(order.id)}
                    >
                      {/* Status Strip */}
                      <div className={cn("h-1.5 w-full", style.bg)} />

                      <div className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                          <div className="flex items-center gap-4">
                            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800", style.text)}>
                              <Package className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <div className="text-lg font-bold text-slate-900 dark:text-white font-mono">{order.orderNumber}</div>
                                <div className={cn("px-2.5 py-0.5 rounded-full text-xs font-bold border capitalize", style.badge.replace("bg-", "bg-opacity-20 bg-").replace("text-", "text-").replace(" border-", " border-"))}>
                                  {statusLabels[order.status] || order.status}
                                </div>
                              </div>
                              <div className="text-sm text-slate-500">
                                Placed on {format(new Date(order.createdAt), "PPP")}
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-slate-500 mb-1">Total Amount</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">₹{order.totalAmount.toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Content */}
                        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-800 mb-6">
                          <div className="space-y-4">
                            {order.items.slice(0, 2).map((item) => (
                              <div key={item.id} className="flex gap-4 items-center">
                                <div className="h-12 w-12 bg-white rounded-lg border border-slate-200 overflow-hidden relative shadow-sm">
                                  {item.productImage ? (
                                    <img src={item.productImage} alt="" className="w-full h-full object-cover" />
                                  ) : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">N/A</div>}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-slate-900 dark:text-white line-clamp-1">{item.productName}</div>
                                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                    <span>Qty: {item.quantity}</span>
                                    <span>•</span>
                                    {item.rentalStartDate && (
                                      <span className="flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {format(new Date(item.rentalStartDate), "MMM dd")} - {format(new Date(item.rentalEndDate), "MMM dd")}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            {order.items.length > 2 && (
                              <div className="text-center text-xs text-slate-500 font-medium">
                                +{order.items.length - 2} more items...
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 text-sm text-slate-500">
                            {order.status === 'in-progress' && (
                              <>
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span>Rental Active</span>
                              </>
                            )}
                          </div>
                          <div className="flex gap-3">
                            {(order.status === "draft" || order.status === "confirmed") && (
                              <Button
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={(e) => handleCancelOrder(order.id, e)}
                                disabled={isPending}
                              >
                                Cancel Order
                              </Button>
                            )}
                            <Button variant="outline" className="border-sky-200 text-sky-600 hover:bg-sky-50 group-hover:border-sky-500 group-hover:bg-sky-500 group-hover:text-white transition-all">
                              View Details <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
