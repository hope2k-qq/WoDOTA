# Патчи: сборка, сравнение, эндпоинты

Работа с патчами игры на бэкенде. Одна и та же логика доступна двумя путями:
через **HTTP-эндпоинты** (для фронта) и через **CLI** (для генерации файлов).

## Структура файлов

```
assets/patches/
  <версия>/
    source/    сырые файлы патча (npc_*.txt, addon_*.txt, *.lua, ...)
    result/
      draft.json      авто-черновик (скрипт перезаписывает при каждой генерации)
      draft.md        читаемый вид черновика (пишет CLI)
      changelog.json  вычитанный вручную ФИНАЛ (скрипт НЕ затирает; его отдаёт чтение)
      skipped.json    изменения, отброшенные из-за отсутствующих файлов (см. ниже)
      published.json  публичная копия changelog.json без сырых значений
```

### Назначение исходных файлов (`source/`)

| Файл | Роль |
|------|------|
| `activelist.txt` | активные герои (`1`) / нет (`0`) |
| `addon_{russian,english,ukrainian}.txt` | глобальная локализация патча |
| `heroesAbilities.json` | **авторитетная** карта герой → его способности (стартовые + `innate`); остальное качается талантами |
| `npc_abilities_custom.txt` | способности героев и их характеристики |
| `npc_dota_hero_<hero>.txt` | способности героя, которых НЕТ в общем файле (fallback) |
| `npc_heroes_custom.txt` | базовые характеристики героев |
| `npc_heroes.txt` | fallback базовых характеристик (чего нет в custom) |
| `shops.txt` | актуальный список предметов магазина |
| `npc_neutral_items_custom.txt` | актуальный список нейтралок и их тиров |
| `npc_items_custom.txt` | характеристики предметов |
| `items.txt` | fallback характеристик предметов (чего нет в custom) |
| `abilities_{russian,english,ukrainian}.txt` | полная база локализации для описаний нейтралок/новых предметов (с подстановкой значений) |
| `talents_list.lua` | таблица талантов (`herotalents`) |
| `npc_units_custom.txt` | нейтральные крипы `npc_woda_creep*`: все характеристики + `Ability1..N` (привязка их способностей к крипам; общая способность → ко ВСЕМ крипам, у кого она есть); имена крипов — токены в `addon_*` по id юнита |
| `shop_items_information.js`, `talents.lua` | **не отслеживаются** |

Любой источник опционален. Если нужного файла нет — категория **пропускается**, а её
изменения складываются в `result/skipped.json` (в основной ченджлог не попадают).
Признак наличия каждого источника — `snapshot.present`.

### Ручная вычитка

Скрипт даёт черновик (`draft.json`) — что нашли изменения. Финал `changelog.json`
сеется из черновика один раз (с `reviewed: false`), дальше правится вручную и
скриптом не затирается. Повторный `create` обновляет только `draft.json`, чтобы
увидеть, что скрипт нашёл нового.

При вычитке:
- `"direction": "up"` (увеличено) / `"down"` (уменьшено) добавляется в любую запись
  изменения — предметы, способности, base героя, тексты. НЕ у перемещений талантов
  (там своя семантика moved/replaced/added/removed);
- вычищаются лишние тексты локализации.

Секция `general` (Общее):
- `heroesAdded` / `heroesRemoved` — считаются автоматически по `activelist.txt`
  (герой `1`→`0`/пропал = убран, `0`/появился→`1` = новый);
- `abilities`, `texts` — изменения, не привязанные к герою;
- `manual` — список ручных заметок, дописывается руками. Элемент — строка или
  `{ "text": "...", "direction": "up" }`.

### Нейтральные предметы (артефакты) и обычные

Предметы делятся на две категории (нейтралки идут **перед** обычными):
- **`items`** (обычные) — не нейтралка. При добавлении/удалении проставляется
  `category` — секция магазина (`secretshop`, `consumables`, …). `is_new` — предмет
  добавлен целиком. **Рецепты (`item_recipe_*`) всегда здесь**, нейтралками не бывают.
- **`neutral_items`** (нейтралки/чары). Каждой записи:
  - `is_new` — предмет добавлен в этом патче;
  - `tier` — тир нейтралки (число); нет данных — `null` («просто новый»);
  - `description` — только у новых: текст с уже подставленными значениями (см. ниже).

