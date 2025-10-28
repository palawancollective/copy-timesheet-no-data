-- Create task templates table for daily tasks
CREATE TABLE IF NOT EXISTS public.task_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  time_slot text NOT NULL,
  task_description text NOT NULL,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.task_templates ENABLE ROW LEVEL SECURITY;

-- Allow public to view active templates
CREATE POLICY "Public can view active task templates"
  ON public.task_templates
  FOR SELECT
  USING (is_active = true);

-- Only authenticated users can manage templates
CREATE POLICY "Authenticated users can manage task templates"
  ON public.task_templates
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Insert default task templates from the PDF
INSERT INTO public.task_templates (time_slot, task_description, order_index) VALUES
('7:00 AM', 'Follow call and put in order for jeepney/charity for order in Abongan and Tay2 (Binga/PPC)', 1),
('7:00 AM', 'ALWAYS WIPE SINKs first. Clean CR, showers, sinks, turn off all lights in CR and mangrove and bridge', 2),
('7:30 AM', 'Rake beach and clean tax dec, pick up plastic, take trash to MRF', 3),
('7:30 AM', 'MAKE RICE AND FEED THE DOGS, make hot water for coffee', 4),
('7:30 AM', 'Check water tank level and solar, fill water if solar is charged, or wait til 10am when battery is charged', 5),
('7:30 AM', 'Set up coffee, hot tea and water station for guest', 6),
('7:30 AM', 'Clean kitchen, tables, sweep deck, bridge, pwd ramp', 7),
('8:00 AM', 'Check all septics, water pressure, toilet closet', 8),
('8:00 AM', 'Check Inventory for kitchen and bar. Check inventory of coconuts, meat, seafood, supplies, gasul tank', 9),
('8:00 AM', 'Sweep all units, decks and CR in G1,2,3 and sweep the deck and the bridge', 10),
('8:00 AM', 'Check level of chairs and tables are level, seat cushions cleaned', 11),
('8:00 AM', 'Prep for breakfast, check inventory, rotate vegetables & fruit & coconut', 12),
('8:30 AM', 'Clean MRF, clean car port, walk the property pick up trash (plastic)', 13),
('9:00 AM', 'Laundry, clean outside sink area, clean washing machine area', 14),
('9:00 AM', 'Clean refrigerator and ice box. Make ice if it wasn''t done the night before. Ice down beer if we have guest', 15),
('9:00 AM', 'Clean all bed sheets, pillows cases and cleaning towels', 16),
('9:00 AM', 'Call/and text for seafood order and follow up for delivery', 17),
('9:00 AM', 'Sweep bridge and mangrove bridge, sweep G1,2,3 decks', 18),
('10:00 AM', 'When guest are done with breakfast and left the deck, clean out grease trap every Monday & Friday', 19),
('10:00 AM', 'Check all drinking water jugs, fill water bottles, check inventory for bar (beer, garnish, liquor)', 20),
('10:30 AM', 'Wipe down kitchen tables, sweep and make sure there are full water bottles in refrigerator', 21),
('11:00 AM', 'Prep for lunch', 22),
('11:15 AM', 'Wipe down sinks and CR, empty trash cans', 23),
('1:00 PM', 'Rake Bermuda grass by G1,G2,G3 / landscaping', 24),
('1:30 PM', 'After lunch clean all tables, chairs, and bar tops. Clean in between cracks of tables and chairs', 25),
('1:45 PM', 'Deep clean kitchen and wipe down all water bottles', 26),
('2:00 PM', 'Clean by outside sink area & check septic if overflow', 27),
('2:00 PM', 'Check beach front for trash / landscaping', 28),
('3:00 PM', 'Wipe down kitchen walls and clean stove top and check for drinking water supply to order', 29),
('3:00 PM', 'Check Inventory for kitchen and bar. Check inventory of coconuts, meat, seafood, supplies, gasul tank', 30),
('3:00 PM', 'Put ice on beer in cooler, check inventory on liquor and fruit plus coffee', 31),
('4:00 PM', 'Prep for dinner and set up bar', 32),
('4:00 PM', 'Clean CR, showers, sinks, take trash from CR and sinks, refresh with toilet paper', 33),
('5:00 PM', 'FEED THE DOGS', 34),
('5:00 PM', 'Take trash out to MRF', 35);