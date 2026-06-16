-- Schema patch for Razorpay integration
alter table orders drop column if exists cashfree_order_id;
alter table orders add column if not exists razorpay_order_id text;
alter table orders add column if not exists razorpay_payment_id text;
alter table orders add column if not exists razorpay_signature text;

create index if not exists idx_orders_razorpay_order_id on orders(razorpay_order_id);
create index if not exists idx_orders_razorpay_payment_id on orders(razorpay_payment_id);

notify pgrst, 'reload schema';
