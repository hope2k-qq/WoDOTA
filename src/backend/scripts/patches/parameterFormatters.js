const DROP_NOTE = Symbol('drop_note');

const DISPELLABLE = new Set(['SPELL_DISPELLABLE_YES', 'SPELL_DISPELLABLE_YES_STRONG']);

const SPELL_IMMUNITY_NOTES = {
    SPELL_IMMUNITY_ENEMIES_YES: {
        ru: 'Теперь эффект проходит сквозь иммунитет к магии',
        en: 'The effect now pierces spell immunity',
        uk: 'Тепер ефект проходить крізь імунітет до магії',
        cs: 'Efekt nyní proniká imunitou vůči kouzlům',
    },
    SPELL_IMMUNITY_ENEMIES_NO: {
        ru: 'Теперь эффект блокируется иммунитетом к магии',
        en: 'The effect is now blocked by spell immunity',
        uk: 'Тепер ефект блокується імунітетом до магії',
        cs: 'Efekt je nyní blokován imunitou vůči kouzlům',
    },
};

const DAMAGE_TYPE_NOTES = {
    DAMAGE_TYPE_PHYSICAL: {
        ru: 'Теперь способность наносит физический урон',
        en: 'The ability now deals physical damage',
        uk: 'Тепер здібність завдає фізичної шкоди',
        cs: 'Schopnost nyní způsobuje fyzické poškození',
    },
    DAMAGE_TYPE_MAGICAL: {
        ru: 'Теперь способность наносит магический урон',
        en: 'The ability now deals magical damage',
        uk: 'Тепер здібність завдає магічної шкоди',
        cs: 'Schopnost nyní způsobuje magické poškození',
    },
    DAMAGE_TYPE_PURE: {
        ru: 'Теперь способность наносит чистый урон',
        en: 'The ability now deals pure damage',
        uk: 'Тепер здібність завдає чистої шкоди',
        cs: 'Schopnost nyní způsobuje čisté poškození',
    },
};

const stripAbilityTypePrefix = (value) => String(value ?? '')
    .replace(/^DOTA_ABILITY_TYPE_/, '')
    .replace(/^ABILITY_TYPE_/, '');

const ABILITY_TYPE_NOTES = {
    ULTIMATE: {
        ru: 'Теперь способность является ультимейтом',
        en: 'The ability is now an ultimate',
        uk: 'Тепер здібність є ультимейтом',
        cs: 'Schopnost je nyní ultimátní',
    },
    BASIC: {
        ru: 'Теперь обычная способность',
        en: 'Now a basic ability',
        uk: 'Тепер звичайна здібність',
        cs: 'Nyní základní schopnost',
    },
};

const RANGE_CONNECTOR = {
    ru: (oldValue, newValue) => `с ${oldValue} до ${newValue}`,
    en: (oldValue, newValue) => `from ${oldValue} to ${newValue}`,
    uk: (oldValue, newValue) => `з ${oldValue} до ${newValue}`,
    cs: (oldValue, newValue) => `z ${oldValue} na ${newValue}`,
};

function numericLabeled(forms) {
    return (oldValue, newValue) => {
        const oldNum = parseFloat(oldValue);
        const newNum = parseFloat(newValue);
        if (!Number.isFinite(oldNum) || !Number.isFinite(newNum) || oldNum === newNum) return null;
        const direction = newNum > oldNum ? 'up' : 'down';
        const note = {};
        for (const lang of ['ru', 'en', 'uk', 'cs']) {
            const form = forms[lang];
            note[lang] = `${form.label} ${form[direction]} ${RANGE_CONNECTOR[lang](oldValue, newValue)}`;
        }
        return note;
    };
}

