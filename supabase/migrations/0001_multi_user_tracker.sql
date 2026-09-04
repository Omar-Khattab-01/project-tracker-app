create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  priority text not null default 'Normal' check (priority in ('Low','Normal','High','Critical')),
  start_date date,
  target_end_date date,
  notes text not null default '',
  archived boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','editor','member')),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  type text not null default 'Task' check (type in ('Task','Milestone')),
  owner text not null default '',
  start_date date,
  due_date date,
  percent_complete integer not null default 0 check (percent_complete between 0 and 100),
  priority text not null default 'Normal' check (priority in ('Low','Normal','High','Critical')),
  manual_status_override text check (manual_status_override in ('On Hold','Cancelled')),
  notes text not null default '',
  sort_order integer not null default 0,
  archived boolean not null default false,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index projects_created_by_idx on public.projects(created_by);
create index project_members_user_idx on public.project_members(user_id);
create index tasks_project_sort_idx on public.tasks(project_id, sort_order);
create index tasks_due_date_idx on public.tasks(due_date);

create function public.is_project_member(target_project uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.project_members where project_id = target_project and user_id = auth.uid()) $$;

create function public.can_edit_project(target_project uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.project_members where project_id = target_project and user_id = auth.uid() and role in ('owner','editor')) $$;

create function public.is_project_owner(target_project uuid)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from public.project_members where project_id = target_project and user_id = auth.uid() and role = 'owner') $$;

create function public.add_project_owner()
returns trigger language plpgsql security definer set search_path = ''
as $$ begin insert into public.project_members(project_id,user_id,role) values(new.id,new.created_by,'owner'); return new; end $$;
create trigger add_project_owner after insert on public.projects for each row execute function public.add_project_owner();

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_members enable row level security;
alter table public.tasks enable row level security;
revoke all on public.profiles, public.projects, public.project_members, public.tasks from anon;
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.projects, public.project_members, public.tasks to authenticated;

create policy profiles_read on public.profiles for select to authenticated using (true);
create policy profiles_insert_self on public.profiles for insert to authenticated with check (id = auth.uid());
create policy profiles_update_self on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy projects_read_member on public.projects for select to authenticated using (public.is_project_member(id));
create policy projects_create on public.projects for insert to authenticated with check (created_by = auth.uid());
create policy projects_update_editor on public.projects for update to authenticated using (public.can_edit_project(id)) with check (public.can_edit_project(id));
create policy projects_delete_owner on public.projects for delete to authenticated using (exists (select 1 from public.project_members m where m.project_id=id and m.user_id=auth.uid() and m.role='owner'));
create policy members_read on public.project_members for select to authenticated using (public.is_project_member(project_id));
create policy members_manage_owner on public.project_members for all to authenticated using (public.is_project_owner(project_id)) with check (public.is_project_owner(project_id));
create policy tasks_read_member on public.tasks for select to authenticated using (public.is_project_member(project_id));
create policy tasks_create_editor on public.tasks for insert to authenticated with check (public.can_edit_project(project_id) and created_by=auth.uid());
create policy tasks_update_editor on public.tasks for update to authenticated using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));
create policy tasks_delete_editor on public.tasks for delete to authenticated using (public.can_edit_project(project_id));
