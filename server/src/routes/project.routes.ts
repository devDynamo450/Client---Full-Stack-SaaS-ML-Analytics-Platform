import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getProjects, getProject, createProject, updateProject, deleteProject, addMember,
} from '../controllers/project.controller';

const router = Router();
router.use(authenticate);

router.get('/', getProjects);
router.post('/', createProject);
router.get('/:id', getProject);
router.put('/:id', updateProject);
router.delete('/:id', deleteProject);
router.post('/:id/members', addMember);

export default router;