**Классификация предмета — только по авторитетным файлам** (без старых
«альтернатив» вроде ручных тиров или определения нейтралки «по отсутствию в
`shops.txt`»):
- рецепт (`item_recipe_*`) → обычный;
- есть в `npc_neutral_items_custom.txt` (`neutral_tiers.<N>.items`/`.enhancements.*`)
  → нейтралка, тир = `N`;
- есть в `shops.txt` → обычный;
- ни там ни там → классифицировать нечем → предмет уходит в `skipped.json`
  (в основной ченджлог не попадает). Нет файла нейтралок вовсе — категория
  нейтралок пропускается целиком.

**Добавление vs удаление:** у **добавленной** сущности (предмет — обычный ИЛИ
нейтралка — и способность) кроме ноты «Добавлен(а) …» строится **полное описание,
что делает** (`description`). У **удалённой** — только нота «Удалён(а) …», без описания.

**Описание** (`buildItemDescription`): шаблон `DOTA_Tooltip_ability_<id>_Description`
(пробуется и без суффикса `_custom`), `%переменные%` заменяются значениями из
`AbilityValues`/полей. Источники по приоритету: (1) локализация патча (`addon_*`),
(2) **база патча** `source/abilities_{russian,english,ukrainian}.txt`. Нужен реальный
ru/en текст; если описания/шаблона нет — `null` (у энхансментов его обычно нет).
Неизвестные `%переменные%` (нет такого поля) остаются как есть — видно при вычитке.

### Чья способность (герой / босс / глобально)

Герой у способности определяется по **авторитетной карте** `heroesAbilities.json`
(`heroAbilityMap`: `ability_id → hero`), с fallback на матчинг по префиксу имени.
`innate`-способности из этой же карты помечаются флагом. Боссы (`ScriptFile`
начинается с `neutrals/`, но это не крип `neutrals/woda_neutral_*`) идут отдельной
категорией; нейтральные крипы в ченджлог не попадают; способности без героя — в
`general.global_changes`.

Каждый патч — папка с подпапками `source/` (вход) и `result/` (выход). Чтобы
добавить патч, создайте `assets/patches/<версия>/source/` и положите файлы.
Версии — как в Dota: `2.00`, `2.00a`, `2.01b`. Порядок: сначала номер, затем
буква по алфавиту, версия без буквы старше буквенных того же номера
(`2.00 < 2.00a < 2.01 < 2.01a`).

## Эндпоинты

| Метод | Путь | Что делает |
|-------|------|-----------|
| GET | `/patches` | **всегда создаёт** changelog для всех патчей (каждый против предыдущего), пишет `result/changelog.json` каждому, возвращает от новых к старым |
| GET | `/patches/:version/create` | **создаёт черновик** конкретного патча vs предшественник; `?from=<версия>` — vs произвольная версия |
| GET | `/patches/:version` | **отдаёт вычитанный финал** `result/changelog.json` с диска, без пересборки |

Ответы:
- `/patches` → `{ success, versions, count, patches: [{version, seeded, draft}...] }`
- `/patches/:version/create` → `{ success, seeded, message, draft }` (`changelog: null`, если первый патч)
- `/patches/:version` → `{ success, changelog }`; `404`, если ещё не создан или версии нет

Логика: [controllers/patchesController.js](../../controllers/patchesController.js)
→ [services/patchesService.js](../../services/patchesService.js). Создание парсит
`source/`, пишет `result/changelog.json`. Снапшоты кэшируются в памяти только на
время одной операции создания, сразу после — кэш очищается. Чтение просто читает
готовый файл.

## CLI (из `src/backend`)

```bash
node scripts/patches/index.js list                  # патчи по порядку
node scripts/patches/index.js build 2.00a           # snapshot.json одного патча
node scripts/patches/index.js build-all             # snapshot.json всех
node scripts/patches/index.js compare 2.00 2.00a    # сырой diff -> changes_*.json
node scripts/patches/index.js changelog 2.00a       # changelog vs предыдущий -> changelog_*.(json|md)
node scripts/patches/index.js changelog 2.00a 2.00  # changelog vs указанной версии
node scripts/patches/index.js changelog-all         # changelog для всех патчей
node scripts/patches/index.js publish 2.00a "Название"  # published.json (публичная копия, ?name -> patch_name)
node scripts/patches/index.js publish-all           # publish каждому, у кого ещё нет published.json
```

## Что попадает в snapshot.json

