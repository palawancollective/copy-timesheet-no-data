-- Create table to store notes describing what a payment is for
CREATE TABLE public.payment_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  time_entry_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Foreign keys for data integrity
ALTER TABLE public.payment_notes
  ADD CONSTRAINT payment_notes_time_entry_fk
  FOREIGN KEY (time_entry_id)
  REFERENCES public.time_entries(id)
  ON DELETE CASCADE;

ALTER TABLE public.payment_notes
  ADD CONSTRAINT payment_notes_employee_fk
  FOREIGN KEY (employee_id)
  REFERENCES public.employees(id)
  ON DELETE CASCADE;

-- Enable Row Level Security and permissive policy (aligned with current setup)
ALTER TABLE public.payment_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on payment_notes"
ON public.payment_notes
FOR ALL
USING (true)
WITH CHECK (true);

-- Keep updated_at fresh on updates
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_payment_notes_updated_at
BEFORE UPDATE ON public.payment_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Helpful indexes
CREATE INDEX idx_payment_notes_time_entry_id ON public.payment_notes (time_entry_id);
CREATE INDEX idx_payment_notes_employee_id ON public.payment_notes (employee_id);