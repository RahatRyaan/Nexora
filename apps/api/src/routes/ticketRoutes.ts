import { Router } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  intakeTicket,
  replyTicket,
} from '../controllers/ticketController.js';

const router = Router();

router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/intake', intakeTicket);
router.post('/:id/reply', replyTicket);
router.post('/', createTicket);
router.patch('/:id', updateTicket);

export default router;
