-- Evidence-only overlay for PR screenshots. Applied to mycarwash_e2e after seed.
-- Do not run against a non-_e2e database.

-- B > G > M > P on Thursday jobs at Marina Heights (Rahul).
UPDATE vehicles SET bay_no = 'B-12' WHERE plate_no = 'DXB-A-1001';
UPDATE vehicles SET bay_no = 'G-8'  WHERE plate_no = 'DXB-A-1002';
UPDATE vehicles SET bay_no = 'M-3'  WHERE plate_no = 'DXB-A-1003';
UPDATE vehicles SET bay_no = 'P-1'  WHERE plate_no = 'DXB-A-1004';

INSERT INTO vehicle_wash_schedules (vehicle_id, customer_id, week_day, version, created_by, updated_by)
SELECT v.vehicle_id, v.customer_id, 'THU', 1,
       '11111111-1111-4111-8111-111111111111',
       '11111111-1111-4111-8111-111111111111'
FROM vehicles v
WHERE v.plate_no IN ('DXB-A-1002', 'DXB-A-1003', 'DXB-A-1004')
  AND NOT EXISTS (
    SELECT 1
    FROM vehicle_wash_schedules s
    WHERE s.vehicle_id = v.vehicle_id
      AND s.week_day = 'THU'
  );

-- Omar Farooq: unpaid invoice past due so Payment History shows Overdue.
UPDATE customer_invoices
SET due_date = (CURRENT_DATE - INTERVAL '7 days')::date,
    payment_status = 'PENDING',
    paid_at = NULL
WHERE customer_id = 'c0000000-0000-4000-8000-000000000002';

-- Aisha: assigned cleaner so Home shows the contact card (ABS-127).
UPDATE customers
SET onboarding_status = 'ASSIGNED'
WHERE customer_id = 'c0000000-0000-4000-8000-000000000001';