const PARAMETER_FORMATTERS = {
    requiem_line_width_end: numericLabeled({
        ru: { label: 'Максимальная ширина волны', up: 'увеличена', down: 'уменьшена' },
        en: { label: 'Maximum wave width', up: 'increased', down: 'reduced' },
        uk: { label: 'Максимальна ширина хвилі', up: 'збільшена', down: 'зменшена' },
        cs: { label: 'Maximální šířka vlny', up: 'zvýšena', down: 'snížena' },
    }),
    ItemStockMax: numericLabeled({
        ru: { label: 'Максимальный запас', up: 'увеличен', down: 'уменьшен' },
        en: { label: 'Maximum stock', up: 'increased', down: 'reduced' },
        uk: { label: 'Максимальний запас', up: 'збільшено', down: 'зменшено' },
        cs: { label: 'Maximální zásoba', up: 'zvýšena', down: 'snížena' },
    }),
    ItemStockInitial: numericLabeled({
        ru: { label: 'Начальный запас', up: 'увеличен', down: 'уменьшен' },
        en: { label: 'Initial stock', up: 'increased', down: 'reduced' },
        uk: { label: 'Початковий запас', up: 'збільшено', down: 'зменшено' },
        cs: { label: 'Počáteční zásoba', up: 'zvýšena', down: 'snížena' },
    }),

    AbilityChannelTime(oldValue, newValue) {
        const oldNum = parseFloat(oldValue);
        const newNum = parseFloat(newValue);
        if (!Number.isFinite(oldNum) || oldNum <= 0) return null; // канализации и не было
        if (Number.isFinite(newNum) && newNum > 0) return null;    // канализация осталась — обычный шаблон
        const sec = String(oldNum);
        return {
            ru: `Применение длительностью ${sec} сек заменено на подготовку ${sec} сек`,
            en: `${sec}s channel replaced with a ${sec}s cast point`,
            uk: `Застосування тривалістю ${sec} сек замінено на підготовку ${sec} сек`,
            cs: `${sec}s kanálování nahrazeno ${sec}s přípravou`,
        };
    },

    invuln_period(oldValue, newValue) {
        const newNum = parseFloat(newValue);
        const oldNum = parseFloat(oldValue);
        if (Number.isFinite(newNum) && newNum > 0) {
            const sec = String(newNum);
            return {
                ru: `Применение способности теперь даёт неуязвимость на ${sec} сек`,
                en: `Casting the ability now grants ${sec}s invulnerability`,
                uk: `Застосування здібності тепер дає невразливість на ${sec} сек`,
                cs: `Použití schopnosti nyní uděluje ${sec}s nezranitelnost`,
            };
        }
        if (Number.isFinite(oldNum) && oldNum > 0) {
            return {
                ru: 'При применении способность больше не даёт неуязвимость',
                en: 'The ability no longer grants invulnerability on cast',
                uk: 'При застосуванні здібність більше не дає невразливість',
                cs: 'Schopnost při použití již neuděluje nezranitelnost',
            };
        }
        return null;
    },
    Innate(oldValue, newValue) {
        const isInnate = (value) => String(value ?? '') === '1';
        const wasInnate = isInnate(oldValue);
        const nowInnate = isInnate(newValue);
        if (wasInnate === nowInnate) return null;
        if (nowInnate) {
            return {
                ru: 'Теперь врождённая способность',
                en: 'Now an innate ability',
                uk: 'Тепер вроджена здібність',
                cs: 'Nyní vrozená schopnost',
            };
        }
        return {
            ru: 'Больше не врождённая способность',
            en: 'No longer an innate ability',
            uk: 'Більше не вроджена здібність',
            cs: 'Již není vrozená schopnost',
        };
    },

    DependentOnAbility(oldValue, newValue, type, context) {
        const nameFor = (id) => {
            const resolved = id && context && typeof context.resolveAbilityName === 'function'
                ? context.resolveAbilityName(id)
                : null;
            return (lang) => (resolved && (resolved[lang] || resolved.en || resolved.ru)) || String(id);
        };
        if (newValue) {
            const name = nameFor(newValue);
            return {
                ru: `Теперь улучшается вместе с ${name('ru')}`,
                en: `Now upgrades together with ${name('en')}`,
                uk: `Тепер покращується разом з ${name('uk')}`,
                cs: `Nyní se vylepšuje spolu s ${name('cs')}`,
            };
        }
        if (oldValue) {
            const name = nameFor(oldValue);
            return {
                ru: `Больше не улучшается с ${name('ru')}`,
                en: `No longer upgrades with ${name('en')}`,
                uk: `Більше не покращується з ${name('uk')}`,
                cs: `Již se nevylepšuje s ${name('cs')}`,
            };
        }
        return null;
    },
    AbilityType(oldValue, newValue) {
        const oldCore = stripAbilityTypePrefix(oldValue);
        const newCore = stripAbilityTypePrefix(newValue);
        if (!newCore || newCore === oldCore) return DROP_NOTE;
        return ABILITY_TYPE_NOTES[newCore] || DROP_NOTE;
    },
    SpellImmunityType(oldValue, newValue) {
        if (!newValue || newValue === oldValue) return null;
        return SPELL_IMMUNITY_NOTES[newValue] || null;
    },
    AbilityUnitDamageType(oldValue, newValue) {
        if (!newValue || newValue === oldValue) return null;
        return DAMAGE_TYPE_NOTES[newValue] || null;
    },
    AbilityBehavior(oldValue, newValue) {
        const LANGS = ['ru', 'en', 'uk', 'cs'];
        const flagSet = (value) => new Set(String(value ?? '').split('|').map((flag) => flag.trim()).filter(Boolean));
        const oldFlags = flagSet(oldValue);
        const newFlags = flagSet(newValue);
        const added = (flag) => newFlags.has(flag) && !oldFlags.has(flag);
        const removed = (flag) => oldFlags.has(flag) && !newFlags.has(flag);

        const parts = { ru: [], en: [], uk: [], cs: [] };
        const push = (message) => LANGS.forEach((lang) => parts[lang].push(message[lang]));
        
        if (removed('DOTA_ABILITY_BEHAVIOR_PASSIVE')) {
            push({ ru: 'Теперь активная способность', en: 'Now an active ability', uk: 'Тепер активна здібність', cs: 'Nyní aktivní schopnost' });
        } else if (added('DOTA_ABILITY_BEHAVIOR_PASSIVE')) {
            push({ ru: 'Теперь пассивная способность', en: 'Now a passive ability', uk: 'Тепер пасивна здібність', cs: 'Nyní pasivní schopnost' });
        }
        if (added('DOTA_ABILITY_BEHAVIOR_AUTOCAST')) {
            push({ ru: 'Добавлено автоприменение', en: 'Autocast added', uk: 'Додано автозастосування', cs: 'Přidáno automatické sesílání' });
        } else if (removed('DOTA_ABILITY_BEHAVIOR_AUTOCAST')) {
            push({ ru: 'Убрано автоприменение', en: 'Autocast removed', uk: 'Прибрано автозастосування', cs: 'Odebráno automatické sesílání' });
        }

        if (!parts.ru.length) return null;
        return Object.fromEntries(LANGS.map((lang) => [lang, parts[lang].join('. ')]));
    },

    IsBreakable(oldValue, newValue) {
        const on = (value) => String(value ?? '') === '1';
        const wasOn = on(oldValue);
        const nowOn = on(newValue);
        if (wasOn === nowOn) return null;
        if (nowOn) {
            return {
                ru: 'Теперь пассивную способность можно отключить истощением',
                en: 'The passive ability can now be disabled by Break',
                uk: 'Тепер пасивну здібність можна вимкнути виснаженням',
                cs: 'Pasivní schopnost lze nyní vypnout efektem Break',
            };
        }
        return {
            ru: 'Теперь пассивную способность нельзя отключить истощением',
            en: 'The passive ability can no longer be disabled by Break',
            uk: 'Тепер пасивну здібність не можна вимкнути виснаженням',
            cs: 'Pasivní schopnost již nelze vypnout efektem Break',
        };
    },
    AbilitySharedCooldown(oldValue, newValue) {
        const has = (value) => value !== null && value !== undefined && String(value).trim() !== '';
        const had = has(oldValue);
        const now = has(newValue);
        if (had === now) return null;
        if (now) {
            return {
                ru: 'Теперь имеет общий откат с другими способностями',
                en: 'Now shares a cooldown with other abilities',
                uk: 'Тепер має спільний відкат з іншими здібностями',
                cs: 'Nyní sdílí cooldown s dalšími schopnostmi',
            };
        }
        return {
            ru: 'Больше не имеет общего отката с другими способностями',
            en: 'No longer shares a cooldown with other abilities',
            uk: 'Більше не має спільного відкату з іншими здібностями',
            cs: 'Již nesdílí cooldown s dalšími schopnostmi',
        };
    },

    ItemDisassembleRule(oldValue, newValue) {
        const canDisassemble = (value) => {
            const text = String(value ?? '').toUpperCase();
            if (text.includes('NEVER')) return false;
            if (text.includes('ALWAYS') || text.includes('ONCE')) return true;
            return null;
        };
        const oldCan = canDisassemble(oldValue);
        const newCan = canDisassemble(newValue);
        if (newCan === null || newCan === oldCan) return null;
        if (newCan) {
            return {
                ru: 'Теперь можно разобрать',
                en: 'Can now be disassembled',
                uk: 'Тепер можна розібрати',
                cs: 'Nyní lze rozložit',
            };
        }
        return {
            ru: 'Теперь нельзя разобрать',
            en: 'Can no longer be disassembled',
            uk: 'Тепер не можна розібрати',
            cs: 'Nyní nelze rozložit',
        };
    },
    ItemCanBeUsedWithoutInventory(oldValue, newValue) {
        const isOn = (value) => String(value ?? '') === '1';
        const wasOn = isOn(oldValue);
        const nowOn = isOn(newValue);
        if (wasOn === nowOn) return null;
        if (nowOn) {
            return {
                ru: 'Теперь можно применять из рюкзака',
                en: 'Can now be used from the backpack',
                uk: 'Тепер можна застосовувати з рюкзака',
                cs: 'Nyní lze použít z batohu',
            };
        }
        return {
            ru: 'Больше нельзя применять из рюкзака',
            en: 'Can no longer be used from the backpack',
            uk: 'Більше не можна застосовувати з рюкзака',
            cs: 'Již nelze použít z batohu',
        };
    },
    SpellDispellableType(oldValue, newValue) {
        const wasDispellable = DISPELLABLE.has(oldValue);
        const nowDispellable = DISPELLABLE.has(newValue);
        if (wasDispellable === nowDispellable) return null; // между YES и YES_STRONG — не описываем

        if (wasDispellable && !nowDispellable) {
            return {
                ru: 'Больше нельзя развеять',
                en: 'Can no longer be dispelled',
                uk: 'Більше не можна розвіяти',
                cs: 'Již nelze rozptýlit',
            };
        }
        return {
            ru: 'Теперь можно развеять',
            en: 'Can now be dispelled',
            uk: 'Тепер можна розвіяти',
            cs: 'Nyní lze rozptýlit',
        };
    },
};

function formatParameterNote(parameter, oldValue, newValue, type, context) {
    const formatter = PARAMETER_FORMATTERS[parameter];
    if (!formatter) return null;
    const result = formatter(oldValue, newValue, type, context);
    if (result === DROP_NOTE) return DROP_NOTE;
    return result || null;
}

module.exports = { PARAMETER_FORMATTERS, formatParameterNote, DROP_NOTE, stripAbilityTypePrefix };
