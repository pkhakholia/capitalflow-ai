-- Investor signup schema upgrade
-- Date: 2026-04-06

alter table public.investors
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists investor_type text,
  add column if not exists role text;

do $$
declare
  sector_udt text;
begin
  select c.udt_name
    into sector_udt
  from information_schema.columns c
  where c.table_schema = 'public'
    and c.table_name = 'investors'
    and c.column_name = 'sector_focus'
  limit 1;

  if sector_udt is null then
    alter table public.investors
      add column sector_focus text[] not null default '{}'::text[];
  elsif sector_udt <> '_text' then
    execute $sql$
      alter table public.investors
      alter column sector_focus type text[]
      using
        case
          when sector_focus is null then '{}'::text[]
          when trim(sector_focus::text) = '' then '{}'::text[]
          else regexp_split_to_array(sector_focus::text, '\s*,\s*')
        end
    $sql$;
  end if;
end $$;

update public.investors
set sector_focus = case
  when focus_industry is null or trim(focus_industry) = '' then '{}'::text[]
  else regexp_split_to_array(focus_industry, '\s*,\s*')
end
where (sector_focus is null or array_length(sector_focus, 1) is null)
  and focus_industry is not null;
