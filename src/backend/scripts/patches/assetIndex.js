// Список ключей объектного хранилища (TimeWeb Cloud, S3-совместимое).
// Нужен, чтобы при сборке патча заранее знать, есть ли картинка, и если нет —
// подставить стандартную. Листинг делается один раз и кэшируется.
//
// Конфиг из env бэка:
//   S3_URL        — эндпоинт (напр. https://s3.twcstorage.ru)
//   S3_REGION     — регион (по умолчанию ru-1)
//   S3_BUCKET     — имя бакета
//   S3_ACCESS_KEY, S3_SECRET_KEY — доступы

function s3Config() {
    const { S3_URL, S3_REGION, S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY } = process.env;
    if (!S3_URL || !S3_BUCKET || !S3_ACCESS_KEY || !S3_SECRET_KEY) return null;
    return {
        endpoint: S3_URL,
        region: S3_REGION || 'ru-1',
        bucket: S3_BUCKET,
        accessKeyId: S3_ACCESS_KEY,
        secretAccessKey: S3_SECRET_KEY,
    };
}

async function fetchAssetKeys() {
    const cfg = s3Config();
    if (!cfg) {
        console.warn('[assetIndex] нет S3-конфига (S3_URL/S3_BUCKET/S3_ACCESS_KEY/S3_SECRET_KEY) — картинки без проверки существования');
        return null;
    }
    let S3;
    try {
        S3 = require('@aws-sdk/client-s3');
    } catch {
        console.warn('[assetIndex] пакет @aws-sdk/client-s3 не установлен — картинки без проверки существования');
        return null;
    }
    const client = new S3.S3Client({
        endpoint: cfg.endpoint,
        region: cfg.region,
        forcePathStyle: true,
        credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });
    const keys = new Set();
    let ContinuationToken;
    try {
        do {
            const out = await client.send(new S3.ListObjectsV2Command({
                Bucket: cfg.bucket,
                ContinuationToken,
            }));
            for (const obj of out.Contents || []) {
                if (obj.Key) keys.add(obj.Key);
            }
            ContinuationToken = out.IsTruncated ? out.NextContinuationToken : undefined;
        } while (ContinuationToken);
    } catch (e) {
        console.warn('[assetIndex] ошибка листинга бакета:', e && e.message);
        return null;
    }
    console.log(`[assetIndex] загружено ключей: ${keys.size}`);
    return keys;
}

// Загружает список ключей бакета заново (без кэша). Вызывается только при
// генерации патча; результат живёт локально в вызывающем коде и после — освобождается.
async function loadAssetKeys() {
    return fetchAssetKeys();
}

// Копирует картинки патча из их исходного места в бакете в папку
// pages/patches/<version>/<имя>. Принимает Map<исходный_ключ, имя_файла_назначения>
// (имя уже устойчиво к коллизиям — см. buildPatchImageNames). Возвращает Set исходных
// ключей, которые удалось скопировать (по ним потом обрезается путь в published.json).
async function copyPatchImages(version, destMap) {
    const done = new Set();
    if (!version || !destMap || !destMap.size) return done;
    const cfg = s3Config();
    if (!cfg) {
        console.warn('[assetIndex] нет S3-конфига — картинки патча не копируются, пути в published оставлены как есть');
        return done;
    }
    let S3;
    try {
        S3 = require('@aws-sdk/client-s3');
    } catch {
        console.warn('[assetIndex] пакет @aws-sdk/client-s3 не установлен — копирование картинок патча пропущено');
        return done;
    }
    const client = new S3.S3Client({
        endpoint: cfg.endpoint,
        region: cfg.region,
        forcePathStyle: true,
        credentials: { accessKeyId: cfg.accessKeyId, secretAccessKey: cfg.secretAccessKey },
    });

    // Пересоздание папки: при повторной публикации сначала удаляем всё, что лежит
    // в pages/patches/<version>/, чтобы не оставалось устаревших/переименованных картинок.
    const prefix = `pages/patches/${version}/`;
    try {
        const toDelete = [];
        let ContinuationToken;
        do {
            const out = await client.send(new S3.ListObjectsV2Command({
                Bucket: cfg.bucket,
                Prefix: prefix,
                ContinuationToken,
            }));
            for (const o of out.Contents || []) {
                if (o.Key) toDelete.push({ Key: o.Key });
            }
            ContinuationToken = out.IsTruncated ? out.NextContinuationToken : undefined;
        } while (ContinuationToken);
        for (let i = 0; i < toDelete.length; i += 1000) {
            await client.send(new S3.DeleteObjectsCommand({
                Bucket: cfg.bucket,
                Delete: { Objects: toDelete.slice(i, i + 1000) },
            }));
        }
        if (toDelete.length) console.log(`[assetIndex] папка ${prefix} очищена (${toDelete.length} объектов)`);
    } catch (e) {
        console.warn(`[assetIndex] не удалось очистить ${prefix}:`, e && e.message);
    }

    for (const [src, name] of destMap) {
        if (!name) continue;
        const dest = `pages/patches/${version}/${name}`;
        if (dest === src) { done.add(src); continue; }
        try {
            await client.send(new S3.CopyObjectCommand({
                Bucket: cfg.bucket,
                CopySource: `/${cfg.bucket}/${encodeURI(src)}`,
                Key: dest,
            }));
            done.add(src);
        } catch (e) {
            console.warn(`[assetIndex] не удалось скопировать ${src} → ${dest}:`, e && e.message);
        }
    }
    console.log(`[assetIndex] картинок патча ${version} скопировано: ${done.size}/${destMap.size}`);
    return done;
}

module.exports = { loadAssetKeys, copyPatchImages };
