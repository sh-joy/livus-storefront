# Lighthouse Baseline Performance (Mobile Preset)

**Date:** 11 November 2026
**Environment:** Vercel Preview (https://my-store-git-claude-first-change-shamimhossein70-3034s-projects.vercel.app)
**Git Commit:** e5dfb5a (Branch: `claude-first-change`)
**Methodology:** 3 mobile runs per route, DevTools throttling, median selected.
**Note on Placeholder Images:** Raw images currently load from `cdn.gentlepark.com` without optimization. Agent P1 will route through `next/image`.

## Median Results Summary

| Route | Performance | LCP (s) | CLS | TBT (ms) | Transfer (KB) | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|---|---|---|
| **Homepage (/)** | 86 | 3.23s | 0.0061 | 28ms | 578 KB | 95 | 96 | 61 |
| **Category (/for-him)** | 77 | 4.44s | 0.0079 | 26ms | 730 KB | 95 | 96 | 61 |
| **Product (/product/grey-textured-crepe-two-piece)** | 77 | 4.11s | 0.0030 | 49ms | 804 KB | 95 | 96 | 61 |
| **Checkout (/checkout)** | 86 | 3.38s | 0.0011 | 20ms | 698 KB | 100 | 96 | 58 |

## Raw Run Details

### Homepage (/)

| Run | Perf | LCP (s) | CLS | TBT (ms) | Transfer (KB) | A11y | Best Practices | SEO |
|---|---|---|---|---|---|---|---|---|
| Run 1 | 86 | 3.23s | 0.0061 | 28ms | 578 KB | 95 | 96 | 61 |
| Run 2 | 86 | 3.21s | 0.0061 | 36ms | 578 KB | 95 | 96 | 61 |
| Run 3 | 85 | 3.29s | 0.0061 | 28ms | 578 KB | 95 | 96 | 61 |
| **Median** | **86** | **3.23s** | **0.0061** | **28ms** | **578 KB** | **95** | **96** | **61** |

### Category (/for-him)

| Run | Perf | LCP (s) | CLS | TBT (ms) | Transfer (KB) | A11y | Best Practices | SEO |
|---|---|---|---|---|---|---|---|---|
| Run 1 | 75 | 4.64s | 0.0079 | 31ms | 730 KB | 95 | 96 | 61 |
| Run 2 | 77 | 4.44s | 0.0079 | 26ms | 730 KB | 95 | 96 | 61 |
| Run 3 | 82 | 3.78s | 0.0021 | 24ms | 730 KB | 95 | 96 | 61 |
| **Median** | **77** | **4.44s** | **0.0079** | **26ms** | **730 KB** | **95** | **96** | **61** |

### Product (/product/grey-textured-crepe-two-piece)

| Run | Perf | LCP (s) | CLS | TBT (ms) | Transfer (KB) | A11y | Best Practices | SEO |
|---|---|---|---|---|---|---|---|---|
| Run 1 | 77 | 4.11s | 0.0030 | 57ms | 804 KB | 95 | 96 | 61 |
| Run 2 | 78 | 3.95s | 0.0030 | 49ms | 804 KB | 95 | 96 | 61 |
| Run 3 | 75 | 4.29s | 0.0030 | 49ms | 804 KB | 95 | 96 | 61 |
| **Median** | **77** | **4.11s** | **0.0030** | **49ms** | **804 KB** | **95** | **96** | **61** |

### Checkout (/checkout)

| Run | Perf | LCP (s) | CLS | TBT (ms) | Transfer (KB) | A11y | Best Practices | SEO |
|---|---|---|---|---|---|---|---|---|
| Run 1 | 86 | 3.38s | 0.0011 | 20ms | 698 KB | 100 | 96 | 58 |
| Run 2 | 86 | 3.37s | 0.0011 | 16ms | 698 KB | 100 | 96 | 58 |
| Run 3 | 86 | 3.38s | 0.0011 | 20ms | 698 KB | 100 | 96 | 58 |
| **Median** | **86** | **3.38s** | **0.0011** | **20ms** | **698 KB** | **100** | **96** | **58** |

