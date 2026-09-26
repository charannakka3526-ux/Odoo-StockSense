REVOKE ALL ON FUNCTION public.validate_receipt(uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.validate_delivery(uuid) FROM anon, PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon, PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_receipt(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_delivery(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;