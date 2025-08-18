-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  ip_address VARCHAR(45),
  user_agent TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_forms_slug ON forms(slug);
CREATE INDEX IF NOT EXISTS idx_forms_active ON forms(is_active);
CREATE INDEX IF NOT EXISTS idx_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON form_submissions(submitted_at);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_forms_updated_at 
    BEFORE UPDATE ON forms 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
