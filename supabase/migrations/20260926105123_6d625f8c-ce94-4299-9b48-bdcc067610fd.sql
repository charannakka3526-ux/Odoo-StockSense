-- ENUMS
CREATE TYPE public.app_role AS ENUM ('manager','staff');
CREATE TYPE public.doc_status AS ENUM ('draft','waiting','picking','packing','ready','done','canceled','backorder');
CREATE TYPE public.ledger_type AS ENUM ('receipt','delivery','transfer','adjustment');

-- PROFILES
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  name text NOT NULL DEFAULT '',
  email text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles readable by team" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- ROLES
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles readable by team" ON public.user_roles FOR SELECT TO authenticated USING (true);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- WAREHOUSES / LOCATIONS
CREATE TABLE public.warehouses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.warehouses TO authenticated;
GRANT ALL ON public.warehouses TO service_role;
ALTER TABLE public.warehouses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "warehouses team access" ON public.warehouses FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE CASCADE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.locations TO authenticated;
GRANT ALL ON public.locations TO service_role;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locations team access" ON public.locations FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- CATEGORIES / PRODUCTS
CREATE TABLE public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories team access" ON public.categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sku text NOT NULL UNIQUE,
  name text NOT NULL,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  unit_of_measure text NOT NULL DEFAULT 'unit',
  reorder_point integer NOT NULL DEFAULT 0,
  reorder_qty integer NOT NULL DEFAULT 0,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products team access" ON public.products FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- STOCK
