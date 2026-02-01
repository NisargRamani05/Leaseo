"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  ChevronRight,
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Building2,
  ArrowRight,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  getCustomerQuotations,
  rejectQuotation,
  CustomerQuotation,
} from "@/actions/orders";
import { toast } from "sonner";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { cn } from "@/lib/utils";

const statusConfig: Record<
  string,
  { bg: string; border: string; text: string; badge: string; icon: any }
> = {
  SENT: {
    bg: "bg-blue-500",
    border: "border-blue-200",
    text: "text-blue-700",
    badge: "bg-blue-100 text-blue-800 border-blue-200",
    icon: FileText,
  },
  CONFIRMED: {
    bg: "bg-green-500",
    border: "border-green-200",
    text: "text-green-700",
    badge: "bg-green-100 text-green-800 border-green-200",
    icon: CheckCircle,
  },
  CANCELLED: {
    bg: "bg-red-500",
    border: "border-red-200",
    text: "text-red-700",
    badge: "bg-red-100 text-red-800 border-red-200",
    icon: XCircle,
  },
  EXPIRED: {
    bg: "bg-slate-500",
    border: "border-slate-200",
    text: "text-slate-700",
    badge: "bg-slate-100 text-slate-800 border-slate-200",
    icon: Clock,
  },
};

const statusLabels: Record<string, string> = {
  SENT: "Pending Review",
  CONFIRMED: "Accepted",
  CANCELLED: "Rejected",
  EXPIRED: "Expired",
};

