import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getTasks, getTask, createTask, updateTask, deleteTask, addComment, moveTask } from '../controllers/task.controller';

const router = Router();
router.use(authenticate);

router.get('/', getTasks);
router.post('/', createTask);
router.get('/:id', getTask);
router.put('/:id', updateTask);
router.patch('/:id/move', moveTask);
router.delete('/:id', deleteTask);
router.post('/:id/comments', addComment);

export default router;
