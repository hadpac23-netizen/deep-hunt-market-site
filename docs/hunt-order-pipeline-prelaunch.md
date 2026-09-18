# HUNT order pipeline — prelaunch verification

This branch keeps real-money checkout and real supplier fulfillment disabled.

Verified prelaunch path:
1. Recheck product, variant, stock, shipping and HUNT retail pricing.
2. Collect a shipping snapshot in checkout.
3. Create a prelaunch payment session without charging.
4. Validate the order pipeline in dry-run mode.
5. Restrict supplier sandbox execution to admin-only access.
6. Keep the real supplier-order kill switch disabled.
7. Verify PayPlus callbacks server-to-server before any future paid-state transition.

Launch rule: do not enable real payment or real supplier order creation until sandbox E2E evidence passes and the owner explicitly approves launch.