export default function QuotationsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [quotations, setQuotations] = useState<CustomerQuotation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    fetchQuotations();
  }, [activeTab]);

  const fetchQuotations = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomerQuotations(
        activeTab === "all" ? undefined : activeTab,
      );
      setQuotations(data);
    } catch (error) {
      console.error("Error fetching quotations:", error);
      toast.error("Failed to load quotations");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptAndPay = (quotationId: string) => {
    router.push(`/quotations/payment?id=${quotationId}`);
  };

  const handleReject = async (quotationId: string) => {
    startTransition(async () => {
      const result = await rejectQuotation(quotationId);
      if (result.success) {
        toast.success("Quotation rejected");
        fetchQuotations();
      } else {
        toast.error(result.error || "Failed to reject quotation");
      }
    });
  };

  const getStatusCounts = () => {
    const counts = {
      all: quotations.length,
      SENT: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
      EXPIRED: 0,
    };
    quotations.forEach((q) => {
      if (counts[q.status as keyof typeof counts] !== undefined) {
        counts[q.status as keyof typeof counts]++;
      }
    });
    return counts;
  };

  const counts = getStatusCounts();

  const filteredQuotations =
    activeTab === "all"
      ? quotations
      : quotations.filter((q) => q.status === activeTab);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans pb-20">
      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30">
        <div className="max-w-[1464px] mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Quotations</h1>
              <p className="text-slate-500 dark:text-slate-400 mt-1">
                Manage proposals and estimates from vendors
              </p>
            </div>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1464px] mx-auto px-6 py-8">

        {/* Custom Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          <TabsList className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-xl h-auto flex-wrap">
            {["all", "SENT", "CONFIRMED", "CANCELLED", "EXPIRED"].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="flex-1 min-w-[100px] py-2.5 rounded-lg data-[state=active]:bg-slate-100 dark:data-[state=active]:bg-slate-800 data-[state=active]:text-slate-900 dark:data-[state=active]:text-white font-medium"
              >
                {tab === "all" ? "All" : statusLabels[tab]}
                <span className="ml-2 text-xs opacity-60 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded-full">
                  {tab === "all" ? counts.all : counts[tab as keyof typeof counts]}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="h-8 w-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filteredQuotations.length === 0 ? (
              <div className="text-center py-24 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 border-dashed">
                <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white">No quotations found</h3>
                <p className="text-slate-500 mt-2">Check back later or browse products to request quotes.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {filteredQuotations.map((quotation) => {
                  const config = statusConfig[quotation.status] || statusConfig.SENT;
                  const StatusIcon = config.icon;
                  const isExpired = isPast(new Date(quotation.validUntil));
                  const canTakeAction = quotation.status === "SENT" && !isExpired;

                  return (
                    <Card key={quotation.id} className="group overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-xl hover:border-sky-200 transition-all duration-300">
                      {/* Status Strip */}
                      <div className={cn("h-1.5 w-full", config.bg)} />

                      <div className="p-6">
                        {/* Header */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                          <div className="flex items-start gap-4">
                            <div className={cn("h-12 w-12 rounded-xl flex items-center justify-center shrink-0 bg-slate-50", config.text.replace("text-", "bg-opacity-10 bg-"))}>
                              <StatusIcon className="h-6 w-6" />
                            </div>
                            <div>
                              <div className="flex items-center gap-3 mb-1">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-mono">
                                  {quotation.quotationNumber}
                                </h3>
                                <Badge variant="secondary" className={cn("rounded-md border", config.badge)}>
                                  {statusLabels[quotation.status]}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500">
                                Received on {format(new Date(quotation.createdAt), "PPP")}
                              </p>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-sm text-slate-500 mb-1">Total Amount</div>
                            <div className="text-2xl font-bold text-slate-900 dark:text-white">
                              ₹{quotation.totalAmount.toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 mb-6 border border-slate-100 dark:border-slate-800">
                          {/* Vendor */}
                          <div className="md:col-span-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                              {quotation.vendor.companyName?.[0] || "V"}
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 font-semibold uppercase">Vendor</div>
                              <div className="font-medium">{quotation.vendor.companyName || "Service Provider"}</div>
                            </div>
                          </div>

                          {/* Expiry */}
                          <div className="md:col-span-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                              <Clock className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 font-semibold uppercase">Validity</div>
                              <div className={cn("font-medium", isExpired ? "text-red-600" : "")}>
                                {isExpired ? "Expired" : formatDistanceToNow(new Date(quotation.validUntil), { addSuffix: true })}
                              </div>
                            </div>
                          </div>

                          {/* Items Count */}
                          <div className="md:col-span-4 flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600">
                              <Package className="h-5 w-5" />
                            </div>
                            <div>
                              <div className="text-xs text-slate-500 font-semibold uppercase">Items</div>
                              <div className="font-medium">{quotation.items.length} Product(s) Included</div>
                            </div>
                          </div>
                        </div>

                        {/* Items Preview */}
                        <div className="space-y-4">
                          {quotation.items.slice(0, 2).map((item) => (
                            <div key={item.id} className="flex items-center gap-4 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors rounded-lg px-2">
                              <div className="h-12 w-12 rounded-lg bg-slate-100 relative overflow-hidden shrink-0">
                                {item.productImage && <Image src={item.productImage} alt="" fill className="object-cover" />}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium text-slate-900">{item.productName}</div>
                                <div className="text-xs text-slate-500">Qty: {item.quantity} × ₹{item.unitPrice}</div>
                              </div>
                              <div className="font-semibold text-slate-900">₹{item.totalPrice.toLocaleString()}</div>
                            </div>
                          ))}
                          {quotation.items.length > 2 && (
                            <div className="text-center text-xs text-slate-500 pt-2">
                              +{quotation.items.length - 2} more items in this quotation
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        {canTakeAction && (
                          <div className="mt-8 flex gap-3 pt-6 border-t border-slate-100">
                            <Button className="flex-1 bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-500/20" onClick={() => handleAcceptAndPay(quotation.id)}>
                              Accept Proposal <CheckCircle className="ml-2 h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" className="flex-1 border-slate-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200">
                                  Decline <XCircle className="ml-2 h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Reject Quotation?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will notify the vendor that you have declined their proposal. This action cannot be reversed.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleReject(quotation.id)} className="bg-red-600 hover:bg-red-700">
                                    Reject Quotation
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        )}
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
