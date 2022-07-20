import express from 'express';
import controller from './controller';
const router = express.Router();

router.post('/login', controller.login);
router.post('/logout', controller.logout);

export = router;
