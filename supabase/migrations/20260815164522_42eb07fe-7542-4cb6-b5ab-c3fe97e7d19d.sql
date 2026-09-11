-- Add weight and dimensions to products table
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS weight_kg numeric(10,3) DEFAULT 0,
ADD COLUMN IF NOT EXISTS height_cm numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS width_cm numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS length_cm numeric(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS variations jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS images text[] DEFAULT ARRAY[]::text[];

-- Grant permissions (though table is already granted, new columns follow)
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
