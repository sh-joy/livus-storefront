'use client';

import { useState, useEffect } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Check, X, Star, Trash2, Loader2, MessageSquare } from "lucide-react";
import {
  fetchAdminReviewsAction,
  updateAdminReviewStatusAction,
  deleteAdminReviewAction,
  type ProductReviewItem,
} from "@/app/actions/reviews";

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ProductReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<"All" | "Pending" | "Approved" | "Rejected">("All");

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await fetchAdminReviewsAction();
      setReviews(data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: "Approved" | "Rejected") => {
    try {
      setReviews(reviews.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      await updateAdminReviewStatusAction(id, newStatus);
    } catch (err) {
      console.error("Failed to update review status:", err);
      loadReviews();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this customer review?")) return;
    try {
      setReviews(reviews.filter((r) => r.id !== id));
      await deleteAdminReviewAction(id);
    } catch (err) {
      console.error("Failed to delete review:", err);
      loadReviews();
    }
  };

  const filteredReviews = reviews.filter((r) => {
    if (activeFilter === "All") return true;
    return r.status === activeFilter;
  });

  const pendingCount = reviews.filter((r) => r.status === "Pending").length;

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight">Product Reviews Moderation Queue</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review, approve, or reject customer product ratings before they appear on live product pages.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {(["All", "Pending", "Approved", "Rejected"] as const).map((tab) => (
            <Button
              key={tab}
              variant={activeFilter === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveFilter(tab)}
              className="text-xs h-8"
            >
              <span>{tab}</span>
              {tab === "Pending" && pendingCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                  {pendingCount}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">
            Customer Reviews ({filteredReviews.length})
          </CardTitle>
          <CardDescription className="text-xs">
            {pendingCount > 0
              ? `${pendingCount} review${pendingCount > 1 ? "s" : ""} awaiting admin approval`
              : "All customer reviews are up to date"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              <Loader2 className="mr-2 size-4 animate-spin" />
              Loading reviews from database...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground text-sm flex flex-col items-center gap-2">
              <MessageSquare className="size-8 text-neutral-300" />
              <span>No {activeFilter !== "All" ? activeFilter.toLowerCase() : ""} customer reviews found.</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Headline &amp; Comment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map((rev) => (
                  <TableRow key={rev.id}>
                    <TableCell className="font-medium text-foreground text-xs whitespace-nowrap">
                      {rev.productName}
                    </TableCell>
                    <TableCell className="text-xs whitespace-nowrap">
                      <div>
                        <p className="font-semibold">{rev.customerName}</p>
                        {rev.customerEmail && (
                          <p className="text-[11px] text-muted-foreground">{rev.customerEmail}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-amber-500">
                        <Star className="size-3.5 fill-amber-500" />
                        <span className="font-semibold text-xs text-foreground">{rev.rating}/5</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[340px] text-xs">
                      {rev.headline && (
                        <p className="font-semibold text-foreground mb-0.5">{rev.headline}</p>
                      )}
                      <p className="text-muted-foreground line-clamp-2">{rev.comment}</p>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {rev.createdAt}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          rev.status === "Approved"
                            ? "outline"
                            : rev.status === "Rejected"
                            ? "destructive"
                            : "secondary"
                        }
                        className={
                          rev.status === "Approved"
                            ? "text-emerald-700 bg-emerald-50 border-emerald-300"
                            : rev.status === "Pending"
                            ? "text-amber-700 bg-amber-50 border-amber-300"
                            : ""
                        }
                      >
                        {rev.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {rev.status !== "Approved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUpdateStatus(rev.id, "Approved")}
                            className="text-xs text-emerald-600 hover:bg-emerald-50 h-7 px-2"
                            title="Approve review"
                          >
                            <Check className="size-3.5 mr-1" />
                            <span>Approve</span>
                          </Button>
                        )}
                        {rev.status !== "Rejected" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleUpdateStatus(rev.id, "Rejected")}
                            className="text-xs text-neutral-600 hover:bg-neutral-100 h-7 px-2"
                            title="Reject review"
                          >
                            <X className="size-3.5 mr-1" />
                            <span>Reject</span>
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(rev.id)}
                          className="size-7 text-destructive hover:bg-destructive/10"
                          title="Delete permanently"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
