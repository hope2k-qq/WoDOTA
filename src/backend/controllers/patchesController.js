const patchesService = require('../services/patchesService');

exports.getAllPatches = async (req, res) => {
    try {
        const patches = patchesService.createAllPatches();
        res.status(200).json({
            success: true,
            versions: patchesService.listPatchVersions(),
            count: patches.length,
            patches,
        });
    } catch (err) {
        console.error('Error building patches:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.createPatch = async (req, res) => {
    try {
        const { version } = req.params;
        const { from } = req.query;

        if (!patchesService.hasPatch(version)) {
            return res.status(404).json({ success: false, message: `Патч ${version} не найден` });
        }
        if (from && !patchesService.hasPatch(from)) {
            return res.status(404).json({ success: false, message: `Патч ${from} не найден` });
        }

        const result = patchesService.createPatch(version, from);
        if (!result) {
            return res.status(200).json({
                success: true,
                message: `${version} — первый патч, сравнивать не с чем`,
                changelog: null,
            });
        }

        res.status(200).json({
            success: true,
            seeded: result.seeded,
            message: result.seeded
                ? 'Черновик создан и засеян в changelog.json — нужна ручная вычитка'
                : 'Черновик обновлён (draft.json); финал changelog.json не тронут',
            draft: result.data,
        });
    } catch (err) {
        console.error('Error building patch:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getPublishedVersions = async (req, res) => {
    try {
        res.status(200).json({ success: true, versions: patchesService.listPublishedVersions() });
    } catch (err) {
        console.error('Error listing published versions:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.publishPatch = async (req, res) => {
    try {
        const { version } = req.params;
        const { name } = req.query;

        if (!patchesService.hasPatch(version)) {
            return res.status(404).json({ success: false, message: `Патч ${version} не найден` });
        }

        const result = patchesService.publishPatch(version, name);
        if (!result) {
            return res.status(404).json({
                success: false,
                message: `Changelog для ${version} ещё не создан. Сначала: GET /patches/${version}/create`,
            });
        }

        res.status(200).json({
            success: true,
            message: 'Публичная копия создана (published.json): сырые значения удалены',
            published: result.data,
        });
    } catch (err) {
        console.error('Error publishing patch:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getPatch = async (req, res) => {
    try {
        const { version } = req.params;

        if (!patchesService.hasPatch(version)) {
            return res.status(404).json({ success: false, message: `Патч ${version} не найден` });
        }

        const changelog = patchesService.readPublished(version);
        if (!changelog) {
            return res.status(404).json({
                success: false,
                message: `Публичная версия ${version} ещё не создана. Сначала: GET /patches/${version}/publish`,
            });
        }

        res.status(200).json({ success: true, changelog });
    } catch (err) {
        console.error('Error reading patch:', err);
        res.status(500).json({ success: false, error: err.message });
    }
};