CREATE TABLE public.stock_levels (
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0,
  PRIMARY KEY (product_id, location_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stock_levels TO authenticated;
GRANT ALL ON public.stock_levels TO service_role;
ALTER TABLE public.stock_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY "stock team access" ON public.stock_levels FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.stock_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  type public.ledger_type NOT NULL,
  ref_doc_id uuid,
  ref_label text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.stock_ledger TO authenticated;
GRANT ALL ON public.stock_ledger TO service_role;
ALTER TABLE public.stock_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ledger readable by team" ON public.stock_ledger FOR SELECT TO authenticated USING (true);
CREATE POLICY "ledger insert by team" ON public.stock_ledger FOR INSERT TO authenticated WITH CHECK (true);
CREATE INDEX stock_ledger_created_at_idx ON public.stock_ledger (created_at DESC);

-- RECEIPTS
CREATE TABLE public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  supplier text NOT NULL,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  status public.doc_status NOT NULL DEFAULT 'draft',
  expected_date date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipts TO authenticated;
GRANT ALL ON public.receipts TO service_role;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipts team access" ON public.receipts FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.receipt_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  receipt_id uuid NOT NULL REFERENCES public.receipts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  qty_expected integer NOT NULL DEFAULT 0,
  qty_received integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receipt_lines TO authenticated;
GRANT ALL ON public.receipt_lines TO service_role;
ALTER TABLE public.receipt_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "receipt lines team access" ON public.receipt_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- DELIVERIES
CREATE TABLE public.delivery_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  customer text NOT NULL,
  warehouse_id uuid NOT NULL REFERENCES public.warehouses(id) ON DELETE RESTRICT,
  location_id uuid NOT NULL REFERENCES public.locations(id) ON DELETE RESTRICT,
  status public.doc_status NOT NULL DEFAULT 'draft',
  scheduled_date date,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  validated_at timestamptz
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_orders TO authenticated;
GRANT ALL ON public.delivery_orders TO service_role;
ALTER TABLE public.delivery_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deliveries team access" ON public.delivery_orders FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.delivery_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES public.delivery_orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
  qty integer NOT NULL DEFAULT 0
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.delivery_lines TO authenticated;
GRANT ALL ON public.delivery_lines TO service_role;
ALTER TABLE public.delivery_lines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery lines team access" ON public.delivery_lines FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- VALIDATE RECEIPT
CREATE OR REPLACE FUNCTION public.validate_receipt(p_receipt_id uuid)
RETURNS public.doc_status
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  r public.receipts;
  l record;
  v_partial boolean := false;
  v_status public.doc_status;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO r FROM public.receipts WHERE id = p_receipt_id FOR UPDATE;
  IF r.id IS NULL THEN RAISE EXCEPTION 'Receipt not found'; END IF;
  IF r.status IN ('done','canceled') THEN RAISE EXCEPTION 'Receipt already closed'; END IF;

  FOR l IN SELECT * FROM public.receipt_lines WHERE receipt_id = p_receipt_id LOOP
    IF l.qty_received < l.qty_expected THEN v_partial := true; END IF;
    IF l.qty_received > 0 THEN
      INSERT INTO public.stock_levels (product_id, location_id, quantity)
      VALUES (l.product_id, r.location_id, l.qty_received)
      ON CONFLICT (product_id, location_id)
      DO UPDATE SET quantity = public.stock_levels.quantity + EXCLUDED.quantity;

      INSERT INTO public.stock_ledger (product_id, location_id, delta, type, ref_doc_id, ref_label, created_by)
      VALUES (l.product_id, r.location_id, l.qty_received, 'receipt', r.id, r.reference, auth.uid());
    END IF;
  END LOOP;

  v_status := CASE WHEN v_partial THEN 'backorder'::public.doc_status ELSE 'done'::public.doc_status END;
  UPDATE public.receipts SET status = v_status, validated_at = now() WHERE id = p_receipt_id;
  RETURN v_status;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_receipt(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_receipt(uuid) TO authenticated;

-- VALIDATE DELIVERY
CREATE OR REPLACE FUNCTION public.validate_delivery(p_delivery_id uuid)
RETURNS public.doc_status
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  d public.delivery_orders;
  l record;
  v_available integer;
  v_sku text;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authorized'; END IF;
  SELECT * INTO d FROM public.delivery_orders WHERE id = p_delivery_id FOR UPDATE;
  IF d.id IS NULL THEN RAISE EXCEPTION 'Delivery not found'; END IF;
  IF d.status IN ('done','canceled') THEN RAISE EXCEPTION 'Delivery already closed'; END IF;

  FOR l IN SELECT * FROM public.delivery_lines WHERE delivery_id = p_delivery_id LOOP
    SELECT quantity INTO v_available FROM public.stock_levels
      WHERE product_id = l.product_id AND location_id = d.location_id FOR UPDATE;
    SELECT sku INTO v_sku FROM public.products WHERE id = l.product_id;
    IF v_available IS NULL OR v_available < l.qty THEN
      RAISE EXCEPTION 'Insufficient stock for % (have %, need %)', v_sku, COALESCE(v_available,0), l.qty;
    END IF;
  END LOOP;

  FOR l IN SELECT * FROM public.delivery_lines WHERE delivery_id = p_delivery_id LOOP
    UPDATE public.stock_levels SET quantity = quantity - l.qty
      WHERE product_id = l.product_id AND location_id = d.location_id;
    INSERT INTO public.stock_ledger (product_id, location_id, delta, type, ref_doc_id, ref_label, created_by)
    VALUES (l.product_id, d.location_id, -l.qty, 'delivery', d.id, d.reference, auth.uid());
  END LOOP;

  UPDATE public.delivery_orders SET status = 'done', validated_at = now() WHERE id = p_delivery_id;
  RETURN 'done'::public.doc_status;
END;
$$;
REVOKE ALL ON FUNCTION public.validate_delivery(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.validate_delivery(uuid) TO authenticated;

-- SEED DATA
INSERT INTO public.warehouses (id, code, name, address) VALUES
  ('11111111-1111-1111-1111-111111111101','WH-01','Central Depot','14 Harbour Road, Chennai'),
  ('11111111-1111-1111-1111-111111111102','WH-02','North Yard','Plot 8, Industrial Estate, Pune'),
  ('11111111-1111-1111-1111-111111111103','WH-03','East Hub','Sector 21, Kolkata');

INSERT INTO public.locations (id, warehouse_id, name) VALUES
  ('22222222-2222-2222-2222-222222222201','11111111-1111-1111-1111-111111111101','Rack A'),
  ('22222222-2222-2222-2222-222222222202','11111111-1111-1111-1111-111111111101','Rack B'),
  ('22222222-2222-2222-2222-222222222203','11111111-1111-1111-1111-111111111102','Bay 1'),
  ('22222222-2222-2222-2222-222222222204','11111111-1111-1111-1111-111111111102','Bay 2'),
  ('22222222-2222-2222-2222-222222222205','11111111-1111-1111-1111-111111111103','Floor 1');

INSERT INTO public.categories (id, name) VALUES
  ('33333333-3333-3333-3333-333333333301','Fasteners'),
  ('33333333-3333-3333-3333-333333333302','Packing'),
  ('33333333-3333-3333-3333-333333333303','Labels'),
  ('33333333-3333-3333-3333-333333333304','Pallets'),
  ('33333333-3333-3333-3333-333333333305','Strapping'),
  ('33333333-3333-3333-3333-333333333306','Hardware');

INSERT INTO public.products (id, sku, name, category_id, unit_of_measure, reorder_point, reorder_qty, unit_cost) VALUES
  ('44444444-4444-4444-4444-444444444401','SKU-4471','Hex bolt M8 x 30','33333333-3333-3333-3333-333333333301','box',2000,5000,0.14),
  ('44444444-4444-4444-4444-444444444402','SKU-4488','Stretch wrap 500mm','33333333-3333-3333-3333-333333333302','roll',300,600,1.20),
  ('44444444-4444-4444-4444-444444444403','SKU-4502','Shelf bracket 200mm','33333333-3333-3333-3333-333333333306','unit',400,800,3.45),
  ('44444444-4444-4444-4444-444444444404','SKU-4519','Thermal label 4x6','33333333-3333-3333-3333-333333333303','pack',1000,2500,0.06),
  ('44444444-4444-4444-4444-444444444405','SKU-4530','Wing nut M6','33333333-3333-3333-3333-333333333301','box',250,500,0.42),
  ('44444444-4444-4444-4444-444444444406','SKU-2093','Euro pallet 1200x800','33333333-3333-3333-3333-333333333304','unit',120,250,18.50),
  ('44444444-4444-4444-4444-444444444407','SKU-5527','Steel strap 15mm','33333333-3333-3333-3333-333333333305','coil',150,400,0.41),
  ('44444444-4444-4444-4444-444444444408','SKU-8810','Barcode label roll','33333333-3333-3333-3333-333333333303','roll',500,1000,0.02),
  ('44444444-4444-4444-4444-444444444409','SKU-3306','Carton 400x300x300','33333333-3333-3333-3333-333333333302','unit',800,2000,0.09),
  ('44444444-4444-4444-4444-444444444410','SKU-6148','Washer M8 zinc','33333333-3333-3333-3333-333333333301','box',400,900,0.22),
  ('44444444-4444-4444-4444-444444444411','SKU-7120','Corner protector','33333333-3333-3333-3333-333333333302','pack',600,1200,0.11),
  ('44444444-4444-4444-4444-444444444412','SKU-7233','Plastic pallet heavy','33333333-3333-3333-3333-333333333304','unit',60,120,26.00),
  ('44444444-4444-4444-4444-444444444413','SKU-8401','Cable tie 300mm','33333333-3333-3333-3333-333333333306','pack',700,1500,0.03),
  ('44444444-4444-4444-4444-444444444414','SKU-9002','Strapping buckle','33333333-3333-3333-3333-333333333305','box',350,700,0.08);

INSERT INTO public.stock_levels (product_id, location_id, quantity) VALUES
  ('44444444-4444-4444-4444-444444444401','22222222-2222-2222-2222-222222222201',12480),
  ('44444444-4444-4444-4444-444444444402','22222222-2222-2222-2222-222222222201',180),
  ('44444444-4444-4444-4444-444444444403','22222222-2222-2222-2222-222222222202',860),
  ('44444444-4444-4444-4444-444444444404','22222222-2222-2222-2222-222222222201',2900),
  ('44444444-4444-4444-4444-444444444405','22222222-2222-2222-2222-222222222202',0),
  ('44444444-4444-4444-4444-444444444406','22222222-2222-2222-2222-222222222203',340),
  ('44444444-4444-4444-4444-444444444407','22222222-2222-2222-2222-222222222203',8900),
  ('44444444-4444-4444-4444-444444444408','22222222-2222-2222-2222-222222222204',0),
  ('44444444-4444-4444-4444-444444444409','22222222-2222-2222-2222-222222222201',2150),
  ('44444444-4444-4444-4444-444444444410','22222222-2222-2222-2222-222222222202',96),
  ('44444444-4444-4444-4444-444444444411','22222222-2222-2222-2222-222222222205',1450),
  ('44444444-4444-4444-4444-444444444412','22222222-2222-2222-2222-222222222205',42),
  ('44444444-4444-4444-4444-444444444413','22222222-2222-2222-2222-222222222204',3100),
  ('44444444-4444-4444-4444-444444444414','22222222-2222-2222-2222-222222222203',290);

INSERT INTO public.receipts (id, reference, supplier, warehouse_id, location_id, status, expected_date) VALUES
  ('55555555-5555-5555-5555-555555555501','RC-20431','Northline Fasteners','11111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222201','waiting', CURRENT_DATE),
  ('55555555-5555-5555-5555-555555555502','RC-20432','Meridian Packaging','11111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222202','draft', CURRENT_DATE + 2),
  ('55555555-5555-5555-5555-555555555503','RC-20433','Sunrise Pallets','11111111-1111-1111-1111-111111111102','22222222-2222-2222-2222-222222222203','ready', CURRENT_DATE + 1);

INSERT INTO public.receipt_lines (receipt_id, product_id, qty_expected, qty_received) VALUES
  ('55555555-5555-5555-5555-555555555501','44444444-4444-4444-4444-444444444401',1000,1000),
  ('55555555-5555-5555-5555-555555555501','44444444-4444-4444-4444-444444444405',400,240),
  ('55555555-5555-5555-5555-555555555501','44444444-4444-4444-4444-444444444410',600,600),
  ('55555555-5555-5555-5555-555555555502','44444444-4444-4444-4444-444444444402',500,0),
  ('55555555-5555-5555-5555-555555555502','44444444-4444-4444-4444-444444444409',1200,0),
  ('55555555-5555-5555-5555-555555555503','44444444-4444-4444-4444-444444444406',200,200),
  ('55555555-5555-5555-5555-555555555503','44444444-4444-4444-4444-444444444414',700,700);

INSERT INTO public.delivery_orders (id, reference, customer, warehouse_id, location_id, status, scheduled_date) VALUES
  ('66666666-6666-6666-6666-666666666601','DO-10871','Arclight Interiors','11111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222201','picking', CURRENT_DATE),
  ('66666666-6666-6666-6666-666666666602','DO-10872','Vertex Builders','11111111-1111-1111-1111-111111111101','22222222-2222-2222-2222-222222222202','ready', CURRENT_DATE + 1),
  ('66666666-6666-6666-6666-666666666603','DO-10873','Harbour Logistics','11111111-1111-1111-1111-111111111102','22222222-2222-2222-2222-222222222203','draft', CURRENT_DATE + 3);

INSERT INTO public.delivery_lines (delivery_id, product_id, qty) VALUES
  ('66666666-6666-6666-6666-666666666601','44444444-4444-4444-4444-444444444401',500),
  ('66666666-6666-6666-6666-666666666601','44444444-4444-4444-4444-444444444404',300),
  ('66666666-6666-6666-6666-666666666602','44444444-4444-4444-4444-444444444403',120),
  ('66666666-6666-6666-6666-666666666603','44444444-4444-4444-4444-444444444407',900),
  ('66666666-6666-6666-6666-666666666603','44444444-4444-4444-4444-444444444406',60);

INSERT INTO public.stock_ledger (product_id, location_id, delta, type, ref_label, created_at) VALUES
  ('44444444-4444-4444-4444-444444444401','22222222-2222-2222-2222-222222222201',12480,'receipt','RC-20390', now() - interval '6 days'),
  ('44444444-4444-4444-4444-444444444404','22222222-2222-2222-2222-222222222201',3200,'receipt','RC-20395', now() - interval '5 days'),
  ('44444444-4444-4444-4444-444444444404','22222222-2222-2222-2222-222222222201',-300,'delivery','DO-10820', now() - interval '3 days'),
  ('44444444-4444-4444-4444-444444444407','22222222-2222-2222-2222-222222222203',8900,'receipt','RC-20401', now() - interval '3 days'),
  ('44444444-4444-4444-4444-444444444403','22222222-2222-2222-2222-222222222202',860,'receipt','RC-20410', now() - interval '2 days'),
  ('44444444-4444-4444-4444-444444444405','22222222-2222-2222-2222-222222222202',-120,'delivery','DO-10845', now() - interval '1 day'),
  ('44444444-4444-4444-4444-444444444410','22222222-2222-2222-2222-222222222202',-64,'adjustment','ADJ-0031', now() - interval '8 hours');