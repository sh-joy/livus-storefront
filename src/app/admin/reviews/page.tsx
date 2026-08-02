'use client';

import { useState } from "react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Check, X, Star } from "lucide-react";

interface ReviewItem {
  id: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  status: "Pending" | "Approved" | "Rejected";
}

const sampleReviews: ReviewItem[] = [
  { id: "rev-1", productName: "Oakwood Long sleeve", customerName: "Fahim R.", rating: 5, comment: "Amazing race fit jersey! The bonded seams and mesh material are top tier.", status: "Pending" },
  { id: "rev-2", productName: "OWAYO - CROSS FADE", customerName: "Arif H.", rating: 4, comment: "High quality fabric and super vibrant print colors.", status: "Approved" },
];

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>(sampleReviews);

  const updateStatus = (id: string, status: "Approved" | "Rejected") => {
    setReviews(reviews.map(r => r.id === id ? { ...r, status } : r));
  };

  return (
    <div className="flex flex-col gap-6 font-sans">
      <div>
        <h2 className="text-xl font-bold tracking-tight">Product Reviews Moderation Queue</h2>
        <p className="text-xs text-muted-foreground mt-0.5">
          Approve or reject customer product reviews before they appear publicly on product detail pages.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold tracking-tight">Customer Reviews Queue ({reviews.length})</CardTitle>
          <CardDescription className="text-xs">Moderate product feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reviews.map((rev) => (
                <TableRow key={rev.id}>
                  <TableCell className="font-medium text-foreground text-xs">{rev.productName}</TableCell>
                  <TableCell className="text-xs">{rev.customerName}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-amber-500">
                      <Star className="size-3.5 fill-amber-500" />
                      <span className="font-semibold text-xs text-foreground">{rev.rating}/5</span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[300px] text-xs text-muted-foreground">{rev.comment}</TableCell>
                  <TableCell>
                    <Badge variant={rev.status === "Approved" ? "outline" : rev.status === "Rejected" ? "destructive" : "secondary"}>
                      {rev.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateStatus(rev.id, "Approved")}
                        className="text-xs text-emerald-600 hover:bg-emerald-50 h-8"
                      >
                        <Check className="size-3.5 mr-1" />
                        <span>Approve</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => updateStatus(rev.id, "Rejected")}
                        className="text-xs text-destructive hover:bg-destructive/10 h-8"
                      >
                        <X className="size-3.5 mr-1" />
                        <span>Reject</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
