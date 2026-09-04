const express = require('express');
const router = express.Router();
const patchesController = require('../controllers/patchesController');

// Всегда создаёт changelog для всех патчей
router.get('/patches', patchesController.getAllPatches);

// Список опубликованных версий (для выпадающего списка на фронте)
router.get('/patches/published/versions', patchesController.getPublishedVersions);

// Создать changelog конкретного патча (или ?from=<версия>)
router.get('/patches/:version/create', patchesController.createPatch);

// Опубликовать патч: копия changelog.json без сырых значений (?name=<название>)
router.get('/patches/:version/publish', patchesController.publishPatch);

// Отдать готовый changelog конкретного патча
router.get('/patches/:version', patchesController.getPatch);

module.exports = router;
