# Lighthouse Post-Optimization Performance (Mobile Preset)

**Date:** 12 November 2026
**Environment:** Vercel Preview (https://my-store-git-claude-first-change-shamimhossein70-3034s-projects.vercel.app)
**Git Commit:** 5824e4d (Branch: `claude-first-change`)
**Methodology:** 3 mobile runs per route, DevTools throttling, median selected.

## Median Results Summary

| Route | Performance | LCP (s) | CLS | TBT (ms) | Transfer (KB) | Accessibility | Best Practices | SEO |
|---|---|---|---|---|---|---|---|---|
| **Homepage (/)** | 89 | 2.94s | 0.0005 | 9ms | 550 KB | 95 | 100 | 61 |
| **Category (/for-him)** | 79 | 4.36s | 0.0005 | 8ms | 698 KB | 95 | 100 | 61 |
| **Product (/product/grey-textured-crepe-two-piece)** | 83 | 3.59s | 0.0007 | 47ms | 640 KB | 95 | 100 | 61 |
| **Checkout (/checkout)** | 90 | 2.98s | 0.0005 | 19ms | 659 KB | 100 | 100 | 58 |

## Raw Run Details

### Homepage (/)

| Run | Perf | LCP (s) | CLS | TBT (ms) | Transfer (KB) | A11y | Best Practices | SEO |
|---|---|---|---|---|---|---|---|---|
| 1 | 83 | 3.46s | 0.0005 | 9ms | 550 KB | 95 | 100 | 61 |
| 2 | 89 | 2.93s | 0.0005 | 9ms | 550 KB | 95 | 100 | 61 |
| 3 | 89 | 2.94s | 0.0005 | 9ms | 550 KB | 95 | 100 | 61 |

### Category (/for-him)

| Run | Perf | LCP (s) | CLS | TBT (ms) | Transfer (KB) | A11y | Best Practices | SEO |
|---|---|---|---|---|---|---|---|---|
| 1 | 79 | 4.37s | 0.0005 | 10ms | 698 KB | 95 | 100 | 61 |
| 2 | 85 | 3.60s | 0.0005 | 7ms | 698 KB | 95 | 100 | 61 |
| 3 | 78 | 4.36s | 0.0005 | 8ms | 698 KB | 95 | 100 | 61 |

### Product (/product/grey-textured-crepe-two-piece)

| Run | Perf | LCP (s) | CLS | TBT (ms) | Transfer (KB) | A11y | Best Practices | SEO |
|---|---|---|---|---|---|---|---|---|
| 1 | 83 | 3.74s | 0.0007 | 44ms | 640 KB | 95 | 100 | 61 |
| 2 | 84 | 3.59s | 0.0007 | 47ms | 640 KB | 95 | 100 | 61 |
| 3 | 83 | 3.56s | 0.0005 | 48ms | 640 KB | 95 | 100 | 61 |

### Checkout (/checkout)

| Run | Perf | LCP (s) | CLS | TBT (ms) | Transfer (KB) | A11y | Best Practices | SEO |
|---|---|---|---|---|---|---|---|---|
| 1 | 90 | 2.98s | 0.0005 | 16ms | 659 KB | 100 | 100 | 58 |
| 2 | 90 | 2.96s | 0.0005 | 19ms | 659 KB | 100 | 100 | 58 |
| 3 | 90 | 2.98s | 0.0005 | 22ms | 659 KB | 100 | 100 | 58 |

