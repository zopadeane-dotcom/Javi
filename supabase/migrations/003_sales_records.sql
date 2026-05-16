CREATE TABLE sales_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual', -- 'sumup', 'square', 'tpv', 'efectivo', 'manual'
  total_sales NUMERIC(10,2) NOT NULL DEFAULT 0,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 10,
  vat_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  base_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE sales_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business members can manage sales_records"
  ON sales_records FOR ALL
  USING (business_id IN (
    SELECT business_id FROM profiles WHERE id = auth.uid()
  ));
