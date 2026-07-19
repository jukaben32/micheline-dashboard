-- ============================================================
-- CORRECCIÓN RLS tabla blocked_slots (auditoría Micheline)
-- ============================================================
-- PROBLEMA: al igual que business, blocked_slots tenía una política
--   blocked_write -> ALL TO anon, que permitía a CUALQUIER persona sin
--   login crear/borrar bloqueos de horarios (sabotaje de la agenda).
--
-- SOLUCIÓN: se elimina la política anon. La escritura queda cubierta por
--   blocked_slots_auth_write (authenticated con business_id = su negocio
--   OR is_super_admin), coherente con el resto de tablas de datos.
--   La lectura pública (blocked_slots_public_read) se mantiene para la
--   landing/widget.
-- ============================================================

DROP POLICY IF EXISTS "blocked_write" ON public.blocked_slots;
