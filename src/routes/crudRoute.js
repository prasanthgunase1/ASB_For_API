const express = require('express');
const crudController = require('../controllers/crudController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();
const crudMiddleware = require('../middlewares/crudMiddleware');
const validate = require('../middlewares/validateInputMiddleware');

router.get('/:model', authMiddleware, crudMiddleware, validate("get_all"), crudController.getAll);
router.get('/:model/:id', authMiddleware, crudMiddleware, validate("get_id"), crudController.getById);
router.post('/:model', authMiddleware, crudMiddleware, validate("create"), crudController.create);
router.put('/:model/:id', authMiddleware, crudMiddleware, validate("update"), crudController.update);
router.delete('/:model/:id', authMiddleware, crudMiddleware, validate("delete"), crudController.delete);

module.exports = router;