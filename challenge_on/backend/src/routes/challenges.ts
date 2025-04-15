import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all challenges for a user
router.get('/', authenticateToken, async (req: any, res) => {
  try {
    const challenges = await prisma.challenge.findMany({
      where: { userId: req.user.userId },
      include: {
        progressLogs: true,
      },
    });
    res.json(challenges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challenges' });
  }
});

// Get a single challenge
router.get('/:id', authenticateToken, async (req: any, res) => {
  try {
    const challenge = await prisma.challenge.findUnique({
      where: { id: req.params.id },
      include: {
        progressLogs: true,
      },
    });
    if (!challenge || challenge.userId !== req.user.userId) {
      return res.status(404).json({ error: 'Challenge not found' });
    }
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch challenge' });
  }
});

// Create a new challenge
router.post('/', authenticateToken, async (req: any, res) => {
  try {
    const { name, description, startDate, endDate, reminderTime } = req.body;
    const challenge = await prisma.challenge.create({
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reminderTime,
        userId: req.user.userId,
      },
    });
    res.status(201).json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create challenge' });
  }
});

// Update a challenge
router.put('/:id', authenticateToken, async (req: any, res) => {
  try {
    const { name, description, startDate, endDate, reminderTime } = req.body;
    const challenge = await prisma.challenge.update({
      where: { id: req.params.id },
      data: {
        name,
        description,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reminderTime,
      },
    });
    res.json(challenge);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update challenge' });
  }
});

// Delete a challenge
router.delete('/:id', authenticateToken, async (req: any, res) => {
  try {
    await prisma.challenge.delete({
      where: { id: req.params.id },
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete challenge' });
  }
});

export default router; 