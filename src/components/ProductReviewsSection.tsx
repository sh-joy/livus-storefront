'use client';

import { useState, useEffect } from "react";
import { Star, CheckCircle2, MessageSquare, Loader2, X } from "lucide-react";
import {
  fetchProductReviewsAction,
  submitProductReviewAction,
  type ProductReviewSummary,
} from "@/app/actions/reviews";

interface ProductReviewsSectionProps {
  productId: string;
  productName: string;
}

export function ProductReviewsSection({ productId, productName }: ProductReviewsSectionProps) {
  const [summary, setSummary] = useState<ProductReviewSummary>({
    reviews: [],
    averageRating: 0,
    totalReviews: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [headline, setHeadline] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState("");
  const [submitError, setSubmitError] = useState("");

  const loadReviews = async () => {
    if (!productId) return;
    setLoading(true);
    try {
      const data = await fetchProductReviewsAction(productId);
      setSummary(data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSubmitSuccess("");

    if (!name.trim()) {
      setSubmitError("Please enter your name.");
      return;
    }
    if (!comment.trim() || comment.trim().length < 5) {
      setSubmitError("Please enter a review comment of at least 5 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitProductReviewAction({
        productId,
        customerName: name.trim(),
        customerEmail: email.trim() || undefined,
        rating,
        headline: headline.trim() || undefined,
        comment: comment.trim(),
      });

      if (res.success) {
        setSubmitSuccess(res.message);
        setName("");
        setEmail("");
        setHeadline("");
        setComment("");
        setRating(5);
        setTimeout(() => {
          setIsModalOpen(false);
          setSubmitSuccess("");
        }, 3000);
      } else {
        setSubmitError(res.message);
      }
    } catch (err: any) {
      setSubmitError(err?.message || "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full px-[36px] max-md:px-[16px] pt-[80px] max-md:pt-[40px] pb-[40px] border-t border-neutral-200 font-sans">
      <div className="max-w-[1080px] mx-auto flex flex-col gap-[36px]">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-[32px] max-md:text-[26px] font-semibold text-[#1c1c1c] leading-[38px]">
              Customer Reviews
            </h2>
            <p className="text-sm text-neutral-500 mt-1 font-sans">
              Customer feedback and reviews for {productName}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-[#050505] text-white px-6 py-3 text-[15px] uppercase tracking-[0.85px] font-medium transition-opacity hover:opacity-90 cursor-pointer"
          >
            WRITE A REVIEW
          </button>
        </div>

        {/* Rating Breakdown & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 bg-[#fafafa] border border-neutral-200 p-6">
          {/* Average Rating Score */}
          <div className="flex flex-col items-center justify-center text-center p-4 border-b md:border-b-0 md:border-r border-neutral-200">
            <span className="font-serif text-[48px] font-bold text-neutral-900 leading-none">
              {summary.totalReviews > 0 ? summary.averageRating.toFixed(1) : "—"}
            </span>
            <div className="flex items-center gap-1 my-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`size-4 ${
                    star <= Math.round(summary.averageRating)
                      ? "fill-amber-400 text-amber-400"
                      : "text-neutral-300 fill-neutral-100"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-neutral-600 uppercase tracking-wider font-medium">
              {summary.totalReviews > 0
                ? `Based on ${summary.totalReviews} review${summary.totalReviews > 1 ? "s" : ""}`
                : "No reviews yet"}
            </p>
          </div>

          {/* Rating Distribution Bars */}
          <div className="flex flex-col justify-center gap-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = summary.ratingDistribution[stars as 1 | 2 | 3 | 4 | 5] || 0;
              const pct = summary.totalReviews > 0 ? (count / summary.totalReviews) * 100 : 0;
              return (
                <div key={stars} className="flex items-center gap-3 text-xs text-neutral-600">
                  <span className="w-12 text-right font-medium">{stars} Star</span>
                  <div className="flex-1 h-2 bg-neutral-200 rounded-none overflow-hidden">
                    <div
                      className="h-full bg-neutral-900 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-8 text-neutral-500 font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reviews Listing */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-neutral-400 text-sm">
            <Loader2 className="mr-2 size-4 animate-spin" />
            Loading customer reviews...
          </div>
        ) : summary.reviews.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-neutral-300 p-8 bg-neutral-50 flex flex-col items-center gap-3">
            <MessageSquare className="size-8 text-neutral-400" />
            <p className="text-base text-neutral-700 font-medium">No customer reviews yet</p>
            <p className="text-xs text-neutral-500 max-w-sm">
              Be the first to share your fit, comfort, and fabric feedback with other LIVUS shoppers.
            </p>
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="mt-2 text-xs uppercase tracking-wider underline text-neutral-900 font-semibold cursor-pointer hover:text-black"
            >
              Write the first review
            </button>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-neutral-200">
            {summary.reviews.map((rev) => (
              <div key={rev.id} className="py-6 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`size-3.5 ${
                          star <= rev.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-neutral-200 fill-neutral-100"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-neutral-400 font-mono">{rev.createdAt}</span>
                </div>

                <div className="flex items-center gap-2 mt-1">
                  <span className="font-semibold text-sm text-neutral-900">{rev.customerName}</span>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 uppercase tracking-wide font-medium flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Verified Buyer
                  </span>
                </div>

                {rev.headline && (
                  <p className="font-medium text-sm text-neutral-900 mt-0.5">{rev.headline}</p>
                )}

                <p className="text-sm text-neutral-700 leading-relaxed font-sans mt-0.5">
                  {rev.comment}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Submission Modal Dialog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-lg p-6 sm:p-8 relative flex flex-col gap-4 font-sans max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-black p-1 cursor-pointer"
            >
              <X className="size-5" />
            </button>

            <div>
              <h3 className="font-serif text-2xl font-semibold text-neutral-900">
                Write a Review
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Share your experience with {productName}
              </p>
            </div>

            {submitSuccess ? (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm text-center flex flex-col items-center gap-2">
                <CheckCircle2 className="size-6 text-emerald-600" />
                <p className="font-medium">{submitSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
                {submitError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                    {submitError}
                  </div>
                )}

                {/* Star Rating Picker */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                    Rating *
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isFilled = star <= (hoverRating || rating);
                      return (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(star)}
                          className="p-1 cursor-pointer focus:outline-none"
                        >
                          <Star
                            className={`size-6 transition-colors ${
                              isFilled
                                ? "fill-amber-400 text-amber-400"
                                : "text-neutral-300 fill-neutral-100"
                            }`}
                          />
                        </button>
                      );
                    })}
                    <span className="text-xs text-neutral-500 ml-2 font-mono">
                      {hoverRating || rating} / 5 Stars
                    </span>
                  </div>
                </div>

                {/* Name */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Shakib Al Hasan"
                    className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                {/* Email (Optional) */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                    Email Address (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com (not published publicly)"
                    className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                {/* Headline */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                    Review Headline (Optional)
                  </label>
                  <input
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Perfect drop shoulder fit & heavy fabric"
                    className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black"
                  />
                </div>

                {/* Comment */}
                <div>
                  <label className="text-xs font-semibold text-neutral-700 uppercase tracking-wider block mb-1">
                    Your Review *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="What did you like about the sizing, stitching, or fit? Any recommendations for other customers?"
                    className="w-full border border-neutral-300 p-2.5 text-sm outline-none focus:border-black resize-y"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 border border-neutral-300 text-neutral-700 text-xs uppercase tracking-wider font-medium hover:bg-neutral-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-[#050505] text-white text-xs uppercase tracking-wider font-medium hover:opacity-90 cursor-pointer flex items-center"
                  >
                    {submitting && <Loader2 className="mr-2 size-3 animate-spin" />}
                    Submit Review
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
