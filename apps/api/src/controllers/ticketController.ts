import { Request, Response, NextFunction } from 'express';
import { Ticket } from '../models/index.js';
import { SupportAgentPod } from '../agents/supportPod.js';

export const getTickets = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { status, severity, category, search } = req.query;
    const filter: any = {};

    if (status) filter.status = status;
    if (severity) filter.severity = severity;
    if (category) filter.category = category;
    if (search) filter.subject = { $regex: String(search), $options: 'i' };

    const tickets = await Ticket.find(filter)
      .populate('account_id', 'name tier health_score')
      .populate('contact_id', 'name email phone')
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (err) {
    next(err);
  }
};

export const getTicketById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('account_id')
      .populate('contact_id');

    if (!ticket) {
      res.status(404).json({ success: false, error: { message: 'Ticket not found', statusCode: 404 } });
      return;
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    next(err);
  }
};

export const createTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticket = await Ticket.create(req.body);
    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    next(err);
  }
};

export const updateTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const ticket = await Ticket.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!ticket) {
      res.status(404).json({ success: false, error: { message: 'Ticket not found', statusCode: 404 } });
      return;
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    next(err);
  }
};

// Sprint 3: Support Agent Pod Ticket Intake & AI Triage
export const intakeTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { account_id, email, customer_name, channel, subject, message } = req.body;
    if (!subject || !message) {
      res.status(400).json({
        success: false,
        error: { message: 'Both subject and message are required for ticket intake', statusCode: 400 },
      });
      return;
    }

    const result = await SupportAgentPod.processTicketIntake({
      account_id,
      email,
      customer_name,
      channel,
      subject,
      message,
    });

    res.status(201).json({
      success: true,
      message: 'Ticket successfully processed through Support Agent Pod',
      data: {
        ticket: result.ticket,
        triage_summary: result.triage,
        action_queued: result.action_queued,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const replyTicket = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { sender_type, sender_name, content } = req.body;
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      res.status(404).json({ success: false, error: { message: 'Ticket not found', statusCode: 404 } });
      return;
    }

    ticket.messages.push({
      sender_type: sender_type || 'AGENT',
      sender_name: sender_name || 'Support Agent',
      content,
      timestamp: new Date(),
    });

    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'Reply added to ticket timeline',
      data: ticket,
    });
  } catch (err) {
    next(err);
  }
};
