-- Demo buses around Kozhikode so the rider map has something to show before
-- real owners join. They are flagged is_demo and shown with a "Demo" badge.
-- Remove them with: delete from fb_owners where is_demo;

do $$
declare v_owner uuid;
begin
  if exists (select 1 from fb_owners where is_demo) then
    return;
  end if;

  insert into fb_owners (name, company, phone, city, is_demo)
  values ('Findbus Demo', 'Demo Travels', '0000000000', 'Kozhikode', true)
  returning id into v_owner;

  insert into fb_buses (owner_id, reg_no, name, route_name, stops, is_demo,
                        demo_from_lat, demo_from_lng, demo_to_lat, demo_to_lng)
  values
    (v_owner, 'KL-11-AB-1234', 'Sreeram', 'Kozhikode - Kannur',
     array['Kozhikode', 'Koyilandy', 'Vadakara', 'Mahe', 'Thalassery', 'Kannur'], true,
     11.2588, 75.7804, 11.8745, 75.3704),
    (v_owner, 'KL-10-CD-5678', 'Malabar Express', 'Kozhikode - Malappuram',
     array['Kozhikode', 'Feroke', 'Ramanattukara', 'Kondotty', 'Malappuram'], true,
     11.2588, 75.7804, 11.0510, 76.0711),
    (v_owner, 'KL-57-EF-9012', 'Hill Queen', 'Kozhikode - Thamarassery',
     array['Kozhikode', 'Medical College', 'Kunnamangalam', 'Koduvally', 'Thamarassery'], true,
     11.2588, 75.7804, 11.4146, 75.9356),
    (v_owner, 'KL-11-GH-3456', 'City Link', 'Palayam - Medical College',
     array['Palayam', 'Mavoor Road', 'Arayidathupalam', 'Medical College'], true,
     11.2480, 75.7840, 11.2721, 75.8366);
end $$;
