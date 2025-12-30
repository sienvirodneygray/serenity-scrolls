-- Create access_requests table for pending verifications
CREATE TABLE public.access_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  order_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.access_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a request (no auth required)
CREATE POLICY "Anyone can submit access requests"
ON public.access_requests
FOR INSERT
WITH CHECK (true);

-- Users can view their own requests by email (for status check)
CREATE POLICY "Anyone can check request status by email"
ON public.access_requests
FOR SELECT
USING (true);

-- Admins can view all requests
CREATE POLICY "Admins can view all access requests"
ON public.access_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update requests (approve/deny)
CREATE POLICY "Admins can update access requests"
ON public.access_requests
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_access_requests_updated_at
BEFORE UPDATE ON public.access_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();