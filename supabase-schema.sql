-- ============================================================
-- 听声音识物 — Supabase 数据库初始化脚本
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================================

-- ==================== 1. 分类表 ====================

create table if not exists public.categories (
  id          text        primary key,
  name        text        not null,
  name_en     text        not null,
  emoji       text        not null,
  color       text        not null,
  description text        not null default '',
  sort_order  int2        not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.categories enable row level security;
create policy "categories_read_all" on public.categories
  for select using (true);

-- ==================== 2. 题目表 ====================

create table if not exists public.questions (
  id              text        primary key,
  category_id     text        not null references public.categories(id),
  name            text        not null,
  name_en         text        not null,
  sound_keywords  text[]      not null default '{}',
  image_keywords  text[]      not null default '{}',
  synth           jsonb,
  difficulty      int2        not null default 1 check (difficulty between 1 and 3),
  sound_path      text,
  image_path      text,
  is_active       boolean     not null default true,
  sort_order      int2        not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.questions enable row level security;
create policy "questions_read_all" on public.questions
  for select using (true);
create policy "questions_insert_all" on public.questions
  for insert with check (true);
create policy "questions_update_all" on public.questions
  for update using (true) with check (true);
create policy "questions_delete_all" on public.questions
  for delete using (true);

-- 自动更新 updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger questions_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

-- ==================== 2.5 Storage Buckets ====================

-- 创建 sounds bucket
insert into storage.buckets (id, name, public) values ('sounds', 'sounds', true)
on conflict (id) do nothing;

-- 创建 images bucket
insert into storage.buckets (id, name, public) values ('images', 'images', true)
on conflict (id) do nothing;

-- sounds bucket 策略：允许公开读取 + anon 上传
create policy "sounds_select" on storage.objects
  for select using (bucket_id = 'sounds');
create policy "sounds_insert" on storage.objects
  for insert with check (bucket_id = 'sounds');
create policy "sounds_update" on storage.objects
  for update using (bucket_id = 'sounds') with check (bucket_id = 'sounds');
create policy "sounds_delete" on storage.objects
  for delete using (bucket_id = 'sounds');

-- images bucket 策略：允许公开读取 + anon 上传
create policy "images_select" on storage.objects
  for select using (bucket_id = 'images');
create policy "images_insert" on storage.objects
  for insert with check (bucket_id = 'images');
create policy "images_update" on storage.objects
  for update using (bucket_id = 'images') with check (bucket_id = 'images');
create policy "images_delete" on storage.objects
  for delete using (bucket_id = 'images');

  create policy "sounds_select" on storage.objects
  for select using (bucket_id = 'sounds');
create policy "sounds_insert" on storage.objects
  for insert with check (bucket_id = 'sounds');
create policy "sounds_update" on storage.objects
  for update using (bucket_id = 'sounds') with check (bucket_id = 'sounds');
create policy "sounds_delete" on storage.objects
  for delete using (bucket_id = 'sounds');

-- ==================== 3. 插入分类数据 ====================

insert into public.categories (id, name, name_en, emoji, color, description, sort_order) values
  ('vehicle', '交通工具', 'Vehicles', '🚗', '#4FC3F7', '滴滴叭叭～猜猜是什么车？', 1),
  ('animal',  '小动物',  'Animals',  '🐰', '#FFB74D', '汪汪喵喵～是谁在叫呀？',   2);

-- ==================== 4. 插入题目数据 ====================

insert into public.questions
  (id, category_id, name, name_en, sound_keywords, image_keywords, synth, difficulty, sound_path, image_path, sort_order)
values
  -- ──── 交通工具 ────
  ('vehicle-car',       'vehicle', '小汽车', 'car',
   array['car-horn','car-engine','car-passing','汽车喇叭'],
   array['car','汽车'],
   '{"type":"engine","freq":150,"durationMs":1500,"sweep":false}'::jsonb,
   1, 'vehicle-car.mp3', 'vehicle-car.webp', 1),

  ('vehicle-train',     'vehicle', '火车',   'train',
   array['train-horn','train-whistle','train-passing','火车汽笛'],
   array['train','火车'],
   '{"type":"horn","freq":300,"durationMs":2000,"sweep":false}'::jsonb,
   1, 'vehicle-train.mp3', 'vehicle-train.webp', 2),

  ('vehicle-airplane',  'vehicle', '飞机',   'airplane',
   array['airplane-flyby','jet-engine','airplane-takeoff','飞机引擎'],
   array['airplane','飞机'],
   '{"type":"engine","freq":400,"durationMs":2000,"sweep":true}'::jsonb,
   1, 'vehicle-airplane.mp3', 'vehicle-airplane.webp', 3),

  ('vehicle-bicycle',   'vehicle', '自行车', 'bicycle',
   array['bicycle-bell','bike-bell','bicycle-ring','自行车铃'],
   array['bicycle','自行车'],
   '{"type":"bell","freq":1200,"durationMs":500,"sweep":false}'::jsonb,
   1, 'vehicle-bicycle.mp3', 'vehicle-bicycle.webp', 4),

  ('vehicle-ship',      'vehicle', '轮船',   'ship',
   array['ship-horn','boat-horn','fog-horn','轮船汽笛'],
   array['ship','轮船'],
   '{"type":"boat","freq":200,"durationMs":2000,"sweep":false}'::jsonb,
   2, 'vehicle-ship.mp3', 'vehicle-ship.webp', 5),

  ('vehicle-motorcycle','vehicle', '摩托车', 'motorcycle',
   array['motorcycle-engine','motorbike-passing','motorcycle-rev','摩托车引擎'],
   array['motorcycle','摩托车'],
   '{"type":"motorcycle","freq":200,"durationMs":1200,"sweep":true}'::jsonb,
   2, 'vehicle-motorcycle.mp3', 'vehicle-motorcycle.webp', 6),

  ('vehicle-helicopter','vehicle', '直升机', 'helicopter',
   array['helicopter-flyby','helicopter-rotor','helicopter-hover','直升机'],
   array['helicopter','直升机'],
   '{"type":"helicopter","freq":350,"durationMs":2000,"sweep":false}'::jsonb,
   2, 'vehicle-helicopter.mp3', 'vehicle-helicopter.webp', 7),

  ('vehicle-police',    'vehicle', '警车',   'police car',
   array['police-siren','police-car','siren-wail','警车警笛'],
   array['police car','警车'],
   '{"type":"siren","freq":800,"durationMs":1500,"sweep":true}'::jsonb,
   2, 'vehicle-police.mp3', 'vehicle-police.webp', 8),

  ('vehicle-fire',      'vehicle', '消防车', 'fire truck',
   array['fire-truck','fire-engine-siren','fire-siren','消防车警笛'],
   array['fire truck','消防车'],
   '{"type":"siren","freq":600,"durationMs":1500,"sweep":true}'::jsonb,
   2, 'vehicle-fire.mp3', 'vehicle-fire.webp', 9),

  ('vehicle-ambulance', 'vehicle', '救护车', 'ambulance',
   array['ambulance-siren','ambulance-emergency','救护车警笛'],
   array['ambulance','救护车'],
   '{"type":"siren","freq":900,"durationMs":1500,"sweep":true}'::jsonb,
   2, 'vehicle-ambulance.mp3', 'vehicle-ambulance.webp', 10),

  ('vehicle-bus',       'vehicle', '公交车', 'bus',
   array['bus-engine','bus-passing','bus-horn','公交车'],
   array['bus','公交车'],
   '{"type":"engine","freq":120,"durationMs":1500,"sweep":false}'::jsonb,
   1, 'vehicle-bus.mp3', 'vehicle-bus.webp', 11),

  ('vehicle-tractor',   'vehicle', '拖拉机', 'tractor',
   array['tractor-engine','tractor-passing','拖拉机'],
   array['tractor','拖拉机'],
   '{"type":"engine","freq":80,"durationMs":1800,"sweep":false}'::jsonb,
   3, 'vehicle-tractor.mp3', 'vehicle-tractor.webp', 12),

  -- ──── 动物 ────
  ('animal-cat',      'animal', '小猫', 'cat',
   array['cat-meow','kitten-meow','cat-purr','猫叫'],
   array['cat','猫'],
   '{"type":"meow","freq":700,"durationMs":600,"sweep":true}'::jsonb,
   1, 'animal-cat.mp3', 'animal-cat.webp', 13),

  ('animal-dog',      'animal', '小狗', 'dog',
   array['dog-bark','puppy-bark','dog-woof','狗叫'],
   array['dog','狗'],
   '{"type":"bark","freq":300,"durationMs":400,"sweep":false}'::jsonb,
   1, 'animal-dog.mp3', 'animal-dog.webp', 14),

  ('animal-cow',      'animal', '奶牛', 'cow',
   array['cow-moo','cow-mooing','牛叫'],
   array['cow','牛'],
   '{"type":"moo","freq":200,"durationMs":1000,"sweep":false}'::jsonb,
   1, 'animal-cow.mp3', 'animal-cow.webp', 15),

  ('animal-sheep',    'animal', '小羊', 'sheep',
   array['sheep-baa','sheep-bleat','lamb-baa','羊叫'],
   array['sheep','羊'],
   '{"type":"baa","freq":350,"durationMs":800,"sweep":true}'::jsonb,
   1, 'animal-sheep.mp3', 'animal-sheep.webp', 16),

  ('animal-chicken',  'animal', '小鸡', 'chicken',
   array['chicken-cluck','rooster-crow','hen-cluck','鸡叫'],
   array['chicken','鸡'],
   '{"type":"cluck","freq":500,"durationMs":300,"sweep":false}'::jsonb,
   1, 'animal-chicken.mp3', 'animal-chicken.webp', 17),

  ('animal-duck',     'animal', '小鸭', 'duck',
   array['duck-quack','duck-quacking','鸭子叫'],
   array['duck','鸭子'],
   '{"type":"quack","freq":400,"durationMs":500,"sweep":false}'::jsonb,
   1, 'animal-duck.mp3', 'animal-duck.webp', 18),

  ('animal-bird',     'animal', '小鸟', 'bird',
   array['bird-chirp','bird-singing','bird-tweet','鸟叫'],
   array['bird','鸟'],
   '{"type":"chirp","freq":1200,"durationMs":400,"sweep":true}'::jsonb,
   2, 'animal-bird.mp3', 'animal-bird.webp', 19),

  ('animal-frog',     'animal', '青蛙', 'frog',
   array['frog-croak','frog-ribbit','青蛙叫'],
   array['frog','青蛙'],
   '{"type":"ribbit","freq":300,"durationMs":600,"sweep":false}'::jsonb,
   2, 'animal-frog.mp3', 'animal-frog.webp', 20),

  ('animal-lion',     'animal', '狮子', 'lion',
   array['lion-roar','lion-growl','狮子吼'],
   array['lion','狮子'],
   '{"type":"roar","freq":150,"durationMs":1500,"sweep":false}'::jsonb,
   2, 'animal-lion.mp3', 'animal-lion.webp', 21),

  ('animal-elephant', 'animal', '大象', 'elephant',
   array['elephant-trumpet','elephant-sound','大象叫'],
   array['elephant','大象'],
   '{"type":"trumpet","freq":250,"durationMs":1500,"sweep":true}'::jsonb,
   2, 'animal-elephant.mp3', 'animal-elephant.webp', 22),

  ('animal-horse',    'animal', '小马', 'horse',
   array['horse-neigh','horse-whinny','horse-gallop','马叫'],
   array['horse','马'],
   '{"type":"neigh","freq":500,"durationMs":1000,"sweep":true}'::jsonb,
   2, 'animal-horse.mp3', 'animal-horse.webp', 23),

  ('animal-pig',      'animal', '小猪', 'pig',
   array['pig-oink','pig-grunt','pig-snort','猪叫'],
   array['pig','猪'],
   '{"type":"oink","freq":300,"durationMs":600,"sweep":false}'::jsonb,
   1, 'animal-pig.mp3', 'animal-pig.webp', 24);
