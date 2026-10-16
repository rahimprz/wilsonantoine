-- A partner's total investment that the owner (Dr. Antoine) pays back out of his share of the
-- profit — e.g. everything Jinnx Book Press put into the book. Until it is repaid, his profit
-- share goes to that partner. 0 means nothing is owed.
alter table public.partners
  add column if not exists repayable numeric(12,2) not null default 0 check (repayable >= 0);

-- let the API see the new column right away
notify pgrst, 'reload schema';
