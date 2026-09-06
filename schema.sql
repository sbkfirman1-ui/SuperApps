-- schema.sql
-- Copy and paste this into the Supabase SQL Editor to create the necessary tables.

-- 1. Table: transactions
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('Wedding', 'Studio')),
    "clientName" TEXT NOT NULL,
    phone TEXT,
    "productName" TEXT NOT NULL,
    "productPrice" NUMERIC NOT NULL DEFAULT 0,
    dp NUMERIC NOT NULL DEFAULT 0,
    "bookingDate" DATE,
    "dDayDate" DATE,
    waktu TEXT,
    tempat TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table: finance
CREATE TABLE IF NOT EXISTS finance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('Wedding', 'Studio')),
    tanggal DATE NOT NULL,
    jenis TEXT NOT NULL CHECK (jenis IN ('Pemasukan', 'Pengeluaran')),
    "kategoriFinance" TEXT NOT NULL,
    nominal NUMERIC NOT NULL DEFAULT 0,
    keterangan TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table: hpp_bahan_baku
CREATE TABLE IF NOT EXISTS hpp_bahan_baku (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('Wedding', 'Studio')),
    name TEXT NOT NULL,
    unit NUMERIC NOT NULL DEFAULT 0,
    price NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table: hpp_packages
CREATE TABLE IF NOT EXISTS hpp_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN ('Wedding', 'Studio')),
    name TEXT NOT NULL,
    "hargaJual" NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table: hpp_package_items (Junction Table for Package -> Bahan Baku)
CREATE TABLE IF NOT EXISTS hpp_package_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    package_id UUID NOT NULL REFERENCES hpp_packages(id) ON DELETE CASCADE,
    bahan_baku_id UUID NOT NULL REFERENCES hpp_bahan_baku(id) ON DELETE CASCADE,
    qty NUMERIC NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Optional: Enable Row Level Security (RLS) but allow public access for now (since no login yet)
-- WARNING: Only use this if you haven't set up authentication. This makes the DB fully readable/writable by anyone with the Anon Key.
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance ENABLE ROW LEVEL SECURITY;
ALTER TABLE hpp_bahan_baku ENABLE ROW LEVEL SECURITY;
ALTER TABLE hpp_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE hpp_package_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous read access on transactions" ON transactions FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on transactions" ON transactions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on transactions" ON transactions FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on transactions" ON transactions FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access on finance" ON finance FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on finance" ON finance FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on finance" ON finance FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on finance" ON finance FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access on hpp_bahan_baku" ON hpp_bahan_baku FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on hpp_bahan_baku" ON hpp_bahan_baku FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on hpp_bahan_baku" ON hpp_bahan_baku FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on hpp_bahan_baku" ON hpp_bahan_baku FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access on hpp_packages" ON hpp_packages FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on hpp_packages" ON hpp_packages FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on hpp_packages" ON hpp_packages FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on hpp_packages" ON hpp_packages FOR DELETE USING (true);

CREATE POLICY "Allow anonymous read access on hpp_package_items" ON hpp_package_items FOR SELECT USING (true);
CREATE POLICY "Allow anonymous insert access on hpp_package_items" ON hpp_package_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow anonymous update access on hpp_package_items" ON hpp_package_items FOR UPDATE USING (true);
CREATE POLICY "Allow anonymous delete access on hpp_package_items" ON hpp_package_items FOR DELETE USING (true);