| Секция              | Источник (+ fallback)                              | Что содержит                          |
|---------------------|----------------------------------------------------|---------------------------------------|
| `items`             | `npc_items_custom.txt` ← `items.txt`               | все предметы и их параметры            |
| `shops`             | `shops.txt`                                        | обычные предметы по категориям магазина |
| `neutrals`          | `npc_neutral_items_custom.txt`                     | нейтралки и их тиры                    |
| `abilities`         | `npc_abilities_custom.txt` ← `npc_dota_hero_*.txt` | все способности и AbilityValues        |
| `heroes`            | `npc_heroes_custom.txt` ← `npc_heroes.txt`         | атрибуты героев (ростер: custom ∪ activelist) |
| `heroAbilityMap` / `innateAbilities` | `heroesAbilities.json`            | карта герой→способности и врождённые   |
| `activelist`        | `activelist.txt`                                   | активные герои (`1`/`0`)               |
| `localization`      | `addon_{russian,english,ukrainian}.txt`            | тексты (ru/en/uk)                      |
| `baseLocalization`  | `abilities_{russian,english,ukrainian}.txt`        | база для описаний предметов/нейтралок  |
| `talents`           | `talents_list.lua`                                 | таблица `herotalents`                  |
| `present`           | (наличие файлов)                                   | флаги для пропуска категорий           |

`←` — fallback. Суффикс `_custom` игнорируется при сравнении id
(`huskar_inner_fire_custom` = `huskar_inner_fire` = одна способность; так же
`item_X` / `item_X_custom`); группировка по герою и `innate` тоже сверяются без `_custom`.
Гранулярность fallback:
- **`items`** — **по полям**: custom-блок перекрывает поле за полем, а поля, которых
  в нём нет, берутся из `items.txt` (у ванильных предметов custom часто держит лишь
  мелкий оверрайд, а `AbilityValues`/`ItemCost` — в `items.txt`);
- **`abilities`** — **целым блоком**: если способность есть в основном файле (в т.ч.
  как `X_custom`), берётся его версия целиком, пофайловая не подмешивается;
- **`heroes`** — по полям (custom-поле важнее, чего нет — из `npc_heroes.txt`).

Служебные способности `woda_*` в ченджлог не попадают. А вот способности крипов
(`ScriptFile neutrals/woda_neutral_*`) теперь **привязываются к крипам**: по
`npc_units_custom.txt` строится карта `ability_id → [npc_woda_creep*, …]`, и изменение
способности идёт в категорию `neutral_creeps` под **каждым** крипом, у которого она
есть. Там же — изменения характеристик крипа (диф полей юнита, кроме `Ability*`) и его
имя из локализации (токен = id юнита). Босс-способности
(`neutrals/*`, но не `woda_neutral_*`) по-прежнему в `bosses`.

## Итоговый changelog (эндпоинт и changelog_*.json)

Очищенный diff, сгруппированный по героям (стиль патчноутов Dota 2):
- `neutral_items` (нейтралки, перед `items`) и `items` (обычные) — см. раздел
  «Нейтральные предметы» выше;
- `items` и `abilities` — сгруппированы по имени: `{ name, changes: [{label, old, new, direction?}] }`
  (у одного предмета/способности все изменения в одном блоке, без дублей имени);
- `heroes[]` — по каждому герою: `base` (атрибуты, плоско), `abilities` (группы), `talents`, `texts{ru,en,uk}`;
- таланты — позиционный diff: `moved` (перемещён на уровень N), `replaced`, `added`, `removed`;
- локализация — без косметики (точки, html-теги) и без дублей вариантов `_0/_1/_2`.

## Фронтенд

Страница `UpdatesPage` (`/<lang>/updates`) тянет данные **с бэкенда**:
`GET /patches/<версия>` (версия — `CURRENT_PATCH` в patchlog.constants.ts,
базовый URL — `REACT_APP_API_URL`). Статичных копий JSON во фронте нет.

## Модули

- `versions.js` — разбор/сортировка версий, поиск предшественника.
- `kvParser.js` — парсер Valve KeyValues (`.txt`).
- `luaTable.js` — извлечение таблицы из `.lua` (luaparse).
- `buildSnapshot.js` — слепок патча из папки.
- `diffSnapshots.js` — рекурсивный diff двух слепков.
- `renderChangelog.js` — очистка + группировка по героям + Markdown.
- `index.js` — CLI.
