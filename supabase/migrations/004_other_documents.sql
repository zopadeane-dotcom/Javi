CREATE TABLE other_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  original_filename TEXT NOT NULL,
  detected_type TEXT,
  reason TEXT,
  file_url TEXT,
  supplier_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE other_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business members can manage other_documents"
  ON other_documents FOR ALL
  USING (business_id IN (
    SELECT business_id FROM profiles WHERE id = auth.uid()
  ));
