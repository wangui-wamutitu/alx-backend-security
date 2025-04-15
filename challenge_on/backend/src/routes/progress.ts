import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all progress logs for a challenge
router.get('/challenge/:challengeId', authenticateToken, async (req: any, res) => {
  try {
    const progressLogs = await prisma.progressLog.findMany({
      where: {
        challengeId: req.params.challengeId,
        userId: req.user.userId,
      },
      orderBy: {
        date: 'desc',
      },
    });
    res.json(progressLogs);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch progress logs' });
  }
});

// Create a new progress log
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { challengeId, date, description, mediaUrl } = req.body;
    const progressLog = await prisma.progressLog.create({
      data: {
        date: new Date(date),
        description,
        mediaUrl,
        challengeId,
        userId: req.user.userId,
      },
    });
    res.status(201).json(progressLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create progress log' });
  }
});

// Update a progress log
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { date, description, mediaUrl } = req.body;
    const progressLog = await prisma.progressLog.update({
      where: { id: req.params.id },
      data: {
        date: new Date(date),
        description,
        mediaUrl,
      },
    });
    res.json(progressLog);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update progress log' });
  }
});

// Delete a progress log
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    await prisma.progressLog.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete progress log' });
  }
});

export default router; 