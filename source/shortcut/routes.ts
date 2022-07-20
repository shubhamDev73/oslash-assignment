import express from 'express';
import controller from './controller';
const router = express.Router();

router.post('/create', controller.createShortcut);
router.get('/list', controller.listShortcuts);
router.delete('/delete/:shortlink', controller.deleteShortcut);
router.get('/search', controller.searchShortcuts);

export = router;
